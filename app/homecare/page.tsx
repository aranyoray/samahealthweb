import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { jsonLdScript } from "../lib/jsonld";

// /homecare: the SamaBeat band and the Home Dock for people cared for at home.
// Nothing here is cleared, approved or a performance claim. The only study
// figures are the finger clip's, and they are attributed to the finger clip.

const SITE = "https://samahealth.in";
const TITLE = "Home care. The SamaBeat band and Home Dock, in clinical validation";
const DESCRIPTION =
  "A monitoring system in clinical validation for people cared for at home, starting with people on home oxygen or CPAP. The SamaBeat band is worn on the wrist by day, and the Home Dock senses breathing and movement in the room at night with no camera and no microphone. Not cleared or approved.";
const OG_ALT = "The SamaBeat Home Dock on a bedside table with the band in its cradle";

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
      "The SamaBeat band by day and the Home Dock at night, for people cared for at home. In clinical validation. Not cleared or approved.",
    images: ["/homecare/og.jpg"],
  },
  alternates: { canonical: "/homecare" },
};

const PILOT = "mailto:hello@samahealth.in?subject=Home%20Dock%20pilot";

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
        <Who />
        <Privacy />
        <Evidence />
        <Contact />
      </main>
      <Footer />
      <style>{`
        .hc h2 { max-width: 720px; }
        .hc .hc-intro { margin-top: 20px; font-size: 18px; line-height: 1.6; max-width: 680px; }
        .hc .hc-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 52px; }
        .hc .hc-col { border-top: 1px solid var(--ink-200); padding-top: 22px; }
        .hc .hc-col h3 { font-size: 19px; line-height: 1.3; }
        .hc .hc-col p { margin-top: 12px; font-size: 15.5px; line-height: 1.62; }
        .hc .hc-col strong { color: var(--ink-700); font-weight: 600; }
        .hc .hc-split { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 72px; align-items: start; }
        .hc .hc-list { list-style: none; margin: 0; padding: 0; }
        .hc .hc-list li { padding: 18px 0; border-top: 1px solid var(--ink-100); font-size: 16.5px; line-height: 1.6; color: var(--ink-500); }
        .hc .hc-list li:first-child { border-top: 0; padding-top: 0; }
        .hc .hc-list strong { color: var(--ink); font-weight: 600; }
        .hc .hc-after { margin-top: 28px; font-size: 16.5px; line-height: 1.65; }
        .hc .hc-link { font-size: 15px; font-weight: 500; color: var(--ink); border-bottom: 1px solid var(--ink); padding-bottom: 2px; }
        .hc .hc-link-quiet { color: var(--ink-500); border-bottom-color: var(--ink-200); }
        .hc .hc-table { width: 100%; border-collapse: collapse; margin-top: 44px; font-size: 14.5px; line-height: 1.55; }
        .hc .hc-table th { text-align: left; padding: 12px 18px 12px 0; font-size: 13px; font-weight: 600; color: var(--ink-700); border-bottom: 1px solid var(--ink-200); }
        .hc .hc-table td { padding: 16px 18px 16px 0; vertical-align: top; color: var(--ink-500); border-bottom: 1px solid var(--ink-100); }
        .hc .hc-table td:first-child { color: var(--ink); font-weight: 500; width: 24%; }
        .hc .hc-table th:last-child, .hc .hc-table td:last-child { padding-right: 0; }
        @media (max-width: 900px) {
          .hc .hc-hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .hc .hc-cols { grid-template-columns: 1fr; gap: 28px; margin-top: 40px; }
          .hc .hc-split { grid-template-columns: 1fr; gap: 28px; }
          .hc .hc-inside { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 760px) {
          .hc .hc-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
          .hc .hc-table, .hc .hc-table tbody, .hc .hc-table tr, .hc .hc-table td { display: block; width: 100%; }
          .hc .hc-table tr { padding: 20px 0; border-bottom: 1px solid var(--ink-100); }
          .hc .hc-table tr:first-child { padding-top: 0; }
          .hc .hc-table td { padding: 0; border: 0; }
          .hc .hc-table td:first-child { width: 100%; font-size: 16px; font-weight: 600; }
          .hc .hc-table td + td { margin-top: 10px; }
          .hc .hc-table td + td::before { content: attr(data-label); display: block; font-size: 12.5px; font-weight: 600; color: var(--ink-700); }
        }
      `}</style>
    </>
  );
}

