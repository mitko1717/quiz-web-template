# Capitalz Quiz — Web (local test client)

A minimal Next.js + Tailwind web app used to exercise the backend locally during
development: guest login, pull a question at any difficulty, answer it, use hints, watch
streak/insight points update, inspect `/progress`.

This is **not** the production mobile app — that will be a separate Expo package
(`app/`). This tool exists purely to make backend testing fast without needing a mobile
simulator running.

## Setup

```bash
# from repo root
npm install

cp web/.env.local.example web/.env.local
# edit web/.env.local and set auth/API values:
# - NEXT_PUBLIC_API_BASE_URL (backend URL)
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID (same OAuth client ID as backend GOOGLE_CLIENT_ID)
# - NEXT_PUBLIC_APPLE_CLIENT_ID (Apple Services ID)
# - NEXT_PUBLIC_APPLE_REDIRECT_URI (registered return URL for that Services ID)
```

Google linking uses Google Identity Services and calls `POST /auth/google` with the
returned ID token plus the existing local `deviceId`.

Apple linking uses Sign in with Apple JS and calls `POST /auth/apple` with the
returned identity token plus the existing local `deviceId`.

## Apple setup prerequisites

Apple web sign-in requires account-level setup in Apple Developer. Code changes alone
are not enough.

1. Create or use an existing Services ID for your backend/app pair.
2. Enable Sign in with Apple for that Services ID.
3. Configure and verify your web domain in Apple Developer.
4. Add your exact return URL to the Services ID configuration, then set the same value
  in `NEXT_PUBLIC_APPLE_REDIRECT_URI`.

Without this setup, the Apple button in this dev tool will render but fail gracefully
with a clear configuration error.

## Running

```bash
# from repo root
npm run dev:web

# or from inside web/
cd web
npm run dev
```

Make sure the backend is running first (`npm run dev:backend` from the repo root) — this
app calls it directly and has no offline/mock mode.

## What it does

- On load, silently registers a guest account against the backend (`POST /auth/guest`)
  using a device id persisted in `localStorage`.
- Lets you pick a difficulty level (1-5) and pulls a question (`GET /quiz/question`).
- Submits your answer (`POST /quiz/answer`) and shows correct/wrong state, plus the
  correct answer either way.
- Lets you spend a hint (`POST /quiz/hint`) — either removes a wrong option (levels 1-3)
  or reveals a text clue (levels 4-5), per the backend's difficulty rules.
- Shows live streak and insight points per difficulty level (`GET /progress`).

## Structure

```
web/
├── src/
│   ├── app/            # Next.js App Router entry points
│   ├── components/       # UI components
│   ├── hooks/              # useAuth, useQuiz, useProgress
│   └── lib/                  # apiClient, shared types
└── .env.local.example
```

## Notes

- No production auth model here — the guest token lives in memory, the device id in
  `localStorage`. Fine for a local dev tool, not representative of how the mobile app
  will handle auth.
- No automated tests for this package — it exists to manually test the backend, not the
  other way around.
