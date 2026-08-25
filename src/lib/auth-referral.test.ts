import { resolveReferralContext } from "./auth-referral";

describe("resolveReferralContext", () => {
  it("returns null referral when active token exists", () => {
    const result = resolveReferralContext({
      search: "?ref=ABCD1234",
      hasActiveToken: true,
      hasStoredSession: false,
    });

    expect(result).toEqual({ invitedBy: null });
  });

  it("returns null referral when stored session exists", () => {
    const result = resolveReferralContext({
      search: "?ref=ABCD1234",
      hasActiveToken: false,
      hasStoredSession: true,
    });

    expect(result).toEqual({ invitedBy: null });
  });

  it("returns normalized referral for fresh session", () => {
    const result = resolveReferralContext({
      search: "?ref=ab12cd",
      hasActiveToken: false,
      hasStoredSession: false,
    });

    expect(result).toEqual({ invitedBy: "AB12CD", refCode: "AB12CD" });
  });

  it("ignores invalid referral codes", () => {
    const result = resolveReferralContext({
      search: "?ref=bad-ref",
      hasActiveToken: false,
      hasStoredSession: false,
    });

    expect(result).toEqual({ invitedBy: null });
  });
});
