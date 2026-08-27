import type { MetadataRoute } from "next";

const privatePaths = ["/dashboard", "/auth", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: "https://www.filmtrack.ir/sitemap.xml",
    host: "https://www.filmtrack.ir",
  };
}
