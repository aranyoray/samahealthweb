import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";

export const metadata: Metadata = {
  title: "ParakhTB. One visit. One finger-clip. A TB triage call.",
  description:
    "ParakhTB pairs a urine strip with the SamaClip finger-clip reader to flag, in about a minute, who at a primary health centre should go on for confirmatory TB testing. A triage-and-referral signal for high-burden, under-screened communities, never a diagnosis.",
  keywords: [
    "TB triage India",
    "tuberculosis screening primary health centre",
    "urinary TB markers",
    "non-invasive TB triage",
    "ParakhTB",
    "SamaClip",
    "pediatric TB triage",
    "TB treatment monitoring",
    "SamaHealth",
  ],
  openGraph: {
    title: "ParakhTB. One visit. One finger-clip. A TB triage call.",
    description:
      "A single-visit triage signal for tuberculosis: a urine strip plus a 60-second finger-clip read decide who needs a confirmatory TB test. Built for primary health centres in high-burden communities.",
    url: "/parakhTB",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ParakhTB. One visit. One finger-clip. A TB triage call.",
    description:
      "A single-visit triage signal for tuberculosis: urine strip plus 60-second finger-clip read decide who needs a confirmatory TB test.",
    images: ["/events/anubhav-cmc-001.jpg"],
  },
  alternates: { canonical: "/parakhTB" },
};

const DEMO = "mailto:hello@samahealth.in?subject=ParakhTB%20demo%20request";
const PARTNER = "mailto:hello@samahealth.in?subject=Partner%20with%20SamaHealth%20on%20TB";

export default function TBPage() {
  return (
    <>
      <Nav variant="hero" />
      <main id="main">
        <Hero />
        <StatStrip />
        <HowItWorks />
        <WhereItFits />
        <UseCases />
        <NeverDiagnosis />
        <CTA />
        <NotesSources />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}

function Hero() {
  return (
    <section className="hero-clinical" style={{ paddingTop: 120 }}>
      <div
        className="tb-hero-grid container"
        style={{
          position: "relative",
          zIndex: 2,
          paddingTop: 72,
          paddingBottom: 110,
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(40px, 5.4vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              textWrap: "balance" as never,
            }}
          >
            Triage TB in a single visit.
          </h1>
          <p style={{ marginTop: 26, fontSize: 19, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, maxWidth: 620 }}>
            ParakhTB pairs a urine strip with the SamaClip finger-clip reader to flag, in about a minute, who at a
            primary health centre should go on for a confirmatory TB test, with no needle, no microscope, and no second
            visit. It does not diagnose tuberculosis. It decides who needs Xpert.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 36, flexWrap: "wrap" }}>
            <Link href={DEMO} className="btn btn-light">Request a demo →</Link>
            <Link href="#how" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
              See how it works
            </Link>
          </div>
          <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.7)", fontSize: 13.5 }}>
            <ShieldCheck />
            <span>Built on the SamaClip optical platform validated at the NABL-accredited centre in Barasat.</span>
          </div>
        </div>

        <TriageReadout />
      </div>

      <BottomFade />
      <style>{`
        @media (max-width: 940px) {
          .tb-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; padding-bottom: 90px !important; }
        }
      `}</style>
    </section>
  );
}

