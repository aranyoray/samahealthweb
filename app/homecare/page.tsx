import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { ClosingCta } from "../components/ClosingCta";
import { jsonLdScript } from "../lib/jsonld";

// /homecare: the SamaBeat band and the SamaDock for people cared for at home, laid
// out as on samawritten.com/homecare. Nothing here is cleared, approved or a
// performance claim. The only completed study is the precursor band's, and its
// figures are attributed to the precursor.

const SITE = "https://samahealth.in";
const TITLE = "Home care. The SamaBeat band and SamaDock, a medical device system in clinical validation";
const DESCRIPTION =
  "A medical device system in clinical validation for people cared for at home, starting with people on home oxygen or CPAP. The SamaBeat band is worn on the wrist by day, and the SamaDock senses breathing and movement in the room at night with no camera and no microphone. Not cleared or approved.";
const OG_ALT = "The SamaDock on a bedside table with the SamaBeat band in its cradle";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "home care monitoring India",
    "home oxygen monitoring",
    "CPAP follow-up at home",
    "contactless breathing rate monitor",
    "radar sleep monitoring",
    "chronic and palliative care at home",
    "SamaBeat",
    "SamaHealth",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/homecare",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/homecare/og.jpg", width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "The SamaBeat band by day and the SamaDock at night, for people cared for at home. A medical device system in clinical validation. Not cleared or approved.",
    images: ["/homecare/og.jpg"],
  },
  alternates: { canonical: "/homecare" },
};

const PILOT = "mailto:hello@samahealth.in?subject=Home-care%20collaboration";

const pageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE}/homecare#webpage`,
      url: `${SITE}/homecare`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE}/homecare#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Home care", item: `${SITE}/homecare` },
      ],
    },
  ],
};

export default function HomeCarePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(pageJsonLd) }}
      />
      <Nav />
      <main id="main" className="hc">
        <Hero />
        <Day />
        <Senses />
        <Limits />
        <Helps />
        <Privacy />
        <Evidence />
        <Partners />
      </main>
      <Footer />
      <RevealOnScroll />
      <style>{`
        .hc .hc-head { max-width: 760px; margin: 0 auto; text-align: center; }
        .hc .hc-tiles { list-style: none; margin: 48px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .hc .hc-tiles li { padding: 32px; }
        .hc .hc-tiles p { margin-top: 12px; }
        .hc .hc-rows { list-style: none; margin: 48px 0 0; padding: 0 40px; }
        .hc .hc-rows li { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 40px; padding: 36px 0; border-top: 1px solid var(--hairline); }
        .hc .hc-rows li:first-child { border-top: 0; }
        .hc .hc-rows .hc-status { color: var(--ink); }
        .hc .hc-split { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: stretch; }
        .hc .hc-list { list-style: none; margin: 32px 0 0; padding: 0; border-top: 1px solid var(--hairline); }
        .hc .hc-list li { padding: 20px 0; border-bottom: 1px solid var(--hairline); font-size: 17px; line-height: 1.6; color: var(--dim); }
        .hc .hc-list strong, .hc .hc-list h3 { color: var(--ink); font-weight: 500; }
        .hc .hc-list h3 { font-size: 20px; line-height: 1.3; letter-spacing: -0.02em; }
        .hc .hc-list li > p { margin-top: 8px; font-size: 16px; }
        .hc .hc-phases { display: grid; grid-template-columns: 5fr 7fr; gap: 32px 64px; }
        .hc .hc-phases .hc-list { margin-top: 0; }
        .hc .hc-privacy { list-style: none; margin: 48px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .hc .hc-privacy li { padding: 40px; }
        .hc .hc-privacy p { margin-top: 12px; }
        .hc .hc-table { width: 100%; border-collapse: collapse; margin-top: 48px; text-align: left; }
        .hc .hc-table thead th { padding: 16px 32px 16px 0; font-size: 13.5px; font-weight: 500; color: var(--dim); border-bottom: 1px solid var(--hairline); }
        .hc .hc-table tbody th, .hc .hc-table td { padding: 24px 32px 24px 0; vertical-align: top; font-size: 15px; line-height: 1.6; border-bottom: 1px solid var(--hairline); }
        .hc .hc-table tbody th { width: 24%; font-size: 16px; font-weight: 500; letter-spacing: -0.015em; line-height: 1.35; color: var(--ink); }
        .hc .hc-table td { color: var(--dim); }
        .hc .hc-table td:last-child { color: var(--ink); padding-right: 0; }
        @media (max-width: 900px) {
          .hc .hc-tiles, .hc .hc-privacy, .hc .hc-split, .hc .hc-phases { grid-template-columns: 1fr; }
          .hc .hc-rows { padding: 0 24px; }
          .hc .hc-rows li { grid-template-columns: 1fr; padding: 28px 0; }
          .hc .hc-tiles li, .hc .hc-privacy li { padding: 24px; }
        }
        @media (max-width: 760px) {
          .hc .hc-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
          .hc .hc-table, .hc .hc-table tbody, .hc .hc-table tr, .hc .hc-table tbody th, .hc .hc-table td { display: block; width: 100%; }
          .hc .hc-table tr { padding: 20px 0; border-bottom: 1px solid var(--hairline); }
          .hc .hc-table tbody th, .hc .hc-table td { padding: 0; border: 0; }
          .hc .hc-table td { margin-top: 10px; }
          .hc .hc-table td::before { content: attr(data-label); display: block; font-size: 13px; font-weight: 500; color: var(--ink); }
        }
      `}</style>
    </>
  );
}

