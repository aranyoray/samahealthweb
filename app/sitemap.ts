import type { MetadataRoute } from "next";

const BASE = "https://samahealth.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${BASE}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/research`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/camps`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
