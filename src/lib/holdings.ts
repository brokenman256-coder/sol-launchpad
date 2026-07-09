import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const HOLDINGS_FILE = path.join(DATA_DIR, "holdings.json");

/** wallet -> mint -> token amount */
export type HoldingsMap = Record<string, Record<string, number>>;

function memory(): { holdings: HoldingsMap } {
  const g = globalThis as typeof globalThis & { __holdings?: HoldingsMap };
  if (!g.__holdings) g.__holdings = {};
  return { holdings: g.__holdings };
}

function load(): HoldingsMap {
  try {
    if (existsSync(HOLDINGS_FILE)) {
      return JSON.parse(readFileSync(HOLDINGS_FILE, "utf-8")) as HoldingsMap;
    }
  } catch {
    /* ignore */
  }
  return memory().holdings;
}

function save(map: HoldingsMap) {
  const g = globalThis as typeof globalThis & { __holdings?: HoldingsMap };
  g.__holdings = map;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(HOLDINGS_FILE, JSON.stringify(map, null, 2));
  } catch {
    // read-only env
  }
}

export function getHolding(wallet: string, mint: string): number {
  const map = load();
  return map[wallet]?.[mint] ?? 0;
}

export function getWalletHoldings(wallet: string): Record<string, number> {
  const map = load();
  return map[wallet] ?? {};
}

export function creditHolding(wallet: string, mint: string, amount: number) {
  if (amount <= 0) return getHolding(wallet, mint);
  const map = load();
  if (!map[wallet]) map[wallet] = {};
  map[wallet][mint] = (map[wallet][mint] ?? 0) + amount;
  save(map);
  return map[wallet][mint];
}

export function debitHolding(wallet: string, mint: string, amount: number): boolean {
  if (amount <= 0) return false;
  const map = load();
  const bal = map[wallet]?.[mint] ?? 0;
  if (bal + 1e-12 < amount) return false;
  map[wallet] = map[wallet] ?? {};
  map[wallet][mint] = Math.max(0, bal - amount);
  save(map);
  return true;
}
