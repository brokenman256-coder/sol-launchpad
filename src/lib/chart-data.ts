import type { Token, Trade } from "./types";

export type ChartPoint = {
  time: number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

/**
 * pump.fun-style market-cap history.
 * Uses real trades when present; otherwise a smooth organic curve
 * with micro-volatility like the live site.
 */
export function generatePriceHistory(
  token: Token,
  trades: Trade[] = [],
  points = 96,
): ChartPoint[] {
  const mintTrades = trades
    .filter((t) => t.mint === token.mint)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (mintTrades.length >= 2) {
    const series: ChartPoint[] = mintTrades.map((t) => ({
      time: t.createdAt,
      value: t.marketCapUsd,
      close: t.marketCapUsd,
    }));
    // densify between sparse trades
    if (series.length < 24) {
      return densify(series, 48);
    }
    return series;
  }

  const history: ChartPoint[] = [];
  const now = Date.now();
  const span = Math.max(now - token.createdAt, 45 * 60_000);
  const end = token.marketCapUsd;
  // start near bonding-curve open (~few k like pump.fun launches)
  const start = Math.max(end * 0.12, 800);

  let prev = start;
  for (let i = 0; i < points; i++) {
    const p = i / (points - 1);
    // organic pump curve: slow start, mid acceleration, late volatility
    const curve =
      Math.pow(p, 0.7) * 0.55 +
      Math.pow(p, 1.4) * 0.45;
    const noise =
      Math.sin(i * 1.37 + token.mint.charCodeAt(0)) * 0.04 +
      Math.cos(i * 0.51) * 0.025 +
      Math.sin(i * 3.1) * 0.012;
    // occasional "candles" of dump/pump
    const spike = i % 17 === 0 ? 0.06 : i % 23 === 0 ? -0.05 : 0;
    let value = start + (end - start) * curve * (1 + noise + spike);
    value = Math.max(value, 200);
    // smooth toward previous for continuity
    value = prev * 0.35 + value * 0.65;
    const high = value * (1 + Math.abs(noise) * 0.5 + 0.008);
    const low = value * (1 - Math.abs(noise) * 0.45 - 0.006);
    history.push({
      time: token.createdAt + span * p,
      value,
      open: prev,
      high,
      low,
      close: value,
    });
    prev = value;
  }

  // pin last point to live mcap
  if (history.length) {
    const last = history[history.length - 1];
    last.value = end;
    last.close = end;
  }

  return history;
}

function densify(series: ChartPoint[], target: number): ChartPoint[] {
  if (series.length < 2) return series;
  const out: ChartPoint[] = [];
  const steps = Math.ceil(target / (series.length - 1));
  for (let i = 0; i < series.length - 1; i++) {
    const a = series[i];
    const b = series[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const value = a.value + (b.value - a.value) * t;
      out.push({
        time: a.time + (b.time - a.time) * t,
        value,
        close: value,
      });
    }
  }
  out.push(series[series.length - 1]);
  return out;
}

export function sliceByTimeframe(
  data: ChartPoint[],
  timeframe: "1m" | "5m" | "15m" | "1h" | "all",
): ChartPoint[] {
  if (timeframe === "all" || data.length < 2) return data;
  const ms =
    timeframe === "1m"
      ? 60_000
      : timeframe === "5m"
        ? 5 * 60_000
        : timeframe === "15m"
          ? 15 * 60_000
          : 60 * 60_000;
  const end = data[data.length - 1].time;
  const start = end - ms;
  const sliced = data.filter((d) => d.time >= start);
  return sliced.length >= 2 ? sliced : data.slice(-12);
}
