# Risebyeden

Risebyeden is a Next.js 15 property investment platform with role-based admin/client workflows, API-backed portfolio data, consultation flows, and Valkey-backed response caching.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Prisma + PostgreSQL
- NextAuth credentials auth
- Valkey (Redis protocol) cache layer
- Sentry-ready instrumentation hooks

## Features

- Admin APIs for users, clients, properties, advisors, consultations, invites, and price updates
- Client APIs for portfolio, properties, profile/settings, interest requests, and consultations
- Rate limiting on auth and enlist endpoints with automatic stale bucket cleanup
- API response caching + invalidation hooks for high-read endpoints
- Pagination support on all admin list endpoints

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Valkey 9+ (or Redis-compatible service)

## Setup

1. Install dependencies:

```bash
npm ci
```

2. Copy env template and set values:

```bash
cp .env.example .env
```

3. Run database migrations:

```bash
npx prisma migrate dev
```

4. Start dev server:

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Docker Services (DB + Cache)

```bash
docker compose up -d db valkey
```

Set `POSTGRES_PASSWORD` in your environment (or `.env`) before starting docker compose.

This starts:
- Postgres `16.6-alpine` on `5432`
- Valkey `9.0.2` on `6379`

Both services include healthchecks.

## Useful Commands

```bash
npm run lint
npm run build
npm run test:cache-hooks
npx prisma validate
npx prisma migrate status
```

## Production Notes

- Set strong secrets for `NEXTAUTH_SECRET` / `AUTH_SECRET`.
- Set `DATABASE_URL` and `VALKEY_URL` to production services.
- Use TLS-enabled SMTP credentials if consultation email notifications are required.
- Build with the provided multi-stage `Dockerfile` (non-root runtime image).
- CI workflow (`.github/workflows/ci.yml`) runs lint, build, Prisma validation, and cache-hook checks.

## Cache + Invalidation

- Cache backend: Valkey via `lib/cache/valkey.ts`
- Key definitions: `lib/cache/keys.ts`
- Write endpoints clear affected keys to keep admin/client reads consistent.

## Project Structure (Key Areas)

- `app/api` - API route handlers
- `lib/security` - token + rate-limit logic
- `lib/cache` - cache client and key catalog
- `prisma` - schema and migrations
- `scripts/test-cache-hooks.js` - guard test for cache invalidation wiring
