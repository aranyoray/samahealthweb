import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import {
  Partners,
  Proof,
  Statement,
  AutonomicSignals,
  DiseaseTriage,
  HomeCare,
  Quote,
  FieldPhotos,
  CTA,
} from "./components/Sections";
import { RevealOnScroll } from "./components/Reveal";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Partners />
        <Proof />
        <Statement />
        <AutonomicSignals />
        <DiseaseTriage />
        <HomeCare />
        <Quote />
        <FieldPhotos />
        <CTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
