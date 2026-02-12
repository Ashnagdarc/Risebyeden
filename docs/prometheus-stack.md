# Prometheus Stack (Free, Self-Hosted)

This project includes a local monitoring stack using:

- Prometheus
- Alertmanager
- Grafana OSS

## Prerequisites

- App running locally on `http://localhost:3000`
- Docker + Docker Compose

## Start stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Access endpoints:

- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Grafana: `http://localhost:3001`

Default Grafana credentials:

- username: `admin`
- password: `admin`

Override with environment variables before starting:

- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

## Scrape target

Prometheus scrapes:

- `http://host.docker.internal:3000/api/system/metrics`

If your app runs on another host/port, update:

- `monitoring/prometheus/prometheus.yml`

Then reload Prometheus:

```bash
curl -X POST http://localhost:9090/-/reload
```

## Built-in alert rules

Configured in:

- `monitoring/prometheus/alerts/risebyeden-alerts.yml`

Initial alerts:

- metrics endpoint down
- overall health degraded
- database degraded
- cache degraded (only when cache is configured)

