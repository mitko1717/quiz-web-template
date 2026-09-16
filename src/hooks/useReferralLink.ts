"use client";

import { useMemo } from "react";
import { topicConfig, type ProfileResponse } from "@/lib";

export function useReferralLink(profileData: ProfileResponse | undefined): string | null {
  return useMemo(() => {
    if (profileData?.referralLink) return profileData.referralLink;
    if (!profileData?.refCode) return null;
    if (topicConfig.telegramBotUsername) return `https://t.me/${topicConfig.telegramBotUsername}?start=ref_${encodeURIComponent(profileData.refCode)}`;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/?ref=${encodeURIComponent(profileData.refCode)}`;
  }, [profileData?.refCode, profileData?.referralLink]);
}