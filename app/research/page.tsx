import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Science & Technology — SamaHealth",
  description:
    "Signal physics, on-device ML, clinical validation, and the field studies that test SamaHealth's cardiac screening stack.",
  alternates: { canonical: "/research" },
};

export default function ResearchPage() {
  return (
    <div className="dark-bg">
      <Nav variant="dark" />
      <main>
        <ResearchHero />
        <ProblemAtScale />
        <Translation />
        <Technology />
        <Validation />
        <Papers />
        <Partners />
        <ResearchCTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </div>
  );
}

function ResearchHero() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "180px 0 100px",
        background:
          "radial-gradient(60% 50% at 50% 0%, rgba(20,184,166,0.18) 0%, transparent 70%), radial-gradient(40% 40% at 20% 60%, rgba(14,165,233,0.12) 0%, transparent 60%), #07090E",
      }}
    >
      <BgGrid />
      <div className="container" style={{ position: "relative", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
        <span className="kbd-pill kbd-pill-dark" style={{ borderColor: "rgba(20,184,166,0.4)", color: "var(--brand-2)" }}>
          Science & Technology
        </span>
        <h1
          style={{
            marginTop: 40,
            color: "#F5F7FA",
            fontSize: "clamp(56px, 9vw, 132px)",
            lineHeight: 0.94,
            letterSpacing: "-0.05em",
            fontWeight: 500,
          }}
        >
          Every heartbeat <br />
          <em style={{ fontStyle: "italic", color: "#A7F3D0", fontWeight: 400 }}>is a fingerprint.</em>
        </h1>
        <p style={{ marginTop: 32, color: "rgba(245,247,250,0.7)", fontSize: 19, lineHeight: 1.6, maxWidth: 720, margin: "32px auto 0" }}>
          Cardiac screening in India isn't gated by intent. It's gated by physics, by training,
          by trust. SamaHealth attacks all three — from the sensor to the model to the audit ledger.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 48, justifyContent: "center" }}>
          {["Signal physics", "On-device ML", "Clinical eval", "DPDPA audit", "Field hardware"].map((t) => (
            <span key={t} className="kbd-pill kbd-pill-dark">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BgGrid() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 0%, transparent 80%)",
      }}
    />
  );
}

