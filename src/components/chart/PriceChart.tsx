"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartPoint } from "@/lib/chart-data";
import { sliceByTimeframe } from "@/lib/chart-data";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "all";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function PriceChart({ data }: { data: ChartPoint[] }) {
  const [tf, setTf] = useState<Timeframe>("all");
  const [hover, setHover] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);

  const sliced = useMemo(() => sliceByTimeframe(data, tf), [data, tf]);

  const { linePath, areaPath, min, max, latest, pts, up, changePct } = useMemo(() => {
    if (!sliced.length) {
      return {
        linePath: "",
        areaPath: "",
        min: 0,
        max: 0,
        latest: 0,
        pts: [] as { x: number; y: number; value: number; time: number }[],
        up: true,
        changePct: 0,
      };
    }
    const values = sliced.map((d) => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const w = 100;
    const h = 100;
    const padY = 6;

    const points = sliced.map((d, i) => {
      const x = sliced.length === 1 ? 50 : (i / (sliced.length - 1)) * w;
      const y = h - padY - ((d.value - minV) / range) * (h - padY * 2);
      return { x, y, value: d.value, time: d.time };
    });

    const line = smoothPath(points);
    const area = line
      ? `${line} L ${points[points.length - 1].x},100 L ${points[0].x},100 Z`
      : "";

    const first = values[0];
    const last = values[values.length - 1];
    const pct = first ? ((last - first) / first) * 100 : 0;

    return {
      linePath: line,
      areaPath: area,
      min: minV,
      max: maxV,
      latest: last,
      pts: points,
      up: last >= first,
      changePct: pct,
    };
  }, [sliced]);

  useEffect(() => {
    setDrawn(false);
    const t = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(t);
  }, [linePath, tf]);

  const stroke = up ? "#86efac" : "#f87171";
  const hoverPt = hover != null ? pts[hover] : null;
  const displayValue = hoverPt?.value ?? latest;

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: "1m", label: "1m" },
    { id: "5m", label: "5m" },
    { id: "15m", label: "15m" },
    { id: "1h", label: "1h" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="chart-root">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#555]">Market cap</p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tabular-nums transition-colors duration-300 ${
                up ? "text-[#86efac]" : "text-red-400"
              }`}
            >
              {formatUsd(displayValue)}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                up ? "text-[#86efac]/80" : "text-red-400/80"
              }`}
            >
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-black p-0.5">
          {timeframes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTf(t.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                tf === t.id
                  ? "bg-[#1a1a1a] text-[#86efac] shadow-sm"
                  : "text-[#666] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative h-52 w-full overflow-hidden rounded-xl bg-black sm:h-56"
        onMouseLeave={() => setHover(null)}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
          {[20, 40, 60, 80].map((y) => (
            <div
              key={y}
              className="absolute left-0 right-0 border-t border-dashed border-white"
              style={{ top: `${y}%` }}
            />
          ))}
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
          onMouseMove={(e) => {
            if (!pts.length) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            let best = 0;
            let bestDist = Infinity;
            pts.forEach((p, i) => {
              const d = Math.abs(p.x - x);
              if (d < bestDist) {
                bestDist = d;
                best = i;
              }
            });
            setHover(best);
          }}
        >
          <defs>
            <linearGradient id="pumpChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
              <stop offset="55%" stopColor={stroke} stopOpacity="0.08" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {areaPath && (
            <path
              d={areaPath}
              fill="url(#pumpChartGrad)"
              className={`chart-area ${drawn ? "chart-area-in" : ""}`}
            />
          )}
          {linePath && (
            <path
              ref={pathRef}
              d={linePath}
              fill="none"
              stroke={stroke}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter="url(#glow)"
              className={`chart-line ${drawn ? "chart-line-in" : ""}`}
            />
          )}

          {hoverPt && (
            <>
              <line
                x1={hoverPt.x}
                y1={0}
                x2={hoverPt.x}
                y2={100}
                stroke="#ffffff22"
                strokeWidth="0.4"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={hoverPt.x}
                cy={hoverPt.y}
                r="1.4"
                fill={stroke}
                stroke="#000"
                strokeWidth="0.4"
              />
            </>
          )}
        </svg>

        <div className="absolute inset-0 flex">
          {pts.map((_, i) => (
            <div
              key={i}
              className="h-full flex-1"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-2 left-2 text-[10px] text-[#3a3a3a]">
          {formatUsd(min)}
        </div>
        <div className="pointer-events-none absolute right-2 top-2 text-[10px] text-[#3a3a3a]">
          {formatUsd(max)}
        </div>

        {hoverPt && (
          <div
            className="pointer-events-none absolute top-2 rounded-md border border-[#222] bg-[#0d0d0d]/95 px-2 py-1 text-[10px] text-white shadow-lg backdrop-blur"
            style={{
              left: `clamp(8px, ${hoverPt.x}% , calc(100% - 90px))`,
            }}
          >
            <div className="font-semibold text-[#86efac]">{formatUsd(hoverPt.value)}</div>
            <div className="text-[#666]">
              {new Date(hoverPt.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
