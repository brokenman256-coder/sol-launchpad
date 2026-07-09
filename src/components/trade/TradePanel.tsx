"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { Token } from "@/lib/types";
import { paySol, getSolBalance } from "@/lib/solana/client-pay";

const QUICK_BUY = [0.1, 0.5, 1, 5];

type PlatformPayments = {
  feeRecipient: string;
  feeRecipientConfigured: boolean;
  tradeFeeBps: number;
  cluster: string;
};

export function TradePanel({
  token,
  tradeFeeBps,
  onTrade,
}: {
  token: Token;
  tradeFeeBps: number;
  onTrade: () => void;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { setVisible } = useWalletModal();

  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [holding, setHolding] = useState(0);
  const [solBal, setSolBal] = useState<number | null>(null);
  const [feeRecipient, setFeeRecipient] = useState("");
  const [feeConfigured, setFeeConfigured] = useState(false);
  const [quote, setQuote] = useState<{
    tokensOut?: number;
    solOut?: number;
    fee?: number;
  } | null>(null);

  const loadHolding = useCallback(async () => {
    if (!publicKey) {
      setHolding(0);
      return;
    }
    const res = await fetch(
      `/api/holdings?wallet=${publicKey.toBase58()}&mint=${token.mint}`,
    );
    const data = await res.json();
    setHolding(data.balance ?? 0);
  }, [publicKey, token.mint]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.config as {
          fees: PlatformPayments & { feeRecipient: string; feeRecipientConfigured?: boolean };
        };
        setFeeRecipient(cfg.fees.feeRecipient);
        setFeeConfigured(Boolean(cfg.fees.feeRecipientConfigured));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadHolding();
  }, [loadHolding]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!publicKey) {
        setSolBal(null);
        return;
      }
      try {
        const sol = await getSolBalance(connection, publicKey);
        if (alive) setSolBal(sol);
      } catch {
        if (alive) setSolBal(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [connection, publicKey, success]);

  useEffect(() => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      const q = new URLSearchParams({
        mode,
        amount: String(num),
        wallet: publicKey?.toBase58() ?? "",
      });
      fetch(`/api/tokens/${token.mint}/trade?${q}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setQuote(null);
          else setQuote(d);
        })
        .catch(() => setQuote(null));
    }, 250);
    return () => clearTimeout(t);
  }, [amount, mode, token.mint, publicKey]);

  async function handleTrade(solAmount?: number) {
    setError("");
    setSuccess("");
    setStatus("");

    if (!connected || !publicKey) {
      setVisible(true);
      setError("Connect Phantom wallet to trade");
      return;
    }

    const num = solAmount ?? parseFloat(amount);
    if (!num || num <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      if (mode === "buy") {
        if (!feeConfigured || !feeRecipient) {
          throw new Error("Platform payment address is not configured");
        }

        setStatus("Approve SOL payment in Phantom…");
        const signature = await paySol({
          connection,
          wallet,
          to: feeRecipient,
          amountSol: num,
          memo: `buy:${token.mint}:${num}`,
        });

        setStatus("Confirming payment on Solana…");
        const res = await fetch(`/api/tokens/${token.mint}/trade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "buy",
            amount: num,
            wallet: publicKey.toBase58(),
            signature,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Trade failed");

        setSuccess(
          `Bought ~${Number(data.tokensOut).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${token.symbol}`,
        );
        setAmount("");
        setHolding(data.holding ?? 0);
        onTrade();
      } else {
        setStatus("Requesting sell payout…");
        const res = await fetch(`/api/tokens/${token.mint}/trade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "sell",
            amount: num,
            wallet: publicKey.toBase58(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sell failed");

        setSuccess(
          `Sold · received ${Number(data.solOut).toFixed(4)} SOL`,
        );
        setAmount("");
        setHolding(data.holding ?? 0);
        onTrade();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Trade failed";
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("rejected")) {
        setError("Transaction cancelled in Phantom");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  const feePct = (tradeFeeBps / 100).toFixed(1);
  const cluster = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="rounded-full bg-[#86efac]/10 px-2 py-0.5 font-medium text-[#86efac]">
          On-chain SOL · {cluster}
        </span>
        {connected && solBal !== null && (
          <span className="text-[#666]">Bal: {solBal.toFixed(3)} SOL</span>
        )}
      </div>

      <div className="mb-4 flex rounded-lg bg-black p-1">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
              setSuccess("");
              setAmount("");
            }}
            className={`flex-1 rounded-md py-2.5 text-sm font-bold capitalize transition ${
              mode === m
                ? m === "buy"
                  ? "bg-[#86efac] text-black"
                  : "bg-red-500 text-white"
                : "text-[#666] hover:text-[#aaa]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "buy" && (
        <div className="mb-3 grid grid-cols-4 gap-2">
          {QUICK_BUY.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleTrade(v)}
              disabled={loading || token.complete}
              className="rounded-lg border border-[#222] bg-[#111] py-1.5 text-xs font-semibold text-[#aaa] transition hover:border-[#86efac]/40 hover:text-[#86efac] disabled:opacity-40"
            >
              {v} SOL
            </button>
          ))}
        </div>
      )}

      {mode === "sell" && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#1f1f1f] bg-black px-3 py-2 text-xs">
          <span className="text-[#666]">Your {token.symbol}</span>
          <button
            type="button"
            className="font-semibold text-[#86efac] hover:underline"
            onClick={() => setAmount(holding > 0 ? String(holding) : "")}
          >
            {holding.toLocaleString(undefined, { maximumFractionDigits: 2 })} · Max
          </button>
        </div>
      )}

      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-[#1f1f1f] bg-black px-4 py-3.5 pr-14 text-lg font-semibold text-white outline-none placeholder:text-[#333] focus:border-[#86efac]/40"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#555]">
          {mode === "buy" ? "SOL" : token.symbol}
        </span>
      </div>

      {quote && (
        <div className="mt-2 space-y-0.5 text-[11px] text-[#666]">
          {mode === "buy" && quote.tokensOut != null && (
            <p>
              You receive ≈{" "}
              <span className="text-[#86efac]">
                {quote.tokensOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                {token.symbol}
              </span>
            </p>
          )}
          {mode === "sell" && quote.solOut != null && (
            <p>
              You receive ≈{" "}
              <span className="text-[#86efac]">{quote.solOut.toFixed(4)} SOL</span>
            </p>
          )}
          {quote.fee != null && <p>Platform fee ≈ {quote.fee.toFixed(4)} SOL</p>}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-[#555]">
        <span>Fee: {feePct}%</span>
        <span className="text-[#444]">Paid via Phantom</span>
      </div>

      {status && <p className="mt-2 text-xs text-[#86efac]">{status}</p>}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {success && <p className="mt-2 text-xs text-[#86efac]">{success}</p>}

      <button
        onClick={() => handleTrade()}
        disabled={loading || token.complete}
        className={`mt-3 w-full rounded-lg py-3.5 text-sm font-bold transition disabled:opacity-50 ${
          loading ? "btn-loading" : ""
        } ${
          mode === "buy"
            ? "bg-[#86efac] text-black hover:bg-[#6ee7a0]"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
      >
        {loading
          ? status || "Processing…"
          : token.complete
            ? "Graduated 🎓"
            : !connected
              ? "Connect Phantom"
              : mode === "buy"
                ? `Buy ${token.symbol} with SOL`
                : `Sell ${token.symbol} for SOL`}
      </button>

      <p className="mt-3 text-center text-[10px] leading-relaxed text-[#444]">
        Buys send SOL from your Phantom wallet to the platform treasury. Sells
        pay SOL back from the treasury after verifying your token balance.
      </p>
    </div>
  );
}
