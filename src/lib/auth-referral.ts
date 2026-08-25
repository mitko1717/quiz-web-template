export function resolveReferralContext(params: {
  search: string;
  hasActiveToken: boolean;
  hasStoredSession: boolean;
}): { invitedBy: string | null; refCode?: string } {
  const { search, hasActiveToken, hasStoredSession } = params;

  if (hasActiveToken || hasStoredSession) {
    return { invitedBy: null };
  }

  const ref = new URLSearchParams(search).get("ref")?.trim().toUpperCase() ?? "";
  if (!ref || !/^[A-Z0-9]{4,32}$/.test(ref)) {
    return { invitedBy: null };
  }

  return { invitedBy: ref, refCode: ref };
}
