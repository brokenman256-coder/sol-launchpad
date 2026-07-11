"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Globe,
  Lock,
  MessageCircle,
  Rocket,
  Share2,
  Shield,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BondingProgress } from "@/components/tokens/BondingProgress";
import { TradePanel } from "@/components/trade/TradePanel";
import { PriceChart } from "@/components/chart/PriceChart";
import { CommentForm } from "@/components/coin/CommentForm";
import { TradeHistory } from "@/components/coin/TradeHistory";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenImage } from "@/components/ui/TokenImage";
import { generatePriceHistory } from "@/lib/chart-data";
import type { Comment, Token, Trade } from "@/lib/types";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

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
          <div className="h-64 animate-pulse rounded-2xl bg-[#111]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[#111]" />
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

  const change = token.change24h ?? 0;
  const up = change >= 0;

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
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <TokenImage
                src={token.imageUrl}
                symbol={token.symbol}
                name={token.name}
                size={96}
                rounded="rounded-2xl ring-1 ring-white/10"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {token.complete && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                          <Rocket size={11} /> Graduated DEX
                        </span>
                      )}
                      {token.verified && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-300">
                          <BadgeCheck size={11} /> Verified
                        </span>
                      )}
                    </div>
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
                    className="shrink-0 rounded-full border border-white/10 p-2 text-[#666] hover:border-[#333] hover:text-white"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                {token.description && (
                  <p className="mt-3 text-sm leading-relaxed text-[#888]">
                    {token.description}
                  </p>
                )}
                {(token.socials?.website ||
                  token.socials?.twitter ||
                  token.socials?.telegram) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {token.socials.website && (
                      <a
                        href={token.socials.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#aaa] hover:text-white"
                      >
                        <Globe size={11} /> Website
                      </a>
                    )}
                    {token.socials.twitter && (
                      <a
                        href={token.socials.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#aaa] hover:text-white"
                      >
                        <ExternalLink size={11} /> X
                      </a>
                    )}
                    {token.socials.telegram && (
                      <a
                        href={token.socials.telegram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#aaa] hover:text-white"
                      >
                        <ExternalLink size={11} /> Telegram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-4 sm:p-5">
            <PriceChart data={chartData} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 sm:gap-3">
              <div className="rounded-xl bg-black/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">
                  Market cap
                </p>
                <p className="mt-0.5 font-bold text-[#86efac]">
                  {formatUsd(token.marketCapUsd)}
                </p>
              </div>
              <div className="rounded-xl bg-black/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">
                  24h
                </p>
                <p
                  className={`mt-0.5 font-bold ${
                    up ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {up ? "+" : ""}
                  {change.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl bg-black/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">
                  Liquidity
                </p>
                <p className="mt-0.5 font-bold text-white">
                  {formatUsd(token.liquidityUsd ?? 0)}
                </p>
              </div>
              <div className="rounded-xl bg-black/60 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#555]">
                  Holders
                </p>
                <p className="mt-0.5 font-bold text-white">
                  {(token.holders ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {token.renounced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                  <Shield size={11} /> Mint renounced
                </span>
              )}
              {typeof token.lpLocked === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300">
                  <Lock size={11} /> LP locked {token.lpLocked}%
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[#888]">
                Vol {token.volume24h.toFixed(1)} SOL · Txns{" "}
                {token.txns24h ?? 0}
              </span>
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

          <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-4 sm:p-5">
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
                  <div key={c.id} className="rounded-xl bg-black/60 p-3">
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
