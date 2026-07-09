import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import type { Comment, PlatformConfig, Token, Trade } from "./types";
import { getBuyQuote, getMarketCapUsd, getSellQuote } from "./bonding-curve";
import seedTokens from "./seed-tokens";

const CONFIG_PATH = path.join(process.cwd(), "config", "platform.json");
const DATA_DIR = path.join(process.cwd(), "data");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

const IS_VERCEL = process.env.VERCEL === "1";

const SEED_COMMENTS: Comment[] = [
  { id: "c1", mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", author: "7xKp9mN2qR4sT8vW1yZ3aB5", text: "LFG 🚀🚀🚀", createdAt: Date.now() - 3600000 },
  { id: "c2", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", author: "3aB5cD7eF9gH1jK3lM5nP7", text: "This is the one", createdAt: Date.now() - 1800000 },
  { id: "c3", mint: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82", author: "9qR2sT4vW6xY8zA0bC2dE4", text: "dev still holding?", createdAt: Date.now() - 7200000 },
];

type MemoryStore = {
  tokens: Token[];
  comments: Comment[];
  trades: Trade[];
  config: PlatformConfig | null;
};

function getMemoryStore(): MemoryStore {
  const g = globalThis as typeof globalThis & { __launchpadStore?: MemoryStore };
  if (!g.__launchpadStore) {
    g.__launchpadStore = {
      tokens: seedTokens as Token[],
      comments: [...SEED_COMMENTS],
      trades: [],
      config: null,
    };
  }
  return g.__launchpadStore;
}

function canUseFilesystem() {
  if (IS_VERCEL) return false;
  try {
    ensureDataDir();
    return true;
  } catch {
    return false;
  }
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}

function writeJsonFile<T>(file: string, data: T) {
  ensureDataDir();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

export function getConfig(): PlatformConfig {
  const mem = getMemoryStore();
  if (mem.config) return mem.config;

  const base = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as PlatformConfig;

  if (process.env.ADMIN_PASSWORD) {
    base.admin.password = process.env.ADMIN_PASSWORD;
  }
  if (process.env.FEE_RECIPIENT) {
    base.fees.feeRecipient = process.env.FEE_RECIPIENT;
  }
  if (process.env.NEXT_PUBLIC_RPC_URL) {
    base.network.rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  }
  if (process.env.NEXT_PUBLIC_CLUSTER === "devnet" || process.env.NEXT_PUBLIC_CLUSTER === "mainnet-beta" || process.env.NEXT_PUBLIC_CLUSTER === "testnet") {
    base.network.cluster = process.env.NEXT_PUBLIC_CLUSTER;
  }
  if (base.fees.tradeFeeBps == null) base.fees.tradeFeeBps = 100;
  if (base.fees.creationFeeSol == null) base.fees.creationFeeSol = 0.02;

  mem.config = base;
  return base;
}

export function updateConfig(updates: Partial<PlatformConfig>): PlatformConfig {
  const current = getConfig();
  const merged = { ...current, ...updates };
  const mem = getMemoryStore();
  mem.config = merged as PlatformConfig;

  if (canUseFilesystem()) {
    writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  }

  return merged as PlatformConfig;
}

export function getAllTokens(): Token[] {
  if (canUseFilesystem()) {
    return readJsonFile<Token[]>(TOKENS_FILE, seedTokens as Token[]);
  }
  const mem = getMemoryStore();
  const seeded = seedTokens as Token[];
  if (mem.tokens.length < Math.min(20, seeded.length) && seeded.length > 0) {
    mem.tokens = [...seeded];
  }
  return mem.tokens;
}

export function getToken(mint: string): Token | undefined {
  return getAllTokens().find((t) => t.mint === mint);
}

export function saveToken(token: Token) {
  const tokens = getAllTokens();
  const idx = tokens.findIndex((t) => t.mint === token.mint);
  if (idx >= 0) tokens[idx] = token;
  else tokens.unshift(token);

  if (canUseFilesystem()) {
    writeJsonFile(TOKENS_FILE, tokens);
  } else {
    getMemoryStore().tokens = [...tokens];
  }
}

export function createToken(
  data: Omit<
    Token,
    | "mint"
    | "createdAt"
    | "virtualSolReserves"
    | "virtualTokenReserves"
    | "realSolReserves"
    | "realTokenReserves"
    | "complete"
    | "marketCapUsd"
    | "priceSol"
    | "volume24h"
    | "replies"
  >,
): Token {
  const config = getConfig();
  const curve = config.bondingCurve;
  const marketCapUsd = getMarketCapUsd(
    curve.virtualSolReserves,
    curve.virtualTokenReserves,
  );

  const token: Token = {
    ...data,
    mint: `mint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    virtualSolReserves: curve.virtualSolReserves,
    virtualTokenReserves: curve.virtualTokenReserves,
    realSolReserves: 0,
    realTokenReserves: curve.realTokenReserves,
    complete: false,
    marketCapUsd,
    priceSol: curve.virtualSolReserves / curve.virtualTokenReserves,
    volume24h: 0,
    replies: 0,
  };

  saveToken(token);
  return token;
}

function logTrade(
  mint: string,
  type: "buy" | "sell",
  amount: number,
  token: Token,
  wallet = "anonymous",
  signature?: string,
) {
  const trade: Trade = {
    id: `t_${Date.now()}`,
    mint,
    type,
    amount,
    priceSol: token.priceSol,
    marketCapUsd: token.marketCapUsd,
    wallet,
    signature,
    createdAt: Date.now(),
  };
  const all = getAllTrades();
  all.push(trade);
  saveTrades(all);
}

function getAllTrades(): Trade[] {
  const g = getMemoryStore();
  return g.trades;
}

function saveTrades(trades: Trade[]) {
  getMemoryStore().trades = [...trades];
}

export function getTrades(mint: string): Trade[] {
  return getAllTrades()
    .filter((t) => t.mint === mint)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export type BuyResult = {
  token: Token;
  tokensOut: number;
  fee: number;
};

export type SellResult = {
  token: Token;
  solOut: number;
  fee: number;
};

export function executeBuy(
  mint: string,
  solAmount: number,
  wallet?: string,
  signature?: string,
): BuyResult | null {
  const token = getToken(mint);
  if (!token || token.complete) return null;

  const config = getConfig();
  const { tokensOut, fee, newVirtualSol, newVirtualToken } = getBuyQuote(
    solAmount,
    token.virtualSolReserves,
    token.virtualTokenReserves,
    config.fees.tradeFeeBps,
  );

  token.virtualSolReserves = newVirtualSol;
  token.virtualTokenReserves = newVirtualToken;
  token.realSolReserves += solAmount;
  token.realTokenReserves -= tokensOut;
  token.volume24h += solAmount;
  token.marketCapUsd = getMarketCapUsd(
    token.virtualSolReserves,
    token.virtualTokenReserves,
  );
  token.priceSol = token.virtualSolReserves / token.virtualTokenReserves;

  if (token.marketCapUsd >= config.bondingCurve.graduationMarketCapUsd) {
    token.complete = true;
  }

  saveToken(token);
  logTrade(mint, "buy", solAmount, token, wallet, signature);
  return { token, tokensOut, fee };
}

export function executeSell(
  mint: string,
  tokenAmount: number,
  wallet?: string,
  signature?: string,
): SellResult | null {
  const token = getToken(mint);
  if (!token || token.complete) return null;

  const config = getConfig();
  const { solOut, fee, newVirtualSol, newVirtualToken } = getSellQuote(
    tokenAmount,
    token.virtualSolReserves,
    token.virtualTokenReserves,
    config.fees.tradeFeeBps,
  );

  token.virtualSolReserves = newVirtualSol;
  token.virtualTokenReserves = newVirtualToken;
  token.realSolReserves = Math.max(0, token.realSolReserves - solOut);
  token.realTokenReserves += tokenAmount;
  token.volume24h += solOut;
  token.marketCapUsd = getMarketCapUsd(
    token.virtualSolReserves,
    token.virtualTokenReserves,
  );
  token.priceSol = token.virtualSolReserves / token.virtualTokenReserves;

  saveToken(token);
  logTrade(mint, "sell", tokenAmount, token, wallet, signature);
  return { token, solOut, fee };
}

function getAllComments(): Comment[] {
  if (canUseFilesystem()) {
    return readJsonFile<Comment[]>(COMMENTS_FILE, []);
  }
  return getMemoryStore().comments;
}

function saveComments(comments: Comment[]) {
  if (canUseFilesystem()) {
    writeJsonFile(COMMENTS_FILE, comments);
  } else {
    getMemoryStore().comments = [...comments];
  }
}

export function getComments(mint: string): Comment[] {
  return getAllComments().filter((c) => c.mint === mint);
}

export function addComment(mint: string, author: string, text: string) {
  const all = getAllComments();
  const comment: Comment = {
    id: `c_${Date.now()}`,
    mint,
    author,
    text,
    createdAt: Date.now(),
  };
  all.push(comment);
  saveComments(all);

  const token = getToken(mint);
  if (token) {
    token.replies += 1;
    saveToken(token);
  }

  return comment;
}
