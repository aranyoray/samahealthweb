// Server-rendered chart pieces for /diabetes. Inline SVG and plain HTML, no
// chart library, same approach as /data. Colour roles live in page.tsx's
// scoped <style> as --dx-* custom properties.

import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Layout                                                               */
/* ------------------------------------------------------------------ */

export function SectionHead({ id, title, blurb, meta }: { id?: string; title: string; blurb: ReactNode; meta?: string[] }) {
  return (
    <div id={id} style={{ maxWidth: 880 }}>
      <h2>{title}</h2>
      <p style={{ marginTop: 18, fontSize: 17, color: "var(--ink-500)", lineHeight: 1.6 }}>{blurb}</p>
      {meta && (
        <div className="mono dx-meta">
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  span = 6,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  span?: 4 | 6 | 8 | 12;
}) {
  return (
    <article className={`card dx-card dx-span-${span}`}>
      <header>
        <h3 style={{ fontSize: 16 }}>{title}</h3>
        {subtitle && (
          <p className="mono" style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-400)" }}>
            {subtitle}
          </p>
        )}
      </header>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </article>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <p style={{ marginTop: 14, fontSize: 13, color: "var(--ink-500)", lineHeight: 1.55 }}>{children}</p>;
}

export function Stat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="dx-stat">
      <div className="dx-stat-value">{value}</div>
      <div className="dx-stat-label">{label}</div>
      {note && <div className="dx-stat-note">{note}</div>}
    </div>
  );
}

export function Legend({ items, shape = "rect" }: { items: { label: string; color: string }[]; shape?: "rect" | "line" }) {
  return (
    <ul className="dx-legend">
      {items.map((l) => (
        <li key={l.label}>
          <span
            aria-hidden
            style={
              shape === "line"
                ? { width: 14, height: 2, borderRadius: 1, background: l.color }
                : { width: 10, height: 10, borderRadius: 2, background: l.color }
            }
          />
          {l.label}
        </li>
      ))}
    </ul>
  );
}

