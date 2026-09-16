# Faith & Me API

Small Railway-ready API for Phase 5A Ask Scripture.

## Local Development

```sh
cd server
npm install
cp .env.example .env
npm run dev
```

Set `OPENAI_API_KEY` in `server/.env.local` or `server/.env` for real Ask Scripture responses. `OPENAI_MODEL` is optional and defaults to `gpt-5.5`. The server starts in development without a key, but `POST /api/ask-scripture` returns a safe `503` until the key is configured.

Health check:

```sh
curl http://localhost:3000/health
```

iOS Simulator can generally reach the Mac host with `http://localhost:3000`. Physical devices usually cannot use the Mac's localhost directly; use a reachable development host URL for device testing.

## Railway Deployment

1. Create a Railway service from this repo. The root `railway.json` tells Railway to build and start the API from `server/`.
2. Set `OPENAI_API_KEY` in Railway variables.
3. Deploy the service.
4. Open the Railway-generated public domain and verify `/health`.
5. Set the mobile app environment variable:

```sh
EXPO_PUBLIC_FAITH_API_URL=https://your-railway-domain
```

6. Restart the Expo app so the public API URL is loaded.

No database, embeddings, auth, queues, or subscriptions are used in Phase 5A.
