import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LiveTicker } from "@/components/layout/LiveTicker";
import { TokenFeed } from "@/components/tokens/TokenFeed";
import { getConfig } from "@/lib/store";

export default function HomePage() {
  const config = getConfig();

  return (
    <AppShell>
      <div className="mb-4 rounded-xl border border-[#86efac]/30 bg-[#86efac]/10 px-4 py-3 text-center">
        <p className="text-sm font-bold text-[#86efac]">
          pump.fun beta
        </p>
        <p className="mt-0.5 text-xs text-[#8a8a8a]">
          {config.brand.tagline} · {config.brand.name}
        </p>
      </div>
      <LiveTicker />
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-[#111]" />
            ))}
          </div>
        }
      >
        <TokenFeed graduationMcap={config.bondingCurve.graduationMarketCapUsd} />
      </Suspense>
    </AppShell>
  );
}
