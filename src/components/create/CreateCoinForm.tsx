"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { BadgeCheck, Globe, ImagePlus, Upload } from "lucide-react";
import { paySol } from "@/lib/solana/client-pay";
import { coinAvatarUrl } from "@/lib/avatar";

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
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [feeRecipient, setFeeRecipient] = useState("");
  const [feeConfigured, setFeeConfigured] = useState(false);

  const preview =
    imageUrl ||
    (symbol
      ? coinAvatarUrl(name || symbol, symbol.toUpperCase())
      : "");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setFeeRecipient(d.config?.fees?.feeRecipient ?? "");
        setFeeConfigured(Boolean(d.config?.fees?.feeRecipientConfigured));
      })
      .catch(() => undefined);
  }, []);

  function onFile(file?: File | null) {
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Image must be under 1.5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

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
            coinAvatarUrl(name, symbol.toUpperCase()),
          creator: publicKey.toBase58(),
          website: website || undefined,
          twitter: twitter || undefined,
          telegram: telegram || undefined,
          signature,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create coin");

      router.push(`/coin/${data.token.mint}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create coin";
      if (
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("rejected")
      ) {
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
      <div className="rounded-2xl border border-[#86efac]/20 bg-gradient-to-br from-[#86efac]/10 to-transparent px-4 py-3 text-center text-xs text-[#aaa]">
        Creating a coin charges{" "}
        <span className="font-semibold text-[#86efac]">{creationFeeSol} SOL</span>
        . Add socials for a{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-sky-300">
          <BadgeCheck size={12} /> Verified
        </span>{" "}
        badge (legitimate launch pattern).
      </div>

      <div className="flex flex-col items-center">
        <label className="relative flex h-36 w-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#333] bg-[#0d0d0d] transition hover:border-[#86efac]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <Upload size={24} className="text-[#666]" />
              <span className="mt-2 text-xs text-[#666]">Upload image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <div className="mt-3 flex w-full items-center gap-2">
          <ImagePlus size={14} className="shrink-0 text-[#555]" />
          <input
            type="url"
            value={imageUrl.startsWith("data:") ? "" : imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or paste image URL…"
            className="w-full rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#86efac]/50"
          />
        </div>
        {imageUrl.startsWith("data:") && (
          <p className="mt-1 text-[11px] text-[#555]">Using uploaded image ✓</p>
        )}
      </div>

      <div>
        <label className="text-sm text-[#888]">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Coin name"
          maxLength={32}
          className="mt-1 w-full rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]/50"
        />
      </div>

      <div>
        <label className="text-sm text-[#888]">Ticker</label>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="TICKER"
          maxLength={10}
          className="mt-1 w-full rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]/50"
        />
      </div>

      <div>
        <label className="text-sm text-[#888]">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the world about your coin..."
          rows={3}
          className="mt-1 w-full resize-none rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]/50"
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Globe size={15} className="text-sky-400" />
          Legitimate launch (optional)
        </div>
        <div className="space-y-3">
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Website URL"
            className="w-full rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400/40"
          />
          <input
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="X / Twitter URL"
            className="w-full rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400/40"
          />
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="Telegram URL"
            className="w-full rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400/40"
          />
        </div>
        <p className="mt-2 text-[11px] text-[#555]">
          Adding socials marks the coin as verified on the launchpad screener.
        </p>
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
        className="pump-btn w-full py-3.5 text-sm disabled:opacity-50"
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
