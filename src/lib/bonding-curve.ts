import type { PlatformConfig } from "./types";

const LAMPORTS_PER_SOL = 1_000_000_000;

export function getBuyQuote(
  solAmount: number,
  virtualSolReserves: number,
  virtualTokenReserves: number,
  feeBps: number,
) {
  const fee = solAmount * (feeBps / 10_000);
  const solAfterFee = solAmount - fee;
  const tokensOut =
    (virtualTokenReserves * solAfterFee) /
    (virtualSolReserves + solAfterFee);

  return {
    tokensOut,
    fee,
    newVirtualSol: virtualSolReserves + solAfterFee,
    newVirtualToken: virtualTokenReserves - tokensOut,
  };
}

export function getSellQuote(
  tokenAmount: number,
  virtualSolReserves: number,
  virtualTokenReserves: number,
  feeBps: number,
) {
  const solOut =
    (virtualSolReserves * tokenAmount) /
    (virtualTokenReserves + tokenAmount);
  const fee = solOut * (feeBps / 10_000);

  return {
    solOut: solOut - fee,
    fee,
    newVirtualSol: virtualSolReserves - solOut,
    newVirtualToken: virtualTokenReserves + tokenAmount,
  };
}

export function getMarketCapUsd(
  virtualSolReserves: number,
  virtualTokenReserves: number,
  solPriceUsd = 150,
) {
  const priceSol =
    virtualSolReserves / Math.max(virtualTokenReserves, 1);
  const supply = 1_000_000_000;
  return priceSol * supply * solPriceUsd;
}

export function getProgress(
  marketCapUsd: number,
  graduationMarketCapUsd: number,
) {
  return Math.min(100, (marketCapUsd / graduationMarketCapUsd) * 100);
}

export function getInitialCurveState(config: PlatformConfig["bondingCurve"]) {
  return {
    virtualSolReserves: config.virtualSolReserves,
    virtualTokenReserves: config.virtualTokenReserves,
    realSolReserves: 0,
    realTokenReserves: config.realTokenReserves,
    complete: false,
  };
}

export function lamportsToSol(lamports: number) {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number) {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
