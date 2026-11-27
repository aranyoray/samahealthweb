import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Partners, System, Evidence, Helps, FieldPhotos, CTA } from "./components/Sections";
import { RevealOnScroll } from "./components/Reveal";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Partners />
        <System />
        <Evidence />
        <Helps />
        <FieldPhotos />
        <CTA />
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
