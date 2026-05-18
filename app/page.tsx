import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { LogoMarquee, Scenarios, HowItWorks, Parameters, Outcomes, Quote, CTA } from "./components/Sections";
import { RevealOnScroll } from "./components/Reveal";

export default function HomePage() {
  return (
    <>
      <Nav variant="hero" />
      <main>
        <Hero />
        <LogoMarquee />
        <Scenarios />
        <HowItWorks />
        <Parameters />
        <Outcomes />
        <Quote />
        <CTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
