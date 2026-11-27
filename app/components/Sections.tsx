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
/* The system — the band, the dock, and the one timeline they feed.    */
/* ------------------------------------------------------------------ */

export function System() {
  return (
    <section aria-labelledby="system-title" className="section" style={{ paddingTop: 80 }}>
      <div className="container">
        <div className="reveal" style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2 id="system-title" className="headline">Two parts, one patient timeline.</h2>
          <p className="lede" style={{ maxWidth: 600, margin: "16px auto 0" }}>
            SamaBeat is a continuous care monitoring system in clinical validation.
          </p>
        </div>

        <div className="system-grid">
          <article data-tone="dark" className="tile-dark system-tile reveal">
            <div className="system-picture">
              <Image
                src="/band/optical.webp"
                alt="The back of the SamaBeat band: six LEDs and the photodiodes behind the sensor window, between the wrist electrodes"
                width={1200}
                height={786}
                sizes="(max-width: 900px) 100vw, 640px"
              />
            </div>
            <div className="system-copy">
              <h3 className="title">The SamaBeat band</h3>
              <p style={{ marginTop: 10 }}>
                A wrist sensor with 6 LEDs and co-located ECG and bioimpedance. It carries a clip-on E Ink
                medical ID that anyone can read without a phone in an emergency.
              </p>
            </div>
          </article>

          <article data-tone="dark" className="tile-dark system-tile reveal">
            <div className="system-picture">
              <Image
                src="/band/dock.webp"
                alt="The SamaDock, a low rounded base with a flat window on its room-facing side, with the band resting in its cradle"
                width={1200}
                height={520}
                sizes="(max-width: 900px) 100vw, 520px"
              />
            </div>
            <div className="system-copy">
              <h3 className="title">The SamaDock</h3>
              <p style={{ marginTop: 10 }}>
                Charges the band at night and senses the room remotely, with proprietary Wi-Fi and radar
                sensing. It has no camera and no microphone.
              </p>
            </div>
          </article>

          <article className="tile system-wide reveal">
            <h3 className="title">One patient timeline</h3>
            <p style={{ fontSize: 17, lineHeight: 1.55 }}>
              Wrist readings from the day and room readings from the night go to one timeline for the
              clinician, and each value carries a confidence flag.
            </p>
            <Link href="/homecare" className="text-link">
              How the day works
            </Link>
          </article>
        </div>
      </div>
      <style>{`
        .system-grid { margin-top: 48px; display: grid; grid-template-columns: 7fr 5fr; gap: 16px; }
        .system-tile { display: flex; flex-direction: column; overflow: hidden; }
        .system-picture { flex: 1; min-height: 280px; display: grid; place-items: center; overflow: hidden; }
        .system-picture img { width: 100%; height: 100%; object-fit: cover; }
        .system-tile:nth-child(2) .system-picture img { object-fit: contain; transform: scale(2); }
        .system-copy { padding: 8px 40px 40px; }
        .system-wide { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1.5fr auto; gap: 16px 40px; align-items: center; padding: 36px 40px; }
        @media (max-width: 900px) {
          .system-grid { grid-template-columns: 1fr; }
          .system-copy { padding: 4px 24px 28px; }
          .system-wide { grid-template-columns: 1fr; padding: 28px 24px; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Evidence — where each study stands, on one black card.              */
/* ------------------------------------------------------------------ */

const EVIDENCE: { value: string; title: string; detail: string }[] = [
  {
    value: "182",
    title: "adults, study complete",
    detail: "A precursor band was tested for SpO₂ and haemoglobin across Monk Skin Tone categories 4 to 10, against a NABL-accredited lab.",
  },
  {
    value: "1,200+",
    title: "people in the palm study",
    detail: "Enrolled at Medical College Kolkata. The trial is ongoing.",
  },
  {
    value: "180+",
    title: "people in the band study",
    detail: "Enrolled at Medical College Kolkata. The trial is ongoing.",
  },
  {
    value: "IEC",
    title: "review under way",
    detail: "NRS Medical College is under ethics committee (IEC) review.",
  },
  {
    value: "Pilot",
    title: "in preparation for the dock",
    detail: "The dock is a prototype. Its pilot will run against a chest ECG strap and a finger oximeter.",
  },
];

export function Evidence() {
  return (
    <section id="evidence" aria-labelledby="evidence-title" style={{ padding: "0 10px" }}>
      <div data-tone="dark" className="tile-dark evidence-card">
        <div className="reveal" style={{ maxWidth: 760 }}>
          <h2 id="evidence-title" className="headline">A medical device under testing.</h2>
          <p className="lede" style={{ marginTop: 16, maxWidth: 620 }}>
            Where each study stands today. The system holds no clearance or approval in any country.
          </p>
        </div>

        <ul className="evidence-row">
          {EVIDENCE.map((item) => (
            <li key={item.title} className="reveal">
              <span className="stat">{item.value}</span>
              <h3 style={{ marginTop: 10, fontSize: 16, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.3 }}>{item.title}</h3>
              <p style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5 }}>{item.detail}</p>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/homecare#evidence" className="btn btn-light">The evidence in full</Link>
          <Link href="/camps" className="btn btn-ghost">Field camps</Link>
        </div>
      </div>
      <style>{`
        .evidence-card { padding: clamp(40px, 6vw, 80px) clamp(24px, 5vw, 72px); }
        .evidence-row { list-style: none; margin: 56px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 28px; }
        .evidence-row li { border-top: 1px solid var(--hairline); padding-top: 24px; }
        @media (max-width: 1000px) {
          .evidence-row { grid-template-columns: 1fr 1fr; gap: 32px 28px; }
        }
        @media (max-width: 560px) {
          .evidence-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Who it helps — one statement and the way to the full page.          */
/* ------------------------------------------------------------------ */

export function Helps() {
  return (
    <section aria-labelledby="helps-title" style={{ padding: "104px 0" }}>
      <div className="container">
        <div className="reveal" style={{ maxWidth: "58rem", margin: "0 auto", textAlign: "center" }}>
          <h2 id="helps-title" className="statement">
            For people on home oxygen or CPAP,{" "}
            <span className="text-dim">and for chronic and palliative care at home.</span>
          </h2>
          <Link href="/homecare" className="btn btn-solid" style={{ marginTop: 32 }}>
            More on home care
          </Link>
        </div>
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
              {data.events.length} screening camps in the field.
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
      title="Clinicians and partners"
      lede="If you run a home-care, respiratory or sleep service and want to see the protocol, or to take part in the pilot, write to us."
    />
  );
}
