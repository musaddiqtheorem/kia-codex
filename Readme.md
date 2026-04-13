# Tory Burch Email Analytics Platform (MVP Backend + Frontend)

This repository now includes a working MVP implementation aligned to the requested next steps:

1. Real DuckDB-backed analytics queries (via @duckdb/node-api)
2. Chunked upload endpoint + Redis/BullMQ job tracking
3. Dashboard widget engine + persisted layouts
4. AI/ML-style async insights endpoints

## Implemented Features

### 1) Real analytics queries (DuckDB)

- `GET /api/analytics/overall?days=90`
- `GET /api/analytics/flows`
- `GET /api/analytics/campaigns`

These endpoints now run SQL against `campaign_performance` and `flow_performance` instead of returning hardcoded placeholders.

### 2) Chunked upload + job tracking (BullMQ)

- `POST /api/upload/chunk` accepts chunk metadata and chunk file
- Chunks are assembled when all parts are received
- Ingestion job is queued in Redis/BullMQ
- `GET /api/upload/jobs` returns persisted ingestion job history

### 3) Dashboard engine + persisted user layouts

- `POST /api/dashboard` create dashboard
- `PUT /api/dashboard/:id` update layout/widgets
- `GET /api/dashboard` list dashboards
- `GET /api/dashboard/default` get latest dashboard

Layouts are persisted in DuckDB table `dashboard_configs` using JSON payloads.

### 4) AI insights async worker + endpoints

- `POST /api/ai/insights/generate` queues async insight generation
- `GET /api/ai/insights` returns generated insights
- `POST /api/ai/query` provides basic NL-style analytics answer routing

Insights are persisted in `ai_insights`.

## Local Development

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker

### Install

```bash
npm install
npm --prefix client install
```

### Configure env

```bash
cp .env.example .env
# set REDIS_URL and DUCKDB_PATH if needed
```

### Start Redis

```bash
docker compose -f docker/docker-compose.yml up -d redis
```

### Migrate + seed

```bash
npm run migrate
npm run seed
```

### Start backend + frontend

```bash
npm run dev
```

- API: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## Frontend Screens

- `/` Dashboard widget layout editor (add + save widgets)
- `/upload` chunked upload tester
- `/ai` generate/view async insights

## Production build

```bash
npm run build
npm start
```
