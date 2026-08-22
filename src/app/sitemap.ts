import type { MetadataRoute } from "next";

const baseUrl = "https://www.filmtrack.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/movies`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/shows`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/genres`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/calendar`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/plus`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