function Hero() {
  return (
    <section aria-labelledby="page-title" data-tone="dark" className="hero-card" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "60px 24px 0", textAlign: "center" }}>
        <h1 id="page-title" className="display" style={{ maxWidth: "60rem", margin: "0 auto" }}>
          Home care, on the wrist and in the room
        </h1>
        <p className="lede" style={{ maxWidth: "40rem", margin: "20px auto 0" }}>
          A medical device system in clinical validation for home care: the SamaBeat band, and the SamaDock
          that ships with it. It is not cleared or approved by any regulator yet, and it does not call
          emergency services.
        </p>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <Link href="#partners" className="btn btn-light">Partner with us</Link>
          <Link href="#evidence" className="btn btn-ghost">See the evidence</Link>
        </div>
      </div>
      <Image
        src="/band/dock.webp"
        alt="The SamaDock, a low rounded base with a flat window on its room-facing side, with the SamaBeat band resting in its cradle"
        width={1200}
        height={520}
        priority
        sizes="100vw"
        style={{ width: "min(1100px, 150%)", maxWidth: "none", height: "auto", alignSelf: "center", margin: "8px 0 24px" }}
      />
    </section>
  );
}

const DAY = [
  {
    title: "Outside, the band on the wrist",
    body: "A screenless sensing core with multi-wavelength optics, ECG and bioimpedance, the clip-on E Ink medical ID, and check-ins over cellular where there is no phone.",
  },
  {
    title: "At home, the band on the dock",
    body: "Set the band in the cradle. The dock charges and syncs it, reads which band it is so the night belongs to that person, and starts a sensing session. A small light shows sensing is on. The band itself does not sense while docked.",
  },
  {
    title: "One patient timeline",
    body: "Wrist readings from the day and room readings from the night land on one timeline for the clinician to review, with a confidence flag on each value.",
  },
];

