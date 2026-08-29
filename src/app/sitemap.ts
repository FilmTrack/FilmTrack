import type { MetadataRoute } from "next";

const baseUrl = "https://www.filmtrack.ir";

const stableGenreIds = [
  "28",
  "12",
  "16",
  "35",
  "80",
  "99",
  "18",
  "10751",
  "14",
  "36",
  "27",
  "10402",
  "9648",
  "10749",
  "878",
  "53",
  "10752",
  "37",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
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

  const genreRoutes: MetadataRoute.Sitemap = stableGenreIds.map((id) => ({
    url: `${baseUrl}/genre/${id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...genreRoutes];
}
