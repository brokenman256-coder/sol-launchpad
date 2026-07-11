"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Token } from "@/lib/types";
import { TokenImage } from "@/components/ui/TokenImage";

function formatMcap(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function LiveTicker() {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    fetch("/api/tokens?sort=volume")
      .then((r) => r.json())
      .then((d) => setTokens((d.tokens ?? []).slice(0, 12)));
  }, []);

  if (!tokens.length) return null;

  const items = [...tokens, ...tokens];

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/90">
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-3 py-1.5">
        <span className="live-dot" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86efac]">
          Live market
        </span>
      </div>
      <div className="overflow-hidden py-2.5">
        <div className="flex animate-marquee gap-5 whitespace-nowrap text-xs">
          {items.map((t, i) => (
            <Link
              key={`${t.mint}-${i}`}
              href={`/coin/${t.mint}`}
              className="inline-flex items-center gap-2 text-[#888] hover:text-white"
            >
              <TokenImage
                src={t.imageUrl}
                symbol={t.symbol}
                name={t.name}
                size={20}
                rounded="rounded-md"
              />
              <span className="font-semibold text-white">${t.symbol}</span>
              <span className="text-[#86efac]">{formatMcap(t.marketCapUsd)}</span>
              <span
                className={
                  (t.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {(t.change24h ?? 0) >= 0 ? "+" : ""}
                {(t.change24h ?? 0).toFixed(1)}%
              </span>
              <span className="text-[#444]">·</span>
              <span>{t.volume24h.toFixed(1)} SOL</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
