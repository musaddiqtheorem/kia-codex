# Tory Burch Email Analytics Platform
### Full-Stack Node.js Application — Build Specification & Claude Code Project

> **Data Source:** Klaviyo exports (Campaign, Flow, Segment, Profile) as of March 23, 2026  
> **Scale:** 4.5M+ profiles · 350+ columns · 7 GB profile file · Multi-region (US, UK, EU, DE, FR, IT, CA, AU, JP, HK, SG, MO)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Source Schema Reference](#2-data-source-schema-reference)
3. [Claude Code Project Structure](#3-claude-code-project-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Data Ingestion Pipeline](#5-data-ingestion-pipeline)
6. [Analytics Modules](#6-analytics-modules)
7. [Dashboard System & Customization Engine](#7-dashboard-system--customization-engine)
8. [AI & ML Capability Layer](#8-ai--ml-capability-layer)
9. [API Reference](#9-api-reference)
10. [Setup & Deployment](#10-setup--deployment)
11. [Environment Variables](#11-environment-variables)

---

## 1. Executive Summary

This platform ingests raw Klaviyo exports and profile data, processes them through a streaming ETL pipeline capable of handling 7 GB files, and surfaces four primary analytics views with AI-powered insights:

- **Overall Email Performance** — configurable time window (30 / 60 / 90 / custom days)
- **Flow Email Performance** — aggregated by flow, with grouping by entry criteria, persona, and trigger event
- **Individual Flow & Individual Email Performance** — drilled-down message-level metrics
- **Campaign Email Performance** — grouped by segment, country/region, labels, and persona, parsed from structured campaign name conventions

The dashboard engine supports full user customization: adding/removing metrics, rearranging panels, saving views, and exporting reports. An AI/ML layer runs continuously in the background using Claude API and statistical models to surface anomalies, predictions, and optimization recommendations.

---

## 2. Data Source Schema Reference

### 2.1 Profile Data (`Sample_Profile.xlsx` → production: `profiles_<date>.xlsx/csv`)

This is the heaviest file — up to 7 GB, 4.5M rows, 390+ columns. The key column groups are:

**Identity & Consent**
```
Email, Klaviyo ID, First Name, Last Name, Country, State/Region, City,
Email Marketing Consent, Email Marketing Consent Timestamp,
SMS Marketing Consent, Profile Created On, signedUpCountry
```

**Purchase & Revenue Signals**
```
Historic Customer Lifetime Value, Historic Number Of Orders,
Total Customer Lifetime Value, Predicted Customer Lifetime Value,
Average Order Value, averageOrderValueLTD, averageOrderValueRolling12m,
netSalesRolling12m, netSalesTotalRevenue, totalTransLTD, totalTransRolling12m,
firstPurchaseDate, lastPurchaseDate, firstPurchaseLocationByChannel,
salesChannel, customerType, segmentWeekly, globalCustomerSegment
```

**Product Affinity (used for Persona derivation)**
```
affinity_boots, affinity_handbags, affinity_loafer, affinity_minibags,
affinity_RTW, affinity_sandals, affinity_shoes, affinity_totes, affinity_bucket,
mostBoughtProductCategoryDesc, mostBoughtProductClassDesc,
mostBoughtProductSubClassDesc, mostBoughtStyleFamily
```

**Channel & Engagement**
```
Email Channel Affinity, SMS Channel Affinity, Last Open, Last Click,
Last Active, First Active, Expected Date Of Next Order, rfeFlag
```

**Flow Test Group Flags** (100+ columns following pattern `{REGION}_{FlowName}_{Control|Test}`)
```
AbandonBrowse_Viewed_Control / Test
AbandonCart_CTAControl / CTATest
AbandonCheckout_ControlGroup / TestGroup
US_DecouplingOnboarding_ControlNew / TestNew
DE_Browse_6Recs_Control / Test  ...etc
```

**Promo Code Tracking** (active_* columns)
```
active_birthday_code, active_welcome_flow, active_winback_code,
active_churn_code, active_bounceback_code, active_pricedrop_flow ...etc
```

**Region-specific Codes** (pattern: `{REGION}_{FlowType}Code{Year}`)
```
US_BirthdayCode, US_BirthdayCode26, US_WelcomeCode26, US_ChurnCode ...
UK_BirthdayCode, DE_WelcomeCode, EU_WinBackCode, FR_BounceBackCode ... etc
```

---

### 2.2 Campaign Performance (`Campaign_Performance__20260323.xlsm`)

**Key Columns:**
```
Date, Campaign Message ID, Campaign Message Name, Send Date, Send Time,
Total Recipients, Total Delivered, Total Opens, Unique Opens,
Total Apple Privacy Opens, Unique Apple Privacy Opens, Open Rate,
Total Clicks, Unique Clicks, Click Rate,
Total Unsubscribes, Unique Unsubscribes, Spam Complaints, Bounces,
Unsubscribe Rate, Bounce Rate, Spam Complaints Rate,
Total Placed Order, Avg Placed Order, Unique Placed Order, Avg Unique Placed Order,
Total Placed Order Value, Avg Placed Order Value, Placed Order Rate,
Revenue Per Recipient (RPR), Tags, Subject, Preview Text,
List, Excluded List, Day of Week, Campaign Message Channel, Region
```

**Campaign Name Convention** (parse from `Campaign Message Name`):
```
Pattern: {YYYYMMDD}_{REGION}_{LANG}_{CHANNEL}_{SEND_TYPE}_{PROMO_TYPE}__{THEME}__{PRODUCT}__{PERSONA}

Example: 20260322_US_EN_Ecom_Mainline_Targeted_Event_SpringEvent_EarlyAccess__CrossCat__CRM
  → date:      2026-03-22
  → region:    US
  → language:  EN
  → channel:   Ecom (vs Retail)
  → send_type: Mainline / Blast / Targeted
  → promo:     Event / FP (Full Price) / Product / Sale
  → theme:     SpringEvent / Shoes / Handbags / CrossCat / Balance
  → persona:   CRM / SaleAffinity / RFNAPreview / FullFile
```

---

### 2.3 Flow Performance (`Flow_Performance__Message__20260323.xlsm`)

**Key Columns:**
```
Date, Flow ID, Flow Name, Message ID, Message Name, Message Channel,
Status, Message Status, Region, Persona, Tags,
Total Recipients, Total Delivered, Unique Opens, Unique Clicks,
Unique Unsubscribes, Bounces, Total Opens, Total Apple Privacy Opens,
Unique Apple Privacy Opens, Open Rate, Total Clicks, Click Rate,
Total Unsubscribes, Spam Complaints, Unsubscribe Rate, Bounce Rate,
Spam Complaints Rate, Total Placed Order, Avg Placed Order,
Unique Placed Order, Avg Unique Placed Order, Total Placed Order Value,
Avg Placed Order Value, Placed Order Rate, Revenue Per Recipient (RPR)
```

**Regions present:** AU, CA, DE, EU, FR, HK, IT, JP, MO, Other, SG, UK, US

---

### 2.4 Flow Inventory (`Flow_Inventory.xlsx`)

**Active Flows Sheet Columns:**
```
Flow Name, Trigger Type, Trigger Name, Re-entry criteria,
Trigger filters, Profile filters, # Emails, Flow Status, Steps, Persona
```

**Trigger Types observed:** Metric (event-based), Segment, Profile Property Assigned

---

### 2.5 Segment Inventory (`Segment_Inventory.xlsx`)

**Main Sheet Columns:**
```
Segment/List Name, Type (Segment|List), Status (Active|Inactive),
Member Count, Creation Date, Rule/Comment, Persona, Group, Persona Confidence
```

**Groups defined:** G-1 through G-14, each with its own sub-sheet

---

### 2.6 List/Segment Performance (`ListSegment_Performance__20260323.xlsm`)

```
Date, Group Id, List/Segment, Total Recipients, Total Delivered,
Total Opens, Unique Opens, Total Apple Privacy Opens, Unique Apple Privacy Opens,
Open Rate, Total Clicks, Unique Clicks, Click Rate,
Total Unsubscribes, Unique Unsubscribes, Spam Complaints, Bounces,
Unsubscribe Rate, Bounce Rate, Spam Complaints Rate,
Total Placed Order, Avg Placed Order, Unique Placed Order, Avg Unique Placed Order,
Total Placed Order Value, Avg Placed Order Value, Placed Order Rate,
Revenue Per Recipient (RPR), Campaign Message Channel, Region
```

---

### 2.7 Profile Exclusions (`Profile_Exclusion__20260323.xlsx`)

```
Exclusion Reason, Count, Exclusion Reason Share (%)
  → Unsubscribed:      1,206,540  (58.4%)
  → Email Bounced:       547,193  (26.5%)
  → Marked as Spam:       30,751  (1.5%)
  → Invalid Email:         7,144  (0.3%)
  → User Suppressed:     275,630  (13.3%)
  → Total Excluded:    2,067,258
```

---

## 3. Claude Code Project Structure

```
email-analytics-platform/
│
├── README.md
├── SPEC.md                          ← This document
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
│
├── claude-code/                     ← Claude Code configuration
│   ├── CLAUDE.md                    ← Claude Code instructions & context
│   └── settings.json
│
├── src/
│   ├── server.ts                    ← Express entry point
│   ├── app.ts                       ← App factory (middleware, routes)
│   │
│   ├── config/
│   │   ├── database.ts              ← DuckDB + Redis connection
│   │   ├── constants.ts             ← Metric definitions, date presets
│   │   └── columnMaps.ts           ← Profile column group mappings
│   │
│   ├── ingestion/                   ← ETL Pipeline
│   │   ├── StreamingProfileParser.ts   ← 7GB streaming XLSX/CSV parser
│   │   ├── CampaignParser.ts           ← Campaign name decoder
│   │   ├── FlowParser.ts               ← Flow + inventory joiner
│   │   ├── SegmentParser.ts            ← Segment inventory merger
│   │   ├── ExclusionParser.ts          ← Profile exclusion loader
│   │   ├── FileWatcher.ts              ← Auto-detect new uploads
│   │   └── IngestionOrchestrator.ts    ← Coordinates all parsers
│   │
│   ├── analytics/
│   │   ├── OverallPerformance.ts       ← Module 1: Overall email KPIs
│   │   ├── FlowPerformance.ts          ← Module 2: Flow-level analytics
│   │   ├── FlowEmailPerformance.ts     ← Module 3: Individual email drill
│   │   ├── CampaignPerformance.ts      ← Module 4: Campaign analytics
│   │   ├── SegmentPerformance.ts       ← Segment-level cross-cuts
│   │   ├── ProfileAnalytics.ts         ← Profile-level aggregations
│   │   └── BenchmarkEngine.ts         ← Compares to industry + own history
│   │
│   ├── ml/
│   │   ├── AnomalyDetector.ts          ← Z-score + CUSUM anomaly flags
│   │   ├── SendTimeOptimizer.ts        ← ML-based send time recommendations
│   │   ├── ChurnPredictor.ts           ← Churn propensity from profile data
│   │   ├── PersonaClusterer.ts         ← k-means clustering on affinities
│   │   ├── LifetimeValueModel.ts       ← CLV regression model
│   │   ├── SubjectLineScorer.ts        ← NLP scoring via Claude API
│   │   ├── CampaignForecaster.ts       ← Time-series revenue forecasting
│   │   └── AIInsightsEngine.ts         ← Claude API orchestrator
│   │
│   ├── routes/
│   │   ├── upload.router.ts            ← File upload endpoints
│   │   ├── analytics.router.ts         ← Analytics query endpoints
│   │   ├── dashboard.router.ts         ← Dashboard config CRUD
│   │   ├── ai.router.ts               ← AI insights endpoints
│   │   └── export.router.ts           ← CSV/PDF export endpoints
│   │
│   ├── middleware/
│   │   ├── auth.ts                     ← JWT authentication
│   │   ├── rateLimiter.ts
│   │   ├── fileValidator.ts            ← MIME + size + schema checks
│   │   └── errorHandler.ts
│   │
│   ├── models/
│   │   ├── DashboardConfig.ts          ← User dashboard layout schema
│   │   ├── UploadJob.ts                ← Ingestion job tracker
│   │   └── UserPreference.ts           ← Saved filters, date windows
│   │
│   └── utils/
│       ├── campaignNameParser.ts        ← Regex decoder for campaign names
│       ├── dateUtils.ts                 ← Rolling window helpers
│       ├── metricFormatter.ts           ← % / currency / number formatters
│       ├── columnGrouper.ts             ← Profile column auto-classifier
│       └── logger.ts
│
├── client/                          ← React frontend
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           ← Main customizable dashboard
│   │   │   ├── OverallPerformance.tsx
│   │   │   ├── FlowPerformance.tsx
│   │   │   ├── CampaignPerformance.tsx
│   │   │   ├── ProfileExplorer.tsx     ← Profile-level browser
│   │   │   ├── AIInsights.tsx          ← AI recommendation center
│   │   │   └── Upload.tsx              ← File upload & job status
│   │   │
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardGrid.tsx   ← Drag-and-drop grid (react-grid-layout)
│   │   │   │   ├── WidgetLibrary.tsx   ← Catalogue of all available widgets
│   │   │   │   ├── WidgetWrapper.tsx   ← Resizable widget container
│   │   │   │   └── SaveViewModal.tsx
│   │   │   │
│   │   │   ├── charts/
│   │   │   │   ├── KPICard.tsx         ← Metric tile with sparkline
│   │   │   │   ├── TrendLine.tsx       ← Recharts time-series
│   │   │   │   ├── HeatMap.tsx         ← Day-of-week / hour send performance
│   │   │   │   ├── FunnelChart.tsx     ← Delivered → Open → Click → Purchase
│   │   │   │   ├── BarComparison.tsx   ← Region / persona comparisons
│   │   │   │   ├── SankeyFlow.tsx      ← Flow step drop-off visualization
│   │   │   │   └── ScatterPlot.tsx     ← RPR vs Open Rate by campaign
│   │   │   │
│   │   │   ├── filters/
│   │   │   │   ├── DateRangePicker.tsx ← 30/60/90/custom presets
│   │   │   │   ├── RegionFilter.tsx
│   │   │   │   ├── PersonaFilter.tsx
│   │   │   │   ├── ChannelFilter.tsx
│   │   │   │   └── TagFilter.tsx
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── InsightCard.tsx     ← AI recommendation tile
│   │   │   │   ├── AnomalyBadge.tsx    ← Alert on anomalous metrics
│   │   │   │   ├── SubjectLineGrader.tsx
│   │   │   │   └── NaturalLanguageQuery.tsx ← "Ask your data" input
│   │   │   │
│   │   │   └── upload/
│   │   │       ├── DropZone.tsx        ← Chunked upload for 7GB files
│   │   │       ├── ProgressTracker.tsx
│   │   │       └── SchemaPreview.tsx   ← Column mapping confirmation
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAnalytics.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── useUpload.ts
│   │   │   └── useAIInsights.ts
│   │   │
│   │   ├── store/                      ← Zustand state management
│   │   │   ├── dashboardStore.ts
│   │   │   ├── filterStore.ts
│   │   │   └── uploadStore.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── workers/                         ← Background processing
│   ├── ingestion.worker.ts          ← Heavy file parsing (worker thread)
│   ├── ml.worker.ts                 ← ML model inference
│   └── export.worker.ts             ← Large export generation
│
├── scripts/
│   ├── migrate.ts                   ← DuckDB schema migrations
│   ├── seed.ts                      ← Load sample data for dev
│   └── benchmark.ts                 ← Profile pipeline performance test
│
├── data/
│   ├── uploads/                     ← Temp storage for uploaded files
│   ├── processed/                   ← DuckDB database files
│   └── exports/                     ← Generated report outputs
│
├── tests/
│   ├── unit/
│   │   ├── campaignNameParser.test.ts
│   │   ├── metricCalculations.test.ts
│   │   └── anomalyDetector.test.ts
│   ├── integration/
│   │   ├── ingestion.test.ts
│   │   └── analytics.test.ts
│   └── load/
│       └── profilePipeline.load.ts
│
└── docker/
    ├── Dockerfile
    ├── docker-compose.yml
    └── nginx.conf
```

---

### `claude-code/CLAUDE.md`

```markdown
# CLAUDE.md — Email Analytics Platform

## What This Project Does
A Node.js analytics platform that ingests Klaviyo email marketing exports
(campaign, flow, segment, 7GB profile data) and surfaces interactive dashboards
with AI-powered insights for the Tory Burch marketing team.

## Critical Context for Claude Code

### Data Architecture
- DuckDB is the analytical database (columnar, handles 7GB in-process, no server needed)
- Redis handles job queues and real-time progress websockets
- Node.js worker threads handle file parsing so the main thread stays non-blocking
- The profile file (7GB, 4.5M rows, 390 cols) MUST use streaming — never load it fully into memory

### Campaign Name Parsing
Campaign names follow a structured convention:
  `{YYYYMMDD}_{REGION}_{LANG}_{CHANNEL}_{SEND_TYPE}_...`
  See src/utils/campaignNameParser.ts for the full regex decoder.

### Key Business Definitions
- **Open Rate** = Unique Opens / Total Delivered (Apple Privacy Opens are tracked separately)
- **CTOR** = Unique Clicks / Unique Opens
- **RPR** = Revenue Per Recipient = Total Placed Order Value / Total Delivered
- **Persona** = derived from profile affinity columns + globalCustomerSegment field
- **Region** = signedUpCountry mapped to region codes (US, UK, EU, DE, FR, IT, CA, AU, JP)

### File → DuckDB Table Mapping
| Source File                          | DuckDB Table              |
|--------------------------------------|---------------------------|
| Sample_Profile.xlsx (7GB production) | profiles                  |
| Campaign_Performance.xlsm            | campaign_performance      |
| Flow_Performance_Message.xlsm        | flow_performance          |
| Flow_Inventory.xlsx                  | flow_inventory            |
| Segment_Inventory.xlsx               | segment_inventory         |
| ListSegment_Performance.xlsm         | segment_performance       |
| Profile_Exclusion.xlsx               | profile_exclusions        |

### When Modifying Analytics Modules
Always preserve the four primary module interfaces:
1. OverallPerformance.getMetrics(days: number, filters: FilterSet)
2. FlowPerformance.getFlows(groupBy: FlowGrouping, filters: FilterSet)
3. CampaignPerformance.getCampaigns(groupBy: CampaignGrouping, filters: FilterSet)
4. FlowEmailPerformance.getEmailDetail(flowId: string, messageId?: string)

### Do Not
- Never load the full profiles table into Node.js memory
- Never run ML inference synchronously on the API request thread
- Never expose raw Klaviyo IDs or email addresses in API responses without auth
```

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│  Dashboard Grid │ Charts │ Filters │ AI Panel │ Upload Portal    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    API SERVER (Express + TypeScript)             │
│  /upload  │  /analytics  │  /dashboard  │  /ai  │  /export      │
└────┬──────────────────────────────────────────┬─────────────────┘
     │ Worker Threads                            │ Redis Pub/Sub
┌────▼────────────────────┐         ┌───────────▼─────────────────┐
│   INGESTION WORKERS     │         │      ML WORKERS              │
│  StreamingProfileParser  │         │  AnomalyDetector             │
│  CampaignParser          │         │  ChurnPredictor              │
│  FlowParser              │         │  PersonaClusterer            │
│  SegmentParser           │         │  CampaignForecaster          │
└────────────┬────────────┘         │  AIInsightsEngine (Claude API)│
             │                      └──────────────────────────────┘
┌────────────▼────────────────────────────────────────────────────┐
│                    DuckDB  (Analytical Store)                     │
│  profiles │ campaign_performance │ flow_performance              │
│  flow_inventory │ segment_inventory │ segment_performance        │
│  profile_exclusions │ dashboard_configs │ ml_predictions         │
└─────────────────────────────────────────────────────────────────┘
```

**Technology Stack:**

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js 20 + TypeScript | Async streaming, worker threads |
| API Framework | Express 5 | Simple, composable |
| Analytical DB | DuckDB | In-process columnar DB, handles 7GB files natively |
| Job Queue | BullMQ (Redis) | Durable ingestion and ML job queues |
| File Parsing | xlsx-stream-reader + csv-parse | Streaming — never loads full file |
| Frontend | React 18 + Vite | Fast HMR in development |
| Charts | Recharts + D3.js | Composable, customizable |
| Dashboard Layout | react-grid-layout | Drag-and-drop widget positioning |
| State | Zustand | Lightweight, no boilerplate |
| Auth | JWT + bcrypt | Stateless API auth |
| AI/NLP | Anthropic Claude API (claude-sonnet-4) | Insight generation, NL queries |
| ML | ml-matrix + simple-statistics | Client-side stats, anomaly detection |
| Testing | Vitest + Supertest | Fast unit + integration tests |
| Containerization | Docker + docker-compose | One-command startup |

---

## 5. Data Ingestion Pipeline

### 5.1 Streaming Profile Parser (7 GB Handler)

The profile file contains 4.5 million rows and 390+ columns. Loading this into memory would require ~28 GB RAM. Instead, the pipeline streams rows in chunks of 10,000 and writes directly to DuckDB using its bulk-insert COPY statement.

```typescript
// src/ingestion/StreamingProfileParser.ts

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { Database } from 'duckdb-async';
import { Transform } from 'stream';
import { EventEmitter } from 'events';

interface IngestionProgress {
  rowsProcessed: number;
  rowsTotal: number;    // estimated from file size
  percentComplete: number;
  currentChunk: number;
  errors: string[];
  elapsedMs: number;
}

export class StreamingProfileParser extends EventEmitter {
  private db: Database;
  private batchSize = 10_000;
  private batch: Record<string, unknown>[] = [];

  constructor(db: Database) {
    super();
    this.db = db;
  }

  /**
   * Core streaming method. Emits 'progress' events every batch,
   * and 'complete' when done. Never holds more than batchSize rows in memory.
   */
  async parse(filePath: string): Promise<void> {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS profiles AS
      SELECT * FROM read_csv_auto('${filePath}', header=true)
      LIMIT 0
    `);

    const startTime = Date.now();
    let rowsProcessed = 0;

    const parser = createReadStream(filePath).pipe(
      parse({ columns: true, skip_empty_lines: true, bom: true })
    );

    for await (const row of parser) {
      this.batch.push(this.transformRow(row));

      if (this.batch.length >= this.batchSize) {
        await this.flushBatch();
        rowsProcessed += this.batchSize;
        this.emit('progress', {
          rowsProcessed,
          percentComplete: rowsProcessed / 4_500_000,
          elapsedMs: Date.now() - startTime,
        } as IngestionProgress);
        this.batch = [];
      }
    }

    // Flush remaining rows
    if (this.batch.length > 0) {
      await this.flushBatch();
      rowsProcessed += this.batch.length;
    }

    this.emit('complete', { rowsProcessed, elapsedMs: Date.now() - startTime });
  }

  private transformRow(row: Record<string, string>): Record<string, unknown> {
    // Parse dates, numbers, booleans from string representation
    return {
      ...row,
      email_marketing_consent: row['Email Marketing Consent'],
      country: row['Country'],
      signed_up_country: row['signedUpCountry'],
      customer_type: row['customerType'],
      segment_weekly: row['segmentWeekly'],
      global_customer_segment: row['globalCustomerSegment'],
      total_clv: parseFloat(row['Total Customer Lifetime Value']) || null,
      historic_clv: parseFloat(row['Historic Customer Lifetime Value']) || null,
      total_orders_ltd: parseInt(row['Historic Number Of Orders']) || 0,
      net_sales_rolling_12m: parseFloat(row['netSalesRolling12m']) || null,
      last_open: row['Last Open'] ? new Date(row['Last Open']) : null,
      last_click: row['Last Click'] ? new Date(row['Last Click']) : null,
      // Affinity flags
      affinity_shoes: row['affinity_shoes'] === 'Y',
      affinity_handbags: row['affinity_handbags'] === 'Y',
      affinity_sandals: row['affinity_sandals'] === 'Y',
      affinity_totes: row['affinity_totes'] === 'Y',
      affinity_rtw: row['affinity_RTW'] === 'Y',
      affinity_boots: row['affinity_boots'] === 'Y',
      affinity_minibags: row['affinity_minibags'] === 'Y',
    };
  }

  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return;
    const placeholders = this.batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    // DuckDB supports appender API for maximum throughput
    const appender = await this.db.createAppender('main', 'profiles');
    for (const row of this.batch) {
      appender.appendRow(Object.values(row));
    }
    appender.flush();
    appender.close();
  }
}
```

### 5.2 Campaign Name Parser

Campaign names encode rich metadata in a structured string. The parser extracts all dimensions for grouping and filtering.

```typescript
// src/utils/campaignNameParser.ts

export interface ParsedCampaignName {
  rawName: string;
  date: Date | null;
  region: string;           // US, UK, EU, DE, FR, IT, CA, AU, JP, HK, SG, MO
  language: string;         // EN, FR, DE, IT, JP
  channel: string;          // Ecom, Retail
  sendType: string;         // Mainline, Blast, Targeted
  promoType: string;        // FP (Full Price), Event, Product, Sale
  theme: string;            // SpringEvent, Shoes, Handbags, CrossCat, Balance...
  persona: string;          // CRM, SaleAffinity, FullFile, RFNAPreview...
  priceType: string;        // FP, Markdown, Promotional, Mixed
  labels: string[];         // All parsed segments as tags
}

const KNOWN_REGIONS = ['US', 'UK', 'EU', 'DE', 'FR', 'IT', 'CA', 'AU', 'JP', 'HK', 'SG', 'MO'];
const KNOWN_CHANNELS = ['Ecom', 'Retail'];
const KNOWN_SEND_TYPES = ['Mainline', 'Blast', 'Targeted'];
const KNOWN_PROMO_TYPES = ['FP', 'Event', 'Product', 'Sale'];

export function parseCampaignName(name: string): ParsedCampaignName {
  const parts = name.split('_').filter(Boolean);

  // Date is always the first token if it matches YYYYMMDD
  const dateMatch = parts[0]?.match(/^(\d{4})(\d{2})(\d{2})$/);
  const date = dateMatch
    ? new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`)
    : null;

  const region = parts.find(p => KNOWN_REGIONS.includes(p)) ?? 'Unknown';
  const language = parts.find(p => /^[A-Z]{2}$/.test(p) && !KNOWN_REGIONS.includes(p)) ?? 'EN';
  const channel = parts.find(p => KNOWN_CHANNELS.includes(p)) ?? 'Unknown';
  const sendType = parts.find(p => KNOWN_SEND_TYPES.includes(p)) ?? 'Unknown';
  const promoType = parts.find(p => KNOWN_PROMO_TYPES.includes(p)) ?? 'Unknown';

  // Everything after known tokens becomes theme/persona labels
  const knownTokens = new Set([
    dateMatch?.[0], region, language, channel, sendType, promoType
  ]);
  const labels = parts.filter(p => p && !knownTokens.has(p));

  return {
    rawName: name,
    date,
    region,
    language,
    channel,
    sendType,
    promoType,
    theme: labels[0] ?? 'Other',
    persona: labels[labels.length - 1] ?? 'Other',
    priceType: promoType === 'FP' ? 'Full Price' : promoType === 'Sale' ? 'Markdown' : 'Promotional',
    labels,
  };
}
```

### 5.3 DuckDB Schema Migrations

```sql
-- scripts/schema.sql — Run via migrate.ts

CREATE TABLE IF NOT EXISTS campaign_performance (
  date_range          VARCHAR,
  campaign_message_id VARCHAR PRIMARY KEY,
  campaign_name       VARCHAR,
  -- Parsed dimensions (from campaignNameParser)
  parsed_date         DATE,
  region              VARCHAR,
  language            VARCHAR,
  channel             VARCHAR,
  send_type           VARCHAR,
  promo_type          VARCHAR,
  theme               VARCHAR,
  persona             VARCHAR,
  price_type          VARCHAR,
  send_date           DATE,
  send_time           TIME,
  day_of_week         VARCHAR,
  -- Core metrics
  total_recipients    BIGINT,
  total_delivered     BIGINT,
  total_opens         BIGINT,
  unique_opens        BIGINT,
  apple_privacy_opens BIGINT,
  open_rate           DOUBLE,
  total_clicks        BIGINT,
  unique_clicks       BIGINT,
  click_rate          DOUBLE,
  ctor                DOUBLE GENERATED ALWAYS AS (
                        CASE WHEN unique_opens > 0
                        THEN unique_clicks::DOUBLE / unique_opens ELSE 0 END
                      ),
  total_unsubscribes  BIGINT,
  unique_unsubscribes BIGINT,
  spam_complaints     BIGINT,
  bounces             BIGINT,
  unsubscribe_rate    DOUBLE,
  bounce_rate         DOUBLE,
  spam_rate           DOUBLE,
  placed_orders       BIGINT,
  placed_order_value  DOUBLE,
  placed_order_rate   DOUBLE,
  revenue_per_recipient DOUBLE,
  tags                VARCHAR,
  subject             VARCHAR,
  preview_text        VARCHAR,
  target_list         VARCHAR,
  excluded_list       VARCHAR,
  message_channel     VARCHAR,
  ingested_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flow_performance (
  date_range          VARCHAR,
  flow_id             VARCHAR,
  flow_name           VARCHAR,
  message_id          VARCHAR,
  message_name        VARCHAR,
  message_channel     VARCHAR,
  status              VARCHAR,
  message_status      VARCHAR,
  region              VARCHAR,
  persona             VARCHAR,
  tags                VARCHAR,
  total_recipients    BIGINT,
  total_delivered     BIGINT,
  unique_opens        BIGINT,
  unique_clicks       BIGINT,
  unique_unsubscribes BIGINT,
  bounces             BIGINT,
  total_opens         BIGINT,
  apple_privacy_opens BIGINT,
  open_rate           DOUBLE,
  total_clicks        BIGINT,
  click_rate          DOUBLE,
  ctor                DOUBLE GENERATED ALWAYS AS (
                        CASE WHEN unique_opens > 0
                        THEN unique_clicks::DOUBLE / unique_opens ELSE 0 END
                      ),
  unsubscribe_rate    DOUBLE,
  bounce_rate         DOUBLE,
  spam_rate           DOUBLE,
  placed_orders       BIGINT,
  placed_order_value  DOUBLE,
  placed_order_rate   DOUBLE,
  revenue_per_recipient DOUBLE,
  ingested_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (flow_id, message_id)
);

CREATE TABLE IF NOT EXISTS flow_inventory (
  flow_name           VARCHAR PRIMARY KEY,
  trigger_type        VARCHAR,   -- Metric, Segment, Profile Property
  trigger_name        VARCHAR,   -- e.g., "Coupon Assigned", "Placed Order"
  reentry_criteria    VARCHAR,
  trigger_filters     VARCHAR,
  profile_filters     VARCHAR,
  num_emails          INTEGER,
  flow_status         VARCHAR,   -- Active, Draft
  steps               TEXT,
  persona             VARCHAR
);

CREATE TABLE IF NOT EXISTS segment_inventory (
  segment_name        VARCHAR PRIMARY KEY,
  type                VARCHAR,   -- Segment, List
  status              VARCHAR,   -- Active, Inactive
  member_count        BIGINT,
  creation_date       VARCHAR,
  rule_comment        TEXT,
  persona             VARCHAR,
  segment_group       VARCHAR,   -- G-1 through G-14
  persona_confidence  DOUBLE
);

CREATE TABLE IF NOT EXISTS segment_performance (
  date_range          VARCHAR,
  group_id            VARCHAR,
  segment_name        VARCHAR,
  total_recipients    BIGINT,
  total_delivered     BIGINT,
  unique_opens        BIGINT,
  open_rate           DOUBLE,
  unique_clicks       BIGINT,
  click_rate          DOUBLE,
  unique_unsubscribes BIGINT,
  bounces             BIGINT,
  placed_order_value  DOUBLE,
  revenue_per_recipient DOUBLE,
  message_channel     VARCHAR,
  region              VARCHAR
);

CREATE TABLE IF NOT EXISTS profile_exclusions (
  exclusion_reason    VARCHAR PRIMARY KEY,
  count               BIGINT,
  share_pct           DOUBLE,
  snapshot_date       DATE
);

CREATE TABLE IF NOT EXISTS dashboard_configs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             VARCHAR,
  name                VARCHAR,
  config              JSON,      -- Full layout + widget config
  is_default          BOOLEAN DEFAULT false,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_predictions (
  profile_id          VARCHAR,
  prediction_type     VARCHAR,   -- 'churn', 'clv', 'persona_cluster', 'next_order'
  score               DOUBLE,
  label               VARCHAR,
  model_version       VARCHAR,
  predicted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Analytics Modules

### 6.1 Module 1: Overall Email Performance

Aggregates all email activity (campaigns + flows) within a configurable rolling window.

**Endpoint:** `GET /api/analytics/overall?days=90&region=US&channel=email`

**DuckDB Query (parameterized):**
```sql
WITH campaign_agg AS (
  SELECT
    'Campaign'              AS source_type,
    SUM(total_recipients)   AS total_recipients,
    SUM(total_delivered)    AS total_delivered,
    SUM(unique_opens)       AS unique_opens,
    SUM(unique_clicks)      AS unique_clicks,
    SUM(total_unsubscribes) AS total_unsubscribes,
    SUM(bounces)            AS bounces,
    SUM(spam_complaints)    AS spam_complaints,
    SUM(placed_order_value) AS total_revenue,
    SUM(placed_orders)      AS total_orders
  FROM campaign_performance
  WHERE send_date >= CURRENT_DATE - INTERVAL '$days' DAY
    AND ($region = 'ALL' OR region = $region)
),
flow_agg AS (
  SELECT
    'Flow'                  AS source_type,
    SUM(total_recipients)   AS total_recipients,
    SUM(total_delivered)    AS total_delivered,
    SUM(unique_opens)       AS unique_opens,
    SUM(unique_clicks)      AS unique_clicks,
    SUM(unique_unsubscribes) AS total_unsubscribes,
    SUM(bounces)            AS bounces,
    SUM(spam_complaints)    AS spam_complaints,
    SUM(placed_order_value) AS total_revenue,
    SUM(placed_orders)      AS total_orders
  FROM flow_performance
    AND ($region = 'ALL' OR region = $region)
),
combined AS (SELECT * FROM campaign_agg UNION ALL SELECT * FROM flow_agg)
SELECT
  SUM(total_recipients)                    AS total_recipients,
  SUM(total_delivered)                     AS total_delivered,
  SUM(unique_opens)                        AS unique_opens,
  SUM(unique_clicks)                       AS unique_clicks,
  -- Rates
  SUM(unique_opens)::DOUBLE /
    NULLIF(SUM(total_delivered), 0)        AS overall_open_rate,
  SUM(unique_clicks)::DOUBLE /
    NULLIF(SUM(total_delivered), 0)        AS overall_click_rate,
  SUM(unique_clicks)::DOUBLE /
    NULLIF(SUM(unique_opens), 0)           AS overall_ctor,
  SUM(total_unsubscribes)::DOUBLE /
    NULLIF(SUM(total_delivered), 0)        AS overall_unsub_rate,
  SUM(bounces)::DOUBLE /
    NULLIF(SUM(total_recipients), 0)       AS overall_bounce_rate,
  SUM(spam_complaints)::DOUBLE /
    NULLIF(SUM(total_delivered), 0)        AS overall_spam_rate,
  -- Revenue
  SUM(total_revenue)                       AS total_revenue,
  SUM(total_orders)                        AS total_orders,
  SUM(total_revenue)::DOUBLE /
    NULLIF(SUM(total_delivered), 0)        AS overall_rpr
FROM combined
```

**Response Shape:**
```typescript
interface OverallPerformanceResponse {
  windowDays: number;
  dateRange: { start: string; end: string };
  summary: {
    totalRecipients: number;
    totalDelivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    openRate: number;            // e.g. 0.3135 → display as 31.35%
    clickRate: number;
    ctor: number;                // Click-to-open rate
    unsubscribeRate: number;
    bounceRate: number;
    spamRate: number;
    totalRevenue: number;
    revenuePerRecipient: number;
  };
  bySource: {
    campaign: Partial<typeof summary>;
    flow: Partial<typeof summary>;
  };
  byRegion: Record<string, Partial<typeof summary>>;
  byDayOfWeek: Record<string, Partial<typeof summary>>;   // Mon-Sun performance
  exclusionSummary: {
    unsubscribed: number;
    bounced: number;
    markedSpam: number;
    invalid: number;
    suppressed: number;
    totalExcluded: number;
    emailablePercent: number;
  };
  aiInsights: AIInsight[];  // Generated by AIInsightsEngine
}
```

---

### 6.2 Module 2: Flow Email Performance

Aggregates flow metrics with three grouping strategies.

**Endpoint:** `GET /api/analytics/flows?groupBy=persona&region=US`

**Flow Grouping Options:**

**a) Group by Entry Criteria** (joins `flow_inventory` on trigger_type + trigger_name):
```sql
SELECT
  fi.trigger_type,
  fi.trigger_name,
  COUNT(DISTINCT fp.flow_id)        AS num_flows,
  SUM(fp.total_delivered)           AS total_delivered,
  AVG(fp.open_rate)                 AS avg_open_rate,
  AVG(fp.click_rate)                AS avg_click_rate,
  SUM(fp.placed_order_value)        AS total_revenue,
  AVG(fp.revenue_per_recipient)     AS avg_rpr
FROM flow_performance fp
JOIN flow_inventory fi ON fp.flow_name = fi.flow_name
GROUP BY fi.trigger_type, fi.trigger_name
ORDER BY total_revenue DESC
```

**b) Group by Persona** (uses `persona` column in flow_performance):
```sql
SELECT
  COALESCE(fp.persona, 'Unassigned')  AS persona,
  COUNT(DISTINCT fp.flow_id)           AS num_flows,
  SUM(fp.total_delivered)              AS total_delivered,
  AVG(fp.open_rate)                    AS avg_open_rate,
  SUM(fp.placed_order_value)           AS total_revenue
FROM flow_performance fp
GROUP BY persona
ORDER BY total_revenue DESC
```

**c) Group by Trigger Event** (metric flows vs. segment-based vs. property-based):
```sql
SELECT
  fi.trigger_type                      AS event_type,
  fi.trigger_name                      AS event_name,
  SUM(fp.total_recipients)             AS total_recipients,
  AVG(fp.open_rate)                    AS avg_open_rate,
  AVG(fp.revenue_per_recipient)        AS avg_rpr
FROM flow_performance fp
LEFT JOIN flow_inventory fi ON fp.flow_name = fi.flow_name
GROUP BY fi.trigger_type, fi.trigger_name
```

---

### 6.3 Module 3: Individual Flow & Email Performance

Drill-down from flow level → message level within a flow.

**Endpoints:**
- `GET /api/analytics/flows/:flowId` — all messages in a flow
- `GET /api/analytics/flows/:flowId/messages/:messageId` — single email detail

**Response includes:**
- Full funnel visualization data: Recipients → Delivered → Opens → Clicks → Orders
- Message sequence number (derived from message name conventions)
- A/B test detection (Control vs. Test suffix in message name)
- Comparison to flow average for each metric

```typescript
interface FlowDetailResponse {
  flow: {
    flowId: string;
    flowName: string;
    region: string;
    persona: string;
    triggerType: string;        // from flow_inventory join
    triggerName: string;
    reentryCriteria: string;
    numMessages: number;
    totalDelivered: number;
    totalRevenue: number;
  };
  messages: Array<{
    messageId: string;
    messageName: string;
    sequencePosition: number;
    channel: string;
    status: string;
    isABTest: boolean;
    variant: 'control' | 'test' | 'single';
    metrics: {
      totalRecipients: number;
      totalDelivered: number;
      uniqueOpens: number;
      openRate: number;
      uniqueClicks: number;
      clickRate: number;
      ctor: number;
      bounceRate: number;
      unsubscribeRate: number;
      placedOrders: number;
      totalRevenue: number;
      revenuePerRecipient: number;
    };
    vsFlowAverage: {          // delta from flow-level average
      openRate: number;
      clickRate: number;
      revenuePerRecipient: number;
    };
  }>;
  funnelData: Array<{ stage: string; count: number; dropOffRate: number }>;
}
```

---

### 6.4 Module 4: Campaign Email Performance

**Endpoint:** `GET /api/analytics/campaigns?groupBy=persona&region=US&days=90`

**Grouping Dimensions:**

**a) By Segment** — uses `target_list` column cross-referenced with `segment_inventory`:
```sql
SELECT
  cp.target_list                       AS segment_name,
  si.persona                           AS segment_persona,
  si.member_count,
  COUNT(*)                             AS num_campaigns,
  SUM(cp.total_delivered)              AS total_delivered,
  AVG(cp.open_rate)                    AS avg_open_rate,
  SUM(cp.placed_order_value)           AS total_revenue,
  AVG(cp.revenue_per_recipient)        AS avg_rpr
FROM campaign_performance cp
LEFT JOIN segment_inventory si ON cp.target_list = si.segment_name
WHERE send_date >= CURRENT_DATE - INTERVAL '$days' DAY
GROUP BY cp.target_list, si.persona, si.member_count
ORDER BY total_revenue DESC
```

**b) By Country/Region** — uses parsed `region` dimension:
```sql
SELECT
  region,
  COUNT(*) AS num_campaigns,
  SUM(total_delivered) AS total_delivered,
  AVG(open_rate) AS avg_open_rate,
  AVG(click_rate) AS avg_click_rate,
  SUM(placed_order_value) AS total_revenue,
  AVG(revenue_per_recipient) AS avg_rpr
FROM campaign_performance
WHERE send_date >= CURRENT_DATE - INTERVAL '$days' DAY
GROUP BY region
ORDER BY total_revenue DESC
```

**c) By Labels/Tags** — uses `tags` column + parsed name components:
```sql
SELECT
  unnest(string_split(tags, ',')) AS label,
  COUNT(*) AS num_campaigns,
  AVG(open_rate) AS avg_open_rate,
  SUM(placed_order_value) AS total_revenue
FROM campaign_performance
WHERE tags IS NOT NULL
GROUP BY label
ORDER BY num_campaigns DESC
```

**d) By Persona** — uses parsed persona from campaign name:
```sql
SELECT
  persona AS campaign_persona,
  send_type,
  promo_type,
  COUNT(*) AS num_campaigns,
  SUM(total_delivered) AS total_delivered,
  AVG(open_rate) AS avg_open_rate,
  AVG(click_rate) AS avg_click_rate,
  AVG(ctor) AS avg_ctor,
  SUM(placed_order_value) AS total_revenue,
  AVG(revenue_per_recipient) AS avg_rpr,
  AVG(unsubscribe_rate) AS avg_unsub_rate
FROM campaign_performance
WHERE send_date >= CURRENT_DATE - INTERVAL '$days' DAY
GROUP BY persona, send_type, promo_type
ORDER BY total_revenue DESC
```

---

## 7. Dashboard System & Customization Engine

Users can build their own dashboards by selecting, arranging, and resizing any combination of widgets. The configuration is persisted per user in DuckDB.

### 7.1 Widget Library

Every widget is a self-contained React component that accepts a standardized `WidgetConfig` prop:

```typescript
// Widget types available in the library
type WidgetType =
  // KPI Cards
  | 'kpi_open_rate'
  | 'kpi_click_rate'
  | 'kpi_ctor'
  | 'kpi_revenue'
  | 'kpi_rpr'
  | 'kpi_bounce_rate'
  | 'kpi_unsub_rate'
  | 'kpi_delivered'
  // Charts
  | 'trend_line_open'
  | 'trend_line_revenue'
  | 'funnel_campaign'
  | 'funnel_flow'
  | 'heatmap_send_time'
  | 'bar_region_comparison'
  | 'bar_persona_comparison'
  | 'scatter_rpr_vs_open'
  | 'sankey_flow_dropoff'
  // Tables
  | 'table_top_campaigns'
  | 'table_top_flows'
  | 'table_segment_performance'
  // AI Widgets
  | 'ai_anomaly_alerts'
  | 'ai_send_time_recommendation'
  | 'ai_subject_line_grader'
  | 'ai_natural_language_query'
  | 'ai_churn_risk_segments'
  // Profile Widgets
  | 'profile_exclusion_breakdown'
  | 'profile_consent_health'
  | 'profile_affinity_distribution';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;              // User-editable display title
  position: { x: number; y: number; w: number; h: number };
  filters: {
    days?: number;
    region?: string[];
    persona?: string[];
    channel?: string[];
    sendType?: string[];
    promoType?: string[];
  };
  displayOptions: {
    colorScheme?: 'default' | 'green-red' | 'brand';
    showLegend?: boolean;
    showDataLabels?: boolean;
    compactMode?: boolean;
  };
}
```

### 7.2 Dashboard API

```
POST   /api/dashboard                  Create new dashboard
GET    /api/dashboard                  List user's dashboards
GET    /api/dashboard/:id              Get dashboard config
PUT    /api/dashboard/:id              Update layout/widgets
DELETE /api/dashboard/:id              Delete dashboard
POST   /api/dashboard/:id/duplicate    Clone dashboard
PUT    /api/dashboard/:id/default      Set as default view
GET    /api/dashboard/widgets          List all available widgets
POST   /api/dashboard/:id/export       Export as PDF/PNG
```

### 7.3 Dashboard Persistence

```typescript
// PUT /api/dashboard/:id
interface DashboardUpdatePayload {
  name?: string;
  widgets: WidgetConfig[];       // Full widget array replaces existing
  globalFilters?: {              // Filters applied to all widgets by default
    days: number;
    region: string[];
    persona: string[];
  };
}
```

---

## 8. AI & ML Capability Layer

### 8.1 Claude-Powered Insight Generation

The `AIInsightsEngine` sends aggregated metrics to the Claude API and returns structured insights. It never sends raw PII — only aggregated statistics.

```typescript
// src/ml/AIInsightsEngine.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();  // Uses ANTHROPIC_API_KEY env var

interface AIInsight {
  category: 'anomaly' | 'opportunity' | 'warning' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  actionableSteps: string[];
  affectedMetric: string;
  affectedDimension: string;   // e.g., "US Birthday Flow" or "EU Campaigns"
  confidenceScore: number;     // 0–1
}

export class AIInsightsEngine {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Analyzes aggregated metrics and returns AI-generated insights.
   * Designed to run asynchronously — never blocks API responses.
   */
  async generateInsights(
    metrics: OverallPerformanceResponse,
    previousPeriodMetrics: OverallPerformanceResponse,
  ): Promise<AIInsight[]> {
    const prompt = this.buildInsightPrompt(metrics, previousPeriodMetrics);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an expert email marketing analyst specializing in luxury fashion brands.
You analyze Klaviyo email performance data and provide specific, actionable insights.
Respond ONLY with a valid JSON array of insight objects matching the AIInsight interface.
Focus on: open rate anomalies, revenue opportunities, persona performance gaps, 
optimal send times, A/B test conclusions, and deliverability risks.`,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '[]';
    return JSON.parse(rawText.replace(/```json|```/g, '').trim()) as AIInsight[];
  }

  /**
   * Natural language query against the analytics data.
   * Example: "Which persona had the best RPR last month in the US?"
   */
  async naturalLanguageQuery(
    query: string,
    context: Record<string, unknown>,
  ): Promise<{ answer: string; sqlQuery?: string; chartType?: string }> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are an analyst with access to email marketing data in DuckDB.
Tables: campaign_performance, flow_performance, flow_inventory, segment_inventory, profiles.
Given a natural language question, respond with JSON: { answer, sqlQuery, chartType }.
sqlQuery should be a valid DuckDB SQL query to retrieve the answer.
chartType should be one of: 'kpi', 'bar', 'line', 'table'.`,
      messages: [{
        role: 'user',
        content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${query}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }

  /**
   * Score a subject line for open rate potential based on historical data.
   */
  async scoreSubjectLine(
    subjectLine: string,
    targetPersona: string,
    region: string,
    historicalContext: { avgOpenRate: number; topSubjectLines: string[] },
  ): Promise<{
    score: number;        // 0–100
    openRatePrediction: number;
    strengths: string[];
    improvements: string[];
  }> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `You are an email subject line expert for a luxury fashion brand (Tory Burch).
Score subject lines 0–100 and predict open rate based on historical context.
Return JSON matching the schema exactly.`,
      messages: [{
        role: 'user',
        content: `Subject: "${subjectLine}"
Target: ${targetPersona} persona, ${region} region
Historical avg open rate: ${(historicalContext.avgOpenRate * 100).toFixed(1)}%
Top performing subject lines: ${historicalContext.topSubjectLines.join(' | ')}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }

  private buildInsightPrompt(
    current: OverallPerformanceResponse,
    previous: OverallPerformanceResponse,
  ): string {
    return `Analyze the following email performance data and identify insights.

Current Period (${current.windowDays} days):
- Open Rate: ${(current.summary.openRate * 100).toFixed(2)}%
- Click Rate: ${(current.summary.clickRate * 100).toFixed(2)}%
- CTOR: ${(current.summary.ctor * 100).toFixed(2)}%
- Unsubscribe Rate: ${(current.summary.unsubscribeRate * 100).toFixed(3)}%
- Revenue Per Recipient: $${current.summary.revenuePerRecipient.toFixed(4)}
- Total Revenue: $${current.summary.totalRevenue.toFixed(2)}

Previous Period:
- Open Rate: ${(previous.summary.openRate * 100).toFixed(2)}%
- Click Rate: ${(previous.summary.clickRate * 100).toFixed(2)}%
- Revenue Per Recipient: $${previous.summary.revenuePerRecipient.toFixed(4)}

By Region: ${JSON.stringify(current.byRegion)}

Return a JSON array of 3–6 insights.`;
  }
}
```

### 8.2 Statistical ML Models

**Anomaly Detection** — runs nightly on all metrics, flags statistical outliers:
```typescript
// src/ml/AnomalyDetector.ts
// Uses Z-score (>2.5 std dev) + CUSUM for sequential detection
// Flags: sudden open rate drops, unusual bounce spikes, revenue anomalies
// Results stored in ml_predictions table with prediction_type='anomaly'
```

**Churn Predictor** — scores each profile based on recency/frequency/monetary signals:
```typescript
// Features: daysSinceLastOpen, daysSinceLastClick, daysSinceLastPurchase,
//           totalTransLTD, netSalesRolling12m, segmentWeekly, emailChannelAffinity
// Model: Logistic regression trained on profiles where segmentWeekly='CHURN'
// Output: churn probability score 0-1 per profile, stored in ml_predictions
```

**Send Time Optimizer** — analyzes historical campaign performance by day + hour:
```typescript
// Queries campaign_performance GROUP BY day_of_week, EXTRACT(hour FROM send_time)
// Finds the day/hour combination with highest average open rate per region/persona
// Returns top 3 send windows with confidence intervals
```

**Persona Clusterer** — discovers natural persona clusters from profile affinity columns:
```typescript
// Features: affinity_shoes, affinity_handbags, affinity_sandals, affinity_totes,
//           affinity_rtw, affinity_boots, mostBoughtProductCategoryDesc, salesChannel
// Algorithm: k-means (k=6) using ml-matrix library
// Maps clusters back to known persona labels (CRM, SaleAffinity, etc.)
```

**Campaign Forecaster** — time-series forecast of weekly revenue:
```typescript
// Algorithm: Exponential smoothing (Holt-Winters) on weekly revenue aggregations
// Produces 4-week forward forecast with confidence intervals
// Accounts for seasonality (holiday peaks, sale events)
```

---

## 9. API Reference

### Upload Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload/profile` | Upload profile file (7GB, chunked multipart) |
| `POST` | `/api/upload/campaign` | Upload Campaign_Performance.xlsm |
| `POST` | `/api/upload/flow` | Upload Flow_Performance_Message.xlsm |
| `POST` | `/api/upload/segment` | Upload Segment_Inventory.xlsx |
| `GET` | `/api/upload/jobs` | List all ingestion jobs |
| `GET` | `/api/upload/jobs/:jobId` | Get job status + progress |
| `DELETE` | `/api/upload/jobs/:jobId` | Cancel in-progress job |

