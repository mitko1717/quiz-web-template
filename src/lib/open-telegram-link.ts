type TelegramWebApp = { openTelegramLink?: (url: string) => void };

function telegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;

  return (window as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

/** Opens a t.me link inside Telegram when possible, otherwise in a new tab. */
export function openTelegramLink(url: string): void {
  const webApp = telegramWebApp();

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url);

    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
