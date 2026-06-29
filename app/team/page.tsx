import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Team — SamaHealth",
  description:
    "The people building SamaHealth: a frugal, frontier engineering team and clinical advisors spanning tertiary care, district public health, and US infectious-disease academic medicine.",
  openGraph: {
    title: "Team — SamaHealth",
    description:
      "Frugal, frontier engineering and clinical advisors across tertiary care, district public health, and US infectious-disease academic medicine.",
    url: "/team",
    siteName: "SamaHealth",
    type: "website",
    images: [{ url: "/events/anubhav-cmc-001.jpg", width: 1200, height: 630, alt: "SamaHealth" }],
  },
  alternates: { canonical: "/team" },
};

type Person = {
  name: string;
  role: string;
  cred: string;
  body: string;
  link?: { href: string; label: string };
};

const FOUNDERS: Person[] = [
  {
    name: "Aranyo Ray",
    role: "Cofounder & CEO",
    cred: "Yale '24 · CS + Psychology",
    body:
      "Leads AI/ML architecture, clinical study design, and regulatory strategy (CDSCO, FDA). Built SamaClip's optical stack and led the n=175 validation study at Anubhav Life Care for non-invasive, skin-tone-agnostic haemoglobin tracking.",
  },
  {
    name: "Pushti Desai, MEng",
    role: "Cofounder & CTO",
    cred: "Biomedical Engineering, Duke · BEng, Georgia Tech",
    body:
      "Patent pending on the Tonsiliscope, a 3D-printed oropharyngeal imaging device for remote ENT exams. Research Scientist III at Boston Scientific (precision diagnostics), ML algorithm development on Medtronic's NIM Vital nerve-monitoring system, and AI/ML at Restor3d. Leads hardware, PCB, and cartridge design.",
    link: { href: "https://pdesai.vercel.app", label: "pdesai.vercel.app" },
  },
];

const ADVISORS: Person[] = [
  {
    name: "Dr. Minghsun Liu, MD PhD",
    role: "Clinical advisor · Infectious disease",
    cred: "MIT · MD-PhD UCLA · ID fellowship, Stanford",
    body:
      "Infectious-disease physician-scientist with an active LA practice. Internal Medicine residency at UW, UCLA postdoc, and co-discoverer of diversity-generating retroelements (Nature). Advises on host-pathogen biology and infectious-disease workflow.",
  },
  {
    name: "Dr. Aniket Halder, MD, DNB (Pathology)",
    role: "Clinical advisor · Pathology",
    cred: "Assistant Professor of GI Pathology, IPGMER / SSKM, Kolkata",
    body:
      "FNAC expert with 28+ publications and TB-relevant work distinguishing intestinal TB from Crohn's (a circulating miRNA + chemokine panel, Scientific Reports 2021) and on pulmonary-TB drug-resistance correlates. Principal investigator on the SamaBeat clinical validation study.",
  },
  {
    name: "Dr. Sabitra Patra, MD (Pathology)",
    role: "Clinical advisor · Pathology",
    cred: "Pathology lead, Anubhav (NABL-accredited validation site)",
    body:
      "Owns diagnostic interpretation at our validation site and runs cartridge-readout cross-validation against gold-standard methods.",
  },
  {
    name: "Dr. Indira Mukherjee, MD (Microbiology)",
    role: "Clinical advisor · Microbiology",
    cred: "Senior Resident, Barasat Govt Medical College & Hospital",
    body:
      "Based in North 24 Parganas, one of India's most populous districts (~10M). Direct exposure to high-volume TB workflow, AFB / GeneXpert routine, and pediatric and extra-pulmonary TB referrals from across the district.",
  },
];