function TriageReadout() {
  const vitals = [
    { k: "Breathing rate", v: "26", u: "/min", chip: "High", tone: "warn" as const },
    { k: "Heart rate", v: "104", u: "bpm", chip: "Raised", tone: "warn" as const },
    { k: "Hb / Anaemia", v: "10.4", u: "g/dL", chip: "Low", tone: "warn" as const },
    { k: "SpO₂ / Oxygen", v: "96", u: "%", chip: "Watch", tone: "warn" as const },
  ];
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 50px 100px -40px rgba(0,0,0,0.45), 0 16px 40px -16px rgba(15,118,110,0.35)",
        border: "1px solid rgba(255,255,255,0.5)",
        padding: 24,
        color: "var(--ink)",
        display: "grid",
        gap: 18,
      }}
    >
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.02em" }}>
          Urine strip and finger-clip
        </div>
      </div>

      <div style={{ background: "var(--paper-2)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--ink-100)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--ink-500)" }}>Urinary TB markers</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, color: "var(--warn)", background: "rgba(217,119,6,0.1)" }}>
            ● Signal present
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 13, color: "var(--ink-500)" }}>Vital-sign pattern</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, color: "var(--warn)", background: "rgba(217,119,6,0.1)" }}>
            ● Disturbed
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {vitals.map((t) => (
          <div key={t.k} style={{ background: "#fff", border: "1px solid var(--ink-100)", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.06em", color: "var(--ink-400)", textTransform: "uppercase", fontWeight: 600 }}>{t.k}</div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1 }}>{t.v}</span>
              <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{t.u}</span>
            </div>
            <span
              style={{
                marginTop: 9,
                display: "inline-block",
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
                color: "var(--warn)",
                background: "rgba(217,119,6,0.1)",
              }}
            >
              ● {t.chip}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--brand)", borderRadius: 14, padding: "14px 16px" }}>
        <ReferIcon />
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff" }}>Refer for Xpert MTB/RIF</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>fused triage call, not a diagnosis</div>
        </div>
      </div>
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
        height: 110,
        background: "linear-gradient(to bottom, transparent, var(--paper) 92%)",
        zIndex: 1,
      }}
    />
  );
}

