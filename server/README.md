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
FREE_ASKS_PER_DAY=3
MAX_ASKS_PER_IP_PER_DAY=30
MAX_AI_REQUESTS_PER_DAY=500
ASK_SCRIPTURE_ENABLED=true
IP_HASH_SECRET=
```

Use a long random value for `IP_HASH_SECRET`. Do not expose it to the mobile app.

4. Deploy the service.
5. Open the Railway-generated public domain and verify `/health`.
6. Set the mobile app environment variable:

```sh
EXPO_PUBLIC_FAITH_API_URL=https://your-railway-domain
```

7. Restart the Expo app so the public API URL is loaded.

## Usage Limit Semantics

Ask Scripture uses anonymous usage buckets, not accounts. The mobile app generates a random installation UUID and sends it as `X-Faith-Client-Id`. The server applies:

- per-install UTC-day limit from `FREE_ASKS_PER_DAY`
- hashed-IP UTC-day backstop from `MAX_ASKS_PER_IP_PER_DAY`
- global UTC-day OpenAI cap from `MAX_AI_REQUESTS_PER_DAY`
- emergency switch from `ASK_SCRIPTURE_ENABLED`

Daily devotional/streak dates remain device-local. AI usage limits use server UTC dates.

PostgreSQL stores only usage counters: bucket type, bucket key, UTC date, counts, and timestamps. It does not store questions, answers, passages, onboarding data, journal entries, names, emails, or device fingerprints.

No auth, user accounts, embeddings, RevenueCat, queues, or subscriptions are used in Phase 5A.1.

Phase 5A.2 keeps the free anonymous limit at `FREE_ASKS_PER_DAY` and the same IP/global caps. Future paid tiers can raise the per-install limit after purchase validation, but server-side abuse and spend caps should remain in place for every tier.
