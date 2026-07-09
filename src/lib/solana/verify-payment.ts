import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { getRpcUrl, LAMPORTS_PER_SOL, MEMO_PROGRAM_ID } from "./constants";

const DATA_DIR = path.join(process.cwd(), "data");
const USED_SIGS_FILE = path.join(DATA_DIR, "used_signatures.json");

type UsedSigs = Record<string, { at: number; purpose: string }>;

function loadUsedSigs(): UsedSigs {
  try {
    if (existsSync(USED_SIGS_FILE)) {
      return JSON.parse(readFileSync(USED_SIGS_FILE, "utf-8")) as UsedSigs;
    }
  } catch {
    /* ignore */
  }
  const g = globalThis as typeof globalThis & { __usedSigs?: UsedSigs };
  return g.__usedSigs ?? {};
}

function saveUsedSigs(sigs: UsedSigs) {
  const g = globalThis as typeof globalThis & { __usedSigs?: UsedSigs };
  g.__usedSigs = sigs;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(USED_SIGS_FILE, JSON.stringify(sigs, null, 2));
  } catch {
    // Vercel / read-only: memory only
  }
}

export function markSignatureUsed(signature: string, purpose: string) {
  const sigs = loadUsedSigs();
  sigs[signature] = { at: Date.now(), purpose };
  saveUsedSigs(sigs);
}

export function isSignatureUsed(signature: string) {
  return Boolean(loadUsedSigs()[signature]);
}

export type VerifyPaymentInput = {
  signature: string;
  expectedFrom: string;
  expectedTo: string;
  minAmountSol: number;
  memoIncludes?: string;
};

export type VerifyPaymentResult =
  | { ok: true; lamports: number; amountSol: number }
  | { ok: false; error: string };

function getConnection() {
  return new Connection(getRpcUrl(), "confirmed");
}

function extractTransferLamports(
  tx: ParsedTransactionWithMeta,
  from: string,
  to: string,
): number {
  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === "string" ? k : k.pubkey.toBase58(),
  );
  const fromIdx = accountKeys.indexOf(from);
  const toIdx = accountKeys.indexOf(to);

  if (
    fromIdx >= 0 &&
    toIdx >= 0 &&
    tx.meta?.preBalances &&
    tx.meta?.postBalances
  ) {
    const fromDelta = tx.meta.preBalances[fromIdx] - tx.meta.postBalances[fromIdx];
    const toDelta = tx.meta.postBalances[toIdx] - tx.meta.preBalances[toIdx];
    if (toDelta > 0) return toDelta;
    if (fromDelta > 0) return fromDelta;
  }

  let total = 0;
  const instructions = tx.transaction.message.instructions;
  for (const ix of instructions) {
    if ("parsed" in ix && ix.program === "system" && ix.parsed?.type === "transfer") {
      const info = ix.parsed.info as {
        source?: string;
        destination?: string;
        lamports?: number;
      };
      if (info.source === from && info.destination === to && info.lamports) {
        total += info.lamports;
      }
    }
  }
  return total;
}

function extractMemo(tx: ParsedTransactionWithMeta): string {
  const parts: string[] = [];
  for (const ix of tx.transaction.message.instructions) {
    if ("parsed" in ix && ix.program === "spl-memo") {
      const memo = typeof ix.parsed === "string" ? ix.parsed : String(ix.parsed ?? "");
      if (memo) parts.push(memo);
    } else if ("programId" in ix) {
      const pid =
        typeof ix.programId === "string"
          ? ix.programId
          : (ix.programId as PublicKey).toBase58?.() ?? "";
      if (pid === MEMO_PROGRAM_ID.toBase58() && "data" in ix && typeof ix.data === "string") {
        try {
          parts.push(Buffer.from(ix.data, "base64").toString("utf8"));
        } catch {
          /* ignore */
        }
      }
    }
  }
  for (const log of tx.meta?.logMessages ?? []) {
    if (log.includes("Memo")) parts.push(log);
  }
  return parts.join(" | ");
}