function StatStrip() {
  const stats = [
    { n: "~1 in 4", l: "of the world's TB is in India, more than any other country" },
    { n: "~60 sec", l: "One finger-clip read, taken alongside the urine strip" },
    { n: "1 visit", l: "Urine and vitals together. No needle, no second trip" },
    { n: "Triage", l: "Decides who needs a confirmatory test, never a diagnosis" },
  ];
  return (
    <section style={{ background: "var(--paper)", borderBottom: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ padding: "8px 28px 56px" }}>
        <div className="tb-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {stats.map((s, i) => (
            <div
              key={s.n}
              className="tb-stat-cell"
              style={{
                padding: "8px 28px",
                borderLeft: i === 0 ? "none" : "1px solid var(--ink-100)",
              }}
            >
              <div className="stat-num" style={{ fontSize: "clamp(30px, 3.8vw, 48px)" }}>{s.n}</div>
              <div style={{ marginTop: 10, fontSize: 14, color: "var(--ink-500)", lineHeight: 1.45, maxWidth: 240 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .tb-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 28px 0 !important; }
          .tb-stat-cell { border-left: none !important; padding: 8px 20px !important; }
          .tb-stat-cell:nth-child(even) { border-left: 1px solid var(--ink-100) !important; }
        }
        @media (max-width: 540px) {
          .tb-stat-grid { grid-template-columns: 1fr !important; }
          .tb-stat-cell, .tb-stat-cell:nth-child(even) { border-left: none !important; border-top: 1px solid var(--ink-100); padding-top: 24px !important; }
          .tb-stat-grid > .tb-stat-cell:first-child { border-top: none; }
        }
      `}</style>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Sample and read, in one sitting.",
      body: "A patient who is symptom-screen positive or contact-traced gives a urine sample and a 60-second finger-clip reading at the same visit. Nothing is sent away. Nothing waits for a second appointment.",
    },
    {
      n: "02",
      title: "What the strip sees, and what the clip sees.",
      body: "The strip reads urinary markers of TB. The same finger-clip reads the vital-sign pattern TB disturbs: breathing rate, heart rate, temperature and haemoglobin. Two independent windows on the same patient.",
    },
    {
      n: "03",
      title: "A single, fused decision.",
      body: "The device combines both into one call: refer for Xpert, monitor, or no further action. The point is not to label the disease. It is to decide, fast, who should move on to a confirmatory test.",
    },
  ];
  return (
    <section id="how" className="section reveal">
      <div className="container">
        <div style={{ maxWidth: 860, margin: "0 auto 56px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <h2>
            A urine strip and a fingertip, working together.
          </h2>
          <p style={{ marginTop: 20, fontSize: 18, color: "var(--ink-500)", maxWidth: 680 }}>
            ParakhTB runs on the same SamaClip optical reader already used for community screening. No extra lab, no
            extra machine. One device, one visit, one decision.
          </p>
        </div>

        <div className="grid grid-3">
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ padding: 32, display: "grid", gap: 14 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--brand)", letterSpacing: "0.16em" }}>{s.n}</span>
              <h3 style={{ fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>{s.title}</h3>
              <p style={{ color: "var(--ink-500)", fontSize: 15 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhereItFits() {
  const cascade = [
    { label: "Symptom screen / contact trace", sub: "who walks in" },
    { label: "ParakhTB triage", sub: "who needs a test", highlight: true },
    { label: "Xpert MTB/RIF · chest imaging", sub: "confirmatory diagnosis" },
  ];
  return (
    <section id="cascade" className="reveal" style={{ background: "var(--ink)", color: "#fff", padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(50% 50% at 15% 30%, rgba(20,184,166,0.16) 0%, transparent 60%), radial-gradient(45% 45% at 90% 80%, rgba(14,165,233,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="container" style={{ position: "relative" }}>
        <div style={{ maxWidth: 820, marginBottom: 48 }}>
          <h2 style={{ color: "#fff" }}>
            We don&apos;t replace Xpert. We decide who needs it.
          </h2>
        </div>

        <div className="tb-cascade-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 22 }}>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>
              Confirmatory TB testing, such as Xpert MTB/RIF and chest imaging, is accurate but scarce, and not everyone
              with a cough needs it. The gap sits between the symptom screen, which over-refers, and the lab, which
              can&apos;t absorb everyone. That gap is where patients fall out of the cascade.
            </p>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>
              ParakhTB fills it. A one-minute, single-visit read narrows the symptom-positive crowd down to the people
              whose urinary markers and disturbed vitals together warrant a confirmatory test, so scarce Xpert capacity
              goes to the patients most likely to need it.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 28,
            }}
          >
            <div style={{ display: "grid", gap: 0 }}>
              {cascade.map((s, i) => (
                <div key={s.label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      background: s.highlight ? "var(--brand)" : "rgba(20,184,166,0.08)",
                      border: s.highlight ? "1px solid var(--brand)" : "1px solid rgba(20,184,166,0.22)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: s.highlight ? 700 : 600, color: "#fff" }}>{s.label}</span>
                    <span style={{ fontSize: 12.5, color: s.highlight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }}>{s.sub}</span>
                  </div>
                  {i < cascade.length - 1 && (
                    <div style={{ display: "grid", placeItems: "center", padding: "8px 0" }}>
                      <DownArrow />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              A triage and referral signal, never a diagnosis.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .tb-cascade-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  );
}

function UseCases() {
  const cases = [
    {
      icon: <IconChild />,
      title: "The children who can't be tested the usual way.",
      body: "Young children rarely produce the sputum that standard TB testing relies on, so they slip through. A non-invasive urine sample plus a finger-clip read is child-friendly and repeatable, used alongside symptom screening to decide which children move on to confirmatory testing.",
    },
    {
      icon: <IconTrend />,
      title: "Catch a patient who isn't responding, sooner.",
      body: "TB treatment runs for months. At every DOTS follow-up, the same one-minute read tracks how a patient's vitals and recovery are trending, so someone who isn't responding is flagged earlier, not at the end of a failed course.",
    },
  ];
  return (
    <section id="usecases" className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <div style={{ maxWidth: 820, margin: "0 auto 48px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <h2>
            Two jobs the cascade does badly today.
          </h2>
        </div>

        <div className="grid grid-2" style={{ maxWidth: 980, marginInline: "auto" }}>
          {cases.map((c) => (
            <div key={c.title} className="card" style={{ padding: 34, display: "grid", gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--paper-3)", display: "grid", placeItems: "center", color: "var(--brand)" }}>
                {c.icon}
              </div>
              <h3 style={{ fontSize: 23, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>{c.title}</h3>
              <p style={{ color: "var(--ink-500)", fontSize: 15.5, lineHeight: 1.6 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NeverDiagnosis() {
  return (
    <section className="section reveal">
      <div className="container" style={{ maxWidth: 920 }}>
        <div
          style={{
            padding: "28px 32px",
            borderRadius: 18,
            border: "1px dashed var(--ink-200)",
            background: "#fff",
          }}
          className="tb-disclaim"
        >
          <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--ink-700)" }}>ParakhTB is a triage-and-referral tool, not a diagnostic.</strong>{" "}
            It does not confirm or rule out tuberculosis. A confirmatory test (Xpert MTB/RIF, culture or chest imaging)
            remains the standard for diagnosis, and ParakhTB exists to get the right patients there faster. Device-level
            TB performance is under validation with our clinical partners.
          </p>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="section reveal" style={{ background: "linear-gradient(135deg, #052E2A 0%, #0F766E 100%)", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div className="container" style={{ position: "relative", maxWidth: 940, textAlign: "center" }}>
        <h2 style={{ color: "#fff" }}>
          Bring single-visit TB triage to your district.
        </h2>
        <p style={{ marginTop: 22, color: "rgba(255,255,255,0.82)", fontSize: 18, maxWidth: 660, margin: "22px auto 0", lineHeight: 1.6 }}>
          Whether you run a TB program, fund one, or study one, let&apos;s talk about putting a fast, non-invasive
          triage step in front of scarce confirmatory testing.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36, justifyContent: "center" }}>
          <Link href={DEMO} className="btn btn-light">Request a demo →</Link>
          <Link href={PARTNER} className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
            Partner with us
          </Link>
        </div>
      </div>
    </section>
  );
}

function NotesSources() {
  const notes = [
    {
      k: "TB burden",
      v: "India carries roughly a quarter of the world's tuberculosis, more than any other country (WHO Global Tuberculosis Report). ParakhTB is built for exactly this setting: high burden, scarce confirmatory testing, and people who fall out of the cascade between a symptom screen and a lab.",
    },
    {
      k: "Triage, not diagnosis",
      v: "ParakhTB produces a triage-and-referral call: refer for confirmatory testing, monitor, or no further action. It does not diagnose tuberculosis. Xpert MTB/RIF, culture and chest imaging remain the diagnostic standard.",
    },
    {
      k: "Platform and validation",
      v: "ParakhTB runs on the SamaClip optical reader validated in an adult cohort (n=175) at the NABL-accredited centre in Barasat, North 24 Parganas. TB-specific performance of the combined urine-and-vitals triage is under validation with our clinical partners and is not yet a published accuracy claim.",
    },
  ];
  return (
    <section className="section-sm" style={{ background: "var(--paper)", borderTop: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ maxWidth: 980 }}>
        <div style={{ display: "grid", gap: 14 }}>
          {notes.map((n) => (
            <div key={n.k} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20, alignItems: "start" }} className="tb-note-row">
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-700)" }}>{n.k}</span>
              <p style={{ fontSize: 13.5, color: "var(--ink-400)", lineHeight: 1.6 }}>{n.v}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .tb-note-row { grid-template-columns: 1fr !important; gap: 6px !important; }
        }
      `}</style>
    </section>
  );
}

function ShieldCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function ReferIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12h12" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
function DownArrow() {
  return (
    <svg width="20" height="22" viewBox="0 0 22 30" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2v22" />
      <path d="M4 18l7 8 7-8" />
    </svg>
  );
}
function IconChild() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.4" />
      <path d="M12 7.4V15" />
      <path d="M6 10h12" />
      <path d="M9 21l3-6 3 6" />
    </svg>
  );
}
function IconTrend() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-5 4 4 8-9" />
      <path d="M16 7h5v5" />
    </svg>
  );
}
