import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SamaHealth",
    short_name: "SamaHealth",
    description:
      "Painless, non-invasive screening for anaemia, blood oxygen, heart rhythm and diabetes risk across Barasat and North 24 Parganas.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0F766E",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/logo.png", type: "image/png", sizes: "512x512", purpose: "any" },
    ],
  };
}