export default function TeamPage() {
  return (
    <>
      <Nav variant="hero" />
      <main id="main">
        <Hero />
        <Group eyebrow="Founders" title="The people building it." people={FOUNDERS} cols={2} />
        <Group
          eyebrow="Clinical & scientific advisors"
          title="Anchored in real clinical practice."
          people={ADVISORS}
          cols={2}
          alt
        />
        <Closing />
        <CTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}

function Hero() {
  return (
    <section className="hero-clinical" style={{ paddingTop: 120 }}>
      <div className="container" style={{ position: "relative", zIndex: 2, paddingTop: 72, paddingBottom: 100, maxWidth: 900 }}>
        <span className="kbd-pill kbd-pill-dark">
          <span className="dot pulse" style={{ background: "#14B8A6" }} />
          SamaHealth · Team
        </span>
        <h1
          style={{
            marginTop: 28,
            color: "#fff",
            fontSize: "clamp(40px, 5.2vw, 70px)",
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            textWrap: "balance" as never,
          }}
        >
          Frugal, frontier engineering. <em style={{ fontStyle: "italic", color: "#A7F3D0", fontWeight: 400 }}>Clinically grounded.</em>
        </h1>
        <p style={{ marginTop: 26, fontSize: 19, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, maxWidth: 640 }}>
          A small technical team building non-invasive diagnostics, backed by clinical leadership across tertiary care,
          district public health, and US infectious-disease academic medicine.
        </p>
      </div>
      <BottomFade />
    </section>
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

function Group({
  eyebrow,
  title,
  people,
  alt,
}: {
  eyebrow: string;
  title: string;
  people: Person[];
  cols: number;
  alt?: boolean;
}) {
  return (
    <section className="section reveal" style={alt ? { background: "var(--paper-2)" } : undefined}>
      <div className="container">
        <div style={{ maxWidth: 820, margin: "0 auto 48px", textAlign: "center", display: "grid", placeItems: "center" }}>
          <div className="eyebrow">{eyebrow}</div>
          <h2 style={{ marginTop: 18 }}>{title}</h2>
        </div>
        <div className="grid grid-2" style={{ maxWidth: 980, marginInline: "auto" }}>
          {people.map((p) => (
            <article key={p.name} className="card" style={{ padding: 32, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Avatar name={p.name} />
                <div>
                  <h3 style={{ fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" }}>{p.name}</h3>
                  <div style={{ fontSize: 13.5, color: "var(--brand)", fontWeight: 600, marginTop: 2 }}>{p.role}</div>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--ink-400)", letterSpacing: "0.02em" }}>{p.cred}</div>
              <p style={{ color: "var(--ink-500)", fontSize: 15, lineHeight: 1.6 }}>{p.body}</p>
              {p.link && (
                <Link href={p.link.href} className="mono" style={{ fontSize: 13, color: "var(--brand)" }} target="_blank" rel="noopener noreferrer">
                  {p.link.label} →
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
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
        width: 52,
        height: 52,
        flexShrink: 0,
        borderRadius: 14,
        background: "linear-gradient(135deg, #14B8A6, #0F766E)",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function Closing() {
  return (
    <section className="section-sm reveal">
      <div className="container" style={{ maxWidth: 820, textAlign: "center" }}>
        <p style={{ fontSize: 17, color: "var(--ink-500)", lineHeight: 1.7 }}>
          Frugal, frontier engineering, paired with clinical leadership anchored in tertiary care (IPGMER / SSKM),
          district public health (Barasat GMCH), and US infectious-disease academic medicine.
        </p>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="section reveal" style={{ background: "linear-gradient(135deg, #052E2A 0%, #0F766E 100%)", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div className="container" style={{ position: "relative", maxWidth: 940, textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>Get in touch</div>
        <h2 style={{ marginTop: 16, color: "#fff" }}>
          Want to build this <em style={{ fontStyle: "italic", color: "#A7F3D0" }}>with us?</em>
        </h2>
        <p style={{ marginTop: 22, color: "rgba(255,255,255,0.82)", fontSize: 18, maxWidth: 640, margin: "22px auto 0", lineHeight: 1.6 }}>
          We work with health systems, funders, researchers and community partners across India.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36, justifyContent: "center" }}>
          <Link href="mailto:hello@samahealth.in" className="btn btn-light">hello@samahealth.in →</Link>
        </div>
      </div>
    </section>
  );
}
