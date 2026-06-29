import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { CampGallery } from "../components/CampGallery";
import data from "../events-data.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blood donation camps. Anubhav CMC × SamaBeat",
  description:
    "Anubhav Cardiometabolic Clinic at 30+ blood donation camps across North 24 Parganas. Free fasting/random sugar, anemia, and body-composition screening on the SamaBeat 5-wavelength PPG + ECG + BIA clip. Donor camps across Ranaghat, Barasat, Barrackpore, Birati, Madhyamgram, Ashoknagar, Habra, Kalyani and more.",
  keywords: [
    "blood donation camp North 24 Parganas",
    "Barasat blood donation",
    "Anubhav CMC",
    "SamaBeat cardiometabolic screening",
    "free sugar test blood donation",
    "anemia screening donor camp",
    "Ranaghat Barasat Barrackpore Birati Madhyamgram blood camp",
  ],
  openGraph: {
    title: "30 blood donation camps. Anubhav CMC × SamaBeat",
    description:
      "Anubhav Cardiometabolic Clinic ran free pre-donation screening (sugar, anemia, body composition) at 30 donor camps across North 24 Parganas. Field gallery of 209 frames.",
    url: "/camps",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "Anubhav CMC team at a blood donation camp" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "30 blood donation camps. Anubhav CMC × SamaBeat",
    description: "Field gallery from 30 donor camps across North 24 Parganas. Free cardiometabolic screening on SamaBeat clip.",
    images: ["/events/anubhav-cmc-001.jpg"],
  },
  alternates: { canonical: "/camps" },
};

type Img = {
  file: string;
  event: number;
  location: string;
  independent: boolean;
  caption: string;
  partnerTag: string;
};

type EventMeta = {
  id: number;
  location: string;
  independent: boolean;
  imageCount: number;
};

export default function CampsPage() {
  const events = data.events as EventMeta[];
  const images = data.images as Img[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Anubhav CMC blood donation camps. Field gallery",
    description:
      "Photo gallery from 30 blood donation camps across North 24 Parganas, with free cardiometabolic screening from the SamaBeat 5-wavelength PPG + ECG + BIA clip.",
    url: "https://samahealth.in/camps",
    numberOfItems: images.length,
    isPartOf: { "@type": "WebSite", name: "SamaHealth", url: "https://samahealth.in" },
    about: events.map((ev) => ({
      "@type": "Event",
      name: `Blood donation camp at ${ev.location}`,
      location: { "@type": "Place", name: ev.location, addressRegion: "West Bengal", addressCountry: "IN" },
      organizer: ev.independent
        ? { "@type": "Organization", name: "Anubhav Cardiometabolic Clinic" }
        : [
            { "@type": "Organization", name: "Anubhav Cardiometabolic Clinic" },
            { "@type": "Organization", name: "Barasat Blood Bank" },
          ],
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav variant="light" />
      <main id="main">
        <header
          style={{
            paddingTop: 140,
            paddingBottom: 56,
            background:
              "radial-gradient(80% 60% at 50% 0%, rgba(20,184,166,0.10) 0%, transparent 70%), #fff",
            borderBottom: "1px solid var(--ink-100)",
          }}
        >
          <div className="container" style={{ maxWidth: 920 }}>
            <h1
              style={{
                fontSize: "clamp(38px, 5.4vw, 64px)",
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                marginBottom: 22,
              }}
            >
              Free screening at 30 blood donation camps
            </h1>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--ink-500)",
                maxWidth: 720,
              }}
            >
              Anubhav Cardiometabolic Clinic ran free pre-donation screening at
              donor camps across North 24 Parganas: fasting / random sugar,
              hemoglobin & anemia, and full body composition (fat mass, muscle
              mass, hydration) from the{" "}
              <a
                href="https://samawritten.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--brand)", borderBottom: "1px solid var(--brand-2)" }}
              >
                SamaBeat
              </a>{" "}
              5-wavelength PPG + ECG + BIA fingertip clip. Every donor walked out
              with their own cardiometabolic snapshot.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                marginTop: 30,
                fontSize: 13,
              }}
            >
              <Stat label="Camps" value={String(events.length)} />
              <Stat label="Frames in this gallery" value={String(images.length)} />
              <Stat label="Districts touched" value="22 localities" />
              <Stat label="Tech" value="SamaBeat clip" />
            </div>
          </div>
        </header>

        <CampGallery events={events} images={images} />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        border: "1px solid var(--ink-100)",
        borderRadius: 999,
        background: "var(--paper-2)",
      }}
    >
      <span style={{ color: "var(--ink-400)", marginRight: 8 }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
