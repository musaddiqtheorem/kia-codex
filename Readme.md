# Tory Burch Email Analytics Platform (MVP Backend + Frontend)

This repository includes an MVP implementation for:

1. Real DuckDB-backed analytics queries (via @duckdb/node-api)
2. Chunked upload endpoint + ingestion job tracking
3. Dashboard widget engine + persisted layouts
4. AI-style async insights endpoints

## Implemented Features

### 1) Real analytics queries (DuckDB)

- `GET /api/analytics/overall?days=90`
- `GET /api/analytics/flows`
- `GET /api/analytics/campaigns`

### 2) Chunked upload + job tracking

- `POST /api/upload/chunk` accepts chunk metadata and chunk file
- Chunks are assembled when all parts are received
- `GET /api/upload/jobs` returns persisted ingestion job history

### 3) Dashboard engine + persisted user layouts

- `POST /api/dashboard` create dashboard
- `PUT /api/dashboard/:id` update layout/widgets
- `GET /api/dashboard` list dashboards
- `GET /api/dashboard/default` get latest dashboard

### 4) AI insights endpoint

- `POST /api/ai/insights/generate` creates an insight job
- `GET /api/ai/insights` returns generated insights
- `POST /api/ai/query` provides basic NL-style analytics answer routing

## Queue modes (important for local setup)

The app supports two queue modes:

- `QUEUE_MODE=memory` (default): **no Redis/Docker required**
- `QUEUE_MODE=redis`: uses BullMQ + Redis

If Docker is unavailable on your system (e.g., `'docker' is not recognized` on Windows), keep `QUEUE_MODE=memory` and skip Redis setup.

## Local Development

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker (optional, only for `QUEUE_MODE=redis`)

### Install

```bash
npm install
npm --prefix client install
```

### Configure env

```bash
cp .env.example .env
# default uses QUEUE_MODE=memory (no Docker needed)
# set QUEUE_MODE=redis only if Redis is available
```

### Optional: start Redis (only QUEUE_MODE=redis)

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
- `/ai` generate/view insights

## Production build

```bash
npm run build
npm start
```
