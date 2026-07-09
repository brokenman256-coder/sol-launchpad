"use client";

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type TransactionSignature,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, MEMO_PROGRAM_ID } from "./constants";

export type PaySolParams = {
  connection: Connection;
  wallet: WalletContextState;
  to: string;
  amountSol: number;
  memo: string;
};

/**
 * Build + sign + send a SOL transfer from the connected Phantom wallet
 * to the platform fee recipient, with a memo for server-side matching.
 */
export async function paySol({
  connection,
  wallet,
  to,
  amountSol,
  memo,
}: PaySolParams): Promise<TransactionSignature> {
  if (!wallet.publicKey) {
    throw new Error("Connect Phantom wallet first");
  }
  if (!wallet.sendTransaction) {
    throw new Error("Wallet does not support transactions");
  }
  if (!amountSol || amountSol <= 0) {
    throw new Error("Invalid payment amount");
  }

  const recipient = new PublicKey(to);
  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
  if (lamports < 1) {
    throw new Error("Amount too small");
  }

  const balance = await connection.getBalance(wallet.publicKey);
  // leave a little for fees
  if (balance < lamports + 5000) {
    throw new Error(
      `Insufficient SOL. Need ~${amountSol.toFixed(4)} SOL + fees (balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL)`,
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    feePayer: wallet.publicKey,
    blockhash,
    lastValidBlockHeight,
  });

  tx.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports,
    }),
  );

  tx.add(
    new TransactionInstruction({
      keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, "utf8"),
    }),
  );

  const signature = await wallet.sendTransaction(tx, connection, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 3,
  });

  const conf = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  if (conf.value.err) {
    throw new Error(`Transaction failed on-chain: ${JSON.stringify(conf.value.err)}`);
  }

  return signature;
}

export async function getSolBalance(
  connection: Connection,
  publicKey: PublicKey | null,
): Promise<number> {
  if (!publicKey) return 0;
  const lamports = await connection.getBalance(publicKey, "confirmed");
  return lamports / LAMPORTS_PER_SOL;
}
