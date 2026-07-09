import { CoinPageClient } from "./CoinPageClient";
import { getConfig } from "@/lib/store";

export default async function CoinPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  const config = getConfig();

  return (
    <CoinPageClient
      mint={mint}
      tradeFeeBps={config.fees.tradeFeeBps}
      graduationMcap={config.bondingCurve.graduationMarketCapUsd}
    />
  );
}
