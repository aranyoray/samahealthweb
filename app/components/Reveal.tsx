"use client";
import { useEffect } from "react";

export function RevealOnScroll() {
  useEffect(() => {
    document.body.classList.add("js-ready");
    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const target = document.getElementById(hash);
      if (!target) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.01 }
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      window.removeEventListener("hashchange", scrollToHash);
      // A page without this component must not inherit hidden .reveal blocks.
      document.body.classList.remove("js-ready");
    };
  }, []);
  return null;
}
