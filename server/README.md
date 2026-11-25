# Faith & Me API

Small Railway-ready API for Phase 5A Ask Scripture.

## Local Development

```sh
cd server
npm install
cp .env.example .env
npm run dev
```

Set `OPENAI_API_KEY` in `server/.env.local` or `server/.env` for real Ask Scripture responses. `OPENAI_MODEL` is optional and defaults to `gpt-5.6-luna`; if you set it in Railway or a local env file, that override wins. `OPENAI_REASONING_EFFORT` defaults to `low`. For local development without `DATABASE_URL`, anonymous usage counters use an in-memory store. Production requires `DATABASE_URL` so daily usage limits survive restarts and deploys.

Health check:

```sh
curl http://localhost:3000/health
```

iOS Simulator can generally reach the Mac host with `http://localhost:3000`. Physical devices usually cannot use the Mac's localhost directly; use a reachable development host URL for device testing.

## Railway Deployment

1. Create a Railway service from this repo. The root `railway.json` tells Railway to build and start the API from `server/`.
2. Add Railway PostgreSQL to the project and set `DATABASE_URL` on the API service.
3. Set these Railway variables:

```sh
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
OPENAI_REASONING_EFFORT=low
OPENAI_PLUS_REASONING_EFFORT=medium
FREE_ASKS_PER_DAY=1
PLUS_ASKS_PER_DAY=20
MAX_ASKS_PER_IP_PER_DAY=30
MAX_AI_REQUESTS_PER_DAY=500
ASK_SCRIPTURE_ENABLED=true
IP_HASH_SECRET=
ASK_SESSION_SECRET=
REVENUECAT_API_KEY=
REVENUECAT_ENTITLEMENT_ID=plus
```

Use separate, long random values for `IP_HASH_SECRET` and `ASK_SESSION_SECRET`, for example by running `openssl rand -hex 32` for each. Keep the session secret stable across deploys and identical on all API replicas. Keep both secrets on the server.

`REVENUECAT_API_KEY` is the server-only RevenueCat secret API key. When enabled, the server loads the entitlement from RevenueCat for verified purchase sessions and applies `PLUS_ASKS_PER_DAY` and deeper reasoning for Plus. Keep the RevenueCat entitlement identifier set to `plus` to match the app. With RevenueCat disabled, Ask Scripture uses the free tier.

4. Deploy the service.
5. Open the Railway-generated public domain and verify `/health`.
6. Set the mobile app environment variable:

```sh
EXPO_PUBLIC_FAITH_API_URL=https://your-railway-domain
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
```

7. Build the native app with the public SDK key for the target platform. Set RevenueCat's restore behavior to **Transfer to new App User ID** so users can recover access after reinstalling or moving to another device with the same store account.

## Usage Limit Semantics

Ask Scripture uses the installation UUID in `X-Faith-Client-Id` for usage counters. To enable purchases, `POST /api/ask-scripture/session` issues a separate RevenueCat subscriber ID and a signed session token bound to the installation. The app stores the token in SecureStore and sends it as a bearer credential. `POST /api/ask-scripture/entitlement` verifies the session and refreshes the entitlement after purchase or restore. Existing clients can continue using the free tier with their installation UUID. The server applies:

- per-install UTC-day limit from `FREE_ASKS_PER_DAY` (free tier) or `PLUS_ASKS_PER_DAY` (active `plus` entitlement)
- hashed-IP UTC-day backstop from `MAX_ASKS_PER_IP_PER_DAY` (free tier only; paying members are never blocked by shared networks)
- global UTC-day OpenAI cap from `MAX_AI_REQUESTS_PER_DAY`
- emergency switch from `ASK_SCRIPTURE_ENABLED`

## Scripture Integrity

The server resolves canonical passage text (BSB for English, RV1909 for Spanish) from each requested reference using the datasets in the repository `data/` directory. Client-supplied passage text is accepted for backwards compatibility but never trusted or forwarded to the model. Unknown references are rejected with `INVALID_REQUEST`. Set `BIBLE_DATA_DIR` if the data files live somewhere other than `./data` or `../data` relative to the server working directory.

Daily devotional/streak dates remain device-local. AI usage limits use server UTC dates.

PostgreSQL stores only usage counters: bucket type, bucket key, UTC date, counts, and timestamps. It does not store questions, answers, passages, onboarding data, journal entries, names, emails, or device fingerprints.

Ask Scripture shares submitted questions with OpenAI after the app obtains consent. The server shares onboarding context only when an ask includes explicit personalization consent. The OpenAI Responses request sets `store: false`.

## Ask Request Language

`POST /api/ask-scripture` accepts an optional `language` field:

- `en` for English responses
- `es` for natural Latin American Spanish responses

If omitted, `language` defaults to `en`. The server and app use BSB passages in English and RV1909 passages in Spanish.

## Production Validation

The current production baseline is:

- Node 22 runtime through Railway/Nixpacks
- Railway PostgreSQL connected through `DATABASE_URL`
- `OPENAI_MODEL=gpt-5.6-luna`
- `OPENAI_REASONING_EFFORT=low`
- `/health` returns `200`
- `POST /api/ask-scripture` returns `200` with anonymous usage data when the OpenAI project has access to `gpt-5.6-luna`

Successful Ask logs should include `requestId`, `endpoint`, `status`, `latencyMs`, `model`, `reasoningEffort`, `language`, and `tokenUsage`.
