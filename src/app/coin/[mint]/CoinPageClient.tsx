"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Share2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BondingProgress } from "@/components/tokens/BondingProgress";
import { TradePanel } from "@/components/trade/TradePanel";
import { PriceChart } from "@/components/chart/PriceChart";
import { CommentForm } from "@/components/coin/CommentForm";
import { TradeHistory } from "@/components/coin/TradeHistory";
import { CopyButton } from "@/components/ui/CopyButton";
import { generatePriceHistory } from "@/lib/chart-data";
import type { Comment, Token, Trade } from "@/lib/types";

export function CoinPageClient({
  mint,
  tradeFeeBps,
  graduationMcap,
}: {
  mint: string;
  tradeFeeBps: number;
  graduationMcap: number;
}) {
  const [token, setToken] = useState<Token | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/tokens/${mint}`)
      .then((r) => r.json())
      .then((data) => {
        setToken(data.token ?? null);
        setComments(data.comments ?? []);
        setTrades(data.trades ?? []);
      })
      .finally(() => setLoading(false));
  }, [mint]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const chartData = useMemo(
    () => (token ? generatePriceHistory(token, trades) : []),
    [token, trades],
  );

  function share() {
    if (navigator.share) {
      navigator.share({ title: token?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-xl bg-[#111]" />
          <div className="h-48 animate-pulse rounded-xl bg-[#111]" />
        </div>
      </AppShell>
    );
  }

  if (!token) {
    return (
      <AppShell>
        <p className="py-20 text-center text-[#666]">Coin not found</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#666] hover:text-[#86efac]"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]">
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] sm:h-24 sm:w-24">
                {token.imageUrl ? (
                  <Image
                    src={token.imageUrl}
                    alt={token.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🪙</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                      {token.name}
                    </h1>
                    <p className="text-[#86efac]">${token.symbol}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CopyButton text={token.mint} label="Copy CA" />
                      <span className="font-mono text-[10px] text-[#444]">
                        {token.mint.slice(0, 8)}…{token.mint.slice(-6)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={share}
                    className="shrink-0 rounded-full border border-[#222] p-2 text-[#666] hover:border-[#333] hover:text-white"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                {token.description && (
                  <p className="mt-3 text-sm leading-relaxed text-[#888]">
                    {token.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4 sm:p-5">
            <PriceChart data={chartData} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
              <div className="rounded-lg bg-black p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">Market cap</p>
                <p className="mt-0.5 font-bold text-[#86efac]">
                  ${token.marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-lg bg-black p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">Price</p>
                <p className="mt-0.5 font-bold text-white">
                  {token.priceSol.toExponential(2)} SOL
                </p>
              </div>
              <div className="rounded-lg bg-black p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">24h Vol</p>
                <p className="mt-0.5 font-bold text-white">{token.volume24h.toFixed(2)} SOL</p>
              </div>
            </div>
            <div className="mt-4">
              <BondingProgress
                marketCapUsd={token.marketCapUsd}
                graduationMcap={graduationMcap}
                complete={token.complete}
              />
            </div>
          </div>

          <TradeHistory trades={trades} />

          <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <MessageCircle size={16} className="text-[#86efac]" />
              Thread ({comments.length})
            </h3>
            <CommentForm mint={mint} onPosted={load} />
            <div className="mt-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-[#555]">Be the first to reply</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-black p-3">
                    <p className="text-xs font-medium text-[#86efac]">
                      {c.author.slice(0, 4)}…{c.author.slice(-4)}
                    </p>
                    <p className="mt-1 text-sm text-[#ccc]">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <TradePanel token={token} tradeFeeBps={tradeFeeBps} onTrade={load} />
        </div>
      </div>
    </AppShell>
  );
}
