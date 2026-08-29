const DEFAULT_BASE_URL = "https://www.filmtrack.ir";

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

export function verifyHomepageHtml(html, baseUrl = DEFAULT_BASE_URL) {
  assertIncludes(html, 'rel="canonical"', "canonical link");
  assertIncludes(html, baseUrl, "canonical production host");
  assertIncludes(html, 'application/ld+json', "JSON-LD script");
  assertIncludes(html, "https://schema.org", "Schema.org context");
  assertIncludes(html, "FilmTrack", "FilmTrack entity signal");
  assertIncludes(html, "https://amirmotefaker.ir", "founder attribution URL");
  assertIncludes(html, "امیر متفکر", "founder attribution name");
}

export function verifyRobotsText(robots) {
  for (const signal of [
    "OAI-SearchBot",
    "/dashboard",
    "/auth",
    "/api/",
    "https://www.filmtrack.ir/sitemap.xml",
  ]) {
    assertIncludes(robots, signal, "robots.txt signal");
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "FilmTrack-SEO-Verification/1.0",
      accept: "text/html,text/plain,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return {
    response,
    text: await response.text(),
  };
}

export async function verifyProductionSeo(baseUrl = DEFAULT_BASE_URL) {
  const homepage = await fetchText(`${baseUrl}/`);

  if (homepage.response.url !== `${baseUrl}/`) {
    throw new Error(
      `Homepage resolved to ${homepage.response.url}; expected ${baseUrl}/`,
    );
  }

  verifyHomepageHtml(homepage.text, baseUrl);

  const robots = await fetchText(`${baseUrl}/robots.txt`);
  verifyRobotsText(robots.text);

  const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
  assertIncludes(sitemap.text, "<urlset", "sitemap urlset");
  assertIncludes(sitemap.text, baseUrl, "sitemap canonical host");

  return {
    homepage: homepage.response.status,
    robots: robots.response.status,
    sitemap: sitemap.response.status,
    baseUrl,
  };
}

if (process.argv[1]?.endsWith("verify-production-seo.mjs")) {
  try {
    const result = await verifyProductionSeo(
      process.env.FILMTRACK_BASE_URL || DEFAULT_BASE_URL,
    );

    console.log("FilmTrack production SEO verification PASS");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("FilmTrack production SEO verification FAILED");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
