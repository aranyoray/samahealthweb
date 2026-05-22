import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { CampGallery } from "../components/CampGallery";
import data from "../events-data.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blood donation camps — Anubhav CMC × SamaBeat",
  description:
    "Anubhav Cardiometabolic Clinic at 30+ blood donation camps across North 24 Parganas — free fasting/random sugar, anemia, and body-composition screening on the SamaBeat 5-wavelength PPG + ECG + BIA clip. Donor camps across Ranaghat, Barasat, Barrackpore, Birati, Madhyamgram, Ashoknagar, Habra, Kalyani and more.",
  keywords: [
    "blood donation camp North 24 Parganas",
    "Barasat blood donation",
    "Anubhav CMC",
    "SamaBeat cardiometabolic screening",
    "free sugar test blood donation",
    "anemia screening donor camp",
    "Ranaghat Barasat Barrackpore Birati Madhyamgram blood camp",
  ],
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

  return (
    <>
      <Nav variant="light" />
      <main>
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
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              Anubhav CMC · Field gallery
            </div>
            <h1
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                marginBottom: 22,
              }}
            >
              30 blood donation camps. <em>One clinic on the floor.</em>
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
              donor camps across North 24 Parganas — fasting / random sugar,
              hemoglobin & anemia, and full body composition (fat mass, muscle
              mass, hydration) from the{" "}
              <a
                href="https://samawritten.com"
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
              <Stat label="Donors screened" value={String(images.length)} />
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
