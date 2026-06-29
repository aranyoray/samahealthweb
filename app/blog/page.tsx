import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RevealOnScroll } from "../components/Reveal";
import { getAllPostsMeta, formatDate } from "../lib/blog";

const SITE = "https://samahealth.in";

export const metadata: Metadata = {
  title: "Blog. Anaemia, cardiometabolic and preventive screening | SamaHealth",
  description:
    "Field notes and patient guides on anaemia, non-invasive screening, cardiometabolic risk, and preventive care in West Bengal, from the SamaHealth team in Barasat.",
  keywords: [
    "anaemia screening blog",
    "non-invasive haemoglobin testing",
    "preventive health West Bengal",
    "cardiometabolic screening India",
    "SamaHealth blog",
  ],
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: "SamaHealth Blog. Preventive screening, anaemia and heart health",
    description:
      "Patient guides and field notes on anaemia, non-invasive screening and preventive care in West Bengal.",
    url: `${SITE}/blog`,
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = getAllPostsMeta();
  const [featured, ...rest] = posts;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${SITE}/blog#blog`,
        name: "SamaHealth Blog",
        url: `${SITE}/blog`,
        description:
          "Field notes and patient guides on anaemia, non-invasive screening, and preventive care in West Bengal.",
        publisher: { "@type": "Organization", name: "SamaHealth", url: SITE },
      },
      {
        "@type": "ItemList",
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE}/blog/${p.slug}`,
          name: p.title,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav variant="light" />
      <main id="main">
        <header className="container" style={{ paddingTop: 128, paddingBottom: 8 }}>
          <h1 style={{ maxWidth: 900 }}>
            Field notes on screening, one signal at a time.
          </h1>
          <p style={{ marginTop: 22, fontSize: 19, color: "var(--ink-500)", maxWidth: 680 }}>
            Patient guides and reports from the work in Barasat and North 24 Parganas: anaemia,
            non-invasive screening, cardiometabolic risk, and the model that carries it to the last mile.
          </p>
        </header>

        {featured && (
          <section className="container" style={{ paddingTop: 40 }}>
            <Link href={`/blog/${featured.slug}`} className="card blog-feature" style={{ display: "grid", gap: 18, padding: 36 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-400)" }}>{formatDate(featured.date)}</span>
              </div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", maxWidth: 900 }}>{featured.title}</h2>
              <p style={{ fontSize: 18, color: "var(--ink-500)", maxWidth: 760 }}>{featured.description}</p>
              <span className="mono" style={{ fontSize: 13, color: "var(--brand)" }}>Read the entry →</span>
            </Link>
          </section>
        )}

        <section className="section" style={{ paddingTop: 56 }}>
          <div className="container">
            <div className="grid grid-3">
              {rest.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="card blog-card" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 10 }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--ink-400)", whiteSpace: "nowrap" }}>{formatDate(p.date)}</span>
                  </div>
                  <h3 style={{ fontSize: 21, lineHeight: 1.2 }}>{p.title}</h3>
                  <p style={{ fontSize: 14.5, color: "var(--ink-500)", flex: 1 }}>{p.description}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="blog-tag">{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
