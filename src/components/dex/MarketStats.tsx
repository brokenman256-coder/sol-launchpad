"use client";

import { useEffect, useState } from "react";
import type { Token } from "@/lib/types";
import { Activity, Rocket, ShieldCheck, TrendingUp } from "lucide-react";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function MarketStats() {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    fetch("/api/tokens?sort=volume")
      .then((r) => r.json())
      .then((d) => setTokens(d.tokens ?? []));
  }, []);

  const volume = tokens.reduce((s, t) => s + t.volume24h, 0);
  const mcap = tokens.reduce((s, t) => s + t.marketCapUsd, 0);
  const graduated = tokens.filter((t) => t.complete).length;
  const verified = tokens.filter((t) => t.verified).length;

  const cards = [
    {
      label: "24h Volume",
      value: `${volume.toFixed(0)} SOL`,
      sub: formatUsd(volume * 140),
      icon: Activity,
      accent: "text-cyan-300",
      ring: "from-cyan-500/20 to-transparent",
    },
    {
      label: "Total Market Cap",
      value: formatUsd(mcap),
      sub: `${tokens.length} pairs`,
      icon: TrendingUp,
      accent: "text-[#86efac]",
      ring: "from-emerald-500/20 to-transparent",
    },
    {
      label: "Graduated to DEX",
      value: String(graduated),
      sub: "LP seeded & tradeable",
      icon: Rocket,
      accent: "text-amber-300",
      ring: "from-amber-500/20 to-transparent",
    },
    {
      label: "Verified Launches",
      value: String(verified),
      sub: "Socials + renounced mint",
      icon: ShieldCheck,
      accent: "text-violet-300",
      ring: "from-violet-500/20 to-transparent",
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`premium-panel relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${c.ring} p-3.5 sm:p-4`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666]">
              {c.label}
            </span>
            <c.icon size={14} className={c.accent} />
          </div>
          <p className={`text-lg font-bold tabular-nums sm:text-xl ${c.accent}`}>
            {c.value}
          </p>
          <p className="mt-0.5 text-[11px] text-[#555]">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
