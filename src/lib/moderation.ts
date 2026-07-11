/** Anti-spam, rate limits, and risk scoring helpers */

type Bucket = { count: number; resetAt: number };

const g = globalThis as typeof globalThis & {
  __rateBuckets?: Map<string, Bucket>;
  __blacklist?: Set<string>;
};

function buckets() {
  if (!g.__rateBuckets) g.__rateBuckets = new Map();
  return g.__rateBuckets;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const map = buckets();
  const b = map.get(key);
  if (!b || now > b.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { ok: true };
}

export function isBlacklisted(wallet: string, list: string[] = []): boolean {
  if (!g.__blacklist) g.__blacklist = new Set(list.map((w) => w.toLowerCase()));
  for (const w of list) g.__blacklist.add(w.toLowerCase());
  return g.__blacklist.has(wallet.toLowerCase());
}

export function addToBlacklist(wallet: string) {
  if (!g.__blacklist) g.__blacklist = new Set();
  g.__blacklist.add(wallet.toLowerCase());
}

const SPAM_PATTERNS = [
  /\b(airdrop|free\s*sol|double\s*your|claim\s*now)\b/i,
  /(https?:\/\/){2,}/i,
  /(.)\1{8,}/,
];

export function isSpamText(text: string): boolean {
  const t = text.trim();
  if (t.length < 1) return true;
  if (t.length > 2000) return true;
  return SPAM_PATTERNS.some((p) => p.test(t));
}

export function scoreWalletRisk(input: {
  totalTrades: number;
  tokensCreated: number;
  reportsAgainst: number;
  banned?: boolean;
}): number {
  let score = 10;
  if (input.banned) return 100;
  score += Math.min(40, input.reportsAgainst * 15);
  if (input.tokensCreated > 20) score += 15;
  if (input.totalTrades === 0 && input.tokensCreated > 3) score += 20;
  return Math.min(100, score);
}

export function sanitizeText(text: string, max = 500): string {
  return text.replace(/[<>]/g, "").trim().slice(0, max);
}
