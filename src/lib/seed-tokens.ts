import type { Token } from "./types";

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

/** Build the 200-token seed set (same logic as scripts/gen-tokens.mjs). */
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
    const mcap = 800 + (i % 100) * 350 + (i % 7) * 1200;
    tokens.push({
      mint: `mint_${i}_${symbol.toLowerCase()}`,
      name,
      symbol,
      description: "live launch · community coin on solana",
      imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(symbol + i)}&backgroundColor=86efac`,
      creator: "Creator" + String(i).padStart(35, "1"),
      createdAt: now - i * 45000 - (i % 60) * 1000,
      virtualSolReserves: 30 + mcap / 5000,
      virtualTokenReserves: 1073000000 - i * 10000,
      realSolReserves: mcap / 8000,
      realTokenReserves: 793100000 - i * 5000,
      complete: mcap >= 69000,
      marketCapUsd: Math.min(mcap, 85000),
      priceSol: 3e-8 + (i % 50) * 1e-9,
      volume24h: 1 + (i % 40) * 2.3,
      replies: (i * 13) % 200,
    });
  }
  return tokens;
}

const seedTokens = buildSeedTokens(200);
export default seedTokens;