export async function verifySolPayment(
  input: VerifyPaymentInput,
): Promise<VerifyPaymentResult> {
  const { signature, expectedFrom, expectedTo, minAmountSol, memoIncludes } = input;

  if (!signature || typeof signature !== "string" || signature.length < 32) {
    return { ok: false, error: "Missing or invalid transaction signature" };
  }

  if (isSignatureUsed(signature)) {
    return { ok: false, error: "This payment was already used" };
  }

  let from: PublicKey;
  let to: PublicKey;
  try {
    from = new PublicKey(expectedFrom);
    to = new PublicKey(expectedTo);
  } catch {
    return { ok: false, error: "Invalid wallet address" };
  }

  const connection = getConnection();
  let tx: ParsedTransactionWithMeta | null = null;

  for (let i = 0; i < 8; i++) {
    tx = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (tx) break;
    await new Promise((r) => setTimeout(r, 750));
  }

  if (!tx) {
    return {
      ok: false,
      error: "Transaction not found on-chain yet. Wait a few seconds and retry.",
    };
  }

  if (tx.meta?.err) {
    return { ok: false, error: "On-chain transaction failed" };
  }

  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === "string" ? k : k.pubkey.toBase58(),
  );

  if (!accountKeys.includes(from.toBase58())) {
    return { ok: false, error: "Payment was not signed by the connected wallet" };
  }

  const lamports = extractTransferLamports(tx, from.toBase58(), to.toBase58());
  const minLamports = Math.floor(minAmountSol * LAMPORTS_PER_SOL * 0.995);

  if (lamports < minLamports) {
    return {
      ok: false,
      error: `Insufficient payment: got ${(lamports / LAMPORTS_PER_SOL).toFixed(6)} SOL, need ${minAmountSol} SOL`,
    };
  }

  if (memoIncludes) {
    const memo = extractMemo(tx);
    if (!memo.includes(memoIncludes)) {
      console.warn("[verify] memo mismatch", { expected: memoIncludes, got: memo });
    }
  }

  return {
    ok: true,
    lamports,
    amountSol: lamports / LAMPORTS_PER_SOL,
  };
}

export async function sendSolFromTreasury(params: {
  to: string;
  amountSol: number;
  memo?: string;
}): Promise<{ ok: true; signature: string } | { ok: false; error: string }> {
  const secret = process.env.PLATFORM_WALLET_SECRET;
  if (!secret) {
    return {
      ok: false,
      error:
        "Sell payouts require PLATFORM_WALLET_SECRET (treasury key) on the server",
    };
  }

  try {
    const bs58 = (await import("bs58")).default;
    const { Keypair, SystemProgram, Transaction, TransactionInstruction } =
      await import("@solana/web3.js");

    const payer = Keypair.fromSecretKey(bs58.decode(secret));
    const to = new PublicKey(params.to);
    const lamports = Math.round(params.amountSol * LAMPORTS_PER_SOL);
    if (lamports < 1) return { ok: false, error: "Payout amount too small" };

    const connection = getConnection();
    const bal = await connection.getBalance(payer.publicKey);
    if (bal < lamports + 5000) {
      return {
        ok: false,
        error: `Treasury low on SOL (${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL). Fund ${payer.publicKey.toBase58()}`,
      };
    }

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({
      feePayer: payer.publicKey,
      blockhash,
      lastValidBlockHeight,
    });

    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: to,
        lamports,
      }),
    );

    if (params.memo) {
      tx.add(
        new TransactionInstruction({
          keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(params.memo, "utf8"),
        }),
      );
    }

    const signature = await connection.sendTransaction(tx, [payer], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    return { ok: true, signature };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Treasury payout failed";
    return { ok: false, error: msg };
  }
}

export function getTreasuryPublicKey(): string | null {
  const secret = process.env.PLATFORM_WALLET_SECRET;
  if (!secret) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bs58mod = require("bs58") as { default?: { decode: (s: string) => Uint8Array }; decode?: (s: string) => Uint8Array };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Keypair } = require("@solana/web3.js") as typeof import("@solana/web3.js");
    const decode = bs58mod.default?.decode ?? bs58mod.decode;
    if (!decode) return null;
    return Keypair.fromSecretKey(decode(secret)).publicKey.toBase58();
  } catch {
    return null;
  }
}
