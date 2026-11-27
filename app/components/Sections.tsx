import Link from "next/link";
import Image from "next/image";
import data from "../events-data.json";
import { Carousel } from "./Carousel";
import { ClosingCta } from "./ClosingCta";

/* ------------------------------------------------------------------ */
/* Research partners — the hospitals, lab and university we work with. */
/* ------------------------------------------------------------------ */

/** The same four the SamaWritten site names as science partners. A crest says nothing alone, so its name sits beside it. */
const PARTNERS: { name: string; src: string; height: number; named?: boolean; href: string }[] = [
  { name: "Medical College Kolkata", src: "/partners/medical-college-kolkata.svg", height: 44, named: true, href: "https://www.medicalcollegekolkata.in/" },
  { name: "NRS Medical College", src: "/partners/nrs-medical-college-kolkata.svg", height: 44, named: true, href: "https://www.nrsmc.edu.in/" },
  { name: "Anubhav Life Care, Kolkata", src: "/partners/anubhav-life-care-kolkata.png", height: 36, href: "https://www.anubhavlifecare.in/" },
  { name: "Brainware University", src: "/partners/brainware-university.svg", height: 44, named: true, href: "https://www.brainwareuniversity.ac.in/" },
];

export function Partners() {
  return (
    <section aria-labelledby="partners-title" style={{ padding: "40px 0 4px" }}>
      <div className="container">
        <h2 id="partners-title" style={{ textAlign: "center", fontSize: 14, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.4, color: "var(--dim)" }}>
          Research partners
        </h2>
        <ul className="partner-row">
          {PARTNERS.map((partner) => (
            <li key={partner.name}>
              <a href={partner.href} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={partner.src} alt={partner.named ? "" : partner.name} loading="lazy" decoding="async" style={{ height: partner.height, width: "auto", maxWidth: "none" }} />
                {partner.named ? <span>{partner.name}</span> : null}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .partner-row { list-style: none; margin: 28px 0 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 24px clamp(28px, 5vw, 64px); }
        .partner-row a { display: flex; align-items: center; gap: 12px; color: var(--dim); transition: color .25s ease; }
        .partner-row a span:not(.sr-only) { white-space: nowrap; font-size: 15px; font-weight: 500; letter-spacing: -0.015em; }
        .partner-row img { filter: grayscale(1); opacity: 0.75; transition: filter .25s ease, opacity .25s ease; }
        .partner-row a:hover, .partner-row a:focus-visible { color: var(--ink); }
        .partner-row a:hover img, .partner-row a:focus-visible img { filter: none; opacity: 1; }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Proof — four figures in a row under the first screen.               */
/* ------------------------------------------------------------------ */

export function Proof() {
  const figures = [
    { value: "175", label: "paired screens in the validation study" },
    { value: "≈ 3,200", label: "patients in the rolling cohort" },
    { value: String(data.events.length), label: "donor camps across North 24 Parganas" },
    { value: "NABL", label: "accredited lab confirms every flag" },
  ];
  return (
    <section aria-label="SamaHealth in figures" style={{ padding: "56px 0 12px" }}>
      <div className="container">
        <ul className="proof-row">
          {figures.map((figure) => (
            <li key={figure.label}>
              <span className="stat">{figure.value}</span>
              <span className="proof-label">{figure.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .proof-row { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
        .proof-row li { padding: 4px 24px; border-left: 1px solid var(--hairline); display: grid; gap: 10px; align-content: start; }
        .proof-row li:first-child { border-left: 0; padding-left: 0; }
        .proof-label { font-size: 15px; line-height: 1.45; color: var(--dim); max-width: 22ch; }
        @media (max-width: 820px) {
          .proof-row { grid-template-columns: 1fr 1fr; gap: 28px 0; }
          .proof-row li:nth-child(odd) { border-left: 0; padding-left: 0; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Statement — the one sentence the page makes.                        */
/* ------------------------------------------------------------------ */

export function Statement() {
  return (
    <section style={{ padding: "72px 0 32px" }}>
      <div className="container">
        <p className="statement reveal" style={{ maxWidth: "58rem", margin: "0 auto", textAlign: "center" }}>
          A single fingertip reading resolves the autonomic state and, through it, a working slice of the
          cardiometabolic panel.{" "}
          <span className="text-dim">
            Every derived signal is checked against a gold-standard instrument in the lab behind the
            screening station.
          </span>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Autonomic vital signs — one tile per derived signal.                */
/* ------------------------------------------------------------------ */

const SIGNALS: { name: string; unit: string; sensor: string; reference: string }[] = [
  { name: "Heart-rate variability", unit: "RMSSD · SDNN · LF/HF", sensor: "PPG at 5 wavelengths", reference: "Clinical ECG on the same clip" },
  { name: "Non-invasive haemoglobin", unit: "g/dL", sensor: "Multi-wavelength absorbance", reference: "Medonic M-32 B haematology analyser" },
  { name: "Oxygen saturation (SpO₂)", unit: "%", sensor: "Red / IR PPG ratio", reference: "Benchtop pulse oximeter" },
  { name: "Respiratory rate", unit: "breaths / min", sensor: "PPG amplitude modulation", reference: "Manual counting, resting" },
  { name: "Pulse transit time", unit: "ms, a BP surrogate", sensor: "ECG to PPG delay", reference: "Cuff sphygmomanometer" },
  { name: "Rhythm, AF flag", unit: "positive / negative", sensor: "Rhythm classifier on ECG", reference: "Clinician-confirmed 12-lead" },
  { name: "Diabetes risk, HbA1c proxy", unit: "%", sensor: "Multi-modal composite", reference: "Mindray CL-900i CLIA" },
];

export function AutonomicSignals() {
  return (
    <section id="signal" aria-labelledby="signal-title" className="section" style={{ paddingTop: 72 }}>
      <div className="container">
        <div className="reveal" style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 id="signal-title" className="headline">Seven signals from one reading.</h2>
          <p className="lede" style={{ maxWidth: 600, margin: "16px auto 0" }}>
            Chronic disease leaves its signature across these channels before it writes itself into a
            blood test.
          </p>
        </div>

        <ul className="signal-grid">
          {SIGNALS.map((signal) => (
            <li key={signal.name} className="tile reveal">
              <h3 className="title">{signal.name}</h3>
              <p className="mono" style={{ marginTop: 6, fontSize: 13 }}>{signal.unit}</p>
              <dl>
                <div>
                  <dt>Read from</dt>
                  <dd>{signal.sensor}</dd>
                </div>
                <div>
                  <dt>Checked against</dt>
                  <dd>{signal.reference}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .signal-grid { list-style: none; margin: 48px 0 0; padding: 0; display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
        .signal-grid li { grid-column: span 3; padding: 28px; display: flex; flex-direction: column; }
        .signal-grid li:nth-child(-n + 3) { grid-column: span 4; }
        .signal-grid dl { margin: auto 0 0; padding-top: 28px; display: grid; gap: 12px; }
        .signal-grid dl > div { border-top: 1px solid #DCDCDC; padding-top: 12px; }
        .signal-grid dt { font-size: 13px; color: var(--dim); }
        .signal-grid dd { margin: 2px 0 0; font-size: 15px; line-height: 1.4; color: var(--ink); }
        @media (max-width: 1000px) {
          .signal-grid li, .signal-grid li:nth-child(-n + 3) { grid-column: span 6; }
          .signal-grid li:last-child { grid-column: span 12; }
        }
        @media (max-width: 620px) {
          .signal-grid li, .signal-grid li:nth-child(-n + 3), .signal-grid li:last-child { grid-column: span 12; padding: 24px; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Disease triage — a black card with the five stages in a row.        */
/* ------------------------------------------------------------------ */

const STAGES: { title: string; detail: string; note: string }[] = [
  { title: "Screen", detail: "About two minutes of fingertip PPG and ECG", note: "Community camp, antenatal visit, clinic front desk" },
  { title: "Flag", detail: "Threshold on the derived autonomic signals", note: "Hb, SpO₂, RR, HRV, AF rhythm, HbA1c proxy" },
  { title: "Confirm", detail: "Gold-standard instrument in the same lab", note: "Haematology, biochemistry, CLIA, 12-lead ECG; sputum AFB, CBNAAT and IGRA for TB" },
  { title: "Treat", detail: "Same-day clinical decision by a physician", note: "Iron or B12, diabetes enrolment, anticoagulation referral, anti-tubercular therapy" },
  { title: "Re-screen", detail: "Scheduled follow-up on the same clip", note: "Closes the loop and picks up non-responders" },
];

export function DiseaseTriage() {
  return (
    <section id="triage" aria-labelledby="triage-title" style={{ padding: "0 10px" }}>
      <div data-tone="dark" className="tile-dark triage-card">
        <div className="reveal" style={{ maxWidth: 760 }}>
          <h2 id="triage-title" className="headline">
            A screen alone is a rumour. The value is in what happens next.
          </h2>
          <p className="lede" style={{ marginTop: 16, maxWidth: 620 }}>
            Every reading falls into a triage that goes through the lab. Nobody is told a number. They are
            told whether they need a real test, and where to get it.
          </p>
        </div>

        <ol className="triage-row">
          {STAGES.map((stage) => (
            <li key={stage.title} className="reveal">
              <span aria-hidden className="triage-dot" />
              <h3 className="title">{stage.title}</h3>
              <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.45, color: "var(--ink)" }}>{stage.detail}</p>
              <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>{stage.note}</p>
            </li>
          ))}
        </ol>

        <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/data" className="btn btn-light">Cohort dashboards</Link>
          <Link href="/research" className="btn btn-ghost">Validation study</Link>
          <Link href="/camps" className="btn btn-ghost">Field camps</Link>
        </div>
      </div>
      <style>{`
        .triage-card { padding: clamp(40px, 6vw, 80px) clamp(24px, 5vw, 72px); }
        .triage-row { list-style: none; margin: 56px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 28px; }
        .triage-row li { position: relative; border-top: 1px solid var(--hairline); padding-top: 24px; }
        .triage-dot { position: absolute; top: -5px; left: 0; width: 9px; height: 9px; border-radius: 999px; background: #2DD4BF; }
        @media (max-width: 1000px) {
          .triage-row { grid-template-columns: 1fr 1fr; gap: 32px 28px; }
        }
        @media (max-width: 560px) {
          .triage-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Home care — one tile: the paragraph and the dock render.            */
/* ------------------------------------------------------------------ */

export function HomeCare() {
  return (
    <section id="homecare" aria-labelledby="homecare-title" className="section">
      <div className="container">
        <div className="tile homecare-tile reveal">
          <div>
            <h2 id="homecare-title" className="headline">After the clinic, care carries on at home.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: 520 }}>
              SamaBeat is our monitoring system for people cared for at home, starting with people on home
              oxygen or CPAP. The band is worn on the wrist by day. At night it sits on the Home Dock, which
              charges it and senses breathing and movement in the room, with no camera and no microphone.
            </p>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.55, maxWidth: 520 }}>
              The system is in clinical validation. It is not cleared or approved by any regulator yet.
            </p>
            <Link href="/homecare" className="text-link" style={{ marginTop: 28 }}>
              The band and the Home Dock
            </Link>
          </div>
          <div className="tile-white homecare-picture">
            <Image
              src="/homecare/dock.webp"
              alt="The SamaBeat Home Dock with the band laid in its cradle"
              width={1600}
              height={1200}
              sizes="(max-width: 900px) 100vw, 520px"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </div>
      <style>{`
        .homecare-tile { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; padding: clamp(24px, 4.5vw, 56px); }
        .homecare-picture { padding: 24px; }
        @media (max-width: 900px) {
          .homecare-tile { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quote.                                                              */
/* ------------------------------------------------------------------ */

export function Quote() {
  return (
    <section style={{ padding: "8px 0 112px" }}>
      <div className="container">
        <figure className="reveal" style={{ margin: "0 auto", maxWidth: "58rem", textAlign: "center" }}>
          <blockquote className="statement" style={{ margin: 0 }}>
            &ldquo;What the screen really changes is the front door. It brings people to confirmatory
            testing who would never have come on their own, and the haemoglobin estimates track our lab
            closely.&rdquo;
          </blockquote>
          <figcaption style={{ marginTop: 24, fontSize: 15, color: "var(--dim)" }}>
            Pathology lead, Anubhav Life Care, Barasat
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Field photos — a row that runs off the page, above the closing.     */
/* ------------------------------------------------------------------ */

/** Photos from the camp gallery, with their real sizes so nothing reflows as they load. */
const FIELD_PHOTOS: { file: string; width: number; height: number }[] = [
  { file: "anubhav-cmc-059.jpg", width: 1600, height: 1200 },
  { file: "anubhav-cmc-010.jpg", width: 1280, height: 751 },
  { file: "anubhav-cmc-145.jpg", width: 1280, height: 874 },
  { file: "anubhav-cmc-115.jpg", width: 1600, height: 1061 },
  { file: "anubhav-cmc-057.jpg", width: 1280, height: 810 },
  { file: "anubhav-cmc-073.jpg", width: 1156, height: 868 },
  { file: "anubhav-cmc-120.jpg", width: 1600, height: 1069 },
  { file: "anubhav-cmc-048.jpg", width: 1156, height: 868 },
  { file: "anubhav-cmc-140.jpg", width: 1280, height: 833 },
  { file: "anubhav-cmc-208.jpg", width: 1600, height: 1075 },
  { file: "anubhav-cmc-092.jpg", width: 1280, height: 960 },
  { file: "anubhav-cmc-176.jpg", width: 1280, height: 862 },
];

export function FieldPhotos() {
  const place = new Map(data.images.map((image) => [image.file, image.location]));
  return (
    <section aria-labelledby="field-title" style={{ padding: "0 0 96px" }}>
      <Carousel
        label="Photos from the screening camps"
        header={
          <>
            <h2 id="field-title" className="headline">
              {data.events.length} camps, one clip on every table.
            </h2>
            <p className="lede" style={{ marginTop: 14, maxWidth: 560 }}>
              Free sugar, anaemia and body-composition screening beside every blood donation across North
              24 Parganas.
            </p>
            <Link href="/camps" className="text-link" style={{ marginTop: 20 }}>
              See every camp
            </Link>
          </>
        }
      >
        {FIELD_PHOTOS.map((photo) => (
          <Image
            key={photo.file}
            src={`/events/${photo.file}`}
            alt={`Screening camp at ${place.get(photo.file) ?? "North 24 Parganas"}, North 24 Parganas`}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 720px) 85vw, 560px"
            className="field-photo"
          />
        ))}
      </Carousel>
      <style>{`
        .field-photo { display: block; width: auto; max-width: 85cqw; height: clamp(240px, 30vw, 400px); object-fit: cover; border-radius: var(--radius-tile); background: var(--tile); }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing banner.                                                     */
/* ------------------------------------------------------------------ */

export function CTA() {
  return (
    <ClosingCta
      title="Bring screening to your clinic or programme."
      lede="We work with clinicians and public-health programmes across West Bengal. Write to us for methods, data access or a conversation."
    />
  );
}
