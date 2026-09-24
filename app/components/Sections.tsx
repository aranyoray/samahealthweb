import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Credibility strip — a single quiet line, no bullets or pills.       */
/* ------------------------------------------------------------------ */

export function CredibilityStrip() {
  const items = [
    "Anubhav Life Care. NABL-accredited lab",
    "Barasat · North 24 Parganas, West Bengal",
    "Painless, non-invasive. No needle, no fasting",
    "Screening, not diagnosis",
  ];
  return (
    <section style={{ borderBottom: "1px solid var(--ink-100)" }}>
      <div
        className="container mono"
        style={{
          padding: "18px 28px",
          fontSize: 12.5,
          color: "var(--ink-400)",
          letterSpacing: "0.04em",
          textAlign: "center",
        }}
      >
        NABL-accredited lab · Barasat, West Bengal · screening, not diagnosis
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Autonomic vital signs — prose + spec table. No cards.               */
/* ------------------------------------------------------------------ */

export function AutonomicSignals() {
  const rows: [string, string, string, string][] = [
    ["Heart-rate variability", "RMSSD · SDNN · LF/HF", "PPG at 5 wavelengths", "Clinical ECG on the same clip"],
    ["Non-invasive haemoglobin", "g/dL", "Multi-wavelength absorbance", "Medonic M-32 B haematology analyser"],
    ["Oxygen saturation (SpO₂)", "%", "Red / IR PPG ratio", "Benchtop pulse oximeter"],
    ["Respiratory rate", "breaths / min", "PPG amplitude modulation", "Manual counting, resting"],
    ["Pulse transit time", "ms — BP surrogate", "ECG → PPG delay", "Cuff sphygmomanometer"],
    ["Rhythm — AF flag", "positive / negative", "Rhythm classifier on ECG", "Clinician-confirmed 12-lead"],
    ["Diabetes risk — HbA1c proxy", "%", "Multi-modal composite", "Mindray CL-900i CLIA"],
export function WhatWeScreen() {
  const items = [
    { title: "Anaemia", body: "A non-invasive haemoglobin estimate, the single most common and most overlooked condition among women here." },
    { title: "Blood oxygen (SpO₂)", body: "Oxygen saturation, validated to read consistently across skin tone." },
    { title: "Heart rate & rhythm", body: "Pulse and an atrial-fibrillation flag, a silent, stroke-causing rhythm people can’t feel." },
    { title: "Diabetes risk", body: "An HbA1c-proxy signal that flags who should get a confirmatory blood test." },
  ];
  return (
    <section id="signal" style={{ padding: "112px 0" }}>
      <div className="container" style={{ maxWidth: 1160 }}>
        <div
          className="signal-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          <div style={{ maxWidth: 460 }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 2.6vw, 32px)",
                lineHeight: 1.22,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                fontWeight: 500,
              }}
            >
              A single fingertip reading resolves the autonomic state and, through it,
              a working slice of the cardiometabolic panel.
            </p>
            <p
              style={{
                marginTop: 26,
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-500)",
              }}
            >
              Heart-rate variability encodes vagal tone. Photoplethysmography at five
              wavelengths carries haemoglobin, oxygenation and respiratory drive.
              Electrical activity on the same clip pins the beats down to a rhythm.
              Chronic disease — anaemia, dysglycaemia, occult infection, the autonomic
              neuropathy of long-standing diabetes — leaves its signature across
              these channels before it writes itself into a blood test.
            </p>
            <p
              style={{
                marginTop: 20,
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-500)",
              }}
            >
              Every derived signal is checked against a gold-standard instrument in
              the lab that sits behind the screening station.
            </p>
          </div>

          <div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ink-200)" }}>
                  <ThHead>Derived</ThHead>
                  <ThHead>Unit</ThHead>
                  <ThHead>Sensor</ThHead>
                  <ThHead>Reference</ThHead>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--ink-100)" }}>
                    <td style={{ padding: "16px 14px 16px 0", color: "var(--ink)", fontWeight: 500 }}>
                      {r[0]}
                    </td>
                    <td className="mono" style={{ padding: "16px 14px 16px 0", color: "var(--ink-500)", fontSize: 13 }}>
                      {r[1]}
                    </td>
                    <td style={{ padding: "16px 14px 16px 0", color: "var(--ink-500)" }}>{r[2]}</td>
                    <td style={{ padding: "16px 0", color: "var(--ink-500)" }}>{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .signal-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .signal-grid table { font-size: 13px; }
          .signal-grid table td, .signal-grid table th { padding-right: 8px !important; }
        }
      `}</style>
    </section>
  );
}

function ThHead({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="mono"
      style={{
        textAlign: "left",
        padding: "10px 14px 10px 0",
        fontSize: 10.5,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--ink-400)",
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* Disease triage — flow schematic + essay. No step-N pills.           */
/* ------------------------------------------------------------------ */

export function DiseaseTriage() {
  return (
    <section
      id="triage"
      style={{
        background: "var(--paper-2)",
        padding: "112px 0",
        borderTop: "1px solid var(--ink-100)",
        borderBottom: "1px solid var(--ink-100)",
      }}
    >
      <div className="container" style={{ maxWidth: 1160 }}>
        <div
          className="triage-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          <div style={{ maxWidth: 540 }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 2.6vw, 32px)",
                lineHeight: 1.22,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                fontWeight: 500,
              }}
            >
              A screen alone is a rumour. The value is in what happens next.
            </p>
            <p
              style={{
                marginTop: 26,
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-500)",
              }}
            >
              Every SamaClip reading falls into a triage that goes through the lab.
              A borderline haemoglobin is checked on the haematology analyser the
              same day. A rhythm flag is checked against a clinical ECG. A raised
              HbA1c proxy is confirmed on the wet-chemistry instrument. The patient
              is not told a number — they are told whether they need a real test,
              and where to get it.
            </p>
            <p
              style={{
                marginTop: 20,
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-500)",
              }}
            >
              Confirmed anaemia is treated. Confirmed diabetes is enrolled in the
              cardiometabolic clinic. Confirmed atrial fibrillation is referred.
              A tuberculosis pattern routes to sputum AFB, CBNAAT and the IGRA on
              site. A re-screen at a defined interval closes the loop.
            </p>
            <p
              style={{
                marginTop: 20,
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-500)",
              }}
            >
              That handover — from a signal to a paid, confirmatory test — is what
              separates a screening tool from an app.
            </p>

            <div style={{ marginTop: 36, display: "flex", gap: 28, flexWrap: "wrap" }}>
              <Link
                href="/data"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink)",
                  borderBottom: "1px solid var(--ink)",
                  paddingBottom: 2,
                }}
              >
                Cohort dashboards →
              </Link>
              <Link
                href="/research"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink-500)",
                  borderBottom: "1px solid var(--ink-200)",
                  paddingBottom: 2,
                }}
              >
                Validation study →
              </Link>
              <Link
                href="/camps"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink-500)",
                  borderBottom: "1px solid var(--ink-200)",
                  paddingBottom: 2,
                }}
              >
                Field camps →
              </Link>
export function HowItWorks() {
  const steps = [
    { n: "1", title: "Screen", body: "A health worker takes a painless fingertip reading at a camp, an antenatal visit, or the clinic. No needle, no fasting, results in minutes." },
    { n: "2", title: "Confirm", body: "Anything flagged is confirmed against the gold-standard instruments in the NABL-accredited lab at Anubhav Life Care. A flag is never a diagnosis." },
    { n: "3", title: "Follow up", body: "Confirmed patients start treatment and are tracked over time, with a re-screen schedule and the SamaBeat band, so the intervention is checked, not just prescribed." },
  ];
  return (
    <section className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <h2 style={{ maxWidth: 760 }}>From a flag to confirmed care</h2>
        <div className="grid grid-3" style={{ marginTop: 48 }}>
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 24 }}>{s.title}</h3>
              <p style={{ marginTop: 12, color: "var(--ink-500)", fontSize: 15 }}>{s.body}</p>
            </div>
          </div>

          <TriageFlow />
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .triage-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}

function TriageFlow() {
  const stages: { title: string; detail: string; note: string; dot: string }[] = [
    {
      title: "Screen",
      detail: "≈ 2-minute fingertip PPG + ECG",
      note: "Community camp · antenatal visit · clinic front desk",
      dot: "var(--brand-2)",
    },
    {
      title: "Flag",
      detail: "Threshold on the derived autonomic signals",
      note: "Hb, SpO₂, RR, HRV, AF rhythm, HbA1c proxy",
      dot: "var(--brand-2)",
    },
    {
      title: "Confirm",
      detail: "Gold-standard instrument in the same lab",
      note: "Medonic haematology · Mindray biochemistry · CL-900i CLIA · 12-lead ECG · sputum AFB / CBNAAT / IGRA for TB",
      dot: "var(--brand)",
    },
    {
      title: "Treat",
      detail: "Same-day clinical decision by a physician",
      note: "Iron / B12 · diabetes enrolment · anticoagulation referral · anti-tubercular therapy",
      dot: "var(--brand)",
    },
    {
      title: "Re-screen",
      detail: "Scheduled follow-up on the same clip",
      note: "Closes the loop; picks up non-responders",
      dot: "var(--brand-deep)",
    },
export function Reach() {
  const items = [
    { title: "A trusted hub", body: "An NABL-accredited diagnostic centre anchors the work, so every screening flag has a real lab behind it." },
    { title: "Spokes that travel", body: "Community camps, antenatal visits, and school screening days run by locally trained operators. Care that goes to people instead of waiting for them." },
    { title: "The last mile", body: "Free transport for pregnant and elderly patients closes the gap between a flag and the confirmatory test that follows it." },
  ];
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--ink-100)",
        borderRadius: 14,
        padding: "32px 32px 28px",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-400)",
          fontWeight: 600,
          marginBottom: 22,
        }}
      >
        Signal → confirmed care
      </div>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <li
              key={s.title}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 1fr",
                gap: 18,
                paddingBottom: isLast ? 0 : 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  alignSelf: "stretch",
                }}
              >
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: s.dot,
                    flex: "none",
                    marginTop: 5,
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: 1.5,
                      flex: 1,
                      background: "var(--ink-100)",
                      minHeight: 26,
                    }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--ink)",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{ fontSize: 14, color: "var(--ink-700)", marginTop: 3 }}
                >
                  {s.detail}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink-400)",
                    marginTop: 5,
                    lineHeight: 1.55,
                  }}
                >
                  {s.note}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quote — kept, byline restrained.                                    */
/* ------------------------------------------------------------------ */

export function Quote() {
  return (
    <section style={{ padding: "120px 0" }}>
      <div className="container" style={{ maxWidth: 940 }}>
        <blockquote
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3.4vw, 38px)",
            lineHeight: 1.24,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            fontWeight: 500,
          }}
        >
          &ldquo;What the screen really changes is the front door. It brings people
          to confirmatory testing who would never have come on their own — and the
          haemoglobin estimates track our lab closely.&rdquo;
          “What the screen really changes is the front door. It brings people to confirmatory testing
          who would never have come on their own, and the haemoglobin estimates track our lab closely.”
        </blockquote>
        <div
          className="mono"
          style={{
            marginTop: 24,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-400)",
          }}
        >
          Pathology lead · Anubhav Life Care · Barasat
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA — one line, one link, no button field.                          */
/* ------------------------------------------------------------------ */

export function CTA() {
  return (
    <section
      id="contact"
      style={{
        background: "var(--ink)",
        color: "#fff",
        padding: "88px 0",
      }}
    >
      <div className="container" style={{ maxWidth: 940 }}>
        <div
          className="cta-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 40,
            alignItems: "end",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 32px)",
              lineHeight: 1.26,
              letterSpacing: "-0.02em",
              color: "#fff",
              fontWeight: 500,
              maxWidth: 620,
              margin: 0,
            }}
          >
            We work with clinicians and public-health programmes across West
            Bengal. For methods, data-access, or a conversation —
          </p>
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end" }}>
            <a
              href="mailto:hello@samahealth.in"
              style={{
                fontSize: 18,
                color: "#fff",
                borderBottom: "1px solid rgba(255,255,255,0.5)",
                paddingBottom: 3,
              }}
            >
              hello@samahealth.in
            </a>
          </div>
    <section id="contact" className="section reveal" style={{ background: "var(--ink)", color: "#fff" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <h2 style={{ color: "#fff" }}>Bring screening to your programme</h2>
        <p style={{ marginTop: 20, color: "rgba(255,255,255,0.72)", fontSize: 18, maxWidth: 600 }}>
          We work with clinicians, public-health programmes, and community organisations across
          West Bengal. Send a note. We reply within two working days.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 32 }}>
          <Link href="mailto:hello@samahealth.in" className="btn btn-light">hello@samahealth.in</Link>
          <Link href="/research" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
            See the validation
          </Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .cta-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </section>
  );
}
