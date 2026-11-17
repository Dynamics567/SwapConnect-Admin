"use client";

import { useEffect, useRef, useState } from "react";

// Campaign report charts: a funnel (each stage against the first) and two
// small-multiple daily column charts (views, entries) on the same time axis.
// Single series each, in the brand green (validated: lightness, chroma and
// >=3:1 contrast on the light surface). Values and labels use text tokens,
// never the series colour. Every chart has a hover/focus tooltip and a
// table equivalent for screen readers.

export interface FunnelStage {
  stage: string;
  count: number;
}
export interface DailyPoint {
  date: string;
  views: number;
  entries: number;
}

const SERIES = "#037f44";
const GRID = "#eceef1";
const INK = "#1f2421";
const INK_2 = "#5c6560";
const INK_3 = "#8a918d";

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const fmt = (n: number) => n.toLocaleString("en-NG");
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = Math.max(stages[0]?.count || 0, 1);
  return (
    <figure className="m-0">
      <figcaption className="text-[13px] font-semibold" style={{ color: INK }}>
        From visit to delivery
      </figcaption>
      <p className="text-xs mb-3" style={{ color: INK_3 }}>
        Each bar is measured against page views.
      </p>
      <ol className="space-y-2.5" aria-hidden="true">
        {stages.map((s, i) => {
          const prev = i > 0 ? stages[i - 1].count : null;
          const w = Math.max((s.count / top) * 100, s.count > 0 ? 1.5 : 0);
          return (
            <li
              key={s.stage}
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="relative grid grid-cols-[minmax(96px,128px)_1fr_auto] items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#037f44]/40"
            >
              <span className="text-xs truncate" style={{ color: INK_2 }}>
                {s.stage}
              </span>
              <span className="h-[18px] rounded-r bg-[#f3f5f4] relative">
                <span className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${w}%`, background: SERIES, opacity: hover === null || hover === i ? 1 : 0.55, transition: "opacity .15s" }} />
              </span>
              <span className="text-xs tabular-nums text-right min-w-[64px]" style={{ color: INK }}>
                <span className="font-semibold">{fmt(s.count)}</span>
                {prev !== null && <span style={{ color: INK_3 }}> · {pct(s.count, prev)}%</span>}
              </span>
              {hover === i && (
                <span role="tooltip" className="absolute z-10 left-[136px] -top-9 whitespace-nowrap rounded-md bg-[#1f2421] px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                  {s.stage}: {fmt(s.count)}
                  {prev !== null ? ` · ${pct(s.count, prev)}% of ${stages[i - 1].stage.toLowerCase()}` : ""}
                  {i > 0 ? ` · ${pct(s.count, top)}% of views` : ""}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <table className="sr-only">
        <caption>Campaign funnel</caption>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Count</th>
            <th>Share of previous stage</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s, i) => (
            <tr key={s.stage}>
              <td>{s.stage}</td>
              <td>{s.count}</td>
              <td>{i ? `${pct(s.count, stages[i - 1].count)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Columns({ title, points, field }: { title: string; points: DailyPoint[]; field: "views" | "entries" }) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real rendered width so text stays a readable size on phones
  // (a scaled-down viewBox shrinks 10px labels to ~5px).
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 132;
  const padL = 28;
  const padB = 20;
  const values = points.map((p) => p[field]);
  const max = Math.max(...values, 1);
  // Nice top tick: 1, 2, 5 x 10^n.
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const yMax = [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= max) || max;
  const plotW = W - padL;
  const plotH = H - padB - 6;
  const slot = plotW / points.length;
  const bw = Math.min(24, Math.max(2, slot - 2));
  const y = (v: number) => 6 + plotH - (v / yMax) * plotH;
  const total = values.reduce((a, b) => a + b, 0);
  const peakIdx = values.indexOf(Math.max(...values));
  const ticks = [0, yMax / 2, yMax];
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <figure className="m-0 min-w-0">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold" style={{ color: INK }}>
          {title}
        </span>
        <span className="text-xs tabular-nums" style={{ color: INK_3 }}>
          {fmt(total)} in {points.length} days
        </span>
      </figcaption>
      <div ref={boxRef} className="relative mt-2">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label={`${title}, last ${points.length} days, ${total} in total`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill={INK_3}>
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const v = p[field];
            const x = padL + i * slot + (slot - bw) / 2;
            const top = y(v);
            const h = Math.max(0, 6 + plotH - top);
            const r = Math.min(4, bw / 2, h);
            return (
              <g key={p.date}>
                {h > 0 && (
                  <path
                    d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${top + h} Z`}
                    fill={SERIES}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {/* Hit target: the whole slot, taller than the mark. */}
                <rect
                  x={padL + i * slot}
                  y={0}
                  width={slot}
                  height={H - padB}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
          {values[peakIdx] > 0 && (
            <text x={padL + peakIdx * slot + slot / 2} y={y(values[peakIdx]) - 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={INK}>
              {values[peakIdx]}
            </text>
          )}
          {xLabels.map((i, k) => (
            <text key={i} x={padL + i * slot + slot / 2} y={H - 5} textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"} fontSize={10} fill={INK_3}>
              {day(points[i].date)}
            </text>
          ))}
        </svg>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#1f2421] px-2.5 py-1.5 text-[11px] text-white shadow-lg"
            style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%` }}
          >
            {day(points[hover].date)}: <b>{points[hover][field]}</b> {field}
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{title} by day</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p[field]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function DailyActivity({ points, showEntries = true, stacked = false }: { points: DailyPoint[]; showEntries?: boolean; stacked?: boolean }) {
  if (!points.length) return null;
  return (
    <div className={`grid gap-6 ${showEntries && !stacked ? "md:grid-cols-2" : ""}`}>
      <Columns title="Page views per day" points={points} field="views" />
      {showEntries && <Columns title="Entries per day" points={points} field="entries" />}
    </div>
  );
}
