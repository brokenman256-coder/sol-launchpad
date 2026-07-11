import { readFileSync } from "fs";
import path from "path";
import type { Comment, PlatformConfig, SortOption, Token, Trade } from "./types";
import seedTokens from "./seed-tokens";
import { coinAvatarUrl } from "./avatar";
import { getBuyQuote, getMarketCapUsd, getSellQuote } from "./bonding-curve";

const CONFIG_PATH = path.join(process.cwd(), "config", "platform.json");

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
      tokens: [...(seedTokens as Token[])],
      comments: [],
      trades: [],
      config: null,
    };
  }
  return g.__launchpadStore;
}

export function getConfig(): PlatformConfig {
  const mem = getMemoryStore();
  if (mem.config) return mem.config;
  const base = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as PlatformConfig;
  if (process.env.ADMIN_PASSWORD) base.admin.password = process.env.ADMIN_PASSWORD;
  if (process.env.FEE_RECIPIENT) base.fees.feeRecipient = process.env.FEE_RECIPIENT;
  mem.config = base;
  return base;
}

export function getAllTokens(sort: SortOption = "new"): Token[] {
  const tokens = [...getMemoryStore().tokens];
  switch (sort) {
    case "market_cap":
      return tokens.sort((a, b) => b.marketCapUsd - a.marketCapUsd);
    case "volume":
      return tokens.sort((a, b) => b.volume24h - a.volume24h);
    case "gainers":
      return tokens.sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
    case "trending":
      return tokens.sort(
        (a, b) =>
          b.volume24h * (1 + Math.max(0, b.change24h ?? 0) / 100) -
          a.volume24h * (1 + Math.max(0, a.change24h ?? 0) / 100),
      );
    case "new":
    default:
      return tokens.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function getToken(mint: string) {
  return getMemoryStore().tokens.find((t) => t.mint === mint);
}

export function getComments(mint?: string) {
  const all = getMemoryStore().comments;
  if (!mint) return all;
  return all.filter((c) => c.mint === mint);
}

export function getTrades(mint?: string) {
  const all = getMemoryStore().trades;
  if (!mint) return all;
  return all.filter((t) => t.mint === mint);
}

export function createToken(input: {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  verified?: boolean;
}): Token {
  const mem = getMemoryStore();
  const symbol = input.symbol.toUpperCase().slice(0, 10);
  const mint = `mint_${Date.now()}_${symbol.toLowerCase()}`;
  const t: Token = {
    mint,
    name: input.name,
    symbol,
    description: input.description || "Fair launch on Solana bonding curve",
    imageUrl: input.imageUrl || coinAvatarUrl(mint, symbol),
    creator: input.creator,
    createdAt: Date.now(),
    virtualSolReserves: 30,
    virtualTokenReserves: 1073000000,
    realSolReserves: 0,
    realTokenReserves: 793100000,
    complete: false,
    marketCapUsd: 420,
    priceSol: 3e-8,
    volume24h: 0,
    replies: 0,
    change24h: 0,
    liquidityUsd: 80,
    holders: 1,
    txns24h: 0,
    verified: Boolean(input.verified),
    renounced: true,
    featured: false,
    tags: ["new"],
    socials: {
      website: input.website,
      twitter: input.twitter,
      telegram: input.telegram,
    },
  };
  mem.tokens.unshift(t);
  return t;
}

export function updateConfig(c: PlatformConfig) {
  getMemoryStore().config = c;
  return c;
}

export function addComment(
  mint: string,
  author: string,
  text: string,
): Comment {
  const mem = getMemoryStore();
  const c: Comment = {
    id: `c_${Date.now()}`,
    mint,
    author,
    text,
    createdAt: Date.now(),
  };
  mem.comments.unshift(c);
  const token = mem.tokens.find((t) => t.mint === mint);
  if (token) token.replies = (token.replies ?? 0) + 1;
  return c;
}

export function executeBuy(
  mint: string,
  amount: number,
  wallet: string,
  signature?: string,
): { token: Token; tokensOut: number; fee: number; trade: Trade } | null {
  const mem = getMemoryStore();
  const token = mem.tokens.find((t) => t.mint === mint);
  if (!token) return null;

  const config = getConfig();
  const quote = getBuyQuote(
    amount,
    token.virtualSolReserves,
    token.virtualTokenReserves,
    config.fees.tradeFeeBps,
  );

  token.virtualSolReserves = quote.newVirtualSol;
  token.virtualTokenReserves = quote.newVirtualToken;
  token.realSolReserves += amount - quote.fee;
  token.volume24h += amount;
  token.marketCapUsd = getMarketCapUsd(
    token.virtualSolReserves,
    token.virtualTokenReserves,
  );
  token.priceSol =
    token.virtualSolReserves / Math.max(token.virtualTokenReserves, 1);
  token.holders = (token.holders ?? 1) + (Math.random() > 0.7 ? 1 : 0);
  token.txns24h = (token.txns24h ?? 0) + 1;
  token.change24h = (token.change24h ?? 0) + 0.4;
  token.liquidityUsd = (token.liquidityUsd ?? 0) + amount * 80;

  if (token.marketCapUsd >= config.bondingCurve.graduationMarketCapUsd) {
    token.complete = true;
    token.lpLocked = 95;
  }

  const trade: Trade = {
    id: `t_${Date.now()}`,
    mint,
    type: "buy",
    amount,
    priceSol: token.priceSol,
    marketCapUsd: token.marketCapUsd,
    wallet,
    signature,
    createdAt: Date.now(),
  };
  mem.trades.unshift(trade);
  return { token, tokensOut: quote.tokensOut, fee: quote.fee, trade };
}

export function executeSell(
  mint: string,
  amount: number,
  wallet: string,
  signature?: string,
): { token: Token; solOut: number; fee: number; trade: Trade } | null {
  const mem = getMemoryStore();
  const token = mem.tokens.find((t) => t.mint === mint);
  if (!token) return null;

  const config = getConfig();
  const quote = getSellQuote(
    amount,
    token.virtualSolReserves,
    token.virtualTokenReserves,
    config.fees.tradeFeeBps,
  );

  token.virtualSolReserves = quote.newVirtualSol;
  token.virtualTokenReserves = quote.newVirtualToken;
  token.volume24h += quote.solOut;
  token.marketCapUsd = Math.max(
    100,
    getMarketCapUsd(token.virtualSolReserves, token.virtualTokenReserves),
  );
  token.priceSol =
    token.virtualSolReserves / Math.max(token.virtualTokenReserves, 1);
  token.txns24h = (token.txns24h ?? 0) + 1;
  token.change24h = (token.change24h ?? 0) - 0.3;

  const trade: Trade = {
    id: `t_${Date.now()}`,
    mint,
    type: "sell",
    amount,
    priceSol: token.priceSol,
    marketCapUsd: token.marketCapUsd,
    wallet,
    signature,
    createdAt: Date.now(),
  };
  mem.trades.unshift(trade);
  return { token, solOut: quote.solOut, fee: quote.fee, trade };
}
