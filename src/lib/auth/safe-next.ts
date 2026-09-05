/**
 * Only allow same-origin relative paths. Blocks protocol-relative URLs,
 * backslashes, and encoded tricks that could send users off-site.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!decoded.startsWith("/")) return fallback;
  if (decoded.startsWith("//")) return fallback;
  if (decoded.includes("://")) return fallback;
  if (decoded.includes("\\")) return fallback;
  if (decoded.startsWith("/login") || decoded.startsWith("/signup")) return fallback;
  return decoded;
}
