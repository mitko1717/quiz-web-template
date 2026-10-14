const ALLOWED_LINK_HOSTS = ["t.me", "telegram.org"];
// Extra image hosts per app (e.g. a CDN for question images), comma-separated.
const EXTRA_IMAGE_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
const ALLOWED_IMAGE_HOSTS = ["raw.githubusercontent.com", "t.me", "telegram.org", ...EXTRA_IMAGE_HOSTS];

function isAllowedHttpsUrl(value: string, allowedHosts: string[]): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

// For web game links (webUrl) — any https URL.
export function isSafeWebLink(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

// For navigable links (tgBotLink, referral links) — only Telegram's own domains.
export function isSafeExternalLink(value: string | null | undefined): value is string {
  if (!value) return false;
  return isAllowedHttpsUrl(value, ALLOWED_LINK_HOSTS);
}

// For <img src> — Telegram domains plus the quiz-assets GitHub host logos are hosted on.
export function isSafeImageUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return isAllowedHttpsUrl(value, ALLOWED_IMAGE_HOSTS);
}
