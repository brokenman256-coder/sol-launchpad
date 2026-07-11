import type { Token } from "./types";
import { coinAvatarUrl } from "./avatar";

const ADJ = [
  "Super", "Mega", "Giga", "Ultra", "Based", "Chad", "Degen", "Turbo", "Hyper", "Neon",
  "Pixel", "Quantum", "Cosmic", "Solar", "Lunar", "Baby", "King", "Queen", "Dark", "Golden",
  "Cyber", "Alpha", "Sigma", "Wild", "Crazy", "Lucky", "Pump", "Moon", "Rocket", "Ninja",
];
const NOUNS = [
  "Pepe", "Doge", "Cat", "Frog", "Ape", "Rat", "Duck", "Whale", "Shark", "Fox",
  "Wolf", "Bear", "Bull", "Dragon", "Goblin", "Troll", "Robot", "Alien", "Banana", "Pizza",
  "Rocket", "Moon", "Hat", "Crown", "Coin", "Wojak", "Chad", "Meme", "Clown", "Bonk",
];

const TAGS = ["meme", "ai", "gaming", "defi", "animal", "culture", "solana"];

function pseudoAddr(i: number): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let s = "";
  let n = i * 7919 + 104729;
  for (let k = 0; k < 44; k++) {
    n = (n * 1103515245 + 12345) >>> 0;
    s += alphabet[n % alphabet.length];
  }
  return s;
}

export function buildSeedTokens(count = 200): Token[] {
  const now = Date.now();
  const tokens: Token[] = [];

  for (let i = 0; i < count; i++) {
    const name =
      ADJ[i % ADJ.length] +
      " " +
      NOUNS[(i * 7) % NOUNS.length] +
      (i > 50 ? " " + (i % 99) : "");
    const symbol = (
      name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4) +
      (i % 36).toString(36).toUpperCase()
    ).slice(0, 8);

    const mcap = 800 + (i % 100) * 350 + (i % 7) * 1200 + (i % 3) * 4000;
    const complete = mcap >= 69000 || i % 17 === 0;
    const verified = i % 11 === 0 || complete;
    const change24h = ((i * 17) % 200) - 80 + (i % 5) * 3.2;
    const volume24h = 1 + (i % 40) * 2.3 + (complete ? 40 : 0);
    const liquidityUsd = complete
      ? 12000 + (i % 30) * 1800
      : 400 + mcap * 0.08;
    const holders = 12 + (i * 13) % 900 + (complete ? 400 : 0);
    const priceSol = 3e-8 + (i % 50) * 1e-9 + mcap * 1e-12;

    tokens.push({
      mint: `mint_${i}_${symbol.toLowerCase()}`,
      name,
      symbol,
      description:
        i % 5 === 0
          ? "Community-owned memecoin on Solana. Fair launch · bonding curve · no team dump."
          : "live launch · community coin on solana",
      imageUrl: coinAvatarUrl(`mint_${i}`, symbol),
      creator: pseudoAddr(i),
      createdAt: now - i * 45000 - (i % 60) * 1000,
      virtualSolReserves: 30 + mcap / 5000,
      virtualTokenReserves: 1073000000 - i * 10000,
      realSolReserves: mcap / 8000,
      realTokenReserves: 793100000 - i * 5000,
      complete,
      marketCapUsd: Math.min(mcap, complete ? 125000 + (i % 20) * 5000 : mcap),
      priceSol,
      volume24h,
      replies: (i * 13) % 200,
      change24h: Math.round(change24h * 10) / 10,
      liquidityUsd: Math.round(liquidityUsd),
      holders,
      txns24h: 20 + (i * 7) % 800,
      verified,
      renounced: verified || i % 4 === 0,
      lpLocked: complete ? 90 + (i % 10) : undefined,
      featured: i < 3 || i === 11 || i === 22,
      tags: [TAGS[i % TAGS.length], TAGS[(i * 3) % TAGS.length]],
      socials: verified
        ? {
            website: i % 2 === 0 ? "https://example.com" : undefined,
            twitter: `https://x.com/${symbol.toLowerCase()}`,
            telegram: i % 3 === 0 ? `https://t.me/${symbol.toLowerCase()}` : undefined,
          }
        : undefined,
    });
  }

  return tokens;
}

const seedTokens = buildSeedTokens(200);
export default seedTokens;
