/**
 * @param {string} title
 * @param {"movie" | "tv"} type
 */
export function getRottenTomatoesUrl(title, type) {
  if (!title.trim()) return "#";

  const slug = title
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  if (!slug) return "#";

  const prefix = type === "movie" ? "m" : "tv";
  return `https://www.rottentomatoes.com/${prefix}/${slug}`;
}
