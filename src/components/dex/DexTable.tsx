"use client";

import Link from "next/link";
import type { Token } from "@/lib/types";
import { TokenImage } from "@/components/ui/TokenImage";
import { BadgeCheck, ExternalLink, Lock, Shield } from "lucide-react";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.max(0, n).toFixed(0)}`;
}

function timeAgo(ts: number) {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function Change({ n = 0 }: { n?: number }) {
  const pos = n >= 0;
  return (
    <span
      className={`tabular-nums font-semibold ${
        pos ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      {pos ? "+" : ""}
      {n.toFixed(1)}%
    </span>
  );
}

export function DexTable({
  tokens,
  title = "DEX Screener",
  subtitle = "Graduated pairs · deep liquidity · tradeable on open market",
}: {
  tokens: Token[];
  title?: string;
  subtitle?: string;
}) {
  if (!tokens.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#2a2a2a] py-16 text-center">
        <p className="text-white font-semibold">No graduated pairs yet</p>
        <p className="mt-1 text-sm text-[#666]">
          Coins graduate here when the bonding curve fills
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0a]/90 shadow-[0_0_60px_rgba(134,239,172,0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 px-4 py-4 sm:px-5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-md bg-amber-400/15 px-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              DEX
            </span>
            <h2 className="text-base font-bold text-white sm:text-lg">{title}</h2>
          </div>
          <p className="text-xs text-[#666]">{subtitle}</p>
        </div>
        <p className="text-xs text-[#555]">{tokens.length} pairs</p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.12em] text-[#555]">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-2 py-3 font-semibold">Token / Pair</th>
              <th className="px-3 py-3 font-semibold">Price</th>
              <th className="px-3 py-3 font-semibold">24h</th>
              <th className="px-3 py-3 font-semibold">Volume</th>
              <th className="px-3 py-3 font-semibold">Liquidity</th>
              <th className="px-3 py-3 font-semibold">MCap</th>
              <th className="px-3 py-3 font-semibold">Holders</th>
              <th className="px-3 py-3 font-semibold">Age</th>
              <th className="px-3 py-3 font-semibold">Safety</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <tr
                key={t.mint}
                className="group border-b border-white/[0.03] transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 text-[#444] tabular-nums">{i + 1}</td>
                <td className="px-2 py-3">
                  <Link href={`/coin/${t.mint}`} className="flex items-center gap-3">
                    <TokenImage
                      src={t.imageUrl}
                      symbol={t.symbol}
                      name={t.name}
                      size={40}
                      rounded="rounded-lg"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white group-hover:text-[#86efac]">
                          {t.symbol}
                        </span>
                        {t.verified && (
                          <BadgeCheck size={14} className="text-sky-400" />
                        )}
                      </div>
                      <p className="truncate text-xs text-[#555]">{t.name}/SOL</p>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 font-medium tabular-nums text-[#ddd]">
                  {(t.priceSol * 140).toExponential(2)}
                </td>
                <td className="px-3 py-3">
                  <Change n={t.change24h} />
                </td>
                <td className="px-3 py-3 tabular-nums text-[#ccc]">
                  {t.volume24h.toFixed(1)} SOL
                </td>
                <td className="px-3 py-3 tabular-nums text-[#ccc]">
                  {formatUsd(t.liquidityUsd ?? 0)}
                </td>
                <td className="px-3 py-3 font-semibold tabular-nums text-[#86efac]">
                  {formatUsd(t.marketCapUsd)}
                </td>
                <td className="px-3 py-3 tabular-nums text-[#aaa]">
                  {(t.holders ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-3 text-[#666]">{timeAgo(t.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#888]">
                    {t.renounced && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                        <Shield size={10} /> Mint
                      </span>
                    )}
                    {typeof t.lpLocked === "number" && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300">
                        <Lock size={10} /> {t.lpLocked}%
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/coin/${t.mint}`}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#86efac]/40 hover:bg-[#86efac]/10 hover:text-[#86efac]"
                  >
                    Trade <ExternalLink size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-white/[0.04] md:hidden">
        {tokens.map((t) => (
          <Link
            key={t.mint}
            href={`/coin/${t.mint}`}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
          >
            <TokenImage
              src={t.imageUrl}
              symbol={t.symbol}
              name={t.name}
              size={44}
              rounded="rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{t.symbol}</span>
                {t.verified && <BadgeCheck size={13} className="text-sky-400" />}
                <span className="text-[10px] text-[#555]">{timeAgo(t.createdAt)}</span>
              </div>
              <p className="text-xs text-[#666]">
                Vol {t.volume24h.toFixed(1)} SOL · Liq {formatUsd(t.liquidityUsd ?? 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#86efac]">
                {formatUsd(t.marketCapUsd)}
              </p>
              <Change n={t.change24h} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
