import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://samahealth.in"),
  title: "SamaHealth — Cardiac screening for every clinic in India",
  description:
    "SamaHealth equips primary clinics and ASHA workers with offline-first cardiac screening, AI triage, and supervisor oversight — built for India's last-mile.",
  keywords: [
    "cardiac screening India",
    "ASHA worker app",
    "primary clinic AI",
    "rural cardiology",
    "SamaHealth",
    "SamaBeat",
    "DPDPA compliant health",
  ],
  authors: [{ name: "SamaHealth" }],
  openGraph: {
    title: "SamaHealth — Cardiac screening for every clinic in India",
    description:
      "Offline-first cardiac screening for ASHA workers and primary clinics. Clinical-grade AI, DPDPA-compliant, deployed in asia-south1.",
    url: "https://samahealth.in",
    siteName: "SamaHealth",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
