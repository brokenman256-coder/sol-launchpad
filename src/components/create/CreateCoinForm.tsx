"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Upload } from "lucide-react";
import { paySol } from "@/lib/solana/client-pay";

export function CreateCoinForm({ creationFeeSol }: { creationFeeSol: number }) {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { setVisible } = useWalletModal();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [feeRecipient, setFeeRecipient] = useState("");
  const [feeConfigured, setFeeConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setFeeRecipient(d.config?.fees?.feeRecipient ?? "");
        setFeeConfigured(Boolean(d.config?.fees?.feeRecipientConfigured));
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!connected || !publicKey) {
      setVisible(true);
      setError("Connect Phantom wallet first");
      return;
    }
    if (!name || !symbol) {
      setError("Name and ticker are required");
      return;
    }
    if (creationFeeSol > 0 && (!feeConfigured || !feeRecipient)) {
      setError("Platform fee wallet is not configured");
      return;
    }

    setLoading(true);

    try {
      let signature: string | undefined;

      if (creationFeeSol > 0) {
        setStatus(`Approve ${creationFeeSol} SOL payment in Phantom…`);
        signature = await paySol({
          connection,
          wallet,
          to: feeRecipient,
          amountSol: creationFeeSol,
          memo: `create:${symbol.toUpperCase()}:${name}`,
        });
        setStatus("Payment confirmed · creating coin…");
      }

      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          symbol: symbol.toUpperCase(),
          description,
          imageUrl:
            imageUrl ||
            `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}&backgroundColor=86efac`,
          creator: publicKey.toBase58(),
          signature,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create coin");

      router.push(`/coin/${data.token.mint}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create coin";
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("rejected")) {
        setError("Payment cancelled in Phantom");
      } else {
        setError(msg);
      }
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-[#86efac]/20 bg-[#86efac]/5 px-4 py-3 text-center text-xs text-[#aaa]">
        Creating a coin charges{" "}
        <span className="font-semibold text-[#86efac]">{creationFeeSol} SOL</span>{" "}
        from your Phantom wallet (devnet/mainnet per config).
      </div>

      <div className="flex flex-col items-center">
        <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#333] bg-[#0d0d0d] transition hover:border-[#86efac]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="preview" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <>
              <Upload size={24} className="text-[#666]" />
              <span className="mt-2 text-xs text-[#666]">Upload image</span>
            </>
          )}
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="hidden"
          />
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Or paste image URL..."
          className="mt-3 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-2 text-sm text-white outline-none focus:border-[#86efac]"
        />
      </div>

      <div>
        <label className="text-sm text-[#888]">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Coin name"
          className="mt-1 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]"
        />
      </div>

      <div>
        <label className="text-sm text-[#888]">Ticker</label>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="TICKER"
          maxLength={10}
          className="mt-1 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]"
        />
      </div>

      <div>
        <label className="text-sm text-[#888]">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the world about your coin..."
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]"
        />
      </div>

      <p className="text-center text-sm text-[#666]">
        Cost to create:{" "}
        <span className="font-semibold text-[#86efac]">{creationFeeSol} SOL</span>
      </p>

      {status && <p className="text-center text-sm text-[#86efac]">{status}</p>}
      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="pump-btn w-full py-3 text-sm disabled:opacity-50"
      >
        {loading
          ? status || "Creating…"
          : !connected
            ? "Connect Phantom to create"
            : `Pay ${creationFeeSol} SOL & create coin`}
      </button>
    </form>
  );
}
