import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LiveTicker } from "@/components/layout/LiveTicker";
import { MarketStats } from "@/components/dex/MarketStats";
import { TokenFeed } from "@/components/tokens/TokenFeed";
import { getConfig } from "@/lib/store";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function Home() {
  const config = getConfig();
  const mcap = config.bondingCurve.graduationMarketCapUsd;

  return (
    <AppShell>
      {/* Hero */}
      <section className="anim-fade-up relative mb-6 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0c1a12] via-[#0a0a0a] to-[#0b1220] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#86efac]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#86efac]/20 bg-[#86efac]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#86efac]">
              <Sparkles size={12} />
              Fair launch · Bonding curve · DEX graduation
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Launch memecoins.{" "}
              <span className="bg-gradient-to-r from-[#86efac] via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Graduate to the open market.
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#8a8a8a] sm:text-base">
              Create on a transparent bonding curve. When market cap hits{" "}
              <span className="font-semibold text-[#86efac]">
                ${mcap.toLocaleString()}
              </span>
              , liquidity seeds automatically — tradeable like a DexScreener pair.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/create"
                className="pump-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                Launch a coin <ArrowRight size={15} />
              </Link>
              <Link
                href="/?view=dex"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#86efac]/30 hover:bg-[#86efac]/10"
              >
                Open DEX screener
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3 lg:w-auto">
            {[
              { icon: Zap, label: "Instant trade", sub: "Bonding curve" },
              { icon: ShieldCheck, label: "Verified", sub: "Legit launches" },
              { icon: Sparkles, label: "Graduate", sub: "DEX listing" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-white/5 bg-black/30 p-3 text-center backdrop-blur"
              >
                <f.icon size={16} className="mx-auto mb-1.5 text-[#86efac]" />
                <p className="text-xs font-semibold text-white">{f.label}</p>
                <p className="text-[10px] text-[#555]">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveTicker />
      <MarketStats />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-shimmer h-28 rounded-2xl" />
            ))}
          </div>
        }
      >
        <TokenFeed graduationMcap={mcap} />
      </Suspense>
    </AppShell>
  );
}
