import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-clinical" style={{ paddingTop: 120, paddingBottom: 0 }}>
      <div className="container" style={{ position: "relative", zIndex: 2, paddingTop: 80, paddingBottom: 120 }}>
        <div style={{ display: "grid", placeItems: "center", textAlign: "center", maxWidth: 980, margin: "0 auto" }}>
          <span className="kbd-pill kbd-pill-dark">
            <span className="dot pulse" style={{ background: "#14B8A6" }} />
            Now piloting · Bihar & Karnataka
          </span>
          <span className="mono" style={{ marginTop: 28, fontSize: 13, letterSpacing: "0.05em", fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>
            dic·tion·ar·y of dis·ease&nbsp;&nbsp;|&nbsp;&nbsp;/ˈdɪk.ʃə.ner.i əv dɪˈziːz/
          </span>
          <h1 style={{ marginTop: 12, color: "#fff", textWrap: "balance" as never }}>
            Dictionary<Sep />of<Sep />Disease
          </h1>
          <p style={{ marginTop: 22, fontSize: 19, lineHeight: 1.5, fontStyle: "italic", color: "rgba(255,255,255,0.82)", maxWidth: 760 }}>
            <b style={{ fontStyle: "normal", fontWeight: 600, color: "#fff" }}>noun.</b> the practice of reading human health by translating a small, foundational vocabulary of vital signs into clear medical meaning.
          </p>
          <p style={{ marginTop: 22, fontSize: 20, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, maxWidth: 720 }}>
            Every primary clinic. Every ASHA visit. A four-minute cardiac screening,
            offline-first, triaged by AI, escalated to a cardiologist when it matters.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="#contact" className="btn btn-light">Book a pilot →</Link>
            <Link href="/research" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
              See the science
            </Link>
          </div>

          <div style={{ display: "flex", gap: 48, marginTop: 48, flexWrap: "wrap", justifyContent: "center", color: "rgba(255,255,255,0.85)" }}>
            <Stat n="3.4 min" l="median screening" />
            <Stat n="92%" l="signal yield" />
            <Stat n="78 paths" l="eval coverage" />
            <Stat n="asia-south1" l="data residency" />
          </div>
        </div>

        <DashboardCard />
      </div>

      <BottomFade />
    </section>
  );
}

function Sep() {
  return <span style={{ color: "#A7F3D0", fontWeight: 300, padding: "0 0.04em" }}>·</span>;
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{l}</div>
    </div>
  );
}

function BottomFade() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        bottom: -1,
        left: 0,
        right: 0,
        height: 120,
        background: "linear-gradient(to bottom, transparent, var(--paper) 90%)",
        zIndex: 1,
      }}
    />
  );
}

function DashboardCard() {
  return (
    <div style={{ marginTop: 72, position: "relative", maxWidth: 1080, marginInline: "auto" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 50px 100px -40px rgba(0,0,0,0.45), 0 16px 40px -16px rgba(15,118,110,0.35)",
          border: "1px solid rgba(255,255,255,0.5)",
          padding: 28,
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 28,
          color: "var(--ink)",
        }}
        className="dashboard-grid"
      >
        <DashboardLeft />
        <DashboardRight />
      </div>
      <style>{`
        @media (max-width: 820px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function DashboardLeft() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-400)", fontWeight: 600 }}>
            Live capture · Begusarai
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 4, letterSpacing: "-0.02em" }}>
            Sunita Devi · 47
          </div>
        </div>
        <span className="kbd-pill" style={{ fontSize: 11, padding: "5px 10px" }}>
          <span className="dot pulse" style={{ background: "var(--ok)" }} /> SamaBeat paired
        </span>
      </div>

      <div style={{ background: "var(--paper-2)", borderRadius: 16, padding: 20, border: "1px solid var(--ink-100)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-400)" }}>
          <span>Position 2 of 4 · Mitral</span>
          <span className="mono" style={{ color: "var(--ink)" }}>18 / 20 s</span>
        </div>
        <ECGFull />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
          <Kv label="Heart rate" value="74" suffix="bpm" />
          <Kv label="Rhythm" value="Sinus" />
          <Kv label="Confidence" value="High" tone="ok" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Mini label="Retake suggestions" value="0 today" />
        <Mini label="Sync queue" value="0 pending" tone="ok" />
      </div>
    </div>
  );
}

function DashboardRight() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-400)", fontWeight: 600 }}>
          Supervisor view · Today
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 4, letterSpacing: "-0.02em" }}>
          47 screenings · 2 referrals
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <Bar label="Pulse" value={78} color="var(--brand)" />
        <Bar label="Rhythm clean" value={92} color="var(--ok)" />
        <Bar label="Retake rate" value={8} color="var(--warn)" />
      </div>

      <div style={{ background: "var(--paper-2)", border: "1px solid var(--ink-100)", borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--brand)", letterSpacing: "0.12em" }}>REFERRAL · 09:41</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--panic)" }}>● AFib suspected</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>Patient #SH-2847</div>
        <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 4 }}>
          Routed to Dr. Mohan · Sadar District Hospital · ETA 22 min
        </div>
      </div>
    </div>
  );
}

function Kv({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone?: "ok" }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--ink-100)" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--ink-400)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: tone === "ok" ? "var(--ok)" : "var(--ink)" }}>{value}</span>
        {suffix && <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "ok" }) {
  return (
    <div style={{ background: "var(--paper-2)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--ink-100)" }}>
      <div style={{ fontSize: 11, color: "var(--ink-400)" }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: 2, color: tone === "ok" ? "var(--ok)" : "var(--ink)" }}>{value}</div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "var(--ink-500)" }}>{label}</span>
        <span className="mono" style={{ color: "var(--ink)" }}>{value}%</span>
      </div>
      <div style={{ background: "var(--ink-100)", height: 8, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, background: color, height: "100%", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function ECGFull() {
  return (
    <svg viewBox="0 0 480 110" width="100%" height="110" aria-hidden style={{ marginTop: 10 }}>
      <defs>
        <linearGradient id="ecgg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0" />
          <stop offset="20%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <g stroke="rgba(15,118,110,0.08)" strokeWidth="1">
        {[0, 22, 44, 66, 88].map((y) => (
          <line key={y} x1="0" x2="480" y1={y + 10} y2={y + 10} />
        ))}
      </g>
      <path
        className="ecg-path"
        d="M0 60 L40 60 L48 56 L56 64 L64 30 L72 88 L80 40 L92 60 L160 60 L168 56 L176 64 L184 30 L192 88 L200 40 L212 60 L280 60 L288 56 L296 64 L304 30 L312 88 L320 40 L332 60 L480 60"
        stroke="url(#ecgg)"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