function Hero() {
  return (
    <section style={{ paddingTop: 128, paddingBottom: 32, borderBottom: "1px solid var(--ink-100)" }}>
      <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 1160 }}>
        <div
          className="hc-hero-grid"
          style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 64, alignItems: "center" }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 4.8vw, 64px)",
                letterSpacing: "-0.032em",
                lineHeight: 1.04,
                maxWidth: 640,
                fontWeight: 500,
              }}
            >
              Home care, on the wrist and in the room
            </h1>
            <p style={{ marginTop: 30, fontSize: 19.5, lineHeight: 1.62, color: "var(--ink-500)", maxWidth: 600 }}>
              SamaBeat is a monitoring system in clinical validation for people who are cared for at home. The band is
              worn on the wrist through the day. At night it sits on the Home Dock, which charges it and senses the
              room without touching the patient.
            </p>
            <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.6, color: "var(--ink-700)", maxWidth: 600 }}>
              It is not cleared or approved by any regulator yet, and it does not call emergency services.
            </p>
            <div style={{ marginTop: 40, display: "flex", gap: 28, flexWrap: "wrap" }}>
              <Link href="#senses" className="hc-link">What the dock senses →</Link>
              <Link href="#evidence" className="hc-link hc-link-quiet">Where the evidence stands →</Link>
            </div>
          </div>

          <figure style={{ margin: 0 }}>
            <div style={{ background: "var(--paper-2)", border: "1px solid var(--ink-100)", borderRadius: 14 }}>
              <Image
                src="/homecare/dock.webp"
                alt="The SamaBeat Home Dock, a low stone-grey block with the band laid in a cradle on top and the E Ink medical ID facing up"
                width={1600}
                height={1200}
                priority
                sizes="(max-width: 900px) 100vw, 520px"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <figcaption style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-400)" }}>
              The Home Dock with the SamaBeat band in its cradle. A render from the design model. The parts inside are
              placeholders, and the charging contacts are provisional.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Day() {
  const steps = [
    {
      title: "By day, the band on the wrist",
      body: "A screenless sensing core with multi-wavelength optics, ECG and bioimpedance, the clip-on E Ink medical ID, and check-ins over 2G where there is no phone.",
    },
    {
      title: "At night, the band on the dock",
      body: "Set the band in the cradle. The dock charges and syncs it, reads which band it is so the night belongs to that person, and starts a sensing session. A small light shows sensing is on. The band itself does not sense while docked.",
    },
    {
      title: "One patient timeline",
      body: "Wrist readings from the day and room readings from the night land on one timeline for the clinician to review, with a confidence flag on each value.",
    },
  ];
  return (
    <section id="day" style={{ padding: "104px 0" }}>
      <div className="container" style={{ maxWidth: 1160 }}>
        <h2>How the day works</h2>
        <p className="hc-intro">The band has to charge anyway. The dock makes that moment useful.</p>
        <div className="hc-cols">
          {steps.map((s) => (
            <div key={s.title} className="hc-col">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Senses() {
  const outputs = [
    {
      title: "Presence, movement and restlessness",
      from: "Wi-Fi channel data heard from the home router. Listening to a router gives a coarser signal than a dedicated sender, so this is a presence and movement feature only.",
      status: "Being validated in a pilot: empty-room and nuisance tests first, then nights alongside a chest ECG strap and a finger oximeter.",
    },
    {
      title: "Breathing rate",
      from: "A 60 GHz radar behind the flat window on the room-facing side, which reads chest-wall motion without touching the sleeper.",
      status: "Being validated in a pilot against a chest ECG strap and a finger oximeter, with targets set in advance.",
    },
    {
      title: "Overnight heart rate variability trend",
      from: "The same radar, from the much smaller chest-wall motion of the heartbeat. The output is an overnight RMSSD trend with the percent of valid time.",
      status: "Validation planned. If radar HRV does not hold up, the fallback is a thin under-mattress strip cabled to the dock.",
    },
  ];
  return (
    <section
      id="senses"
      style={{
        background: "var(--paper-2)",
        padding: "104px 0",
        borderTop: "1px solid var(--ink-100)",
        borderBottom: "1px solid var(--ink-100)",
      }}
    >
      <div className="container" style={{ maxWidth: 1160 }}>
        <h2>What the dock senses</h2>
        <p className="hc-intro">
          Two sensors, no camera, no microphone. Every output carries a confidence flag and the share of the night it
          was valid, so a reviewer knows how far to trust it.
        </p>
        <div className="hc-cols">
          {outputs.map((o) => (
            <div key={o.title} className="hc-col">
              <h3>{o.title}</h3>
              <p><strong>Read from.</strong> {o.from}</p>
              <p><strong>Status.</strong> {o.status}</p>
            </div>
          ))}
        </div>

        <div
          className="hc-inside"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", marginTop: 72 }}
        >
          <Image
            src="/homecare/dock-exploded.webp"
            alt="Teardown of the Home Dock: the band lifts off the cradle, the lid off the base, and the board sits in the base with the radar behind the front window"
            width={1600}
            height={1400}
            sizes="(max-width: 900px) 100vw, 520px"
            style={{ width: "100%", maxWidth: 520, height: "auto", margin: "0 auto" }}
          />
          <div style={{ maxWidth: 480 }}>
            <h3>Inside the dock</h3>
            <p style={{ marginTop: 14, fontSize: 16.5, lineHeight: 1.65 }}>
              One radio module, an external antenna along the back edge away from the charging contacts, the radar
              behind the front window, a USB-C power inlet and a physical privacy switch. The parts in the model are
              placeholders.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Limits() {
  const limits = [
    ["No heart rate from Wi-Fi.", "Wi-Fi channel data is used for presence and movement only."],
    ["No apnea diagnosis.", "Breathing and heart rate variability trends are for a clinician to review. They are not a diagnosis."],
    [
      "No haemoglobin, dementia or cancer side-effect detection from the room signal.",
      "The room signal is presence, movement, breathing and a heart rate variability trend, nothing more.",
    ],
    ["One sleeper per dock.", "Two people in one bed is a later research question."],
    ["No emergency calls.", "The system does not call emergency services."],
  ];
  return (
    <section id="limits" style={{ padding: "104px 0" }}>
      <div className="container" style={{ maxWidth: 1160 }}>
        <div className="hc-split">
          <h2>What it does not do</h2>
          <div>
            <ul className="hc-list">
              {limits.map(([lead, rest]) => (
                <li key={lead}>
                  <strong>{lead}</strong> {rest}
                </li>
              ))}
            </ul>
            <p className="hc-after">
              Haemoglobin and SpO₂ come from the band and the SamaClip optics. That work rests on our precursor
              multi-wavelength finger clip, which was tested in 182 adults (175 analysed) across Monk Skin Tone
              categories 4 to 10 against the NABL-accredited reference lab at Anubhav Life Care. Those results describe
              the finger clip only, not the band or the dock.
            </p>
            <p style={{ marginTop: 22 }}>
              <Link href="/research" className="hc-link">Read the finger clip validation →</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Who() {
  const groups = [
    {
      title: "Respiratory and sleep care first",
      body: "People on home oxygen or CPAP, and people whose breathing at night matters to the clinic. The dock gives the care team an overnight breathing and restlessness trend to review beside the wrist readings.",
    },
    {
      title: "Then chronic and palliative care at home",
      body: "People who are home for long stretches. The band by day, the dock at night, one timeline for the care team and the family.",
    },
    {
      title: "Later phases",
      body: "Dementia and cancer side-effect care are later phases. What the room signal could offer them is a research question we have not answered, not a feature.",
    },
  ];
  return (
    <section
      id="who"
      style={{
        background: "var(--paper-2)",
        padding: "104px 0",
        borderTop: "1px solid var(--ink-100)",
        borderBottom: "1px solid var(--ink-100)",
      }}
    >
      <div className="container" style={{ maxWidth: 1160 }}>
        <h2>Who it helps</h2>
        <div className="hc-cols">
          {groups.map((g) => (
            <div key={g.title} className="hc-col">
              <h3>{g.title}</h3>
              <p>{g.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  const rules = [
    ["No camera, no microphone.", "The dock has neither, by design."],
    [
      "Only derived values leave the home.",
      "Presence, movement, breathing rate, the heart rate variability trend and their confidence flags. Raw channel and radar data stays on the dock, except on consented pilot nights with notice to everyone in the home.",
    ],
    [
      "Consent for every person in the home.",
      "Guests and guardians included, under India's Digital Personal Data Protection Act.",
    ],
    [
      "A physical privacy switch.",
      "On the back of the dock, with the small sensing-on light on the front so anyone in the room can see the state.",
    ],
  ];
  return (
    <section id="privacy" style={{ padding: "104px 0" }}>
      <div className="container" style={{ maxWidth: 1160 }}>
        <div className="hc-split">
          <h2>Privacy</h2>
          <ul className="hc-list">
            {rules.map(([lead, rest]) => (
              <li key={lead}>
                <strong>{lead}</strong> {rest}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Evidence() {
  const rows = [
    [
      "SpO₂ and haemoglobin optics (band, SamaClip)",
      "NABL-accredited reference lab",
      "182 adults enrolled and 175 analysed in Barasat on the precursor multi-wavelength finger clip, Monk Skin Tone 4 to 10",
      "Study complete. Results describe the finger clip only.",
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
      "Pilot in preparation. Targets set in advance. Median and 95th percentile error and percent valid time to be reported.",
    ],
    [
      "Overnight heart rate variability trend (dock)",
      "Chest ECG strap or patch",
      "The same volunteers and nights",
      "Validation planned",
    ],
    ["Noise floor (dock)", "Bench measurement", "Charger on and off, band docked and undocked", "Planned"],
  ];
  const heads = ["Measure", "Reference", "Who and where", "Status"];
  return (
    <section
      id="evidence"
      style={{
        background: "var(--paper-2)",
        padding: "104px 0",
        borderTop: "1px solid var(--ink-100)",
      }}
    >
      <div className="container" style={{ maxWidth: 1160 }}>
        <h2>Evidence and next steps</h2>
        <p className="hc-intro">Where each measure stands. Every number names who was studied, where, and against what.</p>
        <table className="hc-table">
          <thead>
            <tr>
              {heads.map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>
                {r.map((cell, i) => (
                  <td key={heads[i]} data-label={heads[i]}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hc-after" style={{ maxWidth: 760 }}>
          SamaHealth is an Indian company at the clinical trial and pilot validation stage. The dock is one prototype
          in development. Nothing on this page is a performance claim, and the system holds no clearance or approval in
          any country.
        </p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" style={{ background: "var(--ink)", color: "#fff", padding: "88px 0" }}>
      <div className="container" style={{ maxWidth: 1160 }}>
        <h2 style={{ color: "#fff" }}>Clinicians and partners</h2>
        <p style={{ marginTop: 18, fontSize: 18, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", maxWidth: 620 }}>
          If you run a home care, respiratory or sleep service and want to see the protocol, or to take part in the
          pilot, write to us.
        </p>
        <p style={{ marginTop: 28 }}>
          <a
            href={PILOT}
            style={{ fontSize: 18, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.5)", paddingBottom: 3 }}
          >
            hello@samahealth.in
          </a>
        </p>
      </div>
    </section>
  );
}
