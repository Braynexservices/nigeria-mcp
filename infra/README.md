# `infra/` — deploy & cloud (used only when we ship)

**We build and test locally first.** This folder stays empty until a lane is validated and we provision a server for staging/production.

## When we ship (candidates)
- **App hosting:** Fly.io / Railway (app + Postgres) or Cloudflare Workers (edge) or Azure App Service.
- **Data:** Postgres (API keys + audit logs), Redis (cache).
- **Observability:** Sentry / Logtail (free tiers).

## Will hold
- Dockerfile(s), deploy config (fly.toml / railway.json / wrangler.toml), CI, env templates.

## Compliance note
Where a service handles personal data, prefer **NG/compliant data residency** (NDPA).
