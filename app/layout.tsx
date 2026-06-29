import type { Metadata, Viewport } from "next";
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
  openGraph: {
    title: "SamaHealth. Non-invasive screening that finds illness early",
    description:
      "Painless, low-cost screening for anaemia, blood oxygen, heart rhythm and diabetes risk across Barasat and North 24 Parganas, validated against an NABL-accredited lab.",
    url: "https://samahealth.in",
    siteName: "SamaHealth",
    type: "website",
    images: [
      {
        url: "/events/anubhav-cmc-001.jpg",
        width: 1200,
        height: 630,
        alt: "SamaHealth team screening at an Anubhav Life Care community camp in North 24 Parganas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SamaHealth. Non-invasive screening that finds illness early",
    description:
      "Painless, low-cost screening for anaemia, heart and cardiometabolic risk across Barasat and North 24 Parganas, checked against an NABL-accredited lab.",
    images: ["/events/anubhav-cmc-001.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
