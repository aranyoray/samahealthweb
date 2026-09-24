"use client";

// Small line chart with a snapping crosshair and one tooltip for every
// series. Used for the retention curve, the HbA1c trajectories and the
// per-patient timeline in the call list.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { fmtDay } from "./lib/rng";

// Formatters are named, not passed as functions, so server components can
// render this chart (functions do not cross the server/client boundary).
export type XKind = "month" | "quarter" | "day";
export type YKind = "pct" | "a1c";

const X_FORMAT: Record<XKind, (x: number) => string> = {
  month: (x) => `${x} months after first diabetic result`,
  quarter: (q) => `Months ${q * 3} to ${q * 3 + 3} after first diabetic result`,
  day: (d) => fmtDay(d),
};
const Y_FORMAT: Record<YKind, (y: number) => string> = {
  pct: (y) => `${Math.round(y)}%`,
  a1c: (y) => `${y.toFixed(1)}%`,
};

export type Series = {
  name: string;
  color: string;
  points: { x: number; y: number | null }[];
  markers?: boolean;
  endLabel?: boolean;
};

export type RefLine = { axis: "x" | "y"; value: number; label: string };

export function LineChart({
  series,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  xKind,
  yKind,
  height = 220,
  refLines = [],
  ariaLabel,
  step = false,
}: {
  series: Series[];
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: { value: number; label: string }[];
  yTicks: { value: number; label: string }[];
  xKind: XKind;
  yKind: YKind;
  height?: number;
  refLines?: RefLine[];
  ariaLabel: string;
  step?: boolean;
}) {
  // Draw at the container's real width so text stays at its set size.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const padL = 40;
  // On phones there is no room for end labels; the legend below carries identity.
  const narrow = W < 480;
  const showEnds = !narrow && series.some((s) => s.endLabel);
  const padR = showEnds ? 100 : 14;
  const padT = 10;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xs = (x: number) => padL + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW;
  const ys = (y: number) => padT + plotH - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

  const allX = useMemo(() => {
    const set = new Set<number>();
    for (const s of series) for (const p of s.points) if (p.y !== null) set.add(p.x);
    return [...set].sort((a, b) => a - b);
  }, [series]);

  const xFormat = X_FORMAT[xKind];
  const yFormat = Y_FORMAT[yKind];
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tipId = useId();

  const nearest = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || !allX.length) return null;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < allX.length; i++) if (Math.abs(xs(allX[i]) - px) < Math.abs(xs(allX[best]) - px)) best = i;
    return best;
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => setHover(nearest(e.clientX));
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!allX.length) return;
    if (e.key === "ArrowRight") setHover((h) => Math.min(allX.length - 1, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? allX.length) - 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };

  const pathOf = (s: Series) => {
    let d = "";
    let prev: { x: number; y: number } | null = null;
    for (const p of s.points) {
      if (p.y === null) {
        prev = null;
        continue;
      }
      const X = xs(p.x);
      const Y = ys(p.y);
      if (!prev) d += `M${X},${Y}`;
      else if (step) d += `H${X}V${Y}`;
      else d += `L${X},${Y}`;
      prev = { x: X, y: Y };
    }
    return d;
  };

  const hx = hover !== null ? allX[hover] : null;
  const readout =
    hx !== null
      ? series.map((s) => {
          let v: number | null = null;
          if (step) {
            for (const p of s.points) if (p.x <= hx && p.y !== null) v = p.y;
          } else v = s.points.find((p) => p.x === hx)?.y ?? null;
          return { s, v };
        })
      : [];

  // End labels: nudge apart when they would collide.
  const ends = series
    .filter((s) => showEnds && s.endLabel)
    .map((s) => {
      const last = [...s.points].reverse().find((p) => p.y !== null);
      return last ? { s, x: xs(last.x), y: ys(last.y!) } : null;
    })
    .filter(Boolean) as { s: Series; x: number; y: number }[];
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;

  return (
    <div ref={wrapRef} className="dx-line" style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={hx !== null ? tipId : undefined}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
        style={{ touchAction: "pan-y", overflow: "visible" }}
      >
        {yTicks.map((t) => (
          <g key={`y${t.value}`}>
            <line x1={padL} x2={padL + plotW} y1={ys(t.value)} y2={ys(t.value)} stroke="var(--ink-100)" />
            <text x={padL - 6} y={ys(t.value) + 3} fontSize="10" textAnchor="end" fill="var(--ink-400)" className="dx-tnum">
              {t.label}
            </text>
          </g>
        ))}
        {xTicks.filter((_, i) => !narrow || xTicks.length <= 4 || i % 2 === 0).map((t) => (
          <text key={`x${t.value}`} x={xs(t.value)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--ink-400)" className="dx-tnum">
            {t.label}
          </text>
        ))}
        <line x1={padL} x2={padL + plotW} y1={padT + plotH} y2={padT + plotH} stroke="var(--ink-200)" />

        {refLines.map((r) =>
          r.axis === "y" ? (
            <g key={`r${r.label}`}>
              <line x1={padL} x2={padL + plotW} y1={ys(r.value)} y2={ys(r.value)} stroke="var(--ink-400)" strokeDasharray="4 3" />
              <text x={padL + 4} y={ys(r.value) - 4} fontSize="9.5" fill="var(--ink-500)">
                {r.label}
              </text>
            </g>
          ) : (
            <g key={`r${r.label}`}>
              <line x1={xs(r.value)} x2={xs(r.value)} y1={padT} y2={padT + plotH} stroke="var(--ink-400)" strokeDasharray="4 3" />
              <text x={xs(r.value) + 4} y={padT + 10} fontSize="9.5" fill="var(--ink-500)">
                {r.label}
              </text>
            </g>
          ),
        )}

        {series.map((s) => (
          <g key={s.name}>
            <path d={pathOf(s)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {s.markers &&
              s.points.map((p, i) =>
                p.y === null ? null : (
                  <circle key={i} cx={xs(p.x)} cy={ys(p.y)} r={4} fill={s.color} stroke="var(--paper)" strokeWidth={2} />
                ),
              )}
          </g>
        ))}

        {ends.map((e) => (
          <text key={e.s.name} x={e.x + 8} y={e.y + 3.5} fontSize="10.5" fill="var(--ink-700)">
            {e.s.name}
          </text>
        ))}

        {hx !== null && (
          <g pointerEvents="none">
            <line x1={xs(hx)} x2={xs(hx)} y1={padT} y2={padT + plotH} stroke="var(--ink-300)" />
            {readout.map(({ s, v }) =>
              v === null ? null : (
                <circle key={s.name} cx={xs(hx)} cy={ys(v)} r={4.5} fill={s.color} stroke="var(--paper)" strokeWidth={2} />
              ),
            )}
          </g>
        )}
      </svg>

      {hx !== null && (
        <div
          id={tipId}
          role="status"
          className="dx-tip"
          style={{
            left: `${(xs(hx) / W) * 100}%`,
            transform: xs(hx) > W * 0.6 ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
          }}
        >
          <div className="dx-tip-head">{xFormat(hx)}</div>
          {readout.map(({ s, v }) => (
            <div key={s.name} className="dx-tip-row">
              <span aria-hidden style={{ width: 12, height: 2, background: s.color, display: "inline-block" }} />
              <strong>{v === null ? "no data" : yFormat(v)}</strong>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
