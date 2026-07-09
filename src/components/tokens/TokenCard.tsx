import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import type { Token } from "@/lib/types";
import { getProgress } from "@/lib/bonding-curve";

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
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
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

  return (
    <Link
      href={`/coin/${token.mint}`}
      className="token-card-anim group relative flex gap-3 overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-3"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-[92px] sm:w-[92px]">
        {token.imageUrl ? (
          <Image
            src={token.imageUrl}
            alt={token.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🪙</div>
        )}
        {token.complete && (
          <span className="absolute left-1 top-1 rounded bg-yellow-400 px-1 py-0.5 text-[9px] font-bold text-black">
            DEX
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#86efac]">
              {token.name}{" "}
              <span className="font-normal text-[#666]">({token.symbol})</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[#555]">
              {timeAgo(token.createdAt)} · {shortAddr(token.creator)}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#666]">
            <MessageCircle size={11} />
            {token.replies}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#555]">Market cap</p>
            <p className="text-sm font-bold text-[#86efac] tabular-nums">
              {formatUsd(token.marketCapUsd)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#555]">Vol 24h</p>
            <p className="text-xs font-medium text-[#aaa] tabular-nums">
              {token.volume24h.toFixed(1)} SOL
            </p>
          </div>
        </div>

        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1f1f1f]">
          <div
            className={`bond-bar-fill h-full rounded-full ${
              token.complete ? "bg-yellow-400" : "bg-[#86efac]"
            }`}
            style={{ width: `${progress}%`, animationDelay: `${delay + 0.15}s` }}
          />
        </div>
      </div>
    </Link>
  );
}
