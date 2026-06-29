import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Validation and the lab behind it. SamaHealth",
  description:
    "How SamaClip's non-invasive screening was checked against the gold-standard reference instruments in the NABL-accredited lab at Anubhav Life Care, Barasat (n=175).",
  alternates: { canonical: "/research" },
};

export default function ResearchPage() {
  return (
    <>
      <Nav variant="light" />
      <main id="main">
        <ResearchHero />
        <WhatItScreens />
        <Validation />
        <ReferenceInstruments />
        <HonestClaims />
        <ResearchCTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}

function ResearchHero() {
  return (
    <header className="container" style={{ paddingTop: 128, paddingBottom: 8, maxWidth: 900 }}>
      <h1 style={{ fontSize: "clamp(36px, 5.4vw, 64px)" }}>Checked against a working NABL lab.</h1>
      <p style={{ marginTop: 24, fontSize: 20, lineHeight: 1.55, color: "var(--ink-500)", maxWidth: 720 }}>
        SamaClip is a painless, non-invasive fingertip screen. It is developed alongside{" "}
        <strong style={{ color: "var(--ink)" }}>Anubhav Life Care</strong>, an NABL-accredited diagnostic
        centre in Barasat, North&nbsp;24 Parganas. Every signal it produces is benchmarked against the
        gold-standard instruments that same lab uses for routine diagnostics. A screen is only as honest as
        what you check it against.
      </p>
      <p className="mono" style={{ marginTop: 22, fontSize: 13, color: "var(--ink-400)" }}>
        2/8 Jessore Road, Ganji Mill, Barasat, WB 700124 · validation cohort n = 175 · Oct to Dec 2025
      </p>
    </header>
  );
}

function WhatItScreens() {
  const params = [
    { k: "Haemoglobin and anaemia", v: "Non-invasive haemoglobin estimate for fast anaemia screening, with no needle and no fasting." },
    { k: "SpO₂", v: "Blood-oxygen saturation, validated for consistency across skin tone." },
    { k: "Heart rate and rhythm", v: "Pulse and an atrial-fibrillation flag that prompts a referral, not a diagnosis." },
    { k: "Diabetes risk", v: "An HbA1c-proxy signal that flags who should have a confirmatory blood test." },
  ];
  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container">
        <h2 style={{ maxWidth: 760 }}>What one SamaClip screen reads</h2>
        <p style={{ marginTop: 20, fontSize: 17, color: "var(--ink-500)", maxWidth: 680 }}>
          A single ~2-minute fingertip reading. Each output is a <strong style={{ color: "var(--ink)" }}>screening
          signal, not a diagnosis</strong>. Anything it flags is confirmed in the lab before any treatment decision.
        </p>
        <div className="grid grid-4" style={{ marginTop: 44 }}>
          {params.map((p) => (
            <div key={p.k} className="card" style={{ padding: 26 }}>
              <h3 style={{ fontSize: 18 }}>{p.k}</h3>
              <p style={{ marginTop: 10, fontSize: 14.5, color: "var(--ink-500)" }}>{p.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Validation() {
  const rows = [
    { signal: "Non-invasive haemoglobin", metric: "r = 0.91", reference: "vs Medonic M32 B haematology analyser" },
    { signal: "Anaemia detection", metric: "AUC 0.92", reference: "vs lab haemoglobin threshold" },
    { signal: "SpO₂", metric: "bias −0.31%", reference: "across the Monk Skin Tone scale" },
    { signal: "Diabetes-risk (HbA1c proxy)", metric: "r = 0.87", reference: "vs Mindray biochemistry / CLIA" },
    { signal: "Atrial-fibrillation flag", metric: "AUC 0.94", reference: "vs clinician-confirmed ECG" },
  ];
  return (
    <section id="validation" className="section" style={{ paddingTop: 0, background: "var(--paper-2)" }}>
      <div className="container" style={{ paddingTop: 96 }}>
        <h2 style={{ maxWidth: 760 }}>What the validation showed</h2>
        <p style={{ marginTop: 20, fontSize: 17, color: "var(--ink-500)", maxWidth: 680 }}>
          From the cohort of 175 paired screens run at Anubhav Life Care between October and December 2025,
          with results published in January 2026. All figures below belong to SamaClip and to this study.
        </p>

        <div className="card" style={{ marginTop: 40, padding: 0, overflow: "hidden" }}>
          <div className="vrow vhead">
            <span>Signal</span>
            <span>Agreement</span>
            <span>Reference method</span>
          </div>
          {rows.map((r, i) => (
            <div key={r.signal} className="vrow" style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--ink-100)" : "none" }}>
              <span style={{ fontWeight: 600 }}>{r.signal}</span>
              <span className="mono" style={{ color: "var(--brand)", fontWeight: 600 }}>{r.metric}</span>
              <span style={{ color: "var(--ink-500)" }}>{r.reference}</span>
            </div>
          ))}
        </div>
        <p className="mono" style={{ marginTop: 18, fontSize: 12, color: "var(--ink-400)" }}>
          Cost per non-invasive screen ≈ $1.50. Full write-up available on request.
        </p>
      </div>
      <style>{`
        .vrow { display: grid; grid-template-columns: 1.3fr 0.8fr 1.6fr; gap: 16px; padding: 18px 28px; align-items: center; font-size: 15px; }
        .vhead { background: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-400); border-bottom: 1px solid var(--ink-100); }
        @media (max-width: 720px) {
          .vhead { display: none; }
          .vrow { grid-template-columns: 1fr; gap: 4px; padding: 16px 20px; }
          .vrow > span:nth-child(2) { font-size: 18px; }
        }
      `}</style>
    </section>
  );
}

type Device = {
  role: string;
  maker: string;
  model: string;
  serial?: string;
  img: string;
  note: string;
  key?: boolean;
};

const DEVICES: Device[] = [
  { role: "Haematology analyser", maker: "Medonic", model: "M-Series M32 B", serial: "118008", img: "analyzer-hematology", key: true, note: "Reference haemoglobin and full blood count, the gold standard behind SamaClip's non-invasive Hb and anaemia screening." },
  { role: "Biochemistry analyser (full auto)", maker: "Mindray", model: "BS-240 PRO", serial: "BC7-23001933", img: "analyzer-biochemistry", key: true, note: "Reference plasma glucose and biochemistry, the lab benchmark behind the diabetes-risk signal." },
  { role: "Chemiluminescence immunoassay", maker: "Mindray", model: "CL-900i", serial: "BBI-22002654", img: "analyzer-immunoassay", key: true, note: "Reference HbA1c and hormone/marker assays used to characterise the screened cohort." },
  { role: "Electrolyte analyser", maker: "HDC", model: "HDC-LYTE", serial: "HDCL-3798", img: "analyzer-compact", note: "Serum-electrolyte reference for cohort characterisation." },
  { role: "Semi-auto biochemistry", maker: "ElitechGroup", model: "Microlab 300", serial: "19-43642", img: "analyzer-compact", note: "Secondary biochemistry reference and cross-check." },
  { role: "Nephelometry analyser", maker: "Agappe", model: "Mispa-i2", serial: "21211646169", img: "analyzer-compact", note: "Specific-protein and inflammatory-marker reference (e.g. CRP)." },
  { role: "Coagulation analyser", maker: "Tulip Diagnostics", model: "Hemostar XF 1.0", serial: "H1723S683", img: "analyzer-compact", note: "Haemostasis reference within the diagnostic panel." },
  { role: "ELISA microplate reader", maker: "Benesphera", model: "E-21", serial: "502403025", img: "plate-reader", note: "Immunoassay reads for confirmatory panels." },
  { role: "Refrigerated centrifuge", maker: "Remi", model: "NEYA-2", serial: "21NE-20845", img: "centrifuge", note: "Sample preparation behind every reference assay." },
  { role: "Clinical microscope", maker: "Magnus", model: "CH20i LED", img: "microscope", note: "Manual review and peripheral-smear confirmation." },
];

function ReferenceInstruments() {
  return (
    <section id="lab" className="section">
      <div className="container">
        <h2 style={{ maxWidth: 820 }}>The reference instruments we check against</h2>
        <p style={{ marginTop: 20, fontSize: 17, color: "var(--ink-500)", maxWidth: 720 }}>
          These are the real instruments in the NABL-accredited lab at Anubhav Life Care. SamaClip's
          signals are compared against them. The haematology and biochemistry analysers are the direct
          gold standards behind the haemoglobin and diabetes-risk numbers above.
        </p>

        <div className="grid grid-3" style={{ marginTop: 44 }}>
          {DEVICES.map((d) => (
            <article key={d.model} className="card device-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", background: "linear-gradient(180deg, #F7FAF9 0%, #ECFDF5 100%)", borderBottom: "1px solid var(--ink-100)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/devices/${d.img}.svg`} alt={`${d.maker} ${d.model}, ${d.role}`} width={400} height={300} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <h3 style={{ fontSize: 19 }}>{d.maker} {d.model}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-500)", flex: 1 }}>{d.note}</p>
                {d.serial && <div className="mono" style={{ fontSize: 11, color: "var(--ink-400)" }}>S/N {d.serial}</div>}
              </div>
            </article>
          ))}
        </div>

        <p style={{ marginTop: 28, fontSize: 13, color: "var(--ink-400)", fontStyle: "italic" }}>
          Instrument illustrations are representative; model numbers and serials are from the Anubhav Life
          Care asset register. Photographs of the actual units can replace these at the same paths.
        </p>
      </div>
    </section>
  );
}

function HonestClaims() {
  const points = [
    ["Screening is not diagnosis.", "Every flag SamaClip raises is confirmed by a laboratory test or a clinician before any treatment decision."],
    ["Accuracy figures are SamaClip's, from one study.", "The agreement numbers above belong to SamaClip and the n=175 validation cohort. Nothing else."],
    ["SamaBeat is follow-up only.", "The SamaBeat wristband supports monitoring after a confirmed flag. We make no diagnostic-accuracy claim for it."],
    ["TB is a referral signal.", "Where a tuberculosis pattern shows up, it routes a person to proper testing. It never stands in for a TB diagnosis."],
  ];
  return (
    <section className="section" style={{ background: "var(--ink)", color: "#fff", paddingTop: 96, paddingBottom: 96 }}>
      <div className="container">
        <h2 style={{ color: "#fff", maxWidth: 720 }}>How we keep the claims honest</h2>
        <p style={{ marginTop: 20, fontSize: 17, color: "rgba(255,255,255,0.7)", maxWidth: 680 }}>
          The fastest way to look fake is to overclaim. These are the lines we hold.
        </p>
        <div className="grid grid-2" style={{ marginTop: 40 }}>
          {points.map(([t, b]) => (
            <div key={t} style={{ padding: "24px 0", borderTop: "1px solid rgba(255,255,255,0.14)" }}>
              <h3 style={{ color: "#fff", fontSize: 19 }}>{t}</h3>
              <p style={{ marginTop: 10, color: "rgba(255,255,255,0.72)", fontSize: 15 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchCTA() {
  return (
    <section className="section" style={{ maxWidth: 880 }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <h2>Work with us on the evidence</h2>
        <p style={{ marginTop: 18, fontSize: 18, color: "var(--ink-500)" }}>
          We share methods and data with clinicians and public-health programmes. For the validation
          write-up or a conversation, write to us.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 32 }}>
          <Link href="mailto:hello@samahealth.in" className="btn btn-primary">hello@samahealth.in</Link>
          <Link href="/blog" className="btn btn-ghost">Read the journal</Link>
        </div>
      </div>
    </section>
  );
}
