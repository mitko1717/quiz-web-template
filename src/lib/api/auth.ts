import { request } from "../http";
import { topicConfig } from "../topic.config";
import type { AuthResponse } from "../types";

// Topic is bound at login. Every auth call sends topicConfig.slug so the engine
// issues a token scoped to THIS theme. All other endpoints inherit it from the token.
// ⚠️ If your engine's /auth route reads topic from a header or a different field
//    name instead of body `topicSlug`, change it HERE only (one place).
const topicSlug = topicConfig.slug;

export const authApi = {
  guestLogin(deviceId: string, invitedBy?: string | null, refCode?: string) {
    return request<AuthResponse>("/auth/guest", { method: "POST", body: { deviceId, topicSlug, invitedBy: invitedBy ?? null, ...(refCode ? { refCode } : {}) } });
  },

  googleLogin(idToken: string, deviceId: string, invitedBy?: string | null, refCode?: string) {
    return request<AuthResponse>("/auth/google", { method: "POST", body: { idToken, deviceId, topicSlug, invitedBy: invitedBy ?? null, ...(refCode ? { refCode } : {}) } });
  },

  appleLogin(identityToken: string, deviceId: string, invitedBy?: string | null, refCode?: string) {
    return request<AuthResponse>("/auth/apple", { method: "POST", body: { identityToken, deviceId, topicSlug, invitedBy: invitedBy ?? null, ...(refCode ? { refCode } : {}) } });
  },

  telegramLogin(initData: string, invitedBy?: string | null, refCode?: string, deviceId?: string) {
    return request<AuthResponse>("/auth/telegram", {
      method: "POST",
      body: {
        initData,
        topicSlug,
        invitedBy: invitedBy ?? null,
        ...(refCode ? { refCode } : {}),
        ...(deviceId ? { deviceId } : {}),
      },
      credentials: "include",
    });
  },

  refresh(refreshToken: string) {
    // No topicSlug: the refresh token already carries topic from the original login.
    return request<AuthResponse>("/auth/refresh", { method: "POST", body: { refreshToken } });
  },

  localLogin(username: string, password: string, initData?: string) {
    return request<AuthResponse>("/auth/local", {
      method: "POST",
      body: {
        username,
        password,
        topicSlug,
        ...(initData ? { initData } : {}),
      },
    });
  },
};