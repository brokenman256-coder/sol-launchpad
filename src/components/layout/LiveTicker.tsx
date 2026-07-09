"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Token } from "@/lib/types";

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
      .then((d) => setTokens((d.tokens ?? []).slice(0, 10)));
  }, []);

  if (!tokens.length) return null;

  const items = [...tokens, ...tokens];

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0a0a0a]">
      <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-3 py-1.5">
        <span className="live-dot" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86efac]">
          Live
        </span>
      </div>
      <div className="overflow-hidden py-2.5">
        <div className="flex animate-marquee gap-6 whitespace-nowrap text-xs">
          {items.map((t, i) => (
            <Link
              key={`${t.mint}-${i}`}
              href={`/coin/${t.mint}`}
              className="inline-flex items-center gap-2 text-[#888] hover:text-white"
            >
              <span className="font-semibold text-white">${t.symbol}</span>
              <span className="text-[#86efac]">{formatMcap(t.marketCapUsd)}</span>
              <span className="text-[#444]">·</span>
              <span>{t.volume24h.toFixed(1)} SOL</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
