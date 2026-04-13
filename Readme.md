# Tory Burch Email Analytics Platform

This repository contains the implementation plan and local setup guide for building a full-stack **Email Analytics Platform** from the specification in `EMAIL_ANALYTICS_PLATFORM.md`.

## 1) What We Are Building

A scalable analytics platform that ingests Klaviyo exports (campaign, flow, segment, profile, exclusion files), processes them through a streaming ETL pipeline, and serves:

- Overall email performance analytics
- Flow-level and message-level performance analytics
- Campaign performance analytics
- Segment/profile exclusion analytics
- AI-assisted insights (anomalies, recommendations, NL query)
- Customizable dashboard widgets and saved views

## 2) Proposed Tech Stack

### Backend
- **Node.js + TypeScript + Express**
- **DuckDB** for analytics queries
- **Redis + BullMQ** for ingestion/ML/export jobs
- **Worker Threads** for heavy parsing and long-running tasks

### Frontend
- **React + Vite + TypeScript**
- Dashboard grid with drag/resize widgets
- Charting with Recharts

### ML / AI
- Statistical models (anomaly detection, churn, forecasting)
- Anthropic API integration for insight generation and NL query assistance

## 3) Build Plan (Phased)

## Phase 0 — Project Bootstrap (1–2 days)

**Goals**
- Create monorepo structure (`src`, `client`, `workers`, `scripts`, `tests`, `data`, `docker`)
- Add base tooling (`typescript`, `eslint`, `prettier`, `vitest/jest`, `husky` optional)
- Add environment scaffolding (`.env.example`)

**Deliverables**
- Running API health endpoint
- Running React shell app
- Shared config/constants module

---

## Phase 1 — Data Foundation & ETL (4–6 days)

**Goals**
- Implement streaming parsers for profile/campaign/flow/segment/exclusion files
- Build ingestion orchestrator with job status tracking
- Persist normalized tables in DuckDB

**Key requirements**
- Never load full profile file into memory
- Validate schema and reject malformed uploads early
- Track ingestion progress and failure reason per job

**Deliverables**
- `POST /api/upload/*` endpoints
- Job status API (`GET /api/upload/jobs`, `GET /api/upload/jobs/:jobId`)
- Baseline migration + seed scripts

---

## Phase 2 — Core Analytics APIs (4–5 days)

**Goals**
- Implement four primary analytics modules and endpoints:
  1. Overall performance
  2. Flow performance
  3. Individual flow/message drill-down
  4. Campaign performance
- Add shared filter framework (days/region/persona/channel/tag)

**Deliverables**
- `/api/analytics/overall`
- `/api/analytics/flows`
- `/api/analytics/flows/:flowId`
- `/api/analytics/flows/:flowId/messages/:messageId`
- `/api/analytics/campaigns`
- Segment/exclusion summary endpoints

---

## Phase 3 — Dashboard Customization (3–4 days)

**Goals**
- Build dashboard page with reusable widgets
- Enable drag/drop layout, resize, save/load dashboard configs
- Support global and per-widget filters

**Deliverables**
- Dashboard CRUD APIs
- Widget library (KPI, trend, funnel, comparison, tables)
- Persistent user dashboard preferences

---

## Phase 4 — AI/ML Layer (4–6 days)

**Goals**
- Add nightly anomaly detection and forecasting jobs
- Integrate AI insight generation service
- Add subject-line scoring + NL query endpoint

**Deliverables**
- `/api/ai/insights`, `/api/ai/query`, `/api/ai/subject-line-score`
- Background workers for ML execution
- Insight cards and anomaly indicators in UI

---

## Phase 5 — Hardening, Performance, Release (3–5 days)

**Goals**
- Load/performance testing against large profile files
- Security hardening (auth, rate limit, validation, PII controls)
- CI/CD and containerized deployment

**Deliverables**
- Integration/load tests
- Docker deployment
- Production runbook and monitoring checklist

## 4) Suggested Milestones

- **M1:** Upload + ETL + data persisted in DuckDB
- **M2:** Analytics APIs complete and validated
- **M3:** Dashboard UI with customizable layouts
- **M4:** AI/ML insights and background jobs live
- **M5:** Production-ready deployment + observability

## 5) Local Development Setup

> The commands below assume Linux/macOS shell with Node 20+ and npm 10+.

### Prerequisites

- Node.js `>= 20.0.0`
- npm `>= 10.0.0`
- Docker + Docker Compose (for Redis)

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd kia-codex
npm install
```

If frontend is kept under `client/`:

```bash
cd client
npm install
cd ..
```

### 2. Configure environment

Create `.env` from template:

```bash
cp .env.example .env
```

Minimum values to set:

- `PORT=3001`
- `DUCKDB_PATH=./data/processed/analytics.duckdb`
- `REDIS_URL=redis://localhost:6379`
- `ANTHROPIC_API_KEY=<your_key>`

### 3. Start local infrastructure

```bash
docker compose up -d redis
```

### 4. Run migrations and optional seed

```bash
npm run migrate
npm run seed
```

### 5. Start backend and frontend

Backend:

```bash
npm run dev
```

Frontend (if separate app):

```bash
cd client
npm run dev
```

### 6. Access the app

- API: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## 6) Definition of Done (DoD)

A release is done when:
- All upload flows process real sample files successfully
- Analytics endpoints return validated KPIs for 30/60/90-day filters
- Dashboard layouts are customizable and persist per user
- AI insights are generated asynchronously without blocking API requests
- Test suites pass (unit + integration + load smoke)
- Docker deployment works end-to-end locally

## 7) Next Action Items

1. Scaffold repository structure from specification
2. Implement ingestion pipeline and DuckDB schema first
3. Add analytics APIs before UI complexity
4. Introduce AI/ML only after baseline analytics are stable

---

For full functional and schema details, refer to:
- `EMAIL_ANALYTICS_PLATFORM.md`
