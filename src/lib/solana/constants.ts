import { PublicKey } from "@solana/web3.js";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function getRpcUrl() {
  return (
    process.env.NEXT_PUBLIC_RPC_URL ??
    process.env.RPC_URL ??
    "https://api.devnet.solana.com"
  );
}

export function getCluster(): "devnet" | "mainnet-beta" | "testnet" {
  const c = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";
  if (c === "mainnet-beta" || c === "testnet" || c === "devnet") return c;
  return "devnet";
}

export function isPlaceholderAddress(addr: string | undefined | null) {
  if (!addr) return true;
  if (addr.includes("YOUR_") || addr.includes("PLACEHOLDER")) return true;
  try {
    // eslint-disable-next-line no-new
    new PublicKey(addr);
    return false;
  } catch {
    return true;
  }
}
