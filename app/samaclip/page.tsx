import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { SamaClipFaq } from "./SamaClipFaq";

export const metadata: Metadata = {
  title: "SamaClip. One finger. 120 seconds. A full health screen.",
  description:
    "SamaClip is a battery-free, smartphone-powered fingertip sensor that screens for anaemia, oxygen, diabetes risk, heart rhythm and autonomic vitals in a single 120-second test, for under ₹125 a person. Validated at an NABL-accredited centre in Barasat, West Bengal.",
  keywords: [
    "SamaClip",
    "anaemia screening India",
    "battery-free fingertip sensor",
    "PPG ECG screening",
    "community health screening West Bengal",
    "non-invasive haemoglobin",
    "point-of-care diabetes risk",
    "SamaHealth",
  ],
  openGraph: {
    title: "SamaClip. One finger. 120 seconds. A full health screen.",
    description:
      "A battery-free, smartphone-powered fingertip sensor: anaemia, oxygen, diabetes risk, heart rhythm and autonomic vitals from a single 120-second recording, for under ₹125 a person.",
    url: "/samaclip",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth community screening" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SamaClip. One finger. 120 seconds. A full health screen.",
    description:
      "Battery-free fingertip sensor: anaemia, oxygen, diabetes risk, heart rhythm and autonomic vitals in one 120-second test, under ₹125 a person.",
    images: ["/events/anubhav-cmc-001.jpg"],
  },
  alternates: { canonical: "/samaclip" },
};

const DEMO = "mailto:hello@samahealth.in?subject=SamaClip%20demo%20request";
const PARTNER = "mailto:hello@samahealth.in?subject=Partner%20with%20SamaHealth";

export default function SamaClipPage() {
  return (
    <>
      <Nav variant="hero" />
      <main id="main">
        <Hero />
        <StatStrip />
        <WhatItScreens />
        <TriageSignal />
        <Questions />
        <Impact />
        <Model />
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
        className="sc-hero-grid container"
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
            One finger. 120 seconds. A full health screen.
          </h1>
          <p style={{ marginTop: 26, fontSize: 19, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, maxWidth: 620 }}>
            SamaClip is a battery-free, smartphone-powered sensor that screens for anaemia, oxygen, diabetes risk,
            heart rhythm and autonomic vitals in a single painless test. It is built for women and families across West
            Bengal, where more than half the women we see are anaemic and most have never been screened for heart or
            metabolic risk.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 36, flexWrap: "wrap" }}>
            <Link href={DEMO} className="btn btn-light">Request a demo →</Link>
            <Link href="#screens" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
              See how it works
            </Link>
          </div>
          <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.7)", fontSize: 13.5 }}>
            <ShieldCheck />
            <span>Validated at an NABL-accredited diagnostic centre in Barasat, North 24 Parganas.</span>
          </div>
        </div>

        <DeviceReadout />
      </div>

      <BottomFade />
      <style>{`
        @media (max-width: 940px) {
          .sc-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; padding-bottom: 90px !important; }
        }
      `}</style>
    </section>
  );
}

