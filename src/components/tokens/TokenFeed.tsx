"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SortOption, Token } from "@/lib/types";
import { TokenCard } from "./TokenCard";
import { Crown } from "lucide-react";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function TokenFeed({ graduationMcap }: { graduationMcap: number }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  const [tokens, setTokens] = useState<Token[]>([]);
  const [sort, setSort] = useState<SortOption>("new");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tokens?sort=${sort}`)
      .then((r) => r.json())
      .then((data) => setTokens(data.tokens ?? []))
      .finally(() => setLoading(false));
  }, [sort]);

  const filtered = query
    ? tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.symbol.toLowerCase().includes(query),
      )
    : tokens;

  const king = [...tokens].sort((a, b) => b.marketCapUsd - a.marketCapUsd)[0];

  const sorts: { value: SortOption; label: string }[] = [
    { value: "new", label: "New" },
    { value: "market_cap", label: "Market cap" },
    { value: "volume", label: "Volume" },
  ];

  return (
    <div>
      {king && !loading && !query && (
        <Link
          href={`/coin/${king.mint}`}
          className="anim-fade-up mb-5 flex items-center gap-4 overflow-hidden rounded-xl border border-[#86efac]/25 bg-gradient-to-r from-[#0c1f14] via-[#0d0d0d] to-[#0d0d0d] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#86efac]/45 hover:shadow-[0_0_40px_rgba(134,239,172,0.08)] sm:p-4"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] sm:h-20 sm:w-20">
            {king.imageUrl ? (
              <Image src={king.imageUrl} alt={king.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">👑</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#86efac]">
              <Crown size={14} />
              King of the hill
            </div>
            <p className="truncate text-base font-bold text-white sm:text-lg">
              {king.name}{" "}
              <span className="font-normal text-[#666]">${king.symbol}</span>
            </p>
            <p className="mt-0.5 text-sm text-[#86efac]">
              {formatUsd(king.marketCapUsd)} market cap
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-wide text-[#555]">24h vol</p>
            <p className="font-semibold text-white">{king.volume24h.toFixed(1)} SOL</p>
          </div>
        </Link>
      )}

      {query && (
        <p className="mb-4 text-sm text-[#888]">
          Results for &quot;<span className="text-white">{query}</span>&quot; ({filtered.length})
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              sort === s.value
                ? "bg-[#86efac] text-black"
                : "bg-[#111] text-[#888] hover:bg-[#161616] hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-[#444] sm:inline">
          {filtered.length} coins
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-shimmer h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2a2a2a] py-20 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#86efac]/15 text-2xl">
            🟢
          </div>
          <p className="text-lg font-semibold text-white">No coins found</p>
          <p className="mt-1 text-sm text-[#666]">
            {query ? "Try a different search" : "Create the first coin on pump.fun beta"}
          </p>
          {!query && (
            <Link href="/create" className="pump-btn mt-5 inline-flex px-5 py-2.5 text-sm">
              Create coin
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((token, i) => (
            <TokenCard
              key={token.mint}
              token={token}
              graduationMcap={graduationMcap}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