### Analytics Endpoints

| Method | Path | Query Params | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/analytics/overall` | `days, region, channel` | Overall email performance |
| `GET` | `/api/analytics/flows` | `groupBy, region, persona, days` | Flow list + metrics |
| `GET` | `/api/analytics/flows/:flowId` | `region` | Single flow + all messages |
| `GET` | `/api/analytics/flows/:flowId/messages/:messageId` | — | Single email detail |
| `GET` | `/api/analytics/campaigns` | `groupBy, region, persona, days, channel` | Campaign list |
| `GET` | `/api/analytics/campaigns/:id` | — | Single campaign detail |
| `GET` | `/api/analytics/segments` | `group, persona, status` | Segment inventory + performance |
| `GET` | `/api/analytics/exclusions` | — | Profile exclusion breakdown |
| `GET` | `/api/analytics/profiles/summary` | `region, persona, segment` | Profile aggregate stats |

### AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/ai/insights` | Latest AI-generated insights |
| `POST` | `/api/ai/query` | Natural language data query |
| `POST` | `/api/ai/subject-line-score` | Score a subject line |
| `GET` | `/api/ai/anomalies` | Current anomaly alerts |
| `GET` | `/api/ai/send-time-recommendation` | Optimal send window |
| `GET` | `/api/ai/churn-risk` | Top churn-risk segments |
| `GET` | `/api/ai/forecast` | Revenue forecast next 4 weeks |

