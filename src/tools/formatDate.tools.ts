/**
 * Converts an ISO date string to a human-readable format.
 * Example: "2025-07-04T01:26:26Z" -> "July 4, 2025, 1:26 AM"
 *
 * @param isoString - ISO date string (e.g., from `lastModified`).
 * @param options - Intl.DateTimeFormat options to customize format.
 * @returns Formatted date string.
 */
export function formatDate(
  isoString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(isoString);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleString(undefined, options || defaultOptions);
}