/** Every chart gets a table twin, collapsed by default. */
export function TableView({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="dx-table-view">
      <summary>Show as table</summary>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{typeof c === "number" ? c.toLocaleString("en-IN") : c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal bars                                                      */
/* ------------------------------------------------------------------ */

export function HBars({
  rows,
  max = 100,
  unit = "%",
  color = "var(--dx-in)",
}: {
  rows: { label: string; value: number; note?: string; color?: string }[];
  max?: number;
  unit?: string;
  color?: string;
}) {
  return (
    <ul className="dx-hbars">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value}${unit}${r.note ? ` (${r.note})` : ""}`}>
          <div className="dx-hbar-top">
            <span>{r.label}</span>
            <span className="mono">
              <strong>
                {r.value.toLocaleString("en-IN")}
                {unit}
              </strong>
              {r.note && <span className="dx-dim"> {r.note}</span>}
            </span>
          </div>
          <div className="dx-hbar-track">
            <div
              className="dx-hbar-fill"
              style={{ width: `${Math.max(0.6, Math.min(100, (r.value / max) * 100))}%`, background: r.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                                */
/* ------------------------------------------------------------------ */

export function Donut({ segments, centre }: { segments: { label: string; v: number; color: string }[]; centre: string }) {
  const total = segments.reduce((s, x) => s + x.v, 0);
  const R = 56;
  const C = 2 * Math.PI * R;
  const GAP = 2;
  let offset = 0;
  return (
    <div className="dx-donut">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`Donut chart, ${centre}`}>
        {segments.map((s) => {
          const len = (s.v / total) * C;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${Math.max(0, len - GAP)} ${C - Math.max(0, len - GAP)}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            >
              <title>{`${s.label}: ${s.v.toLocaleString("en-IN")} (${((s.v / total) * 100).toFixed(1)}%)`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="21" fontWeight="600" fill="var(--ink)">
          {total.toLocaleString("en-IN")}
        </text>
        <text x="70" y="85" textAnchor="middle" fontSize="9" fill="var(--ink-400)" letterSpacing="0.08em">
          {centre.toUpperCase()}
        </text>
      </svg>
      <ul className="dx-donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
            <span>{s.label}</span>
            <span className="mono dx-dim">{s.v.toLocaleString("en-IN")}</span>
            <span className="mono" style={{ fontWeight: 600 }}>
              {((s.v / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heatmap (single hue, sequential)                                     */
/* ------------------------------------------------------------------ */

export function Heatmap({
  rows,
  cols,
  values,
  rowLabel,
  colLabel,
  hue = "232, 98, 42",
  unit = "%",
}: {
  rows: string[];
  cols: string[];
  values: number[][];
  rowLabel?: string;
  colLabel?: string;
  hue?: string;
  unit?: string;
}) {
  const max = Math.max(...values.flat(), 1);
  return (
    <div>
      {colLabel && <div className="mono dx-axis-label" style={{ marginLeft: 92 }}>{colLabel}</div>}
      <div className="dx-heat" style={{ gridTemplateColumns: `88px repeat(${cols.length}, minmax(0, 1fr))` }}>
        <span />
        {cols.map((c) => (
          <span key={c} className="mono dx-heat-col">
            {c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <div key={r} style={{ display: "contents" }}>
            <span className="mono dx-heat-row">{r}</span>
            {values[ri].map((v, ci) => {
              const t = v / max;
              return (
                <div
                  key={ci}
                  className="dx-heat-cell"
                  style={{ background: `rgba(${hue}, ${0.1 + t * 0.85})`, color: t > 0.55 ? "#fff" : "var(--ink)" }}
                  title={`${rowLabel ? rowLabel + " " : ""}${r}, ${colLabel ? colLabel + " " : ""}${cols[ci]}: ${v}${unit}`}
                >
                  {v}
                  {unit}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {rowLabel && <div className="mono dx-axis-label" style={{ marginTop: 8 }}>rows: {rowLabel}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Columns (histogram)                                                  */
/* ------------------------------------------------------------------ */

export function Columns({
  bars,
  height = 150,
  unit = "%",
}: {
  bars: { label: string; value: number; color: string; note?: string }[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="dx-cols" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
      {bars.map((b) => (
        <div key={b.label} className="dx-col" title={`${b.label}: ${b.value}${unit}${b.note ? ` (${b.note})` : ""}`}>
          <div className="dx-col-plot" style={{ height }}>
            <span className="mono dx-col-value">
              {b.value.toLocaleString("en-IN")}
              {unit}
            </span>
            <div className="dx-col-bar" style={{ height: `${(b.value / max) * (height - 20)}px`, background: b.color }} />
          </div>
          <span className="mono dx-col-label">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stacked columns (monthly status)                                     */
/* ------------------------------------------------------------------ */

/** HTML rather than SVG so labels stay the same size at any width. */
export function StackedColumns({
  columns,
  keys,
  height = 200,
}: {
  columns: { label: string; values: number[] }[];
  keys: { label: string; color: string }[];
  height?: number;
}) {
  const max = Math.max(...columns.map((c) => c.values.reduce((s, v) => s + v, 0)));
  const nice = Math.ceil(max / 1000) * 1000;
  const ticks = [0, nice / 2, nice];
  return (
    <div className="dx-stack" role="img" aria-label="Monthly status of people with diabetes, stacked columns">
      <div className="dx-stack-plot" style={{ height }}>
        {ticks.map((t) => (
          <div key={t} className="dx-stack-grid" style={{ bottom: `${(t / nice) * 100}%` }}>
            <span className="mono">{t.toLocaleString("en-IN")}</span>
          </div>
        ))}
        <div className="dx-stack-cols" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((c) => {
            const total = c.values.reduce((s, v) => s + v, 0);
            return (
              <div
                key={c.label}
                className="dx-stack-col"
                title={`${c.label}: ${keys.map((k, ki) => `${k.label} ${c.values[ki].toLocaleString("en-IN")}`).join(", ")}`}
              >
                <div className="dx-stack-bar" style={{ height: `${(total / nice) * 100}%` }}>
                  {[...c.values].reverse().map((v, ri) => {
                    const ki = c.values.length - 1 - ri;
                    return <div key={ki} style={{ flexGrow: v, background: keys[ki].color }} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="dx-stack-x" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((c, i) => (
          <span key={c.label} className="mono">
            {i % 3 === 0 ? c.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workflow diagram                                                     */
/* ------------------------------------------------------------------ */

export function WorkflowDiagram() {
  const steps = [
    { t: "AKTIV lab system", s: "bills + results, nightly mirror" },
    { t: "Link visits", s: "phone, then fuzzy name" },
    { t: "Apply rules", s: "what is due, how late, how risky" },
    { t: "Ranked queues", s: "keep in care · re-engage" },
    { t: "Care team acts", s: "call, WhatsApp, agent, doctor" },
  ];
  return (
    <div className="dx-flow" role="img" aria-label="Workflow: AKTIV lab system, link visits, apply rules, ranked queues, care team acts; the next lab result closes the loop">
      <ol>
        {steps.map((st, i) => (
          <li key={st.t}>
            <span className="mono dx-flow-n">{i + 1}</span>
            <strong>{st.t}</strong>
            <span>{st.s}</span>
          </li>
        ))}
      </ol>
      <div className="dx-flow-loop mono">
        <span aria-hidden>↺</span> the next result for that person closes the item automatically, no manual tick-off
      </div>
    </div>
  );
}
