"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FeedTab, SortOption, Token } from "@/lib/types";
import { TokenCard } from "./TokenCard";
import { DexTable } from "@/components/dex/DexTable";
import { TokenImage } from "@/components/ui/TokenImage";
import {
  BadgeCheck,
  Crown,
  Flame,
  LayoutGrid,
  Rocket,
  Sparkles,
  Table2,
} from "lucide-react";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function TokenFeed({ graduationMcap }: { graduationMcap: number }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const viewParam = searchParams.get("view");

  const [tokens, setTokens] = useState<Token[]>([]);
  const [sort, setSort] = useState<SortOption>("trending");
  const [tab, setTab] = useState<FeedTab>(
    viewParam === "dex" ? "graduated" : "all",
  );
  const [view, setView] = useState<"cards" | "table">(
    viewParam === "dex" ? "table" : "cards",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tokens?sort=${sort}`)
      .then((r) => r.json())
      .then((data) => setTokens(data.tokens ?? []))
      .finally(() => setLoading(false));
  }, [sort]);

  useEffect(() => {
    if (viewParam === "dex") {
      setTab("graduated");
      setView("table");
    }
  }, [viewParam]);

  const filtered = useMemo(() => {
    let list = tokens;
    if (tab === "new") list = list.filter((t) => Date.now() - t.createdAt < 3_600_000);
    if (tab === "graduating")
      list = list.filter(
        (t) => !t.complete && t.marketCapUsd >= graduationMcap * 0.55,
      );
    if (tab === "graduated") list = list.filter((t) => t.complete);
    if (tab === "verified") list = list.filter((t) => t.verified);
    if (query) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.symbol.toLowerCase().includes(query) ||
          t.mint.toLowerCase().includes(query),
      );
    }
    return list;
  }, [tokens, tab, query, graduationMcap]);

  const king = useMemo(
    () => [...tokens].sort((a, b) => b.marketCapUsd - a.marketCapUsd)[0],
    [tokens],
  );
  const featured = useMemo(
    () => tokens.filter((t) => t.featured).slice(0, 4),
    [tokens],
  );
  const graduated = useMemo(
    () => tokens.filter((t) => t.complete).sort((a, b) => b.volume24h - a.volume24h),
    [tokens],
  );

  const sorts: { value: SortOption; label: string }[] = [
    { value: "trending", label: "Trending" },
    { value: "new", label: "New" },
    { value: "market_cap", label: "Market cap" },
    { value: "volume", label: "Volume" },
    { value: "gainers", label: "Gainers" },
  ];

  const tabs: { value: FeedTab; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: "All", icon: <Sparkles size={13} /> },
    { value: "new", label: "New", icon: <Flame size={13} /> },
    { value: "graduating", label: "Almost DEX", icon: <Rocket size={13} /> },
    { value: "graduated", label: "Graduated", icon: <Table2 size={13} /> },
    { value: "verified", label: "Verified", icon: <BadgeCheck size={13} /> },
  ];

  return (
    <div>
      {/* King of the hill */}
      {king && !loading && !query && tab === "all" && (
        <Link
          href={`/coin/${king.mint}`}
          className="anim-fade-up mb-5 flex items-center gap-4 overflow-hidden rounded-2xl border border-[#86efac]/20 bg-gradient-to-r from-[#0c1f14] via-[#0d0d0d] to-[#111827] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#86efac]/45 hover:shadow-[0_0_50px_rgba(134,239,172,0.12)] sm:p-4"
        >
          <TokenImage
            src={king.imageUrl}
            symbol={king.symbol}
            name={king.name}
            size={80}
            rounded="rounded-2xl ring-2 ring-[#86efac]/30"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#86efac]">
              <Crown size={14} />
              King of the hill
            </div>
            <p className="truncate text-base font-bold text-white sm:text-lg">
              {king.name}{" "}
              <span className="font-normal text-[#666]">${king.symbol}</span>
              {king.verified && (
                <BadgeCheck size={16} className="ml-1 inline text-sky-400" />
              )}
            </p>
            <p className="mt-0.5 text-sm text-[#86efac]">
              {formatUsd(king.marketCapUsd)} market cap
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-wide text-[#555]">24h vol</p>
            <p className="font-semibold text-white">{king.volume24h.toFixed(1)} SOL</p>
            <p
              className={`mt-1 text-xs font-semibold ${
                (king.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {(king.change24h ?? 0) >= 0 ? "+" : ""}
              {(king.change24h ?? 0).toFixed(1)}%
            </p>
          </div>
        </Link>
      )}

      {/* Featured strip */}
      {featured.length > 0 && !query && tab === "all" && !loading && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#666]">
            <Sparkles size={12} className="text-violet-300" />
            Featured launches
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {featured.map((t) => (
              <Link
                key={t.mint}
                href={`/coin/${t.mint}`}
                className="flex min-w-[200px] items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-2.5 transition hover:border-violet-400/30 hover:bg-violet-500/5"
              >
                <TokenImage
                  src={t.imageUrl}
                  symbol={t.symbol}
                  name={t.name}
                  size={44}
                  rounded="rounded-xl"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    ${t.symbol}
                  </p>
                  <p className="text-xs text-[#86efac]">{formatUsd(t.marketCapUsd)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && (
        <p className="mb-4 text-sm text-[#888]">
          Results for &quot;<span className="text-white">{query}</span>&quot; (
          {filtered.length})
        </p>
      )}

      {/* Tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
              if (t.value === "graduated") setView("table");
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              tab === t.value
                ? "bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.12)]"
                : "bg-white/[0.04] text-[#888] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-white/5 bg-black/40 p-0.5">
          <button
            onClick={() => setView("cards")}
            className={`rounded-full p-1.5 ${
              view === "cards" ? "bg-white/10 text-white" : "text-[#555]"
            }`}
            aria-label="Card view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded-full p-1.5 ${
              view === "table" ? "bg-white/10 text-white" : "text-[#555]"
            }`}
            aria-label="Table view"
          >
            <Table2 size={14} />
          </button>
        </div>
      </div>

      {/* Sort */}
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
            <div key={i} className="skeleton-shimmer h-28 rounded-2xl" />
          ))}
        </div>
      ) : tab === "graduated" || view === "table" ? (
        <DexTable
          tokens={tab === "graduated" ? graduated.filter((t) =>
            query
              ? t.name.toLowerCase().includes(query) ||
                t.symbol.toLowerCase().includes(query)
              : true,
          ) : filtered}
          title={tab === "graduated" ? "Graduated · DEX Market" : "Screener"}
          subtitle={
            tab === "graduated"
              ? "Bonding complete · liquidity seeded · DexScreener-style pairs"
              : "All pairs in table view"
          }
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] py-20 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#86efac]/15 text-2xl">
            🟢
          </div>
          <p className="text-lg font-semibold text-white">No coins found</p>
          <p className="mt-1 text-sm text-[#666]">
            {query ? "Try a different search" : "Create the first coin"}
          </p>
          {!query && (
            <Link href="/create" className="pump-btn mt-5 inline-flex px-5 py-2.5 text-sm">
              Create coin
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
