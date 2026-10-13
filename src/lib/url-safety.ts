const ALLOWED_LINK_HOSTS = ["t.me", "telegram.org"];
const ALLOWED_IMAGE_HOSTS = ["raw.githubusercontent.com", "t.me", "telegram.org"];

function isAllowedHttpsUrl(value: string, allowedHosts: string[]): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
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
