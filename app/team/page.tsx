import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { ClosingCta } from "../components/ClosingCta";

export const metadata: Metadata = {
  title: "Team. SamaHealth",
  description:
    "The people building SamaHealth: a frugal, frontier engineering team and clinical advisors spanning tertiary care, district public health, and US infectious-disease academic medicine.",
  openGraph: {
    title: "Team. SamaHealth",
    description:
      "Frugal, frontier engineering and clinical advisors across tertiary care, district public health, and US infectious-disease academic medicine.",
    url: "/team",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: "The Anubhav Life Care team at the planning table before a community camp in North 24 Parganas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team. SamaHealth",
    description:
      "Frugal, frontier engineering and clinical advisors across tertiary care, district public health, and US infectious-disease academic medicine.",
    images: ["/og-cover.jpg"],
  },
  alternates: { canonical: "/team" },
};

type Person = {
  name: string;
  role: string;
  cred: string;
  body: string;
  img?: string;
  link?: { href: string; label: string };
};

const FOUNDERS: Person[] = [
  {
    name: "Aranyo Ray",
    role: "Cofounder & CEO",
    cred: "Yale '24 · CS + Psychology",
    img: "/team/aranyo.jpg",
    body:
      "Leads AI/ML architecture, clinical study design, and regulatory strategy (CDSCO, FDA). Built the optical stack and led the n=175 validation study at Anubhav Life Care for non-invasive, skin-tone-agnostic haemoglobin tracking.",
  },
  {
    name: "Pushti Desai, MEng",
    role: "Cofounder & CTO",
    cred: "Biomedical Engineering, Duke · BEng, Georgia Tech",
    img: "/team/pushti.jpg",
    body:
      "Patent pending on the Tonsiliscope, a 3D-printed oropharyngeal imaging device for remote ENT exams. Research Scientist III at Boston Scientific (precision diagnostics), ML algorithm development on Medtronic's NIM Vital nerve-monitoring system, and AI/ML at Restor3d. Leads hardware, PCB, and cartridge design.",
    link: { href: "https://pdesai.vercel.app", label: "pdesai.vercel.app" },
  },
];

const ADVISORS: Person[] = [
  {
    name: "Dr. Minghsun Liu, MD PhD",
    role: "Clinical advisor, infectious disease",
    cred: "MIT · MD-PhD UCLA · ID fellowship, Stanford",
    img: "/team/minghsun-liu.jpg",
    body:
      "Infectious-disease physician-scientist with an active LA practice. Internal Medicine residency at UW, UCLA postdoc, and co-discoverer of diversity-generating retroelements (Nature). Advises on host-pathogen biology and infectious-disease workflow.",
  },
  {
    name: "Dr. Aniket Halder, MD, DNB (Pathology)",
    role: "Clinical advisor, pathology",
    cred: "Assistant Professor of GI Pathology, IPGMER / SSKM, Kolkata",
    img: "/team/aniket-halder.png",
    body:
      "FNAC expert with 28+ publications and TB-relevant work distinguishing intestinal TB from Crohn's (a circulating miRNA + chemokine panel, Scientific Reports 2021) and on pulmonary-TB drug-resistance correlates. Principal investigator on the SamaBeat clinical validation study.",
  },
  {
    name: "Dr. Sabitra Patra, MD (Pathology)",
    role: "Clinical advisor, pathology",
    cred: "Pathology lead, Anubhav (NABL-accredited validation site)",
    body:
      "Owns diagnostic interpretation at our validation site and runs cartridge-readout cross-validation against gold-standard methods.",
  },
  {
    name: "Dr. Indira Mukherjee, MD (Microbiology)",
    role: "Clinical advisor, microbiology",
    cred: "Senior Resident, Barasat Govt Medical College & Hospital",
    img: "/team/indira-mukherjee.jpg",
    body:
      "Based in North 24 Parganas, one of India's most populous districts (~10M). Direct exposure to high-volume TB workflow, AFB / GeneXpert routine, and pediatric and extra-pulmonary TB referrals from across the district.",
  },
];

export default function TeamPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Group title="The people building it." people={FOUNDERS} cols={2} />
        <Group
          title="Anchored in real clinical practice."
          people={ADVISORS}
          cols={2}
          alt
        />
        <CTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}

function Hero() {
  return (
    <section className="hero-clinical" data-tone="dark">
      <div className="container" style={{ paddingTop: "clamp(72px, 9vw, 120px)", paddingBottom: "clamp(72px, 9vw, 120px)", maxWidth: 960, textAlign: "center" }}>
        <h1 className="display">
          <span style={{ display: "block" }}>Frugal, frontier engineering.</span>
          <span style={{ display: "block", color: "var(--dim)" }}>Clinically grounded.</span>
        </h1>
        <p className="lede" style={{ margin: "20px auto 0", maxWidth: 640 }}>
          A small technical team building non-invasive diagnostics, backed by clinical leadership across tertiary
          care (IPGMER / SSKM), district public health (Barasat GMCH) and US infectious-disease academic medicine.
        </p>
      </div>
    </section>
  );
}

function Group({
  title,
  people,
  alt,
}: {
  title: string;
  people: Person[];
  cols: number;
  alt?: boolean;
}) {
  return (
    <section className={`section reveal${alt ? " on-soft" : ""}`} style={alt ? { background: "var(--paper-2)" } : undefined}>
      <div className="container">
        <div style={{ maxWidth: 820, margin: "0 auto 48px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <h2>{title}</h2>
        </div>
        <div className="grid grid-2" style={{ maxWidth: 1040, marginInline: "auto" }}>
          {people.map((p) => (
            <article key={p.name} className="card" style={{ padding: 32, display: "grid", gap: 14, alignContent: "start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Avatar name={p.name} img={p.img} />
                <div>
                  <h3 className="title">{p.name}</h3>
                  <div style={{ fontSize: 14.5, color: "var(--brand)", fontWeight: 500, marginTop: 3 }}>{p.role}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.45 }}>{p.cred}</div>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>{p.body}</p>
              {p.link && (
                <Link href={p.link.href} className="text-link" target="_blank" rel="noopener noreferrer">
                  {p.link.label}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Avatar({ name, img }: { name: string; img?: string }) {
  if (img) {
    return (
      <Image
        src={img}
        alt=""
        width={64}
        height={64}
        sizes="64px"
        style={{
          width: 64,
          height: 64,
          flexShrink: 0,
          borderRadius: 999,
          objectFit: "cover",
          objectPosition: "center top",
          background: "var(--paper-3)",
        }}
      />
    );
  }
  const initials = name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden
      style={{
        width: 64,
        height: 64,
        flexShrink: 0,
        borderRadius: 999,
        background: "#0F766E",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: 20,
        fontWeight: 500,
      }}
    >
      {initials}
    </div>
  );
}

function CTA() {
  return (
    <ClosingCta
      title="Want to build this with us?"
      lede="We work with health systems, funders, researchers and community partners across India."
    />
  );
}