### Dashboard Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | List user dashboards |
| `POST` | `/api/dashboard` | Create dashboard |
| `GET` | `/api/dashboard/:id` | Get dashboard config |
| `PUT` | `/api/dashboard/:id` | Update dashboard |
| `DELETE` | `/api/dashboard/:id` | Delete dashboard |
| `POST` | `/api/dashboard/:id/export` | Export as PDF |

---

## 10. Setup & Deployment

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
docker & docker-compose (for Redis)
```

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/email-analytics-platform
cd email-analytics-platform
npm install
cd client && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env — minimum required: ANTHROPIC_API_KEY

# 3. Start Redis (for job queues)
docker-compose up -d redis

# 4. Run database migrations
npm run migrate

# 5. Load sample data (development)
npm run seed

# 6. Start development servers
npm run dev        # starts API on :3001
cd client && npm run dev  # starts React on :5173
```

### Production Deployment

```bash
# Build frontend
cd client && npm run build && cd ..

# Build TypeScript
npm run build

# Start production
NODE_ENV=production npm start
```

### Docker (Full Stack)

```bash
docker-compose up --build
# API: http://localhost:3001
# Frontend: http://localhost:80
```

---

## 11. Environment Variables

```bash
# .env.example

# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here-min-32-chars

# Database
DUCKDB_PATH=./data/processed/analytics.duckdb

# Redis (BullMQ job queues)
REDIS_URL=redis://localhost:6379

# AI
ANTHROPIC_API_KEY=sk-ant-...        # Required for AI insights + NL queries

# File Upload
UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE_GB=8                  # Allow up to 8 GB
CHUNK_SIZE_MB=10                    # Multipart chunk size

# ML
ML_ANOMALY_THRESHOLD=2.5           # Z-score threshold for anomaly flagging
ML_CHURN_SCORE_THRESHOLD=0.65      # Above this = high churn risk
ML_PERSONA_CLUSTERS=6              # k-means k value

# Analytics
DEFAULT_ROLLING_DAYS=90            # Default time window for all views
APPLE_PRIVACY_ADJUSTMENT=true      # Exclude Apple Privacy Opens from Open Rate calc
```

---

## Appendix: Key Business Metrics Definitions

| Metric | Formula | Notes |
|--------|---------|-------|
| **Open Rate** | Unique Opens / Total Delivered | Apple Privacy Opens tracked separately; use adjusted rate when `APPLE_PRIVACY_ADJUSTMENT=true` |
| **Click Rate** | Unique Clicks / Total Delivered | Also called CTR |
| **CTOR** | Unique Clicks / Unique Opens | Click-to-open rate — quality of content |
| **RPR** | Total Placed Order Value / Total Delivered | Revenue per recipient — primary revenue KPI |
| **Bounce Rate** | Bounces / Total Recipients | Hard + soft combined |
| **Unsubscribe Rate** | Unique Unsubscribes / Total Delivered | <0.2% is healthy |
| **Spam Rate** | Spam Complaints / Total Delivered | >0.1% triggers deliverability risk |
| **Placed Order Rate** | Unique Placed Orders / Total Delivered | Conversion rate |
| **Emailable %** | (Total Profiles − Total Excluded) / Total Profiles | List health indicator |

---

*Generated from Klaviyo export analysis — March 23, 2026 snapshot*  
*Platform designed to scale to 4.5M+ profiles · 350+ columns · multi-region*
