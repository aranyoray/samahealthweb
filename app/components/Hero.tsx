import Link from "next/link";

/** One beat of a fingertip pulse wave, 0 to 1: the systolic rise, then the smaller second wave. */
function beat(t: number): number {
  return Math.exp(-(((t - 0.2) / 0.085) ** 2)) + 0.42 * Math.exp(-(((t - 0.46) / 0.13) ** 2));
}

const PERIOD = 200;
const STAGE = { width: 1200, height: 300 };
/** One more beat than the stage shows, so the row can move a whole beat and start again unseen. */
const BEATS = STAGE.width / PERIOD + 1;

function tracePath(baseline: number, amplitude: number, lag: number): string {
  const steps = 40;
  const points: string[] = [];
  for (let k = 0; k <= BEATS * steps; k++) {
    const x = (k / steps) * PERIOD;
    const t = (((k / steps - lag) % 1) + 1) % 1;
    points.push(`${x.toFixed(1)} ${(baseline - beat(t) * amplitude).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

/** The clip reads the pulse at five wavelengths: five traces of the same heartbeat. */
const TRACES = [
  { baseline: 96, amplitude: 58, lag: 0, color: "#5EEAD4", width: 2 },
  { baseline: 142, amplitude: 74, lag: 0.02, color: "#2DD4BF", width: 2.4 },
  { baseline: 188, amplitude: 52, lag: 0.04, color: "#38BDF8", width: 2 },
  { baseline: 230, amplitude: 66, lag: 0.055, color: "#A7F3D0", width: 1.8 },
  { baseline: 270, amplitude: 40, lag: 0.07, color: "#E5E5E5", width: 1.6 },
];

/** The example reading the SamaClip page shows, figure for figure. */
const READING = [
  { label: "Haemoglobin", value: "10.8", unit: "g/dL", flag: "Low", ok: false },
  { label: "Oxygen", value: "98", unit: "%", flag: "Normal", ok: true },
  { label: "HbA1c estimate", value: "5.9", unit: "%", flag: "Watch", ok: false },
  { label: "Rhythm", value: "Sinus", unit: "76 bpm", flag: "Stable", ok: true },
];

/**
 * The first screen: one black card, inset from the edges of the page. The statement is centred at the
 * top, the pulse traces pass across the card under it, and the example reading sits over them on
 * frosted glass, so the traces show through it, blurred.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" data-tone="dark" className="hero-card home-hero">
      <div className="home-hero-text">
        <h1 id="hero-title" className="display">
          <span style={{ display: "block" }}>A two-minute fingertip screen.</span>
          <span style={{ display: "block", color: "var(--dim)" }}>A real lab behind it.</span>
        </h1>
        <p className="lede" style={{ maxWidth: "38rem", margin: "20px auto 0" }}>
          SamaClip reads haemoglobin, oxygen, heart rhythm and diabetes risk from one finger. Anything
          abnormal goes to the NABL-accredited lab at Anubhav Life Care, Barasat.
        </p>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="/samaclip" className="btn btn-light">
            See SamaClip
          </Link>
          <Link href="/research" className="btn btn-ghost">
            Read the validation
          </Link>
        </div>
      </div>

      <div className="home-hero-stage">
        {/* On a narrow screen the row keeps its beat width and runs off both sides instead of bunching up. */}
        <div className="trace-field" aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <svg
            viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: "50%", width: "max(100%, 980px)", maxWidth: "none", height: "100%", transform: "translateX(-50%)" }}
          >
            <g className="trace-track" style={{ ["--trace-shift" as string]: `${PERIOD}px`, ["--trace-seconds" as string]: "2.6s" }}>
              {TRACES.map((trace) => (
                <path
                  key={trace.baseline}
                  d={tracePath(trace.baseline, trace.amplitude, trace.lag)}
                  fill="none"
                  stroke={trace.color}
                  strokeWidth={trace.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          </svg>
        </div>

        <dl className="glass-dark home-reading" aria-label="An example SamaClip reading">
          <div className="home-reading-intro">
            <dt className="title" style={{ fontSize: 17 }}>Example reading</dt>
            <dd>One finger, one recording</dd>
          </div>
          {READING.map((cell, index) => (
            <div key={cell.label} className="reading-cell home-reading-cell" style={{ ["--delay" as string]: `${500 + index * 260}ms` }}>
              <dt>{cell.label}</dt>
              <dd>
                <span className="home-reading-value">{cell.value}</span>
                <span className="home-reading-unit">{cell.unit}</span>
                <span className="home-reading-flag" style={{ color: cell.ok ? "#4ADE80" : "#FBBF24" }}>
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor", display: "inline-block" }} />
                  {cell.flag}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <style>{`
        .home-hero { display: flex; flex-direction: column; min-height: min(800px, max(620px, calc(100svh - var(--nav-h) - 104px))); }
        .home-hero-text { position: relative; z-index: 1; padding: 64px 24px 0; text-align: center; }
        .home-hero-text h1 { max-width: 60rem; margin: 0 auto; }
        .home-hero-stage { position: relative; flex: 1; min-height: 330px; margin-top: 8px; }
        .home-reading {
          position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%);
          width: min(980px, calc(100% - 32px)); margin: 0;
          display: grid; grid-template-columns: 1.1fr repeat(4, 1fr);
          border-radius: 18px; color: #F5F5F5;
        }
        .home-reading > div { padding: 18px 20px; border-left: 1px solid rgba(255,255,255,0.12); }
        .home-reading > div:first-child { border-left: 0; }
        .home-reading dt { font-size: 13.5px; color: #CFCFCF; }
        .home-reading dd { margin: 6px 0 0; }
        .home-reading-intro dt { color: #F5F5F5; }
        .home-reading-intro dd { font-size: 13.5px; color: #CFCFCF; margin-top: 4px; }
        .home-reading-value { font-size: 28px; font-weight: 500; letter-spacing: -0.035em; line-height: 1; font-variant-numeric: tabular-nums; }
        .home-reading-unit { margin-left: 6px; font-size: 13px; color: #CFCFCF; }
        .home-reading-flag { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; font-weight: 500; }
        @media (max-width: 860px) {
          .home-hero-text { padding-top: 44px; }
          .home-hero-stage { min-height: 400px; }
          .home-reading { grid-template-columns: 1fr 1fr; bottom: 16px; }
          .home-reading-intro { grid-column: 1 / -1; }
          .home-reading > div { border-left: 0; border-top: 1px solid rgba(255,255,255,0.12); padding: 14px 16px; }
          .home-reading > div:first-child { border-top: 0; }
          .home-reading > div:nth-child(odd):not(:first-child) { border-left: 1px solid rgba(255,255,255,0.12); }
        }
      `}</style>
    </section>
  );
}
