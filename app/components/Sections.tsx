import Link from "next/link";

export function CredibilityStrip() {
  const items = [
    "Anubhav Life Care. NABL-accredited lab",
    "Barasat · North 24 Parganas, West Bengal",
    "Painless, non-invasive. No needle, no fasting",
    "Screening, not diagnosis",
  ];
  return (
    <section style={{ background: "var(--paper-2)", borderBottom: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ padding: "26px 28px", display: "flex", flexWrap: "wrap", gap: "12px 32px", justifyContent: "center" }}>
        {items.map((t) => (
          <span key={t} style={{ fontSize: 14, color: "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand-2)" }} />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

export function WhatWeScreen() {
  const items = [
    { title: "Anaemia", body: "A non-invasive haemoglobin estimate, the single most common and most overlooked condition among women here." },
    { title: "Blood oxygen (SpO₂)", body: "Oxygen saturation, validated to read consistently across skin tone." },
    { title: "Heart rate & rhythm", body: "Pulse and an atrial-fibrillation flag, a silent, stroke-causing rhythm people can’t feel." },
    { title: "Diabetes risk", body: "An HbA1c-proxy signal that flags who should get a confirmatory blood test." },
  ];
  return (
    <section id="platform" className="section reveal">
      <div className="container">
        <h2 style={{ maxWidth: 760 }}>One painless screen, four signals that matter</h2>
        <p style={{ marginTop: 20, fontSize: 18, color: "var(--ink-500)", maxWidth: 680 }}>
          A roughly two-minute fingertip reading covers the conditions that cause the most harm when they
          go unseen. Each result points to a test, not a conclusion.
        </p>
        <div className="grid grid-4" style={{ marginTop: 48 }}>
          {items.map((it) => (
            <div key={it.title} className="card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 19 }}>{it.title}</h3>
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
          ))}
        </div>
      </div>
    </section>
  );
}

export function Reach() {
  const items = [
    { title: "A trusted hub", body: "An NABL-accredited diagnostic centre anchors the work, so every screening flag has a real lab behind it." },
    { title: "Spokes that travel", body: "Community camps, antenatal visits, and school screening days run by locally trained operators. Care that goes to people instead of waiting for them." },
    { title: "The last mile", body: "Free transport for pregnant and elderly patients closes the gap between a flag and the confirmatory test that follows it." },
  ];
  return (
    <section id="outcomes" className="section reveal">
      <div className="container">
        <h2 style={{ maxWidth: 760 }}>A hub-and-spoke model for ten million people</h2>
        <p style={{ marginTop: 20, fontSize: 18, color: "var(--ink-500)", maxWidth: 680 }}>
          North 24 Parganas is home to roughly ten million people, with a wide gap between where
          diagnostics exist and where people live. The model is built to close it.
        </p>
        <div className="grid grid-3" style={{ marginTop: 48 }}>
          {items.map((it) => (
            <div key={it.title} className="card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 21 }}>{it.title}</h3>
              <p style={{ marginTop: 12, color: "var(--ink-500)", fontSize: 15 }}>{it.body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40 }}>
          <Link href="/camps" className="btn btn-ghost">See the field camps →</Link>
        </div>
      </div>
    </section>
  );
}

export function Quote() {
  return (
    <section className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container" style={{ maxWidth: 920 }}>
        <blockquote
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3.6vw, 38px)",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            fontWeight: 500,
          }}
        >
          “What the screen really changes is the front door. It brings people to confirmatory testing
          who would never have come on their own, and the haemoglobin estimates track our lab closely.”
        </blockquote>
        <div style={{ marginTop: 24, fontSize: 15, color: "var(--ink-500)" }}>
          Pathology lead, Anubhav Life Care · Barasat
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
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
    </section>
  );
}
