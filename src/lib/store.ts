import { readFileSync } from "fs";
import path from "path";
import type { Comment, PlatformConfig, Token, Trade } from "./types";
import seedTokens from "./seed-tokens";

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
      tokens: seedTokens as Token[],
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

export function getAllTokens(): Token[] {
  return getMemoryStore().tokens;
}

export function getToken(mint: string) {
  return getMemoryStore().tokens.find((t) => t.mint === mint);
}

export function getComments() {
  return [] as Comment[];
}

export function getTrades() {
  return [] as Trade[];
}

export function createToken(input: {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
}): Token {
  const mem = getMemoryStore();
  const t: Token = {
    mint: "mint_" + Date.now(),
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    imageUrl: input.imageUrl,
    creator: input.creator,
    createdAt: Date.now(),
    virtualSolReserves: 30,
    virtualTokenReserves: 1073000000,
    realSolReserves: 0,
    realTokenReserves: 793100000,
    complete: false,
    marketCapUsd: 0,
    priceSol: 3e-8,
    volume24h: 0,
    replies: 0,
  };
  mem.tokens.unshift(t);
  return t;
}

export function updateConfig(c: PlatformConfig) {
  getMemoryStore().config = c;
  return c;
}

export function addComment() {
  return null;
}

export function executeBuy() {
  return null;
}

export function executeSell() {
  return null;
}