function Day() {
  return (
    <section aria-labelledby="day-title" className="section">
      <div className="container">
        <h2 id="day-title" className="headline hc-head reveal">
          <span style={{ display: "block" }}>The band has to charge anyway.</span>
          <span style={{ display: "block", color: "var(--dim)" }}>The dock makes that moment useful.</span>
        </h2>
        <ul className="hc-tiles">
          {DAY.map((item) => (
            <li key={item.title} className="tile reveal">
              <h3 className="title">{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const MEASURES = [
  {
    name: "Presence, movement and restlessness",
    how: "From Wi-Fi channel data heard from the home router. Listening to a router gives a coarser signal than a dedicated sender, so this is a presence and movement feature only.",
    status: "Being validated in a pilot: empty-room and nuisance tests first, then nights alongside a chest ECG strap and a finger oximeter.",
  },
  {
    name: "Breathing rate",
    how: "From a 60 GHz radar behind the flat window on the room-facing side, which reads chest-wall motion without touching the sleeper.",
    status: "Being validated in a pilot against a chest ECG strap and a finger oximeter, with targets set in advance.",
  },
  {
    name: "Overnight heart rate variability trend",
    how: "From the same radar, from the much smaller chest-wall motion of the heartbeat. The output is an overnight RMSSD trend with the percent of valid time.",
    status: "Validation planned. If radar HRV does not hold up, the fallback is a thin under-mattress strip cabled to the dock.",
  },
];

function Senses() {
  return (
    <section id="senses" aria-labelledby="senses-title" className="section on-soft" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <div className="hc-head reveal">
          <h2 id="senses-title" className="headline">What the dock senses</h2>
          <p className="lede" style={{ maxWidth: 640, margin: "16px auto 0" }}>
            Two sensors, no camera, no microphone. Every output carries a confidence flag and the share of the
            night it was valid, so a reviewer knows how far to trust it.
          </p>
        </div>
        <ul className="tile hc-rows reveal">
          {MEASURES.map((measure) => (
            <li key={measure.name}>
              <h3 className="title">{measure.name}</h3>
              <p>{measure.how}</p>
              <p className="hc-status">{measure.status}</p>
            </li>
          ))}
          <li>
            <h3 className="title">Inside the dock</h3>
            <p style={{ gridColumn: "span 2" }}>
              One radio module, an external antenna along the back edge away from the charging contacts, the
              radar behind the front window, a USB-C power inlet and a physical privacy switch.
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}

const LIMITS = [
  { lead: "No heart rate from Wi-Fi.", rest: "Wi-Fi channel data is used for presence and movement only." },
  { lead: "No apnea diagnosis.", rest: "Breathing and heart rate variability trends are for a clinician to review. They are not a diagnosis." },
  {
    lead: "No haemoglobin, dementia or cancer side-effect detection from the room signal.",
    rest: "The room signal is presence, movement, breathing and a heart rate variability trend, nothing more.",
  },
  { lead: "One sleeper per dock.", rest: "Two people in one bed is a later research question." },
  { lead: "No emergency calls.", rest: "The system does not call emergency services." },
];

function Limits() {
  return (
    <section id="limits" aria-labelledby="limits-title" className="section">
      <div className="container">
        <div className="hc-split">
          <div className="reveal">
            <h2 id="limits-title" className="headline">What it does not do</h2>
            <ul className="hc-list">
              {LIMITS.map((limit) => (
                <li key={limit.lead}>
                  <strong>{limit.lead}</strong> {limit.rest}
                </li>
              ))}
            </ul>
          </div>

          <div data-tone="dark" className="tile-dark reveal" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, minHeight: 260, overflow: "hidden" }}>
              <Image
                src="/band/optical.webp"
                alt="A close view of the back of the band: the optical array of LEDs and photodiodes behind its sensor window, between the wrist electrodes"
                width={1200}
                height={786}
                sizes="(max-width: 900px) 100vw, 560px"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ padding: "32px 40px 40px" }}>
              <h3 className="title">Haemoglobin and SpO₂ come from the band&rsquo;s optics, not from the room.</h3>
              <p style={{ marginTop: 12 }}>
                That work rests on a precursor band, tested for SpO₂ and haemoglobin in 182 adults across Monk
                Skin Tone categories 4 to 10 against a NABL-accredited lab. Those results describe the
                precursor only.
              </p>
              <Link href="#evidence" className="text-link" style={{ marginTop: 28 }}>
                Where each study stands
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PHASES = [
  {
    title: "Respiratory and sleep care first",
    body: "People on home oxygen or CPAP, and people whose breathing at night matters to the clinic. The dock gives the care team an overnight breathing and restlessness trend to review beside the wrist readings.",
  },
  {
    title: "Then chronic and palliative care at home",
    body: "People who are home for long stretches. The band outside, the dock at night, one timeline for the care team and the family.",
  },
  {
    title: "Later phases",
    body: "Dementia and cancer side-effect care are later phases. What the room signal could offer them is a research question we have not answered, not a feature.",
  },
];

function Helps() {
  return (
    <section id="who" aria-labelledby="helps-title" className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="hc-phases">
          <h2 id="helps-title" className="headline reveal">Who it helps</h2>
          <ul className="hc-list reveal">
            {PHASES.map((phase) => (
              <li key={phase.title}>
                <h3>{phase.title}</h3>
                <p>{phase.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const PRIVACY = [
  { title: "No camera, no microphone.", body: "The dock has neither, by design." },
  {
    title: "Only derived values leave the home.",
    body: "Presence, movement, breathing rate, the heart rate variability trend and their confidence flags. Raw channel and radar data stays on the dock, except on consented pilot nights with notice to everyone in the home.",
  },
  {
    title: "Consent for every person in the home.",
    body: "Guests and guardians included, under India's Digital Personal Data Protection Act.",
  },
  {
    title: "A physical privacy switch.",
    body: "On the back of the dock, with the small sensing-on light on the front so anyone in the room can see the state.",
  },
];

function Privacy() {
  return (
    <section id="privacy" aria-labelledby="privacy-title" className="section on-soft" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <h2 id="privacy-title" className="headline hc-head reveal">Privacy</h2>
        <ul className="hc-privacy">
          {PRIVACY.map((item) => (
            <li key={item.title} className="tile reveal">
              <h3 className="title">{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const EVIDENCE: [string, string, string, string][] = [
  [
    "SpO₂ and haemoglobin optics (band)",
    "NABL-accredited reference lab",
    "182 adults on a precursor band, Monk Skin Tone 4 to 10",
    "Study complete. Results describe the precursor only.",
  ],
  [
    "Presence, movement and restlessness (dock)",
    "Empty-room and nuisance tests: fan, air conditioner, curtain, pet, a person in the next room",
    "3 rooms, 7 nights each",
    "Planned, before the volunteer nights",
  ],
  [
    "Breathing rate (dock)",
    "Chest ECG strap or patch, and a finger oximeter",
    "At least 15 volunteers, 2 to 3 nights each, all sleeping positions, in homes the model has not seen",
    "Pilot in preparation. Targets set in advance; median and 95th percentile error and percent valid time to be reported.",
  ],
  ["Overnight heart rate variability trend (dock)", "Chest ECG strap or patch", "The same volunteers and nights", "Validation planned"],
  ["Noise floor (dock)", "Bench measurement", "Charger on and off, band docked and undocked", "Planned"],
];

const HEADS = ["Measure", "Reference", "Who and where", "Status"];

function Evidence() {
  return (
    <section id="evidence" aria-labelledby="evidence-title" className="section">
      <div className="container">
        <div className="hc-head reveal">
          <h2 id="evidence-title" className="headline">Evidence and next steps</h2>
          <p className="lede" style={{ maxWidth: 640, margin: "16px auto 0" }}>
            Where each measure stands. Every number names who was studied, where, and against what.
          </p>
        </div>

        <table className="hc-table reveal">
          <caption className="sr-only">
            Where each measure stands: the reference it is compared with, who was studied and where, and its status
          </caption>
          <thead>
            <tr>
              {HEADS.map((head) => (
                <th key={head} scope="col">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVIDENCE.map(([measure, ...cells]) => (
              <tr key={measure}>
                <th scope="row">{measure}</th>
                {cells.map((cell, index) => (
                  <td key={HEADS[index + 1]} data-label={HEADS[index + 1]}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="reveal" style={{ marginTop: 40, maxWidth: 760, fontSize: 17, lineHeight: 1.6 }}>
          Trials are ongoing at Medical College Kolkata, with 1,200+ people enrolled in our palm study and 180+
          in our band study, and NRS Medical College is under IEC review.
        </p>
        <p className="reveal" style={{ marginTop: 20, maxWidth: 760, fontSize: 19, lineHeight: 1.4, letterSpacing: "-0.02em", color: "var(--ink)" }}>
          SamaHealth is an Indian company at the clinical trial and pilot validation stage. The dock is one
          prototype in development. Nothing on this page is a performance claim, and the system holds no
          clearance or approval in any country.
        </p>
      </div>
    </section>
  );
}

const ASKS = [
  {
    title: "Protocol review",
    body: "Read the pilot protocol with us and tell us where it falls short of what a home-care service needs.",
  },
  {
    title: "A pilot at home",
    body: "Run a small pilot with people on home oxygen or CPAP, alongside the reference devices your teams already use.",
  },
  {
    title: "Local validation",
    body: "Plan the studies and the regulatory review that use in Japan would require.",
  },
];

function Partners() {
  return (
    <>
      <section id="partners" aria-labelledby="partners-title">
        <div className="container">
          <div className="hc-split" style={{ borderTop: "1px solid var(--hairline)", padding: "112px 0", gap: "40px 64px" }}>
            <div className="reveal">
              <h2 id="partners-title" className="headline">
                <span style={{ display: "block" }}>Built in India.</span>
                <span style={{ display: "block", color: "var(--dim)" }}>Looking to Japan.</span>
              </h2>
              <p className="lede" style={{ marginTop: 20 }}>
                Japan has one of the oldest populations in the world, and care at home is well established
                there, home oxygen and CPAP therapy included. We are looking for a Japanese home-care partner
                to review this work with us and to test it where that care already happens. There is no
                agreement, clearance or approval in Japan today.
              </p>
            </div>
            <div className="reveal">
              <h3 className="title">What we are asking for</h3>
              <ul className="hc-list" style={{ marginTop: 16 }}>
                {ASKS.map((ask) => (
                  <li key={ask.title}>
                    <strong style={{ display: "block", fontSize: 17, letterSpacing: "-0.015em" }}>{ask.title}</strong>
                    <span style={{ display: "block", marginTop: 4, fontSize: 16 }}>{ask.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ClosingCta
        title="Clinicians and partners"
        lede="If you run a home-care, respiratory or sleep service and want to see the protocol, or to take part in the pilot, write to us."
      >
        <a href={PILOT} className="btn btn-light">hello@samahealth.in</a>
      </ClosingCta>
    </>
  );
}