function ProblemAtScale() {
  return (
    <section className="section reveal">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 64, alignItems: "center" }} className="problem-grid">
          <div>
            <div className="eyebrow">The problem at scale</div>
            <h2 style={{ marginTop: 22 }}>
              The detection gap is the largest <em style={{ fontStyle: "italic", color: "var(--brand-2)" }}>in primary care, period.</em>
            </h2>
            <p style={{ marginTop: 22, color: "rgba(245,247,250,0.65)", fontSize: 17, lineHeight: 1.65, maxWidth: 520 }}>
              India has the workers — over a million ASHAs — and the political will. What's missing
              is a tool that respects the field: sunlight, noise, low literacy, and a worker who
              has 240 visits a month and no time for a 10-step UI.
            </p>
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            {[
              { n: "1.7M", l: "Indians die from CVD each year" },
              { n: "11×", l: "rural-vs-urban cardiologist gap" },
              { n: "21%", l: "of strokes are preventable AFib" },
              { n: "< 1%", l: "of ASHAs have screening tools" },
            ].map((s) => (
              <div key={s.l} className="card-dark">
                <div className="stat-num" style={{ color: "var(--brand-2)" }}>{s.n}</div>
                <div style={{ color: "rgba(245,247,250,0.55)", fontSize: 14, marginTop: 14 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 980px) { .problem-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>
    </section>
  );
}

function Translation() {
  return (
    <section
      className="section reveal"
      style={{
        background: "linear-gradient(180deg, #07090E 0%, #0A1015 100%)",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container trans-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 80, alignItems: "center" }}>
        <div>
          <div className="eyebrow">Translation</div>
          <h2 style={{ marginTop: 22 }}>
            From a beating heart <br />
            <em style={{ fontStyle: "italic", color: "var(--brand-2)" }}>to digital information.</em>
          </h2>
          <p style={{ marginTop: 22, fontSize: 17, color: "rgba(245,247,250,0.65)", lineHeight: 1.65, maxWidth: 520 }}>
            SamaBeat captures three signals at the chest — phonocardiogram, single-lead ECG,
            accelerometer — and fuses them in 800 milliseconds. The model doesn't see a strip.
            It sees a 12-dimensional time-series of cardiac state.
          </p>
          <div style={{ marginTop: 36, display: "grid", gap: 14 }}>
            {[
              { k: "PCG", v: "Heart sound · S1/S2 · murmurs" },
              { k: "ECG", v: "Single-lead · rhythm · rate · QRS morphology" },
              { k: "ACC", v: "Contact pressure · respiration · posture" },
            ].map((r) => (
              <div key={r.k} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--brand-2)", letterSpacing: "0.18em" }}>{r.k}</span>
                <span style={{ color: "rgba(245,247,250,0.85)", fontSize: 15 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <Visualization />
      </div>
      <style>{`@media (max-width: 980px) { .trans-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>
    </section>
  );
}

function Visualization() {
  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1", maxWidth: 480, margin: "0 auto" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.35) 0%, rgba(20,184,166,0) 65%)",
          filter: "blur(20px)",
        }}
      />
      <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ position: "relative" }}>
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#0F766E" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="180" fill="url(#rg)" />
        {[60, 100, 140, 180].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="rgba(20,184,166,0.16)" strokeWidth="1" />
        ))}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 200 + Math.cos(a) * 60;
          const y1 = 200 + Math.sin(a) * 60;
          const x2 = 200 + Math.cos(a) * 180;
          const y2 = 200 + Math.sin(a) * 180;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(20,184,166,0.1)" strokeWidth="1" />;
        })}
        <path
          d="M40 200 L80 200 L88 188 L96 212 L104 160 L112 244 L120 172 L140 200 L200 200 L208 188 L216 212 L224 160 L232 244 L240 172 L260 200 L360 200"
          stroke="url(#lg2)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ecg-path"
        />
        <text x="200" y="208" textAnchor="middle" fill="#F5F7FA" fontFamily="var(--font-display)" fontSize="26" fontWeight="500" letterSpacing="-0.02em">
          SamaBeat
        </text>
        <text x="200" y="232" textAnchor="middle" fill="rgba(245,247,250,0.5)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.2em">
          v1 · 12-D FUSION
        </text>
      </svg>
    </div>
  );
}

function Technology() {
  const pillars = [
    {
      n: "01",
      title: "Hardware",
      tag: "SamaBeat",
      body: "PCG + ECG + accelerometer in one ECDH-paired puck. Designed in-house with an ISO 13485 contract manufacturer in Bengaluru.",
      bullets: ["BLE 5.2 ECDH handshake", "48-hour battery", "IP54 sealed"],
    },
    {
      n: "02",
      title: "Signal",
      tag: "Wavelet denoise + SQI",
      body: "Tropical-clinic noise floors are ugly. Adaptive wavelet denoising + signal-quality gates reject unusable clips before inference.",
      bullets: ["35 dB(A) ambient budget", "Cycle alignment", "Pre-inference reject"],
    },
    {
      n: "03",
      title: "Model",
      tag: "On-device TFLite",
      body: "Quantized rhythm + abnormality models. Sub-800 ms inference on a sub-₹10k Android. Ships only after 78 clinical paths pass.",
      bullets: ["INT8 quantization", "Rhythm + AFib + flutter", "Voice-flow Hindi/Tamil/Bengali/Marathi"],
    },
    {
      n: "04",
      title: "Evaluation",
      tag: "Pre-registered with CTRI",
      body: "Retrospective (n>5k) + prospective (n>400) + adversarial-rural gates. A drop in any gate triggers automatic block.",
      bullets: ["Three CTRI-registered studies", "Stop-rules public", "No endpoint retrofitting"],
    },
    {
      n: "05",
      title: "Trust",
      tag: "DPDPA · asia-south1",
      body: "Tink AEAD per-field via Android Keystore. Append-only audit on every PHI touch. Mumbai-only residency.",
      bullets: ["Field-level encryption", "PHI scrubber on crashes", "Reason-gated reveals"],
    },
  ];
  return (
    <section id="tech" className="reveal" style={{ padding: "120px 0" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 880, margin: "0 auto 80px" }}>
          <div className="eyebrow">Our technology</div>
          <h2 style={{ marginTop: 22 }}>
            Five layers. <em style={{ fontStyle: "italic", color: "var(--brand-2)" }}>One screening event.</em>
          </h2>
          <p style={{ marginTop: 22, fontSize: 18, color: "rgba(245,247,250,0.65)" }}>
            Every layer is owned by SamaHealth. Vendor lock-in is a clinical-safety risk we won't take.
          </p>
        </div>

        <div style={{ display: "grid", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, overflow: "hidden" }}>
          {pillars.map((p) => (
            <article
              key={p.n}
              className="tech-row"
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1.4fr 1fr",
                gap: 32,
                padding: "40px 40px",
                background: "#0A0D13",
                alignItems: "start",
              }}
            >
              <div className="mono" style={{ fontSize: 13, letterSpacing: "0.18em", color: "var(--brand-2)" }}>{p.n}</div>
              <div>
                <h3 style={{ fontSize: 32, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>{p.title}</h3>
                <div className="mono" style={{ marginTop: 6, fontSize: 11, color: "rgba(245,247,250,0.45)", letterSpacing: "0.16em", textTransform: "uppercase" }}>{p.tag}</div>
                <p style={{ marginTop: 16, fontSize: 16, color: "rgba(245,247,250,0.7)", maxWidth: 540 }}>{p.body}</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {p.bullets.map((b) => (
                  <li key={b} style={{ fontSize: 14, color: "rgba(245,247,250,0.7)", display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-2)", marginTop: 8 }} />
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 980px) {
          .tech-row { grid-template-columns: 1fr !important; gap: 16px !important; padding: 32px 24px !important; }
        }
      `}</style>
    </section>
  );
}

function Validation() {
  const sites = [
    {
      tag: "Prospective · Bihar",
      site: "Sadar District Hospital, Begusarai",
      n: "n = 412",
      findings: [
        "AFib sensitivity 91.4% vs 12-lead reference",
        "Specificity 96.1%",
        "Median screening time 3.4 min",
      ],
    },
    {
      tag: "Retrospective · Karnataka",
      site: "St. John's, Bengaluru",
      n: "n = 5,127",
      findings: [
        "India-only ECG corpus",
        "F1 on AFib 0.89, on flutter 0.84",
        "False-positive rate halved vs baseline",
      ],
    },
    {
      tag: "Adversarial · Tamil Nadu",
      site: "GovMC + Sama labs",
      n: "n = 96",
      findings: [
        "Wet skin · fan noise · crying infant overlay",
        "SQI gate caught 87% of unusable clips",
        "Pre-inference, before model sees signal",
      ],
    },
  ];
  return (
    <section id="validation" className="section reveal" style={{ background: "#07090E" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 880, margin: "0 auto 64px" }}>
          <div className="eyebrow">Clinical validation</div>
          <h2 style={{ marginTop: 22 }}>
            Validated where it has to be used. <br />
            <em style={{ fontStyle: "italic", color: "var(--brand-2)" }}>Not where it's easy.</em>
          </h2>
        </div>

        <div className="grid grid-3">
          {sites.map((s) => (
            <article key={s.site} className="card-dark" style={{ padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--brand-2)", letterSpacing: "0.16em" }}>{s.tag}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(245,247,250,0.85)" }}>{s.n}</span>
              </div>
              <h3 style={{ marginTop: 20, fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 500 }}>{s.site}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 12 }}>
                {s.findings.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "rgba(245,247,250,0.7)", display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-2)", marginTop: 8 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            padding: "24px 28px",
            borderRadius: 16,
            border: "1px dashed rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.02)",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 20,
            alignItems: "center",
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "var(--brand-2)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Pre-registration
          </span>
          <p style={{ color: "rgba(245,247,250,0.7)", fontSize: 14 }}>
            All three studies are pre-registered with CTRI. Protocols, primary endpoints, and stop-rules
            are public before enrollment. We will not retrofit endpoints.
          </p>
        </div>
      </div>
    </section>
  );
}

function Papers() {
  const papers = [
    {
      title: "An ASHA-tier multimodal cardiac screening front-end: results from a Bihar pilot",
      venue: "Preprint · medRxiv · 2026",
      authors: "Kumar R., Mohan R., Iyer S. et al.",
    },
    {
      title: "Adversarial-rural evaluation of on-device AFib detectors in India",
      venue: "Submitted · npj Digital Medicine · 2026",
      authors: "Iyer S., Kumar R., Aravindan P.",
    },
    {
      title: "DPDPA-aligned audit ledgers for PHI in primary-care apps",
      venue: "Workshop · ML4H @ NeurIPS · 2025",
      authors: "Kumar R., Sharma A.",
    },
  ];

  return (
    <section id="papers" className="section reveal">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "end", marginBottom: 56 }} className="papers-head">
          <div>
            <div className="eyebrow">Most reviewed</div>
            <h2 style={{ marginTop: 22 }}>
              Publications from <em style={{ fontStyle: "italic", color: "var(--brand-2)" }}>SamaHealth.</em>
            </h2>
          </div>
          <p style={{ fontSize: 17, color: "rgba(245,247,250,0.7)", maxWidth: 520, justifySelf: "end" }}>
            We publish before we ship. Models, eval suites, and audit-ledger code are open-sourced
            within 90 days of paper acceptance.
          </p>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {papers.map((p) => (
            <Link
              key={p.title}
              href="#"
              className="card-dark"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: 24,
                padding: "26px 28px",
              }}
            >
              <div>
                <div className="mono" style={{ fontSize: 11, color: "var(--brand-2)", letterSpacing: "0.16em" }}>{p.venue}</div>
                <div style={{ fontWeight: 500, fontSize: 22, marginTop: 8, fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "rgba(245,247,250,0.55)", marginTop: 6 }}>{p.authors}</div>
              </div>
              <span style={{ color: "var(--brand-2)", fontWeight: 600, fontSize: 14 }}>Read →</span>
            </Link>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 820px) { .papers-head { grid-template-columns: 1fr !important; gap: 16px !important; } .papers-head > p { justify-self: start !important; } }`}</style>
    </section>
  );
}

function Partners() {
  const partners = ["AIIMS Patna", "St. John's Bangalore", "Sadar District Hospital", "NHSRC", "C-CAMP", "IISc", "CTRI", "ICMR"];
  return (
    <section id="partners" className="section reveal" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 56px" }}>
          <div className="eyebrow">Research partners</div>
          <h2 style={{ marginTop: 22 }}>
            Built with the <em style={{ fontStyle: "italic", color: "var(--brand-2)" }}>people who use it.</em>
          </h2>
        </div>
        <div className="grid grid-4" style={{ gap: 12 }}>
          {partners.map((p) => (
            <div
              key={p}
              className="card-dark"
              style={{
                padding: "32px 20px",
                textAlign: "center",
                fontWeight: 500,
                fontSize: 15,
                color: "rgba(245,247,250,0.85)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.01em",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchCTA() {
  return (
    <section className="section reveal" style={{ background: "linear-gradient(135deg, #052E2A 0%, #0F766E 100%)" }}>
      <div className="container" style={{ maxWidth: 880, textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>Collaborate</div>
        <h2 style={{ marginTop: 18, color: "#fff" }}>
          We work openly with clinicians, public-health programs, and <em style={{ fontStyle: "italic", color: "#A7F3D0" }}>academic groups.</em>
        </h2>
        <p style={{ marginTop: 22, color: "rgba(255,255,255,0.78)", fontSize: 18, maxWidth: 620, margin: "22px auto 0" }}>
          Datasets, eval harnesses, co-authorship, or a coffee in Bengaluru. Send a note.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36, justifyContent: "center" }}>
          <Link href="mailto:research@samahealth.in" className="btn btn-light">research@samahealth.in →</Link>
          <Link href="/#contact" className="btn" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.45)" }}>
            Back to product
          </Link>
        </div>
      </div>
    </section>
  );
}
