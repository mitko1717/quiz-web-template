# Frontend security review

Reviewed on 2026-10-13. This review covers the frontend repository and the four
clone paths configured in `scripts/clones.json`; it does not certify backend
behavior or deployment-layer controls.

## Checklist

| # | Status | File:line | Comment |
|---:|:---:|---|---|
| 1 | ✅ | `src/lib/topic.config.ts:31-33`; `.gitignore:33-34`; `README.md:25` | Reviewed public environment configuration. `NEXT_PUBLIC_TELEGRAM_ADMIN_USER_IDS` contains user IDs, which are identifiers rather than credentials. No bot-token env key or exposed bot token was identified. `.env` and `.env.local` are ignored; `.env.example` is referenced by the README but absent in this checkout. |
| 2 | ⚠️ | `scripts/clones.json:2-6`; `src/components/AuthGate.tsx:71-72` | Ran the requested keyword search over all refs in this repository and the four configured, accessible clones. No actual credential was confirmed and no `.env` paths appeared in available history. A keyword search cannot prove no differently named or obfuscated secret was committed; remote and archived refs were not inspected. Remove the prefilled `admin`/`admin` values and run secret scanning over all remote/archived refs; revoke and rotate any confirmed credential. |
| 3 | ⚠️ | `src/hooks/useAuth.ts:8,24-26,167` | Access and refresh tokens are stored in `localStorage`, where injected scripts can read them. No explicit Mini App-specific rationale for this choice was found. Prefer an `HttpOnly`, `Secure`, appropriately `SameSite` refresh-token cookie and short-lived in-memory access tokens if the engine supports it; otherwise document the constraint and maintain strong XSS controls. |
| 4 | ✅ | `src/app/admin/page.tsx:9-24`; `src/components/AuthGate.tsx:229-232`; `src/components/AdminPageContent.tsx:49-50` | The `/admin` UI is gated by auth mode and the profile-derived admin flag. This is UI gating only; actual authorization must be enforced by the engine, which is outside this repository's scope. |
| 5 | ✅ | `src/components/QuestionCard.tsx:297`; `src/components/SignInPanel.tsx:96` | No `dangerouslySetInnerHTML` use was found. API-backed text is rendered as JSX text. The `innerHTML` use only clears the Google button container; it does not inject untrusted HTML. |
| 6 | ✅ | `src/lib/i18n/index.ts:14-21`; `src/components/DailyChallengePageContent.tsx:134-140` | Translation interpolation returns strings rendered as React text nodes, which React escapes. No unsafe HTML interpolation was found. |
| 7 | ⚠️ | `next.config.ts:24-34` | No CSP was found in repository source or deployment configuration. Add a restrictive CSP at the deployment boundary or in Next headers; account for required API, image, and script origins, including Adsgram and any third-party sign-in providers. |
| 8 | ⚠️ | `src/components/SignInPanel.tsx:189-200`; `src/components/AdsgramBanner.tsx:77-82` | The inspected external `next/script` URLs are fixed HTTPS URLs for Google, Apple, and Adsgram, not user- or environment-controlled. The source pins host/path, not script contents or integrity hashes. No Telegram WebApp SDK script was identified in the inspected script references; confirm the deployed Telegram integration's script-loading mechanism. |
| 9 | ✅ | `src/components/AdsgramBanner.tsx:46-63` | Adsgram's block ID comes from the optional prop or `NEXT_PUBLIC_ADSGRAM_BLOCK_ID`, not a URL parameter or user input. It is passed as an SDK option and does not alter the script URL. |
| 10 | ⚠️ | `src/components/MoreGamesSection.tsx:18-27`; `src/hooks/useReferralLink.ts:8-12`; `src/lib/share.ts:2-18` | API-provided `game.tgBotLink` is rendered as an external anchor without URL validation (although `noopener noreferrer` is present). Validate links against an explicit HTTPS host allowlist before rendering. Referral links were observed as displayed/copied/shared rather than navigated; the share URL is built on fixed `https://t.me`. |
| 11 | ✅ | `src/components/AuthGate.tsx:106-122`; `src/lib/api/auth.ts:24-35`; `src/hooks/useAuth.ts:140-153` | The client passes Telegram `initData` to the engine login endpoint and only persists tokens after that mutation succeeds. It does not treat mere init-data presence as authentication. Server-side signature and freshness validation must be verified in the engine audit. |
| 12 | ⚠️ | `next.config.ts:24-34` | No `X-Frame-Options` or CSP `frame-ancestors` policy was found in this repository. Configure an anti-framing policy at the deployment boundary that is compatible with the actual Telegram Mini App embedding model; verify deployed headers. |
| 13 | ❌ | `package.json:18`; `package-lock.json:14` | `npm audit` reported 15 vulnerabilities: 14 high and 1 critical (0 moderate, 0 low); `npm outdated` reported 11 outdated packages. The direct Next.js dependency is `16.3.0`; audit reported affected Next.js advisories, including critical RCE and high SSRF advisories. Update Next.js and the lockfile to a patched release, then rerun the audit and review remaining advisories individually. |
| 14 | ✅ | `src/lib/topic.config.ts:4-6,18-24` | Required `NEXT_PUBLIC_TOPIC_SLUG` and `NEXT_PUBLIC_FIELD_DISPLAY_NAME` values throw when missing; import/build-time evaluation therefore fails loudly where this config module is loaded. Other topic settings have defaults. |
| 15 | ⚠️ | `src/lib/http.ts:50-68`; `src/lib/api/quiz.ts:5-23`; `src/lib/api/daily-challenge.ts:4-16`; `src/lib/types/response.types.ts:5-8` | Login, quiz/hint, and daily-challenge responses are read by browser-side code. The login response includes access and refresh tokens as expected. Static types do not strip extra runtime fields. No live deployment or authorized test account was available to inspect actual Network-tab payloads. Inspect these flows against the engine and ensure responses contain only data required by the current user. |

## Highest-priority actions

1. **Patch Next.js:** Upgrade `next@16.3.0` and update the lockfile to a patched
   release; rerun `npm audit` and address remaining high advisories.
2. **Add a CSP:** Restrict scripts and connections to required origins, including
   the configured API and the fixed Adsgram, Google, and Apple script hosts.
3. **Add anti-framing controls:** Set `frame-ancestors` (and compatible
   `X-Frame-Options`, if appropriate) in the deployed response headers, after
   confirming Telegram's required embedding behavior.
4. **Review token persistence:** Prefer an HttpOnly refresh cookie and
   short-lived in-memory access token if supported; otherwise document why
   `localStorage` is required for this Mini App and keep XSS controls strong.
5. **Validate outbound game links:** Validate API-provided `tgBotLink` values
   against an explicit HTTPS host allowlist before rendering navigable links.

## Scope and limitations

- The history search covered all refs in this repository and the four
  clone paths configured in `scripts/clones.json`; remote and archived refs
  beyond those local checkouts were not inspected. The search found no
  confirmed credential, but keyword searches are not exhaustive secret scans.
- `.env` and `.env.local` are ignored and untracked; their values were not
  disclosed. The referenced `.env.example` was absent from this checkout.
- The engine is outside this repository, so backend authorization,
  Telegram `initData` HMAC/freshness validation, and response minimization
  cannot be confirmed here.
- No live deployment or authorized test account was available for browser
  Network-tab inspection or verification of deployment-layer CSP and
  anti-framing headers.
- Dependency audit and outdated-package results reflect the registry and
  dependency tree at review time.
