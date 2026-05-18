import Link from "next/link";

export function LogoMarquee() {
  const partners = [
    "AIIMS Patna",
    "St. John's Bangalore",
    "Sadar District Hospital",
    "NHSRC",
    "C-CAMP",
    "IISc",
    "ICMR",
    "CTRI India",
  ];
  const row = [...partners, ...partners];
  return (
    <section style={{ background: "var(--paper)", borderTop: "1px solid var(--ink-100)", borderBottom: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ padding: "40px 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="eyebrow">Trusted clinical & research partners</div>
        </div>
        <div style={{ overflow: "hidden", maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)" }}>
          <div className="marquee-track">
            {row.map((p, i) => (
              <span key={i} className="mono" style={{ fontSize: 15, color: "var(--ink-400)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Scenarios() {
  const items = [
    { icon: <Village />, title: "Rural villages", body: "ASHA-led screening at the doorstep. Voice-prompted, offline-first, 14-day cache." },
    { icon: <Camp />, title: "Mass screening camps", body: "200+ patients/day with 6 SamaBeats. Queue, triage, sync — one workflow." },
    { icon: <Clinic />, title: "Primary health centres", body: "Walk-in cardiac risk assessment in under 4 minutes. ABDM-linked." },
    { icon: <Followup />, title: "Follow-up & titration", body: "Recurring screening for hypertensives + diabetics. Reminders + supervisor escalation." },
  ];
  return (
    <section id="platform" className="section reveal">
      <div className="container">
        <div style={{ display: "grid", placeItems: "center", textAlign: "center", maxWidth: 880, margin: "0 auto 64px" }}>
          <div className="eyebrow">Application scenarios</div>
          <h2 style={{ marginTop: 18 }}>
            One stack, <em style={{ fontStyle: "italic", color: "var(--brand)" }}>four points of care.</em>
          </h2>
          <p style={{ marginTop: 18, fontSize: 18, maxWidth: 680, color: "var(--ink-500)" }}>
            SamaHealth is the cardiac front-end for every screening event in primary care —
            village to camp to clinic to follow-up.
          </p>
        </div>
        <div className="grid grid-4">
          {items.map((it) => (
            <div key={it.title} className="card" style={{ padding: 28, textAlign: "left" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-3)", display: "grid", placeItems: "center", color: "var(--brand)" }}>
                {it.icon}
              </div>
              <h3 style={{ marginTop: 20 }}>{it.title}</h3>
              <p style={{ marginTop: 10, color: "var(--ink-500)", fontSize: 15 }}>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Capture",
      body: "Voice-led workflow. ASHA places SamaBeat at four positions. 20s clips, encrypted on device.",
      stat: "3.4 min",
      stat_l: "median",
    },
    {
      n: "02",
      title: "Triage",
      body: "On-device TFLite models flag rhythm + abnormality risk in under 800 ms. Retake hints fire in-clip.",
      stat: "800 ms",
      stat_l: "inference",
    },
    {
      n: "03",
      title: "Escalate",
      body: "Panic flags routed to supervising clinicians within 90 seconds. Signed, append-only audit trail.",
      stat: "90 s",
      stat_l: "escalation",
    },
  ];

  return (
    <section className="reveal" style={{ background: "var(--ink)", color: "#fff", padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <BgPattern />
      <div className="container" style={{ position: "relative" }}>
        <div style={{ maxWidth: 880, margin: "0 auto 64px", textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "var(--brand-2)" }}>How it works</div>
          <h2 style={{ marginTop: 18, color: "#fff" }}>
            From the patient's chest to the cardiologist's desk in <em style={{ fontStyle: "italic", color: "#A7F3D0" }}>90 seconds.</em>
          </h2>
        </div>

        <div className="grid grid-3" style={{ gap: 20 }}>
          {steps.map((s) => (
            <div
              key={s.n}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: 32,
                display: "grid",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 12, color: "var(--brand-2)", letterSpacing: "0.16em" }}>{s.n}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, color: "#fff" }}>{s.stat}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.stat_l}</div>
                </div>
              </div>
              <h3 style={{ color: "#fff", fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>{s.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BgPattern() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(50% 50% at 20% 50%, rgba(20,184,166,0.18) 0%, transparent 60%), radial-gradient(40% 40% at 90% 10%, rgba(14,165,233,0.12) 0%, transparent 60%)",
      }}
    />
  );
}

export function Parameters() {
  const groups: { title: string; items: { label: string; desc: string }[] }[] = [
    {
      title: "Cardiac",
      items: [
        { label: "Heart rate", desc: "Beat-to-beat HRV" },
        { label: "Rhythm", desc: "Sinus, AFib, flutter, VT" },
        { label: "S1/S2 split", desc: "PCG cycle analysis" },
        { label: "Murmurs", desc: "Systolic/diastolic detection" },
      ],
    },
    {
      title: "Hemodynamic",
      items: [
        { label: "Pulse pressure", desc: "Wave morphology" },
        { label: "Cardiac cycle", desc: "EMD, IVRT, IVCT" },
        { label: "Arterial stiffness", desc: "PWV proxy" },
        { label: "Workload", desc: "Effort-aware capture" },
      ],
    },
    {
      title: "Signal quality",
      items: [
        { label: "SQI gating", desc: "Reject before inference" },
        { label: "Ambient noise", desc: "< 35 dB(A) budget" },
        { label: "Contact pressure", desc: "Accelerometer feedback" },
        { label: "Position drift", desc: "Auto-retake prompts" },
      ],
    },
  ];

  return (
    <section id="parameters" className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48, alignItems: "end", marginBottom: 56 }} className="param-head">
          <div>
            <div className="eyebrow">Parameters tracked</div>
            <h2 style={{ marginTop: 18 }}>
              Every screening is <em style={{ fontStyle: "italic", color: "var(--brand)" }}>twelve measurements deep.</em>
            </h2>
          </div>
          <p style={{ fontSize: 17, color: "var(--ink-500)", maxWidth: 540, justifySelf: "end" }}>
            Not a single-shot ECG strip. A multi-modal capture — phonocardiogram, single-lead ECG, accelerometer —
            fused on-device into a triage signal the ASHA can act on.
          </p>
        </div>

        <div className="grid grid-3">
          {groups.map((g) => (
            <div key={g.title} className="card" style={{ padding: 32 }}>
              <div className="eyebrow" style={{ fontSize: 11 }}>{g.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 18 }}>
                {g.items.map((it) => (
                  <li key={it.label} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
                    <Dot />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{it.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ink-400)", marginTop: 2 }}>{it.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 820px) { .param-head { grid-template-columns: 1fr !important; gap: 20px !important; } .param-head > p { justify-self: start !important; } }`}</style>
    </section>
  );
}

function Dot() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden style={{ marginTop: 2 }}>
      <circle cx="10" cy="10" r="9" fill="#ECFDF5" />
      <path d="M6 10.5L9 13.5L14.5 7.5" stroke="#0F766E" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Outcomes() {
  const rows = [
    { area: "Time to screening", before: "Months · referral to district", after: "3.4 min · in the village" },
    { area: "Detection of AFib", before: "Symptomatic only", after: "Asymptomatic at first visit" },
    { area: "Patient round-trips", before: "3.2 hospitals avg.", after: "Single ASHA touch" },
    { area: "Worker training", before: "2 weeks classroom", after: "90 min voice tutorial" },
    { area: "Data residency", before: "Multiregion · opaque", after: "asia-south1 · audited" },
  ];

  return (
    <section id="outcomes" className="section reveal">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "start" }} className="outcomes-head">
          <div>
            <div className="eyebrow">Outcomes</div>
            <h2 style={{ marginTop: 18 }}>
              What changes when screening <em style={{ fontStyle: "italic", color: "var(--brand)" }}>reaches the village.</em>
            </h2>
            <p style={{ marginTop: 22, fontSize: 17, color: "var(--ink-500)", maxWidth: 460 }}>
              From the Bihar + Karnataka pilot (n=412, Q4 2025). Pre-registered with CTRI.
              Full methodology on the research page.
            </p>
            <Link href="/research" className="btn btn-ghost" style={{ marginTop: 28 }}>
              Read the science →
            </Link>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              className="outcomes-row outcomes-headrow"
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.1fr 1.1fr",
                padding: "18px 28px",
                background: "var(--paper-2)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-400)",
                borderBottom: "1px solid var(--ink-100)",
              }}
            >
              <span>Outcome</span>
              <span>Before</span>
              <span>With SamaHealth</span>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.area}
                className="outcomes-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.1fr 1.1fr",
                  padding: "22px 28px",
                  borderBottom: i < rows.length - 1 ? "1px solid var(--ink-100)" : "none",
                  gap: 16,
                  fontSize: 15,
                  alignItems: "start",
                }}
              >
                <span style={{ fontWeight: 600 }}>{r.area}</span>
                <span style={{ color: "var(--ink-400)" }}>{r.before}</span>
                <span style={{ color: "var(--brand)", fontWeight: 600 }}>{r.after}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 980px) {
          .outcomes-head { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          .outcomes-headrow { display: none !important; }
          .outcomes-row { grid-template-columns: 1fr !important; padding: 18px 20px !important; gap: 4px !important; }
          .outcomes-row > span:nth-child(1) { font-size: 18px !important; }
          .outcomes-row > span:nth-child(2)::before { content: 'Before · '; color: var(--ink-300); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
          .outcomes-row > span:nth-child(3)::before { content: 'With SamaHealth · '; color: var(--brand-2); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
        }
      `}</style>
    </section>
  );
}

export function Quote() {
  return (
    <section className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container" style={{ maxWidth: 980, textAlign: "center" }}>
        <span className="kbd-pill">Field report · Begusarai</span>
        <blockquote
          style={{
            margin: "28px 0 0",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4.2vw, 48px)",
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            fontWeight: 500,
          }}
        >
          “We saw four <em style={{ fontStyle: "italic", color: "var(--brand)" }}>asymptomatic AFib</em> patients in the first week.
          None of them would have walked into a clinic on their own.”
        </blockquote>
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 18 }}>
            RM
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 600 }}>Dr. Rajiv Mohan</div>
            <div style={{ fontSize: 13, color: "var(--ink-400)" }}>Cardiologist · Sadar District Hospital, Begusarai</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section id="contact" className="section reveal" style={{ background: "var(--ink)", color: "#fff", position: "relative", overflow: "hidden" }}>
      <BgPattern />
      <div className="container" style={{ position: "relative", maxWidth: 980, textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "var(--brand-2)" }}>Get in touch</div>
        <h2 style={{ marginTop: 16, color: "#fff" }}>
          Bring screening to your district. <em style={{ fontStyle: "italic", color: "#A7F3D0" }}>Pilot in 90 days.</em>
        </h2>
        <p style={{ marginTop: 22, color: "rgba(255,255,255,0.7)", fontSize: 18, maxWidth: 620, margin: "22px auto 0" }}>
          We partner with state programs, district hospitals, and rural-health NGOs.
          Send a note — we reply within two working days.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36, justifyContent: "center" }}>
          <Link href="mailto:hello@samahealth.in" className="btn btn-light">hello@samahealth.in →</Link>
          <Link href="/research" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
            Read the science
          </Link>
        </div>
      </div>
    </section>
  );
}

/* icons */
function Village() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V11l4-3 4 3v10" />
      <path d="M13 21V13l4-3 4 3v8" />
      <path d="M8 21v-4h2v4" />
      <path d="M16 21v-4h2v4" />
    </svg>
  );
}
function Camp() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l9-16 9 16" />
      <path d="M3 20h18" />
      <path d="M12 4v16" />
    </svg>
  );
}
function Clinic() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="15" rx="2" />
      <path d="M12 10v6M9 13h6" />
      <path d="M3 6l9-3 9 3" />
    </svg>
  );
}
function Followup() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
