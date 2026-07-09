import { NextResponse } from "next/server";
import { getConfig } from "@/lib/store";
import { getCluster, getRpcUrl, isPlaceholderAddress } from "@/lib/solana/constants";
import { getTreasuryPublicKey } from "@/lib/solana/verify-payment";

export async function GET() {
  const config = getConfig();
  const { admin: _, ...publicConfig } = config;

  const feeRecipient = config.fees.feeRecipient;
  const treasury = getTreasuryPublicKey();

  return NextResponse.json({
    config: {
      ...publicConfig,
      fees: {
        ...publicConfig.fees,
        feeRecipientConfigured: !isPlaceholderAddress(feeRecipient),
      },
      network: {
        ...publicConfig.network,
        rpcUrl: getRpcUrl(),
        cluster: getCluster(),
      },
      payments: {
        buysRequireOnChainSol: true,
        createRequiresOnChainSol: config.fees.creationFeeSol > 0,
        sellsPaidFromTreasury: Boolean(treasury),
        treasuryPublicKey: treasury,
        cluster: getCluster(),
        explorerBase:
          getCluster() === "mainnet-beta"
            ? "https://solscan.io"
            : `https://solscan.io?cluster=${getCluster()}`,
      },
    },
  });
}
