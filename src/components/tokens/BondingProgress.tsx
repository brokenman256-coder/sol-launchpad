import { getProgress } from "@/lib/bonding-curve";

export function BondingProgress({
  marketCapUsd,
  graduationMcap,
  complete,
}: {
  marketCapUsd: number;
  graduationMcap: number;
  complete: boolean;
}) {
  const progress = getProgress(marketCapUsd, graduationMcap);

  return (
    <div className="anim-fade-up">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-[#666]">
          {complete ? "Graduated to Raydium 🎓" : "Bonding curve progress"}
        </span>
        <span className="font-semibold tabular-nums text-[#86efac]">
          {progress.toFixed(1)}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#1f1f1f]">
        <div
          className={`bond-bar-fill h-full rounded-full ${
            complete
              ? "bg-yellow-400"
              : "bg-gradient-to-r from-[#22c55e] via-[#86efac] to-[#bbf7d0]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {!complete && (
        <p className="mt-1.5 text-[11px] text-[#555]">
          Graduates at ${graduationMcap.toLocaleString()} market cap · remaining{" "}
          {(100 - progress).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
