# Tory Burch Email Analytics Platform (Scaffold)

This repository now includes a runnable **backend + frontend scaffold** generated from the `EMAIL_ANALYTICS_PLATFORM.md` specification.

## What is implemented

- TypeScript Express API scaffold with routes for:
  - `GET /api/health`
  - `GET /api/analytics/overall`
  - `GET /api/analytics/flows`
  - `GET /api/analytics/campaigns`
  - `POST /api/upload/:type`
  - `GET /api/upload/jobs`
- DuckDB configuration and migration/seed scripts
- React + Vite frontend scaffold with Dashboard and Upload pages
- Docker Compose for Redis local dependency

## Repository layout

```
.
├── src/                 # API server
├── client/              # React frontend
├── scripts/             # migrate + seed scripts
├── docker/              # Docker assets
├── data/                # local storage folders
├── EMAIL_ANALYTICS_PLATFORM.md
└── README.md
```

## Local development

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker

### 1) Install dependencies

```bash
npm install
npm --prefix client install
```

### 2) Configure environment

```bash
cp .env.example .env
```

### 3) Start Redis

```bash
docker compose -f docker/docker-compose.yml up -d redis
```

### 4) Run database setup

```bash
npm run migrate
npm run seed
```

### 5) Start app (API + frontend)

```bash
npm run dev
```

- API: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## Build for production

```bash
npm run build
npm start
```

## Next implementation steps

1. Replace analytics scaffold responses with real DuckDB queries against ingested tables.
2. Implement chunked file upload + job tracking with Redis/BullMQ workers.
3. Add dashboard widget engine and persisted user layouts.
4. Add AI/ML async workers and insights endpoints.

## Notes

- This is an MVP scaffold intended to accelerate implementation.
- Detailed architecture and target feature set remain in `EMAIL_ANALYTICS_PLATFORM.md`.
