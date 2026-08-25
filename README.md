# quiz-web-template

A theme-agnostic Next.js frontend for the [quiz-platform-engine](../quiz-platform-engine).
Copy this repo per quiz topic (capitals, planets, football, ...) and configure it entirely
through environment variables — **no code changes per theme**.

## How it works

The engine is generic: a user's topic is bound at login (the JWT carries the topic), and
every question's display data arrives in a generic `publicFields` bag. This template reads
that bag through a single config module (`src/lib/topic.config.ts`), which is driven by env.

To ship a new theme:

1. Copy this repo.
2. Set the env vars below.
3. Add the topic's i18n keys (nouns + scope labels).
4. Deploy.

That's it — the components, hooks, and API client are already topic-neutral.

## Quick start

```bash
cp .env.example .env.local   # then edit values (see below)
npm install
npm run dev                  # http://localhost:3000
```

The engine must be running and reachable at `NEXT_PUBLIC_API_BASE_URL`.

## Environment variables

All theme configuration lives in env. `NEXT_PUBLIC_` vars are inlined at **build time**,
so changing a theme requires a rebuild/restart — one build serves one topic.

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | yes | `http://localhost:3000` | Engine base URL |
| `NEXT_PUBLIC_TOPIC_SLUG` | yes | `capitals` | Engine topic slug (must match the engine's `topics.manifest.json`); bound at login |
| `NEXT_PUBLIC_APP_NAME` | yes | `Capitalz Quiz` | Display name in titles, dev tool, referral copy |
| `NEXT_PUBLIC_FIELD_DISPLAY_NAME` | yes | `countryName` | Key inside `question.publicFields` used as the question title |
| `NEXT_PUBLIC_FIELD_BADGE` | no | `flagEmoji` | Key in `publicFields` for a small icon/emoji; leave empty for none |
| `NEXT_PUBLIC_SCOPE_PARAM` | no | `continent` | Query-param name the engine reads for scope filtering |
| `NEXT_PUBLIC_SCOPE_WORLD` | no | `WORLD` | The "all / no filter" scope sentinel |
| `NEXT_PUBLIC_SCOPES` | no | see below | Scope options shown in the UI |
| `NEXT_PUBLIC_MAX_ITEM_COUNT` | no | `195` | Upper bound for admin numeric inputs (item pool size) |

If `NEXT_PUBLIC_SCOPES` is empty, the scope selector is hidden entirely (topics without scopes).

### `NEXT_PUBLIC_SCOPES` format

Comma-separated `value:labelKey` pairs. `value` is what the engine expects; `labelKey` is
an i18n key that must exist in your locale files.

```
NEXT_PUBLIC_SCOPES=WORLD:scope.world,africa:scope.africa,europe:scope.europe
```

## Per-theme i18n keys

Two groups of keys are theme-specific and must exist for your topic in every locale
(`src/lib/i18n/en.ts`, `es.ts`, `uk.ts`):

1. **Nouns**, keyed by slug — used in prompts, direction labels, and free-text placeholders:
   ```
   <slug>_prompt_noun   // e.g. capitals_prompt_noun = 'capital'
   <slug>_answer_noun   // e.g. capitals_answer_noun = 'country'
   ```
2. **Scope labels** — every `labelKey` referenced in `NEXT_PUBLIC_SCOPES`:
   ```
   scope.world, scope.africa, ...
   ```

Missing keys render as the raw key string, so add all of them.

## Example: capitals vs planets

**Capitals `.env.local`:**
```
NEXT_PUBLIC_TOPIC_SLUG=capitals
NEXT_PUBLIC_APP_NAME=Capitalz Quiz
NEXT_PUBLIC_FIELD_DISPLAY_NAME=countryName
NEXT_PUBLIC_FIELD_BADGE=flagEmoji
NEXT_PUBLIC_SCOPE_PARAM=continent
NEXT_PUBLIC_SCOPES=WORLD:scope.world,africa:scope.africa,americas:scope.americas,asia:scope.asia,europe:scope.europe,oceania:scope.oceania
NEXT_PUBLIC_MAX_ITEM_COUNT=195
```

**Planets `.env.local`:**
```
NEXT_PUBLIC_TOPIC_SLUG=planets
NEXT_PUBLIC_APP_NAME=Planets Quiz
NEXT_PUBLIC_FIELD_DISPLAY_NAME=planetName
NEXT_PUBLIC_FIELD_BADGE=
NEXT_PUBLIC_SCOPE_PARAM=type
NEXT_PUBLIC_SCOPES=WORLD:scope.world,terrestrial:scope.terrestrial,gas-giant:scope.gasGiant,ice-giant:scope.iceGiant,dwarf:scope.dwarf
NEXT_PUBLIC_MAX_ITEM_COUNT=9
```
(plus `planets_prompt_noun` / `planets_answer_noun` and the `scope.*` labels in each locale)

## What is and isn't theme-specific

**Configured via env / i18n (edit per theme):**
- topic slug, app name, display/badge field keys
- scope param, scope options and their labels
- topic nouns and scope labels in i18n

**Generic (never edit per theme):**
- `src/lib/api/*` — API client (sends `itemId`, reads `publicFields`)
- `src/hooks/*`, `src/components/*` — all topic-neutral
- `QuizScope` is a plain `string`; scopes come from config, not a hardcoded enum

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build (env inlined here)
npm run start       # serve production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## Notes / known gaps

- `NEXT_PUBLIC_*` is build-time; runtime topic switching would need an engine-served UI
  schema endpoint instead (future work — the "shared UI package", QE-55).
- localStorage keys are slug-prefixed, so multiple themes on the same domain don't collide
  (switching themes logs out the previous one).
- Not yet verified end-to-end against a non-capitals topic — first real run is expected to
  surface bugs.