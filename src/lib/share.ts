export async function shareViaTelegram(text: string): Promise<void> {
  const telegramShareUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  const telegramWebApp = typeof window !== "undefined" ? (window as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp : undefined;

  try {
    if (telegramWebApp?.openTelegramLink) {
      telegramWebApp.openTelegramLink(telegramShareUrl);
      return;
    }
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch {
    return;
  }

  window.open(telegramShareUrl, "_blank", "noopener,noreferrer");
}