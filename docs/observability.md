# Observability Runbook

This document captures the baseline observability setup in the application repository.

## 1) Structured application logs

- Logger utility: `lib/observability/logger.ts`
- Output format: one JSON line per log event.
- Core fields:
  - `timestamp`
  - `level`
  - `event`
  - optional contextual fields (`userId`, `requestId`, `action`, etc.)

Current high-impact coverage includes:

- authentication warnings (`lib/auth.ts`)
- enlist flow errors (`app/api/auth/enlist/route.ts`)
- interest request assignment/rejection outcomes (`app/api/admin/interest-requests/route.ts`)
- consultation request creation failures (`app/api/client/consultations/route.ts`)
- cache/Valkey connectivity + operation failures (`lib/cache/valkey.ts`)

## 2) Health probes

- Endpoint: `GET /api/system/health`
- Result:
  - `200` when DB is healthy and cache is healthy (or cache is not configured)
  - `503` when DB is down or configured cache is unreachable
- Response includes:
  - `status`
  - per-service status (`database`, `cache`)
  - `checkedAt`
  - `latencyMs`

## 3) Sentry integration

- Sentry request/error capture remains enabled via:
  - `instrumentation.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`

## 4) Alerting guidance (infra layer)

Set up external monitors to alert on:

- repeated `503` from `/api/system/health`
- spike in `auth.enlist.failed`
- spike in `admin.interest_request.update_failed`
- spike in cache connection failures (`valkey.connect_failed`)
- elevated Next.js 5xx responses in Sentry/APM

## 5) Next improvements

- add request correlation IDs and include them in all logs
- expose metrics to a TSDB (Prometheus/Datadog/CloudWatch)
- define SLOs for auth, admin actions, and client request flows
