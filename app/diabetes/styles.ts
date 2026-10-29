// Scoped dashboard styles, shared by /diabetes and the other NCD follow-up pages.

export const STYLES = `
.dx {
  --dx-in: #0d9488;
  --dx-out: #eb6834;
  --dx-b0: #0d9488;
  --dx-b1: #dba300;
  --dx-b2: #e8622a;
  --dx-b3: #b91c1c;
  --dx-critical: #d03b3b;
  --dx-high: #ec835a;
  --dx-medium: #fab219;
  --dx-routine: #94a3b8;
  --dx-ok: #0d9488;
}
.dx-band { background: var(--paper-2); }
.dx-a { color: var(--brand); text-decoration: underline; text-underline-offset: 2px; }
.dx-dim { color: var(--ink-400); }
.dx-tnum { font-variant-numeric: tabular-nums; }
.dx-meta { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 18px; font-size: 12px; color: var(--ink-400); }

.dx-hero-stats { margin-top: 36px; display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.dx-toc { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
.dx-toc a { font-size: 13px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--ink-100); color: var(--ink-700); background: #fff; }
.dx-toc a:hover { border-color: var(--brand-2); color: var(--brand); }

.dx-stat { background: var(--paper-2); border-radius: 12px; padding: 14px 16px; min-width: 0; }
.dx-band .dx-stat { background: #fff; border: 1px solid var(--ink-100); }
.dx-card .dx-stat { background: var(--paper-2); border: 0; }
.dx-stat-value { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); line-height: 1.05; }
.dx-stat-label { margin-top: 6px; font-size: 12.5px; color: var(--ink-500); line-height: 1.35; }
.dx-stat-note { margin-top: 4px; font-size: 11.5px; color: var(--ink-400); font-family: var(--font-mono); }

.dx-funnel { margin-top: 32px; display: grid; grid-template-columns: 1fr auto 1fr auto 1.3fr; align-items: stretch; gap: 12px; max-width: 900px; }
.dx-arrow { align-self: center; color: var(--ink-300); font-size: 22px; }

.dx-grid { margin-top: 32px; display: grid; gap: 18px; grid-template-columns: repeat(12, minmax(0, 1fr)); }
.dx-card { display: flex; flex-direction: column; gap: 14px; padding: 24px; min-width: 0; }
.dx-card:hover { transform: none; }
.dx-span-4 { grid-column: span 4; }
.dx-span-6 { grid-column: span 6; }
.dx-span-8 { grid-column: span 8; }
.dx-span-12 { grid-column: span 12; }

.dx-legend { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; color: var(--ink-500); }
.dx-legend li { display: flex; align-items: center; gap: 7px; }
.dx-axis-label { font-size: 10.5px; color: var(--ink-400); margin-bottom: 6px; }

.dx-hbars { list-style: none; padding: 0; margin: 0; display: grid; gap: 11px; }
.dx-hbar-top { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; color: var(--ink-700); margin-bottom: 5px; }
.dx-hbar-top .mono { font-size: 11.5px; color: var(--ink-700); white-space: nowrap; }
.dx-hbar-track { height: 12px; background: var(--ink-50); border-radius: 4px; overflow: hidden; }
.dx-hbar-fill { height: 100%; border-radius: 0 4px 4px 0; }

.dx-donut { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: center; }
.dx-donut-legend { list-style: none; padding: 0; margin: 0; display: grid; gap: 7px; }
.dx-donut-legend li { display: grid; grid-template-columns: 10px 1fr auto auto; gap: 8px; align-items: center; font-size: 12.5px; color: var(--ink-700); }
.dx-donut-legend .mono { font-size: 11.5px; }

.dx-heat { display: grid; gap: 3px; align-items: center; }
.dx-heat-col { font-size: 10.5px; color: var(--ink-400); text-align: center; }
.dx-heat-row { font-size: 10.5px; color: var(--ink-500); text-align: right; padding-right: 6px; }
.dx-heat-cell { border-radius: 4px; padding: 10px 0; text-align: center; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }

.dx-cols { display: grid; gap: 6px; align-items: end; }
.dx-col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
.dx-col-plot { width: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; border-bottom: 1px solid var(--ink-200); }
.dx-col-value { font-size: 10.5px; color: var(--ink-700); margin-bottom: 4px; }
.dx-col-bar { width: 100%; max-width: 24px; border-radius: 4px 4px 0 0; }
.dx-col-label { font-size: 10px; color: var(--ink-400); text-align: center; white-space: nowrap; }

.dx-stack-plot { position: relative; margin-left: 44px; }
.dx-stack-grid { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid var(--ink-100); }
.dx-stack-grid span { position: absolute; left: -44px; width: 38px; text-align: right; transform: translateY(-50%); font-size: 10.5px; color: var(--ink-400); font-variant-numeric: tabular-nums; }
.dx-stack-cols { position: absolute; inset: 0; display: grid; gap: 4px; align-items: end; border-bottom: 1px solid var(--ink-200); }
.dx-stack-col { height: 100%; display: flex; align-items: flex-end; justify-content: center; }
.dx-stack-bar { width: 100%; max-width: 24px; display: flex; flex-direction: column; gap: 2px; border-radius: 4px 4px 0 0; overflow: hidden; }
.dx-stack-bar > div { min-height: 0; }
.dx-stack-x { margin: 6px 0 0 44px; display: grid; gap: 4px; }
.dx-stack-x span { font-size: 10.5px; color: var(--ink-400); white-space: nowrap; }
.dx-line svg:focus-visible { outline: 2px solid var(--brand); outline-offset: 4px; border-radius: 6px; }
.dx-tip { position: absolute; top: 4px; pointer-events: none; background: #fff; border: 1px solid var(--ink-100); box-shadow: 0 8px 24px -12px rgba(11,18,32,0.25); border-radius: 8px; padding: 8px 10px; font-size: 12px; min-width: 160px; z-index: 2; }
.dx-tip-head { font-size: 11px; color: var(--ink-400); margin-bottom: 4px; }
.dx-tip-row { display: flex; align-items: center; gap: 8px; color: var(--ink-500); }
.dx-tip-row strong { color: var(--ink); font-variant-numeric: tabular-nums; }

.dx-table-view { margin-top: 12px; font-size: 12.5px; }
.dx-table-view summary { cursor: pointer; color: var(--ink-500); font-size: 12px; }
.dx-table-view table, .dx-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dx-table-view table { margin-top: 10px; }
.dx-table-view th, .dx-table-view td, .dx-table th, .dx-table td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--ink-100); vertical-align: top; }
.dx-table-view th, .dx-table th { font-weight: 600; color: var(--ink-500); font-size: 11.5px; }
.dx-table-view td, .dx-table td { color: var(--ink-700); font-variant-numeric: tabular-nums; }
.dx-table-num td:not(:first-child), .dx-table-num th:not(:first-child) { text-align: right; }
.dx-table tr.is-ours td { background: var(--paper-3); font-weight: 600; }

.dx-link { display: inline-block; font-size: 11.5px; padding: 3px 8px; border-radius: 999px; background: var(--paper-3); color: var(--brand-deep); white-space: nowrap; }
.dx-link-name-bridge, .dx-link-name-only { background: #fff4e5; color: #8a4b00; }
.dx-link-single { background: var(--ink-50); color: var(--ink-500); }
.dx-check { margin-top: 8px; font-size: 12.5px; color: #8a4b00; background: #fff4e5; border-radius: 8px; padding: 8px 10px; }

.dx-steps { margin: 0; padding-left: 20px; display: grid; gap: 10px; font-size: 13.5px; color: var(--ink-700); line-height: 1.5; }
.dx-steps strong { color: var(--ink); }
.dx-family { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.dx-family li { display: flex; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--paper-2); font-size: 14px; }
.dx-family .mono { font-size: 12px; }

.dx-corr { }
.dx-corr-head { display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-700); margin-bottom: 5px; }
.dx-corr-track { position: relative; height: 12px; background: var(--ink-50); border-radius: 4px; }
.dx-corr-mid { position: absolute; left: 50%; top: -2px; bottom: -2px; width: 1px; background: var(--ink-300); }
.dx-corr-fill { position: absolute; top: 0; bottom: 0; border-radius: 3px; opacity: 0.9; }
.dx-corr-reading { margin-top: 5px; font-size: 12px; color: var(--ink-500); }

.dx-callout { margin-top: 24px; padding: 18px 20px; border-left: 3px solid var(--dx-out); background: #fff7f2; border-radius: 0 12px 12px 0; font-size: 15px; color: var(--ink-700); line-height: 1.55; max-width: 900px; }

.dx-flow ol { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; counter-reset: none; }
.dx-flow li { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: 12px; background: var(--paper-2); font-size: 12.5px; color: var(--ink-500); }
.dx-flow li strong { font-size: 14px; color: var(--ink); }
.dx-flow li:not(:last-child)::after { content: "→"; position: absolute; right: -5px; top: 50%; transform: translate(50%, -50%); color: var(--ink-400); font-size: 18px; line-height: 1; z-index: 1; }
.dx-flow-n { font-size: 11px; color: var(--brand); }
.dx-flow-loop { margin-top: 12px; font-size: 12px; color: var(--ink-500); }

.dx-prose { margin-top: 24px; display: grid; gap: 18px; font-size: 15.5px; color: var(--ink-500); line-height: 1.65; }
.dx-prose strong { color: var(--ink); }

/* ---------- call list ---------- */
.dx-owners { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
.dx-owners-label { flex-basis: 100%; font-size: 12px; color: var(--ink-400); }
.dx-owners div { display: flex; align-items: baseline; gap: 8px; padding: 8px 14px; border-radius: 10px; background: #fff; border: 1px solid var(--ink-100); font-size: 13px; color: var(--ink-500); }
.dx-owners strong { font-size: 16px; color: var(--ink); }
.dx-wl { margin-top: 20px; background: #fff; border: 1px solid var(--ink-100); border-radius: 18px; padding: 20px; }
.dx-wl-queues { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dx-queue { text-align: left; display: grid; grid-template-columns: auto 1fr; column-gap: 12px; align-items: baseline; padding: 14px 16px; border-radius: 12px; border: 1.5px solid var(--ink-100); background: var(--paper-2); color: var(--ink-700); }
.dx-queue.is-on { border-color: var(--brand); background: var(--paper-3); }
.dx-queue-n { grid-row: span 2; font-size: 26px; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; }
.dx-queue-label { font-weight: 600; font-size: 14px; }
.dx-queue-hint { font-size: 12px; color: var(--ink-400); }
.dx-wl-tiers { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }
.dx-chip { display: inline-flex; align-items: center; gap: 7px; min-height: 36px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--ink-100); background: #fff; font-size: 13px; color: var(--ink-700); }
.dx-chip.is-on { border-color: var(--ink); background: var(--ink-50); font-weight: 600; }
.dx-chip .mono { font-size: 12px; }
.dx-wl-filters { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
.dx-wl-filters label { display: grid; gap: 4px; font-size: 11.5px; color: var(--ink-400); }
.dx-wl-filters select, .dx-wl-filters input, .dx-cell-status select { font: inherit; font-size: 13px; min-height: 36px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--ink-200); background: #fff; color: var(--ink); }
.dx-search input { width: 200px; }
.dx-btn { font: inherit; font-size: 13px; min-height: 36px; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--ink-200); background: #fff; color: var(--ink); font-weight: 500; }
.dx-btn:hover { border-color: var(--ink-400); }
.dx-more { margin-top: 14px; }
.dx-wl-summary { margin-top: 14px; font-size: 11.5px; color: var(--ink-400); }

.dx-wl-head, .dx-wl-cells { display: grid; grid-template-columns: 110px minmax(150px, 1.3fr) 110px 150px minmax(150px, 1.3fr) minmax(170px, 1.4fr) 150px; gap: 12px; align-items: start; }
.dx-wl-head { margin-top: 10px; padding: 8px 10px; font-size: 11px; font-weight: 600; color: var(--ink-400); border-bottom: 1px solid var(--ink-100); }
.dx-wl-list { list-style: none; padding: 0; margin: 0; }
.dx-wl-row { border-bottom: 1px solid var(--ink-100); }
.dx-wl-row.is-open { background: var(--paper-2); }
.dx-wl-cells { padding: 12px 10px; font-size: 13px; }
.dx-wl-cells > div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dx-wl-cells .mono { font-size: 11px; }
.dx-cell-tier { flex-direction: row !important; align-items: center; gap: 8px !important; }
.dx-tier { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink); }
.dx-name { all: unset; cursor: pointer; font-weight: 600; color: var(--ink); display: inline-flex; gap: 6px; align-items: baseline; }
.dx-name:hover { color: var(--brand); }
.dx-name:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 4px; }
.dx-caret { font-size: 10px; color: var(--ink-400); }
.dx-contact { font-size: 11.5px; color: var(--ink-500); }
.dx-a1c { display: inline-flex; align-items: center; gap: 6px; }
.dx-dot { width: 8px; height: 8px; border-radius: 50%; }
.dx-up { color: var(--dx-critical); }
.dx-down { color: var(--dx-in); }
.dx-state { font-weight: 600; font-size: 12.5px; }
.dx-state-lost, .dx-state-slipping { color: #a12a2a; }
.dx-state-overdue { color: #8a4b00; }
.dx-state-due-soon, .dx-state-on-track { color: var(--ink-700); }
.dx-cell-why { flex-direction: row !important; flex-wrap: wrap; gap: 4px !important; }
.dx-reason { font-size: 11px; padding: 2px 7px; border-radius: 999px; background: var(--ink-50); color: var(--ink-700); white-space: nowrap; }
.dx-cell-next span:first-child { color: var(--ink-700); }
.dx-cell-next .dx-dim { font-size: 11.5px; }
.dx-cell-status select { width: 100%; }
.dx-cell-status select.is-set { border-color: var(--brand); background: var(--paper-3); }

.dx-detail { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; padding: 6px 10px 22px; }
.dx-detail h4 { font-size: 13px; margin: 0 0 8px; color: var(--ink-700); }
.dx-detail-p { font-size: 13px; color: var(--ink-500); }
.dx-names { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.dx-names span { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: #fff; border: 1px solid var(--ink-100); }
.dx-results { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dx-results td { padding: 5px 6px; border-bottom: 1px solid var(--ink-100); color: var(--ink-700); }
.dx-results td.mono { font-size: 11.5px; white-space: nowrap; }
.dx-flag { color: #a12a2a; font-size: 11.5px; }
.dx-msg { margin-top: 16px; padding: 14px; border-radius: 12px; background: #fff; border: 1px solid var(--ink-100); }
.dx-msg-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.dx-msg-head h4 { margin: 0; }
.dx-seg { display: inline-flex; border: 1px solid var(--ink-200); border-radius: 8px; overflow: hidden; }
.dx-seg button { font: inherit; font-size: 12px; padding: 5px 10px; border: 0; background: #fff; color: var(--ink-500); min-height: 30px; }
.dx-seg button[aria-pressed="true"] { background: var(--ink); color: #fff; }
.dx-msg-text { margin-top: 10px; font-size: 13.5px; color: var(--ink-700); line-height: 1.55; white-space: pre-wrap; }
.dx-msg-actions { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }

@media (max-width: 1100px) {
  .dx-wl-head { display: none; }
  .dx-wl-cells { grid-template-columns: 1fr 1fr; }
  .dx-cell-tier { grid-column: 1 / -1; }
  .dx-cell-why, .dx-cell-next, .dx-cell-status { grid-column: 1 / -1; }
}
@media (max-width: 980px) {
  .dx-span-4, .dx-span-6, .dx-span-8, .dx-span-12 { grid-column: span 12; }
  .dx-hero-stats { grid-template-columns: 1fr 1fr; }
  .dx-detail { grid-template-columns: 1fr; }
  .dx-flow ol { grid-template-columns: 1fr; }
  .dx-flow li:not(:last-child)::after { content: "↓"; right: 50%; top: auto; bottom: -5px; transform: translate(50%, 50%); }
}
@media (max-width: 640px) {
  .dx-funnel { grid-template-columns: 1fr; }
  .dx-arrow { transform: rotate(90deg); justify-self: center; }
  .dx-wl { padding: 14px; }
  .dx-wl-queues { grid-template-columns: 1fr; }
  .dx-search input { width: 100%; }
  .dx-search { flex: 1 1 100%; }
  .dx-donut { grid-template-columns: 1fr; justify-items: center; }
  .dx-donut-legend { width: 100%; }
  .dx-stat-value { font-size: 24px; }
}
`;
