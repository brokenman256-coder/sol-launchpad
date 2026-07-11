import Link from "next/link";
import { BadgeCheck, MessageCircle, Rocket } from "lucide-react";
import type { Token } from "@/lib/types";
import { getProgress } from "@/lib/bonding-curve";
import { TokenImage } from "@/components/ui/TokenImage";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function timeAgo(ts: number) {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function shortAddr(a: string) {
  if (a.length < 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function TokenCard({
  token,
  graduationMcap,
  index = 0,
}: {
  token: Token;
  graduationMcap: number;
  index?: number;
}) {
  const progress = getProgress(token.marketCapUsd, graduationMcap);
  const delay = Math.min(index, 12) * 0.04;
  const change = token.change24h ?? 0;
  const up = change >= 0;

  return (
    <Link
      href={`/coin/${token.mint}`}
      className="token-card-anim group relative flex gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#121212] to-[#0a0a0a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative shrink-0">
        <TokenImage
          src={token.imageUrl}
          symbol={token.symbol}
          name={token.name}
          size={88}
          rounded="rounded-xl ring-1 ring-white/10"
        />
        {token.complete && (
          <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-black shadow">
            <Rocket size={9} /> DEX
          </span>
        )}
        {token.verified && !token.complete && (
          <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-sky-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
            <BadgeCheck size={9} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-semibold text-white transition-colors group-hover:text-[#86efac]">
              <span className="truncate">
                {token.name}{" "}
                <span className="font-normal text-[#666]">({token.symbol})</span>
              </span>
              {token.verified && (
                <BadgeCheck size={14} className="shrink-0 text-sky-400" />
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-[#555]">
              {timeAgo(token.createdAt)} · {shortAddr(token.creator)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-[11px] text-[#666]">
              <MessageCircle size={11} />
              {token.replies}
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                up ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {up ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#555]">Market cap</p>
            <p className="text-sm font-bold text-[#86efac] tabular-nums">
              {formatUsd(token.marketCapUsd)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#555]">Vol · Liq</p>
            <p className="text-xs font-medium text-[#aaa] tabular-nums">
              {token.volume24h.toFixed(1)} SOL · {formatUsd(token.liquidityUsd ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
          <div
            className={`bond-bar-fill h-full rounded-full ${
              token.complete
                ? "bg-gradient-to-r from-amber-300 to-yellow-400"
                : "bg-gradient-to-r from-emerald-500 to-[#86efac]"
            }`}
            style={{ width: `${progress}%`, animationDelay: `${delay + 0.15}s` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[#444]">
          {token.complete
            ? "Graduated · open market"
            : `${progress.toFixed(0)}% to graduation`}
        </p>
      </div>
    </Link>
  );
}
