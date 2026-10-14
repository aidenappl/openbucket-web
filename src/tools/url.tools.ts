export function normalizeUrl(url: string): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

/** Host part of an endpoint URL, for telling same-named sessions apart. Falls back to the raw string. */
export function endpointHost(endpoint: string): string {
  try {
    return new URL(normalizeUrl(endpoint)).host;
  } catch {
    return endpoint;
  }
}

export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(normalizeUrl(input));
    if (!url.protocol) return false;
    if (!url.hostname) return false;
    if (!url.origin) return false;
    if (input.toLowerCase() == "n/a") return false;
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}
