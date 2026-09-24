import type { Metadata, Viewport } from "next";
import { jsonLdScript } from "./lib/jsonld";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://samahealth.in"),
  title: "SamaHealth. Non-invasive screening for anaemia, heart and cardiometabolic risk",
  description:
    "SamaHealth brings painless, low-cost, non-invasive screening for anaemia, blood oxygen, heart rhythm and diabetes risk to clinics and camps across Barasat and North 24 Parganas, validated against the NABL-accredited lab at Anubhav Life Care.",
  keywords: [
    "anaemia screening West Bengal",
    "non-invasive haemoglobin testing",
    "cardiometabolic screening India",
    "preventive health Barasat",
    "North 24 Parganas health",
    "Anubhav Life Care",
    "SamaHealth",
    "SamaClip",
  ],
  authors: [{ name: "SamaHealth" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "SamaHealth. Non-invasive screening that finds illness early",
    description:
      "Painless, low-cost screening for anaemia, blood oxygen, heart rhythm and diabetes risk across Barasat and North 24 Parganas, validated against an NABL-accredited lab.",
    url: "https://samahealth.in",
    siteName: "SamaHealth",
    type: "website",
    images: [
      {
        url: "/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "The Anubhav Life Care team at the planning table before a community camp in North 24 Parganas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SamaHealth. Non-invasive screening that finds illness early",
    description:
      "Painless, low-cost screening for anaemia, heart and cardiometabolic risk across Barasat and North 24 Parganas, checked against an NABL-accredited lab.",
    images: ["/og-cover.jpg"],
  },
};

const SITE = "https://samahealth.in";

// Organization + WebSite graph. Every value here is already stated elsewhere on
// the site (footer legal name and email, hero region, root description); no
// address, phone, rating or social profile is asserted, because the repo holds
// none of those.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "SamaHealth",
      legalName: "SamaHealth Technologies Pvt Ltd",
      url: SITE,
      email: "hello@samahealth.in",
      description:
        "Painless, non-invasive screening for anaemia, heart and cardiometabolic risk, built around the NABL-accredited lab at Anubhav Life Care, Barasat, West Bengal.",
      logo: { "@type": "ImageObject", url: `${SITE}/logo.png`, width: 512, height: 512 },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "North 24 Parganas",
        address: { "@type": "PostalAddress", addressRegion: "West Bengal", addressCountry: "IN" },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "SamaHealth",
      inLanguage: "en",
      publisher: { "@id": `${SITE}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
