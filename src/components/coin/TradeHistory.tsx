import type { Trade } from "@/lib/types";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function shortSig(sig?: string) {
  if (!sig) return null;
  return `${sig.slice(0, 4)}…${sig.slice(-4)}`;
}

export function TradeHistory({ trades }: { trades: Trade[] }) {
  if (!trades.length) {
    return (
      <div className="anim-fade-up rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-5">
        <h3 className="mb-1 text-sm font-semibold text-white">Recent trades</h3>
        <p className="text-xs text-[#555]">No on-chain trades yet — be the first.</p>
      </div>
    );
  }

  const cluster = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";
  const explorer =
    cluster === "mainnet-beta"
      ? "https://solscan.io/tx/"
      : `https://solscan.io/tx/`;

  return (
    <div className="anim-fade-up rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">Recent trades</h3>
      <div className="max-h-52 space-y-1.5 overflow-y-auto">
        {trades.slice(0, 20).map((t, i) => (
          <div
            key={t.id}
            className="trade-flash flex items-center justify-between rounded-lg bg-black px-3 py-2 text-xs"
            style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
          >
            <span
              className={
                t.type === "buy" ? "font-semibold text-[#86efac]" : "font-semibold text-red-400"
              }
            >
              {t.type.toUpperCase()} {t.amount.toFixed(3)}{" "}
              {t.type === "buy" ? "SOL" : "tokens"}
            </span>
            <div className="flex items-center gap-2 text-[#555]">
              {t.signature && (
                <a
                  href={`${explorer}${t.signature}${cluster !== "mainnet-beta" ? `?cluster=${cluster}` : ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#666] hover:text-[#86efac]"
                  title="View on Solscan"
                >
                  {shortSig(t.signature)}
                </a>
              )}
              <span>{timeAgo(t.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
