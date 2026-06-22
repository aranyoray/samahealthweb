import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { CredibilityStrip, WhatWeScreen, HowItWorks, Reach, Quote, CTA } from "./components/Sections";
import { RevealOnScroll } from "./components/Reveal";

export default function HomePage() {
  return (
    <>
      <Nav variant="light" />
      <main id="main">
        <Hero />
        <CredibilityStrip />
        <WhatWeScreen />
        <HowItWorks />
        <Reach />
        <Quote />
        <CTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
