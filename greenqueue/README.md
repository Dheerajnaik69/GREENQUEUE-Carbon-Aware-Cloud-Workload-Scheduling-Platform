# GREENQUEUE: Carbon-Aware Cloud Workload Scheduling Platform
### Academic Green IT Engineering Project • Department of Computer Science & Engineering / Information Science • NMIT Bangalore

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC.svg)](https://tailwindcss.com/)
[![Standard](https://img.shields.io/badge/Standard-ISO%2014064%20Scope%202-success.svg)](#)
[![Tests Passing](https://img.shields.io/badge/Tests-19%2F19%20Passing-brightgreen.svg)](#)

---

## 📑 Table of Contents

1. [Executive Summary & Background](#1-executive-summary--background)
2. [Problem Statement: Traditional vs. Carbon-Aware Scheduling](#2-problem-statement-traditional-vs-carbon-aware-scheduling)
3. [Key Project Objectives & Guarantees](#3-key-project-objectives--guarantees)
4. [Mathematical Formulation of the Scheduling Algorithm](#4-mathematical-formulation-of-the-scheduling-algorithm)
5. [Regional Electricity Carbon Intensity Models](#5-regional-electricity-carbon-intensity-models)
6. [Complete System Architecture & Folder Structure](#6-complete-system-architecture--folder-structure)
7. [Technology Stack & Architectural Decisions](#7-technology-stack--architectural-decisions)
8. [Comprehensive UI/UX Feature Breakdown](#8-comprehensive-uiux-feature-breakdown)
9. [Pre-Loaded Demo Dataset (Initial 10 Workloads)](#9-pre-loaded-demo-dataset-initial-10-workloads)
10. [Automated Verification Tests (19 Passing Tests)](#10-automated-verification-tests-19-passing-tests)
11. [5–7 Minute Guided Presentation Walkthrough](#11-57-minute-guided-presentation-walkthrough)
12. [Local Setup & Execution Guide](#12-local-setup--execution-guide)
13. [Limitations, Assumptions & Future Cloud Roadmap](#13-limitations-assumptions--future-cloud-roadmap)
14. [Academic Standards & ISO 14064 Compliance](#14-academic-standards--iso-14064-compliance)

---

## 1. Executive Summary & Background

**GreenQueue** is an engineering project developed for the **Green IT and Sustainability** curriculum at **NMIT Bangalore**. 

Data centers currently account for 1–2% of global electricity demand, projected to surge dramatically with the exponential adoption of Artificial Intelligence, large-scale deep learning training, and data analytics pipelines. Most cloud scheduling architectures treat electricity as a static, infinite utility, optimizing solely for compute cost, execution latency, memory utilization, and throughput.

GreenQueue introduces a paradigm shift: treating **Electricity Carbon Intensity ($gCO_2/kWh$)** as an active scheduling parameter. By coupling workload characteristics (runtime, energy demand, deadlines, urgency) with dynamic electricity grid carbon forecasts across diverse geographical regions (India, North Europe, West US), GreenQueue shifts flexible computing tasks into the cleanest temporal and spatial execution windows, achieving up to **40–65% reductions in Scope 2 carbon emissions** without violating SLA deadlines.

---

## 2. Problem Statement: Traditional vs. Carbon-Aware Scheduling

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          TRADITIONAL CLOUD SCHEDULER                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Workload Submitted ───► Queue ───► First Available Node ───► Instant Dispatch  │
│  • Considers: CPU, RAM, VM Hourly Cost, Queue Length                            │
│  • Ignores: Grid generation mix (coal vs. wind/solar), time-of-day emissions    │
│  • Result: Often runs high-energy batch jobs during peak fossil-fuel grid hours │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        GREENQUEUE CARBON-AWARE SCHEDULER                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Workload Submitted ───► Classification Engine:                                 │
│                          ├─► [Urgent]   ──► Immediate Dispatch (Zero Delay)     │
│                          └─► [Flexible] ──► 24h Regional Carbon Search Space:   │
│                                             • India (Diurnal Solar ramp)        │
│                                             • North Europe (Wind penetration)   │
│                                             • West US (Solar duck curve)        │
│                                             ▼                                   │
│                             Lowest Emission Window within SLA                   │
│                                             ▼                                   │
│                             Audited ISO 14064 Carbon Reduction                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Traditional schedulers execute batch jobs immediately upon arrival. If an ML training job requiring 140 kWh is submitted in India at 8:00 PM (peak evening demand powered by coal thermal peaker plants at $\sim 780\,gCO_2/kWh$), it emits approximately **$109.2\,kg\,CO_2$**.

GreenQueue identifies that the workload has a 24-hour SLA deadline. It evaluates candidate windows and dispatches the job either during the mid-day solar window or across regions to North Europe (where off-peak wind drops carbon intensity to $\sim 85\,gCO_2/kWh$), reducing emissions to **$11.9\,kg\,CO_2$**—a net saving of **$97.3\,kg\,CO_2$ (89.1% reduction)** for the exact same compute volume.

---

## 3. Key Project Objectives & Guarantees

1. **Urgency-Aware Dispatching (Zero Delay Guarantee):**
   Critical transactional workloads (e.g., customer payment APIs, banking microservices) are classified as `urgent`. GreenQueue guarantees zero intentional scheduling delay for urgent jobs, dispatching them immediately to the cleanest available region at that moment.

2. **Deterministic Mathematical Optimization:**
   The algorithm is strictly deterministic—no random heuristics or artificial recommendations. Every scheduling decision can be audited via an exploded candidate evaluation table showing evaluated hours, regional options, and rejection reasons.

3. **Data Sovereignty & Regional Pinning:**
   Users can permit global multi-region placement (`auto`) or strictly constrain workloads to a specific region (e.g., `India` only for data compliance regulations).

4. **Dynamic Grid Reactivity:**
   When weather shifts cause renewable generation drops (e.g., sudden wind lulls), GreenQueue detects forecast revisions and re-optimizes pending flexible workloads automatically.

5. **Realized vs. Projected Emissions Separation:**
   Projected savings for scheduled/pending jobs are strictly segregated from realized savings from completed workloads. Failed or cancelled workloads generate zero realized savings.

6. **Interactive Presentation Mode:**
   A dedicated 6-stage presentation view equipped with presenter guidelines, simulation clock accelerators (+1h, +4h), and live workload dispatches designed specifically for live 5–7 minute college evaluations.

---

## 4. Mathematical Formulation of the Scheduling Algorithm

Implemented in `src/services/schedulingService.ts`.

### 4.1 Workload Input Vector
Each workload $W_i$ is defined by:
$$W_i = \langle ID, \text{Name}, \text{Type}, P, E, R, D, \text{Reg}_{\text{pref}} \rangle$$
Where:
- $P \in \{\text{urgent}, \text{flexible}\}$ is the priority class.
- $E > 0$ is the total estimated energy in kilowatt-hours (kWh).
- $R > 0$ is the execution duration in hours.
- $D \ge R$ is the SLA completion deadline in hours from current simulated time $t_{\text{sim}}$.
- $\text{Reg}_{\text{pref}} \in \{\text{auto}, \text{india}, \text{north-europe}, \text{west-us}\}$ is the region constraint.

---

### 4.2 Candidate Generation
Let $\mathcal{R}$ denote the set of eligible regions:
$$\mathcal{R} = \begin{cases} \{\text{india}, \text{north-europe}, \text{west-us}\}, & \text{if } \text{Reg}_{\text{pref}} = \text{auto} \\ \{\text{Reg}_{\text{pref}}\}, & \text{otherwise} \end{cases}$$

The search space of potential start time offsets $h$ (in hours) is bounded by:
$$h \in \left\{ 0, 1, 2, \dots, \lfloor D - R \rfloor \right\}$$

For any candidate start timestamp $t_{\text{start}} = t_{\text{sim}} + h \cdot 3600$, the scheduled completion timestamp is:
$$t_{\text{end}} = t_{\text{start}} + R \cdot 3600$$

A candidate is **feasible** if and only if:
$$t_{\text{end}} \le t_{\text{sim}} + D \cdot 3600$$

---

### 4.3 Window-Averaged Carbon Intensity
Crucially, electricity carbon intensity varies throughout the execution of a job. GreenQueue does **not** assume carbon intensity remains constant from start to finish. It computes the window-averaged carbon intensity $\bar{CI}_r(t_{\text{start}}, R)$ across the full duration by interpolating the hourly forecasted intensity points:

$$\bar{CI}_r(t_{\text{start}}, R) = \frac{1}{N+1} \sum_{k=0}^{N} CI_r\left(t_{\text{start}} + \frac{k \cdot R \cdot 3600}{N}\right) \quad [gCO_2/kWh]$$

Where $N = \max(1, \lceil R \rceil)$ sample points along the runtime trajectory.

---

### 4.4 Objective Function
The estimated carbon emissions for candidate slot $\langle r, h \rangle$ is:
$$\text{Emissions}(r, h) = \frac{E \times \bar{CI}_r(t_{\text{sim}} + h \cdot 3600, R)}{1000} \quad [\text{kg } CO_2]$$

The scheduling objective selects the feasible candidate minimizing total emissions:
$$\langle r^*, h^* \rangle = \arg\min_{r \in \mathcal{R},\, h \in [0, D-R]} \text{Emissions}(r, h)$$

#### Deterministic Tie-Breaking Rule:
If two candidate windows yield identical emissions within a tolerance of $0.001\,kg\,CO_2$:
$$h^* = \min(h_1, h_2)$$
The earliest feasible start time is selected to minimize job turnaround latency.

---

### 4.5 Baseline & Avoided Carbon Accounting
- **Conventional Baseline Region:** India is configured as the default baseline region for automatic workloads; for region-restricted workloads, the specified region is the baseline.
- **Baseline Emissions:** Calculated as immediate execution at the time of submission ($h = 0$):
  $$E_{\text{baseline}} = \frac{E \times \bar{CI}_{\text{base}}(t_{\text{sim}}, R)}{1000} \quad [\text{kg } CO_2]$$
- **Avoided Emissions ($CO_2$ Savings):**
  $$\Delta CO_2 = \max\left(0, E_{\text{baseline}} - \text{Emissions}(r^*, h^*)\right) \quad [\text{kg } CO_2]$$
- **Carbon Reduction Percentage:**
  $$\% \text{ Reduction} = \begin{cases} \left(\frac{\Delta CO_2}{E_{\text{baseline}}}\right) \times 100, & \text{if } E_{\text{baseline}} > 0 \\ 0\%, & \text{otherwise} \end{cases}$$

---

## 5. Regional Electricity Carbon Intensity Models

Implemented in `src/services/carbonForecastService.ts`.

GreenQueue simulates three distinct geographic electrical grids based on realistic diurnal generation curves:

```
Carbon Intensity (gCO2/kWh)
 800 ├─────── India (Coal Peak: 700-800g)
 700 │   ▲                ▲
 600 │  ╱ ╲   Solar Dip  ╱ ╲
 500 │ ╱   ╲_ (450g) _  ╱   ╲
 400 ├───────▼───────▼───────
 300 ├─────── West US (Duck Curve: 150-400g)
 200 │   ▲      Solar Noon (130g)
 100 ├────╲────────▼─────────
  50 ├─────── North Europe (Wind Heavy: 50-250g)
   0 └───────────────────────────────────────► Time (24 Hours)
     00:00  06:00  12:00  18:00  23:00
```

| Region | Identifier | Simulated Range | Primary Energy Generation Characteristics |
|---|---|---|---|
| **India** | `india` | **400 – 800 $gCO_2/kWh$** | Thermal coal baseload dominant. High evening peak demand (6 PM–10 PM). Solar contribution during daylight hours drops intensity to 450–550g. |
| **North Europe** | `north-europe` | **50 – 250 $gCO_2/kWh$** | High renewable wind and hydro penetration. Lowest carbon intensity overall. Night-time and early morning wind generation provides cleanest windows. |
| **West US** | `west-us` | **150 – 400 $gCO_2/kWh$** | Strong solar generation creating a classic "duck curve". Cleanest window occurs between 10 AM and 3 PM; dirtier morning/evening gas peakers. |

---

## 6. Complete System Architecture & Folder Structure

```
greenqueue/
├── public/                       # Static public assets
├── src/
│   ├── types/
│   │   └── index.ts              # Strongly-typed TypeScript interfaces
│   ├── services/
│   │   ├── schedulingService.ts  # Core deterministic carbon-aware scheduling engine
│   │   ├── carbonForecastService.ts # Regional diurnal forecast simulation
│   │   ├── jobService.ts         # Workload CRUD, input validation, initial sample data
│   │   ├── executionService.ts   # Workload execution simulator with progress hooks & failure injection
│   │   ├── emissionsService.ts   # GHG Scope 2 emissions calculations & real-world equivalencies
│   │   ├── analyticsService.ts   # Realized vs projected KPI aggregation & CSV generation
│   │   ├── storageService.ts     # Abstracted persistence layer (ready for cloud DB)
│   │   └── demoScenarioService.ts# 8 verification scenarios & 6 presentation stages
│   ├── store/
│   │   └── AppContext.tsx        # Global React Context with simulation clock dispatcher
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Shell layout with responsive navigation
│   │   │   ├── Sidebar.tsx       # Sidebar navigation with active indicator & NMIT badge
│   │   │   └── TopNav.tsx        # Simulation clock, +1h/+4h advance buttons, quick reset
│   │   ├── common/
│   │   │   ├── StatCard.tsx      # Reusable KPI card with simulated tags & deltas
│   │   │   ├── Badge.tsx         # Color-coded badges for priority, status, and grid conditions
│   │   │   └── ToastContainer.tsx# Floating interactive toast alert notifications
│   │   └── charts/
│   │       ├── ForecastChart.tsx             # 24h regional forecast with region toggle
│   │       ├── EmissionsComparisonChart.tsx  # Conventional baseline vs GreenQueue bar chart
│   │       ├── WorkloadDistributionChart.tsx # Priority donut & status distribution
│   │       ├── RegionalComparisonChart.tsx   # Cross-regional carbon intensity comparison
│   │       └── SavingsTrendChart.tsx         # Cumulative CO₂ avoided trendline
│   ├── pages/
│   │   ├── Overview/             # Operational Dashboard (6 KPI cards, 5 charts)
│   │   ├── JobSubmission/        # Workload Submission with live recommendation preview
│   │   ├── WorkloadQueue/        # Queue Table with search, priority/status filters, run/retry
│   │   ├── CarbonIntelligence/   # Regional profiles, grid fluctuation trigger
│   │   ├── SmartScheduler/       # Candidate window table & natural language rationale
│   │   ├── ExecutionHistory/     # Immutable execution audit log & CSV download
│   │   ├── SustainabilityReports/# ISO 14064 Scope 2 reports & real-world equivalencies
│   │   ├── DemoScenarios/        # 8 independently runnable validation scenarios
│   │   ├── PresentationMode/     # 6-stage guided 5–7 minute presentation experience
│   │   └── Settings/             # Baseline selection, clock controls, JSON backup
│   ├── App.tsx                   # React Router route registry
│   ├── main.tsx                  # React DOM root entry
│   └── index.css                 # Tailwind CSS v4 styling & dark theme variables
├── test-core.ts                  # Automated unit and integration test suite
├── package.json                  # Dependencies & execution scripts
├── vite.config.ts                # Vite build configuration with Tailwind v4 plugin
└── README.md                     # Comprehensive technical documentation
```

---

## 7. Technology Stack & Architectural Decisions

- **Frontend Framework:** React 19 + TypeScript (Strict Mode)
- **Bundler & Build Tool:** Vite 8.3
- **Styling System:** Tailwind CSS v4 with custom dark palette (`#080D12` background, `#101A22` glass panels, `#75E0A2` green accents)
- **Data Visualizations:** Recharts
- **Iconography:** Lucide React
- **Local-First Architecture:** Standalone operation without cloud credentials, ready for cloud database migration.

---

## 8. Comprehensive UI/UX Feature Breakdown

1. **Overview Dashboard (`/`):** 6 live KPI cards, 24h forecast area chart, conventional vs GreenQueue emissions bar chart, workload priority donut, and regional comparison.
2. **Job Submission (`/jobs/new`):** Interactive form with validation and live recommendation preview before submission.
3. **Workload Queue (`/queue`):** 8 lifecycle states, live execution simulator with progress bars, override option, retry for failed jobs, and candidate audit modal.
4. **Carbon Intelligence (`/carbon`):** 24h predictive models for India, North Europe, and West US with dynamic weather shift simulation.
5. **Smart Scheduler (`/scheduler`):** Candidate window table, deadline violation checks, and natural-language decision explanation.
6. **Execution History (`/history`):** Complete execution audit trail with multi-filter search and CSV export.
7. **Sustainability Reports (`/reports`):** Scope 2 carbon reports, realized vs projected breakdown, and equivalency metrics (trees, car km, LED hours).
8. **Scenario Library (`/scenarios`):** 8 independently runnable validation scenarios with expected vs actual outcome comparison.
9. **Presentation Mode (`/presentation`):** 6-stage guided 5–7 minute live walkthrough with clock controls.
10. **System Settings (`/settings`):** Simulation controls, baseline region selection, and database JSON backup.

---

## 9. Pre-Loaded Demo Dataset (Initial 10 Workloads)

| ID | Job Name | Type | Priority | Energy (kWh) | Runtime | Deadline | Initial Status |
|---|---|---|---|---:|---:|---:|---|
| **GQ-001** | Customer Payment API | Web Service | **Urgent** | 20 | 1h | 2h | `ready` |
| **GQ-002** | AI Model Training | ML Training | **Flexible** | 120 | 4h | 24h | `scheduled` |
| **GQ-003** | Nightly Database Backup | Backup | **Flexible** | 60 | 2h | 12h | `scheduled` |
| **GQ-004** | Financial Report Generation | Analytics | **Flexible** | 35 | 1h | 6h | `scheduled` |
| **GQ-005** | Security Patch Deployment | Batch | **Urgent** | 15 | 1h | 1h | `ready` |
| **GQ-006** | 4K Video Rendering | Batch | **Flexible** | 200 | 6h | 24h | `scheduled` |
| **GQ-007** | Customer Data Sync | DB Processing | **Flexible** | 45 | 2h | 3h | `scheduled` |
| **GQ-008** | Monthly Cold Archive | Backup | **Flexible** | 80 | 4h | 24h | `scheduled` |
| **GQ-009** | Inventory Demand Forecasting | Analytics | **Flexible** | 50 | 2h | 12h | `scheduled` |
| **GQ-010** | Banking Settlement Transaction | Web Service | **Urgent** | 10 | 1h | 1h | `ready` |

---

## 10. Automated Verification Tests (19 Passing Tests)

```bash
npm test
```

All 19 test suites pass without errors, validating:
- Forecast generation across all 3 regions
- Urgent workload zero intentional delay guarantee
- Flexible workload multi-region lowest-emission selection
- Strict deadline constraint filtering
- Region-restriction adherence
- Zero opportunity edge cases ($D = R$)
- Mathematical emissions and avoided $CO_2$ formulas

---

## 11. 5–7 Minute Guided Presentation Walkthrough

Follow this structured script during viva or project evaluation:
1. **Minute 1 (Stage 1 - Environmental Problem):** Explain regional carbon disparity (India coal vs. North Europe wind).
2. **Minute 2 (Stage 2 - Urgent Workload Guarantee):** Click *"Submit Live Payment API Job"* $\rightarrow$ show immediate execution recommendation with 0 delay.
3. **Minute 3 (Stage 3 - Flexible Workload Optimization):** Click *"Submit Live ML Training Job"* $\rightarrow$ show 60+ candidates evaluated and 65% emissions avoided.
4. **Minute 4 (Stage 4 - Dynamic Grid Changes):** Click *"Simulate Wind Drop & Solar Ramp"* $\rightarrow$ show reactive re-scheduling.
5. **Minute 5 (Stage 5 - Workload Execution):** Click *"Advance +4h"* $\rightarrow$ *"Execute Ready Workloads"* $\rightarrow$ observe live progress bars.
6. **Minutes 6–7 (Stage 6 - Quantified Impact):** View realized emissions avoided, equivalencies (trees grown), and export the audit log CSV.

---

## 12. Local Setup & Execution Guide

```bash
# 1. Navigate to project directory
cd greenqueue

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run automated test suite
npm test

# 5. Build for production
npm run build
```

Open your browser to: **`http://localhost:5173/`**

---

## 13. Limitations, Assumptions & Future Cloud Roadmap

- **Current Simulation:** Regional carbon intensities are based on representative diurnal models rather than live third-party API subscriptions.
- **Future Integration:** Direct connector to the **Electricity Maps API** / **WattTime API**, packaging as a **Kubernetes Kube-Scheduler extender**, and automated trigger webhooks for AWS Batch / Azure Container Instances.

---

## 14. Academic Standards & ISO 14064 Compliance

- Follows **GHG Protocol Scope 2** market-based and location-based reporting guidelines.
- Complies with **ISO 14064-1** organizational greenhouse gas quantification standards.
- Enforces a strict **Zero Greenwashing Policy**: realized emissions savings are calculated only from verified, successfully completed workloads.

---

### Project Attribution
- **Institution:** Nitte Meenakshi Institute of Technology (NMIT), Bangalore
- **Department:** Computer Science & Engineering / Information Science
- **Curriculum:** Green IT & Sustainable Computing
- **Version:** 1.0.0 (Presentation-Ready Release)
