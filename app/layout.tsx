import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { jsonLdScript } from "./lib/jsonld";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://samahealth.in"),
  title: "SamaHealth. SamaBeat, a continuous care monitoring system in clinical validation",
  description:
    "SamaBeat is a medical device system in clinical validation for people cared for at home: a wrist band with 6 LEDs, ECG and bioimpedance, and the SamaDock, which senses the room at night with no camera and no microphone. Not cleared or approved by any regulator.",
  keywords: [
    "continuous care monitoring",
    "home care monitoring India",
    "home oxygen monitoring",
    "CPAP follow-up at home",
    "medical device in clinical validation",
    "SamaBeat band",
    "SamaDock",
    "SamaHealth",
  ],
  authors: [{ name: "SamaHealth" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "SamaHealth. Continuous care monitoring, on the wrist and in the room",
    description:
      "SamaBeat is a medical device system in clinical validation: a wrist band and a bedside dock for people cared for at home. Not cleared or approved by any regulator.",
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
    title: "SamaHealth. Continuous care monitoring, on the wrist and in the room",
    description:
      "SamaBeat is a medical device system in clinical validation: a wrist band and a bedside dock for people cared for at home. Not cleared or approved.",
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
        "Medical device company. SamaBeat, its continuous care monitoring system for people cared for at home, is in clinical validation and is not cleared or approved by any regulator.",
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
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