function DeviceReadout() {
  const tiles = [
    { k: "Hb / Anaemia", v: "10.8", u: "g/dL", chip: "Low", tone: "warn" as const },
    { k: "SpO₂ / Oxygen", v: "98", u: "%", chip: "Normal", tone: "ok" as const },
    { k: "A1c / Diabetes risk", v: "5.9", u: "%", chip: "Watch", tone: "warn" as const },
    { k: "ECG / Rhythm", v: "Sinus", u: "76 bpm", chip: "Stable", tone: "ok" as const },
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
          Fingertip, one recording
        </div>
      </div>

      <div style={{ background: "var(--paper-2)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--ink-100)" }}>
        <WaveTrace />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tiles.map((t) => (
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
                color: t.tone === "ok" ? "var(--ok)" : "var(--warn)",
                background: t.tone === "ok" ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)",
              }}
            >
              ● {t.chip}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaveTrace() {
  return (
    <svg viewBox="0 0 460 120" width="100%" height="100" aria-hidden style={{ marginTop: 8 }}>
      <defs>
        <linearGradient id="sc-ecg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0" />
          <stop offset="18%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="sc-ppg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
          <stop offset="18%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <g stroke="rgba(15,118,110,0.08)" strokeWidth="1">
        {[16, 40, 64, 88, 112].map((y) => (
          <line key={y} x1="0" x2="460" y1={y} y2={y} />
        ))}
      </g>
      <path
        className="ecg-path"
        d="M0 40 Q20 12 40 40 T80 40 T120 40 T160 40 T200 40 T240 40 T280 40 T320 40 T360 40 T400 40 T440 40 L460 40"
        stroke="url(#sc-ppg)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animationDuration: "3s" }}
      />
      <path
        className="ecg-path"
        d="M0 92 L46 92 L54 88 L62 96 L70 64 L78 116 L86 72 L98 92 L168 92 L176 88 L184 96 L192 64 L200 116 L208 72 L220 92 L290 92 L298 88 L306 96 L314 64 L322 116 L330 72 L342 92 L460 92"
        stroke="url(#sc-ecg)"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    { n: "< ₹125", l: "Full screening per person, the cost of a bus ride" },
    { n: "120 sec", l: "One painless finger-clip test, no needle" },
    { n: "No plug", l: "Runs off a phone. No batteries, no charging" },
    { n: "175", l: "Adults screened in our validation study at the centre" },
  ];
  return (
    <section style={{ background: "var(--paper)", borderBottom: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ padding: "8px 28px 56px" }}>
        <div className="sc-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {stats.map((s, i) => (
            <div
              key={s.n}
              className="sc-stat-cell"
              style={{
                padding: "8px 28px",
                borderLeft: i === 0 ? "none" : "1px solid var(--ink-100)",
              }}
            >
              <div className="stat-num" style={{ fontSize: "clamp(34px, 4.2vw, 52px)" }}>{s.n}</div>
              <div style={{ marginTop: 10, fontSize: 14, color: "var(--ink-500)", lineHeight: 1.45, maxWidth: 240 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .sc-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 28px 0 !important; }
          .sc-stat-cell { border-left: none !important; padding: 8px 20px !important; }
          .sc-stat-cell:nth-child(even) { border-left: 1px solid var(--ink-100) !important; }
        }
        @media (max-width: 540px) {
          .sc-stat-grid { grid-template-columns: 1fr !important; }
          .sc-stat-cell, .sc-stat-cell:nth-child(even) { border-left: none !important; border-top: 1px solid var(--ink-100); padding-top: 24px !important; }
          .sc-stat-grid > .sc-stat-cell:first-child { border-top: none; }
        }
      `}</style>
    </section>
  );
}

function WhatItScreens() {
  const params = [
    { icon: <IconDroplet />, title: "Anaemia", body: "Estimates haemoglobin without a blood draw, flagging anaemia early in the women who need it most." },
    { icon: <IconOxygen />, title: "Oxygen (SpO₂)", body: "Reliable oxygen readings that stay accurate across every Indian skin tone, including the darkest." },
    { icon: <IconGlucose />, title: "Diabetes risk", body: "An HbA1c proxy that flags diabetes and pre-diabetes risk, again with no needle and no lab." },
    { icon: <IconRhythm />, title: "Heart rhythm", body: "A single-lead ECG that catches dangerous rhythms like atrial fibrillation, the kind that lead to stroke." },
    { icon: <IconHeart />, title: "Heart rate", body: "Accurate pulse measurement captured alongside every other reading in the same recording." },
    { icon: <IconArtery />, title: "Vascular stiffness", body: "An early signal of cardiovascular strain, derived from the same fingertip waveform." },
  ];
  return (
    <section id="screens" className="section reveal">
      <div className="container">
        <div style={{ maxWidth: 860, margin: "0 auto 56px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <h2>
            Four machines and a lab visit, replaced by a fingertip.
          </h2>
          <p style={{ marginTop: 20, fontSize: 18, color: "var(--ink-500)", maxWidth: 680 }}>
            SamaClip captures everything below from a single 120-second recording. The same work normally needs a pulse
            oximeter, a blood test, an HbA1c analyser and an ECG machine.
          </p>
        </div>

        <div className="grid grid-3">
          {params.map((p) => (
            <div key={p.title} className="card" style={{ padding: 30 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--paper-3)", display: "grid", placeItems: "center", color: "var(--brand)" }}>
                {p.icon}
              </div>
              <h3 style={{ marginTop: 20, fontSize: 21 }}>{p.title}</h3>
              <p style={{ marginTop: 10, color: "var(--ink-500)", fontSize: 15 }}>{p.body}</p>
            </div>
          ))}
        </div>

        <div
          className="sc-autonomic"
          style={{
            marginTop: 24,
            background: "linear-gradient(135deg, #ECFDF5 0%, #F0FBFF 100%)",
            border: "1px solid rgba(15,118,110,0.16)",
            borderRadius: 20,
            padding: 40,
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: 26, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>
              One reading also reveals how the body is regulating itself.
            </h3>
            <p style={{ marginTop: 14, fontSize: 16, color: "var(--ink-500)", maxWidth: 560 }}>
              Because SamaClip captures both a multi-wavelength light pulse (PPG) and a single-lead ECG, one
              120-second reading also yields autonomic vitals, including heart rate variability, a recognised window
              on how the autonomic nervous system is functioning, and respiratory rate. Together these move each
              screen beyond a one-off snapshot toward a picture of how the body is actually regulating itself.
            </p>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {[
              { v: "Heart rate variability" },
              { v: "Respiratory rate" },
              { v: "PPG and ECG together, one finger" },
            ].map((r) => (
              <div key={r.v} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(15,118,110,0.12)" }}>
                <span style={{ fontSize: 14.5, color: "var(--ink-700)", fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: "22px 28px",
            borderRadius: 16,
            background: "var(--ink)",
            color: "#fff",
          }}
        >
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            Clip it on a fingertip, plug into any Android phone, wait 120 seconds. Results at the point of care.
          </span>
        </div>
      </div>
      <style>{`
        @media (max-width: 820px) {
          .sc-autonomic { grid-template-columns: 1fr !important; gap: 28px !important; padding: 28px !important; }
        }
      `}</style>
    </section>
  );
}

function TriageSignal() {
  const signals = [
    { label: "Anaemia", sub: "low haemoglobin" },
    { label: "↑ Heart rate", sub: "raised pulse" },
    { label: "↑ Breathing rate", sub: "raised respiration" },
    { label: "↓ Oxygen", sub: "sometimes lower SpO₂" },
  ];
  return (
    <section id="triage" className="reveal" style={{ background: "var(--ink)", color: "#fff", padding: "120px 0", position: "relative", overflow: "hidden" }}>
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
            An early triage signal for infectious disease.
          </h2>
        </div>

        <div className="sc-triage-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 22 }}>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>
              SamaClip is not a test for tuberculosis or any other infection, and it does not diagnose one. But active
              TB very often shows up as exactly the pattern SamaClip is built to catch: anaemia together with a raised
              heart rate and raised breathing rate, and sometimes lower oxygen. Anaemia alone affects roughly
              two-thirds of people with TB, around 72% in Indian studies.
            </p>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 1.65 }}>
              So a rapid, sub-₹125 multi-parameter screen can act as an early triage signal, quietly flagging people
              whose combination of anaemia and abnormal vitals warrants referral for proper TB diagnostics such as
              sputum testing or chest imaging. In a high-burden, under-screened population, that turns a routine health
              check into a chance to catch infection earlier, and the same logic extends to other conditions that
              present with anaemia and disturbed vitals.
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
            <div style={{ display: "grid", gap: 10 }}>
              {signals.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.22)", borderRadius: 12, padding: "13px 16px" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{s.label}</span>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{s.sub}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", placeItems: "center", padding: "14px 0" }}>
              <DownArrow />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--brand)", borderRadius: 12, padding: "16px 18px" }}>
              <ReferIcon />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Refer for TB diagnostics</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>sputum testing, chest imaging</div>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              A triage and referral signal, never a diagnosis.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .sc-triage-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  );
}

function Questions() {
  return (
    <section id="questions" className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container" style={{ maxWidth: 980 }}>
        <div style={{ maxWidth: 760, margin: "0 auto 48px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <h2>
            The questions, answered plainly.
          </h2>
          <p style={{ marginTop: 20, fontSize: 17, color: "var(--ink-500)", maxWidth: 600 }}>
            From what SamaClip measures to how communities actually reach it. Tap any question to open it.
          </p>
        </div>
        <SamaClipFaq />
      </div>
    </section>
  );
}

function Impact() {
  return (
    <section id="impact" className="section reveal">
      <div className="container">
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <blockquote
            style={{
              margin: 0,
              textAlign: "center",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 4vw, 46px)",
              lineHeight: 1.18,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              fontWeight: 500,
            }}
          >
            More than half the women who come to us for a routine blood test are anaemic. Most never knew.
          </blockquote>
        </div>

        <div className="grid grid-2" style={{ marginTop: 56, maxWidth: 920, marginInline: "auto" }}>
          {[
            { n: "71.4%", l: "of women of reproductive age in West Bengal are anaemic, the highest rate of any Indian state." },
            { n: "700k+", l: "people live within the immediate reach of our hub-and-spoke network." },
          ].map((f) => (
            <div key={f.n} className="card" style={{ padding: 34 }}>
              <div className="stat-num">{f.n}</div>
              <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-500)" }}>{f.l}</p>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 760, margin: "48px auto 0", display: "grid", gap: 20 }}>
          <p style={{ fontSize: 17, color: "var(--ink-500)", lineHeight: 1.7 }}>
            SamaHealth operates in North 24 Parganas, West Bengal, a largely semi-urban, lower-income catchment where
            good diagnostics are expensive, lab-bound and often far away. Standard equipment frequently reads
            inaccurately on darker skin, so even the screening that does happen can fail the people it is meant to serve.
          </p>
          <p style={{ fontSize: 17, color: "var(--ink-500)", lineHeight: 1.7 }}>
            Our NABL-accredited Anubhav centre already sees hundreds of patients a day. By adding SamaClip to routine
            visits and carrying it into community camps, a woman attending for antenatal or routine bloodwork can be
            screened for anaemia, oxygen, diabetes risk and heart rhythm in the same short visit, painlessly, and for
            the cost of a bus ride.
          </p>
          <p style={{ fontSize: 17, color: "var(--ink-700)", lineHeight: 1.7, fontWeight: 500 }}>
            When maternal anaemia and cardiometabolic risk are caught early, newborns and whole families benefit. That
            is the point: shift the curve of disease earlier, for the people most often left behind.
          </p>
        </div>
      </div>
    </section>
  );
}

function Model() {
  const steps = [
    {
      n: "01",
      title: "Screening at the edge.",
      body: "SamaClip brings a full anaemia and NCD screen to a fingertip, at a fraction of the cost and complexity of the machines it replaces. No infrastructure required beyond a phone.",
    },
    {
      n: "02",
      title: "A hub-and-spoke network.",
      body: "One NABL-accredited centre anchors a growing network of community micro-clinics and camps across North 24 Parganas, with free transport to the hub for those who need it most.",
    },
    {
      n: "03",
      title: "Train the trainer.",
      body: "Local operators are trained to run standardised screening themselves and to train the next cohort, so the model grows from inside the community, not above it.",
    },
  ];
  return (
    <section id="model" className="section reveal" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <div style={{ maxWidth: 820, margin: "0 auto 56px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <h2>
            Devices, micro-clinics, and the people who run them.
          </h2>
        </div>

        <div className="grid grid-3">
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ padding: 32, display: "grid", gap: 14 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--brand)", letterSpacing: "0.16em" }}>{s.n}</span>
              <h3 style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>{s.title}</h3>
              <p style={{ color: "var(--ink-500)", fontSize: 15 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: "22px 26px",
            borderRadius: 16,
            border: "1px dashed var(--ink-200)",
            background: "#fff",
          }}
        >
          <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--ink-700)" }}>SamaBand</strong> is the wrist-worn companion for continuous,
            at-home monitoring of patients already flagged by SamaClip. It keeps an eye on people over time. It is not
            a diagnostic screening device, and the accuracy figures above belong to SamaClip alone.
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
          Bring validated screening to your community.
        </h2>
        <p style={{ marginTop: 22, color: "rgba(255,255,255,0.82)", fontSize: 18, maxWidth: 660, margin: "22px auto 0", lineHeight: 1.6 }}>
          Whether you are a health system, a funder, a researcher or a community partner, let&apos;s talk about
          putting a full health screen within reach of the families who need it.
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
      k: "Accuracy attribution",
      v: "All validated diagnostic figures (anaemia ~89% / haemoglobin, SpO₂ across skin tones, the HbA1c diabetes-risk proxy, and atrial fibrillation ~94%) come from the 175-adult validation study at the NABL-accredited Barasat centre. Autonomic vitals (heart rate variability, respiratory rate) are signals the PPG + ECG platform captures; they are presented as capabilities, not as separately validated accuracy claims. SamaBand carries no accuracy claims, follow-up monitoring only.",
    },
    {
      k: "TB figure",
      v: "Anaemia in tuberculosis: the global pooled prevalence is roughly 62% (systematic review/meta-analysis, 41 studies), with Indian studies reporting around 72%. The copy uses the conservative \"roughly two-thirds / ~72% in India\" framing. TB is framed as a triage/referral signal, never as a diagnosis.",
    },
  ];
  return (
    <section className="section-sm" style={{ background: "var(--paper)", borderTop: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ maxWidth: 980 }}>
        <div style={{ display: "grid", gap: 14 }}>
          {notes.map((n) => (
            <div key={n.k} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20, alignItems: "start" }} className="sc-note-row">
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-700)" }}>{n.k}</span>
              <p style={{ fontSize: 13.5, color: "var(--ink-400)", lineHeight: 1.6 }}>{n.v}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .sc-note-row { grid-template-columns: 1fr !important; gap: 6px !important; }
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
function IconDroplet() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z" />
      <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
    </svg>
  );
}
function IconOxygen() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 12h14a3 3 0 1 1-3 3" />
      <path d="M3 16h8" />
    </svg>
  );
}
function IconGlucose() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v5l-4 9a3 3 0 0 0 3 4h6a3 3 0 0 0 3-4l-4-9V3" />
      <path d="M7.5 15h9" />
    </svg>
  );
}
function IconRhythm() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7-4.5-9.5-9A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}
function IconArtery() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v5a5 5 0 0 0 5 5h2a4 4 0 0 1 4 4v2" />
      <path d="M20 4v5a5 5 0 0 1-1.5 3.5" />
      <circle cx="9" cy="9" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function DownArrow() {
  return (
    <svg width="22" height="30" viewBox="0 0 22 30" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2v22" />
      <path d="M4 18l7 8 7-8" />
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
