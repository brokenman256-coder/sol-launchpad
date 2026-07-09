"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getSolBalance } from "@/lib/solana/client-pay";

export function WalletButton({ className = "" }: { className?: string }) {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!publicKey) {
        setBalance(null);
        return;
      }
      try {
        const sol = await getSolBalance(connection, publicKey);
        if (alive) setBalance(sol);
      } catch {
        if (alive) setBalance(null);
      }
    }
    load();
    const id = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [connection, publicKey]);

  if (!connected || !publicKey) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        disabled={connecting}
        className={`pump-btn px-3 py-2 text-xs sm:px-4 sm:text-sm ${className}`}
      >
        {connecting ? "Connecting…" : "Connect Phantom"}
      </button>
    );
  }

  const short = `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`;
  const name = wallet?.adapter.name ?? "Wallet";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {balance !== null && (
        <span className="hidden rounded-full border border-[#1f1f1f] bg-[#111] px-2.5 py-1.5 text-xs font-medium text-[#86efac] sm:inline">
          {balance.toFixed(3)} SOL
        </span>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        title={`${name} · click to disconnect`}
        className="rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#86efac]/40 hover:text-[#86efac] sm:text-sm"
      >
        {short}
      </button>
    </div>
  );
}
