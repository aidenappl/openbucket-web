export function normalizeUrl(url: string): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(normalizeUrl(input));
    if (!url.protocol) return false;
    if (input.toLowerCase() == "n/a") return false;
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}
