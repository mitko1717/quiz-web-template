# Frontend security review

Re-verified on 2026-10-13 against the previous frontend review. This covers
repository source and the four clone paths configured in `scripts/clones.json`;
it does not certify backend behavior or deployed headers.

## Checklist

Changed statuses are marked **changed** in the table. All other rows retain
their previous status.

| # | Status | File:line | Comment |
|---:|:---:|---|---|
| 1 | ✅ unchanged | `src/lib/topic.config.ts:18-24,31-33`; `.gitignore:33-34` | Public configuration, including `NEXT_PUBLIC_TELEGRAM_ADMIN_USER_IDS`, contains identifiers/settings rather than credentials. No bot token was identified. `.env` and `.env.local` are ignored; `.env.example` is referenced by README but absent from this checkout. |
| 2 | ⚠️ unchanged | `scripts/clones.json:2-6`; `src/components/AuthGate.tsx:71-72` | No credential was confirmed in tracked files or local history of this repo and the four accessible clones. Search coverage is not exhaustive of remote/archived refs or obfuscated secrets. The form still pre-fills `admin`/`admin`; remove these values and run a full secret scan over all refs. |
| 3 | ✅ **changed from ⚠️** | `src/hooks/useAuth.ts:10-16,31,173-186` | The code now documents keeping tokens in `localStorage` as an accepted Mini App tradeoff, including the engine change that an HttpOnly cookie would require. The comment also cites CSP protection, but overstates it: `script-src` permits `'unsafe-inline'` (item 7). `localStorage` remains readable to any script that executes in the origin; this is an accepted, documented risk, not a claim that WebView or CSP prevents token theft. |
| 4 | ✅ unchanged | `src/app/admin/page.tsx:8-24`; `src/components/AuthGate.tsx:229-240`; `src/components/AdminPageContent.tsx:49-50` | Admin UI is gated by auth mode/profile role. Actual authorization must still be enforced by the engine, which is outside this frontend review. |
| 5 | ✅ unchanged | `src/components/SignInPanel.tsx:111`; `src/components/QuestionCard.tsx:297` | No `dangerouslySetInnerHTML` was found. `innerHTML` is used only to clear the Google button container; API text is rendered as React text. |
| 6 | ✅ unchanged | `src/lib/i18n/index.ts:14-21`; `src/components/DailyChallengePageContent.tsx:134-140` | Interpolated translation strings render as React text, which is escaped. No unsafe HTML interpolation was found. |
| 7 | ⚠️ unchanged | `next.config.ts:33-42` | A CSP header is now configured, but `script-src` includes `'unsafe-inline'`, weakening the XSS protection and invalidating the token-storage comment's claim of a restrictive script policy. `img-src https:` is also broad. Prefer nonce/hash-based scripts and narrow source lists; verify headers on the deployed host. |
| 8 | ⚠️ **changed from ✅** | `src/components/SignInPanel.tsx:189-200`; `src/components/AdsgramBanner.tsx:77-82` | Google, Apple, and Adsgram scripts use fixed HTTPS URLs, not user/env-controlled URLs. Their source host/path is fixed, but contents are not integrity-pinned; no Telegram WebApp SDK script reference was found. Verify the deployed Telegram script-loading mechanism and assess the third-party script trust boundary. |
| 9 | ✅ unchanged | `src/components/AdsgramBanner.tsx:46-63,77-82` | The block ID comes from the optional prop or `NEXT_PUBLIC_ADSGRAM_BLOCK_ID`; it does not come from a URL or user input and does not affect the fixed script URL. |
| 10 | ✅ **changed from ⚠️** | `src/lib/url-safety.ts:1-23`; `src/components/MoreGamesSection.tsx:6,19-28`; `src/hooks/useReferralLink.ts:5,9-13` | Outbound links now require HTTPS and an exact/subdomain match to the Telegram host allowlist. More Games filters links before rendering; referral links are validated and fallbacks use fixed `t.me` or the current origin. |
| 11 | ✅ unchanged | `src/components/AuthGate.tsx:106-122`; `src/lib/api/auth.ts:24-35`; `src/hooks/useAuth.ts:151-157` | Client sends Telegram `initData` to the engine and persists tokens only after login succeeds; mere presence is not treated as authentication. Server-side HMAC/freshness validation remains engine scope. |
| 12 | ✅ **changed from ⚠️** | `next.config.ts:24-42` | The configured CSP includes `frame-ancestors https://web.telegram.org https://*.telegram.org` for `/:path*`. This closes the source-configuration gap. Verify deployed headers and that the allowed origins match the Telegram clients in use. |
| 13 | ⚠️ **changed from ❌** | `package.json:17-18,29`; `package-lock.json:13-14,25` | Next.js is upgraded to `16.4.0`; audit fell from 15 findings (14 high, 1 critical) to **10 high, 0 critical** (**5 high, 0 critical** with `--omit=dev`). Findings are in `eslint-config-next` and `@telegram-apps/sdk-react` dependency branches, including vulnerable transitives, so they are not merely two direct-package advisories. `npm outdated` lists 10 packages. Update compatible dependency branches or document/track deferred upstream fixes; rerun the audit. |
| 14 | ✅ unchanged | `src/lib/topic.config.ts:4-6,18-24` | Required topic slug and display name throw when missing; other settings have defaults. |
| 15 | ⚠️ unchanged | `src/lib/http.ts:50-68`; `src/lib/api/auth.ts:12-50`; `src/lib/api/quiz.ts:5-23`; `src/lib/api/daily-challenge.ts:4-16`; `src/lib/types/response.types.ts:5-8` | Auth, quiz/hint, and daily-challenge JSON flows reach browser code; login tokens are expected. Types do not strip extra runtime fields. No live deployment or authorized account was available for Network-tab verification. Inspect actual engine responses and limit them to data needed by the current user. |

## Highest-priority follow-up

1. Tighten CSP by replacing `'unsafe-inline'` with nonce/hash-based script
   authorization where feasible, and narrow broad source directives.
2. Resolve or explicitly track the remaining **10 high** audit findings; the
   current Next.js upgrade removed the critical finding but did not close all
   high findings.
3. Verify deployed CSP and `frame-ancestors` response headers from Telegram and
   confirm that embedding works only from intended Telegram origins.
4. Locate and verify the deployed Telegram WebApp SDK loader; review third-party
   script integrity/trust for Google, Apple, and Adsgram.
5. Inspect authorized login, hint, and daily-challenge Network responses for
   excess user or internal data.

## Scope and limitations

- The history review covered local refs for this repository and the four
  configured, accessible clone paths. Remote/archived refs were not fetched;
  keyword searches cannot prove the absence of every possible secret.
- `.env` and `.env.local` are ignored and untracked; values were not disclosed.
- No live deployment, authorized test account, or browser Network capture was
  available. Backend authorization, Telegram init-data validation, response
  minimization, deployed headers, and the deployed Telegram script loader
  therefore remain unverified.
- Audit counts are the current `npm audit` results at re-verification time;
  dependency findings include transitive packages within the named dependency
  branches.
