"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAuthContext } from "@/components/AuthGate";
import { Button } from "@/components/button";
import { BodyText, SectionLabel } from "@/components/SectionLabel";
import { useI18n } from "@/providers/I18nProvider";
import { useTelegram } from "@/providers/TelegramProvider";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black" | "outline_dark";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: string;
    }
  ) => void;
};

type GoogleNamespace = {
  accounts: {
    id: GoogleIdApi;
  };
};

type AppleSignInResponse = {
  authorization?: {
    id_token?: string;
  };
};

type AppleAuthApi = {
  init: (config: { clientId: string; scope?: string; redirectURI: string; usePopup?: boolean; }) => void;
  signIn: () => Promise<AppleSignInResponse>;
};

type AppleNamespace = {
  auth: AppleAuthApi;
};

declare global {
  interface Window {
    google?: GoogleNamespace;
    AppleID?: AppleNamespace;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() ?? "";
const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim() ?? "";

export function SignInPanel() {
  const { t } = useI18n();
  const { authMode, linkWithGoogle, linkWithApple } = useAuthContext();
  const { isTelegram } = useTelegram();
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [googleScriptError, setGoogleScriptError] = useState(false);
  const [appleScriptReady, setAppleScriptReady] = useState(false);
  const [appleScriptError, setAppleScriptError] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<"google" | "apple" | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const isGuest = authMode === "guest";
  const isGoogleConfigured = GOOGLE_CLIENT_ID.length > 0;
  const isAppleConfigured = APPLE_CLIENT_ID.length > 0 && APPLE_REDIRECT_URI.length > 0;
  const googleApi = typeof window !== "undefined" ? window.google?.accounts?.id : undefined;

  useEffect(() => {
    if (!isGuest || !isGoogleConfigured || !googleScriptReady || !googleButtonRef.current) return;
    if (!googleApi) return;
    
    const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
      const credential = response.credential?.trim();
      if (!credential) {
        setProviderError(t("auth_google_missing_credential"));
        return;
      }

      setProviderError(null);
      setLinkingProvider("google");
      try {
        await linkWithGoogle(credential);
      } catch (cause) {
        setProviderError(cause instanceof Error ? cause.message : t("auth_google_login_failed"));
      } finally {
        setLinkingProvider(null);
      }
    };

    if (!googleInitializedRef.current) {
      googleApi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        ux_mode: "popup",
      });
      googleInitializedRef.current = true;
    }

    googleButtonRef.current.innerHTML = "";
    googleApi.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline_dark",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: "320",
    });
  }, [googleScriptReady, googleApi, isGuest, isGoogleConfigured, linkWithGoogle, t]);

  const handleAppleSignIn = async () => {
    setProviderError(null);

    if (!isAppleConfigured) {
      setProviderError(t("auth_apple_not_configured"));
      return;
    }

    if (!appleScriptReady) {
      setProviderError(t("auth_apple_sdk_not_ready"));
      return;
    }

    const appleAuth = window.AppleID?.auth;
    if (!appleAuth) {
      setProviderError(t("auth_apple_sdk_failed"));
      return;
    }

    setLinkingProvider("apple");
    try {
      appleAuth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT_URI,
        usePopup: true,
      });

      const response = await appleAuth.signIn();
      const identityToken = response.authorization?.id_token?.trim();
      if (!identityToken) throw new Error(t("auth_apple_missing_identity_token"));

      await linkWithApple(identityToken);
    } catch (cause) {
      setProviderError(cause instanceof Error ? cause.message : t("auth_apple_login_failed"));
    } finally {
      setLinkingProvider(null);
    }
  };

  const authStateLabel =
    authMode === "google"
      ? t("auth_state_google")
      : authMode === "apple"
        ? t("auth_state_apple")
        : authMode === "telegram"
          ? t("auth_state_telegram")
        : authMode === "localAdmin"
          ? t("auth_state_local_admin")
          : t("auth_state_guest");

  if (isTelegram) {
    return (
      <section className="w-full rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-5">
        <SectionLabel>{t("auth_signin_section_label")}</SectionLabel>
        <h2 className="mt-2 text-lg font-semibold text-ink-100">{t("auth_signin_section_title")}</h2>
        <BodyText>{t("auth_telegram_identity_active")}</BodyText>
        <p className="mt-3 rounded-lg border border-base-600 bg-base-700/45 px-3 py-2 text-sm text-ink-200">
          {t("auth_current_state")}: <span className="font-semibold text-ink-100">{authStateLabel}</span>
        </p>
        <p className="mt-3 text-sm text-ink-300">{t("auth_telegram_external_hidden")}</p>
      </section>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-5">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
        onError={() => setGoogleScriptError(true)}
      />
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
        onLoad={() => setAppleScriptReady(true)}
        onError={() => setAppleScriptError(true)}
      />

      <SectionLabel>{t("auth_signin_section_label")}</SectionLabel>
      <h2 className="mt-2 text-lg font-semibold text-ink-100">{t("auth_signin_section_title")}</h2>
      <BodyText>{t("auth_signin_section_desc")}</BodyText>

      <p className="mt-3 rounded-lg border border-base-600 bg-base-700/45 px-3 py-2 text-sm text-ink-200">
        {t("auth_current_state")}: <span className="font-semibold text-ink-100">{authStateLabel}</span>
      </p>

      {isGuest ? (
        <div className="mt-4 space-y-3">
          <div>
            {isGoogleConfigured ? (
              <div ref={googleButtonRef} className="min-h-[40px]" />
            ) : (
              <p className="text-sm text-pastel-amber">{t("auth_google_not_configured")}</p>
            )}
            {googleScriptError || (googleScriptReady && !googleApi) ? <p className="mt-2 text-sm text-pastel-coral">{t("auth_google_sdk_failed")}</p> : null}
          </div>

          <div>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => void handleAppleSignIn()}
              disabled={linkingProvider !== null || !isAppleConfigured}
            >
              {linkingProvider === "apple" ? t("auth_apple_linking") : t("auth_apple_link")}
            </Button>
            {!isAppleConfigured ? <p className="mt-2 text-sm text-pastel-amber">{t("auth_apple_not_configured")}</p> : null}
            {appleScriptError ? <p className="mt-2 text-sm text-pastel-coral">{t("auth_apple_sdk_failed")}</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-300">{t("auth_already_linked")}</p>
      )}

      {providerError ? <pre className="edge-safe-scroll mt-3 overflow-x-auto rounded-lg border border-pastel-coral/40 bg-pastel-coral/10 p-3 text-xs text-pastel-coral">{providerError}</pre> : null}
      {linkingProvider === "google" ? <p className="mt-3 text-sm text-ink-300">{t("auth_google_linking")}</p> : null}
    </section>
  );
}
