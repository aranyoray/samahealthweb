import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://samahealth.in/sitemap.xml",
    host: "https://samahealth.in",
  };
}
