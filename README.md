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

### Controlled Variability & Seeding
Forecasts are generated using a seeded pseudo-random number generator (`SeededRandom`), ensuring reproducible simulation results across demo runs while supporting on-demand grid weather fluctuations via the **"Simulate Grid Fluctuation"** button.

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

### Design System & Theme
- **Background:** `#080D12` (deep dark monitor background)
- **Primary Surface:** `#101A22` (glass card container)
- **Secondary Surface:** `#14232B` (inner nested containers)
- **Border Palette:** `#24343C` (subtle border definition)
- **Primary Text:** `#E8F1EE` (crisp high-contrast text)
- **Secondary Text:** `#8DA29E` (muted labels and subtitles)
- **Primary Green:** `#75E0A2` (energy-efficient accent)
- **Secondary Green:** `#27B56E` (gradient endpoints)
- **Lime Accent:** `#C4F27B` (savings highlights)
- **Urgent / Error:** `#FF7C78` (immediate alerts & conventional baselines)
- **Warning:** `#F4BD67` (moderate grid conditions)

### Why Local-First Modular Architecture?
- **Zero Cloud Friction:** Runs completely standalone without requiring AWS, Azure, or GCP credentials or paid API billing accounts.
- **Academic Reliability:** Guarantees zero downtime or network timeouts during live classroom and viva demonstrations.
- **Clean Service Separation:** All business logic lives in pure TypeScript service files (`schedulingService`, `emissionsService`, `carbonForecastService`) decoupled from React presentation components. Migrating to Supabase, PostgreSQL, or Firebase in the future requires modifying only `storageService.ts`.

---

## 8. Comprehensive UI/UX Feature Breakdown

### 8.1 Overview Dashboard (`/`)
- **6 Operational KPI Cards:**
  1. *Total Jobs Managed:* Total workloads registered in the scheduler.
  2. *Jobs Optimized:* Number of flexible workloads successfully deferred to cleaner hours.
  3. *Estimated $CO_2$ Avoided:* Net carbon savings in kilograms, distinguishing realized from projected.
  4. *Average Carbon Reduction:* Mean percentage reduction across all scheduled workloads.
  5. *Total Energy Consumed:* Cumulative kilowatt-hours dispatched.
  6. *Successful Executions:* Count of workloads executed and audited.
- **5 Interactive Visualizations:**
  - *24-Hour Carbon Forecast Chart:* Area chart with tabs to toggle between India, North Europe, and West US.
  - *Emissions Comparison Chart:* Side-by-side bar chart of conventional baseline vs. GreenQueue emissions by workload type.
  - *Workload Distribution Donut:* Proportions of urgent vs. flexible jobs and status breakdown.
  - *Regional Intensity Comparison:* Horizontal bar chart comparing live grid cleanliness.
  - *Cumulative Savings Trendline:* Running total of avoided carbon emissions.

---

### 8.2 Job Submission Form (`/jobs/new`)
- **Required Fields:**
  - Workload Name (text)
  - Workload Type (`Batch`, `ML Training`, `Backup`, `Data Analytics`, `Web Service`, `Database Processing`)
  - Priority Class (`Urgent` vs. `Flexible`)
  - Preferred Region (`Automatic Selection`, `India`, `North Europe`, `West US`)
  - Energy Consumption (numeric kWh)
  - Execution Runtime (`1h`, `2h`, `4h`, `6h`, `8h`)
  - SLA Deadline (`1h`, `2h`, `3h`, `6h`, `12h`, `24h`)
- **Strict Input Validation:** Rejects empty names, non-positive energy, non-positive runtime, and invalid deadlines where $\text{Deadline} < \text{Runtime}$.
- **Live Scheduling Preview Card:** As the user adjusts parameters, the scheduling engine evaluates candidates in real-time, displaying recommended region, start time, baseline emissions, and projected savings *before* submission.

---

### 8.3 Workload Queue & Execution Simulator (`/queue`)
- **Table Columns:** Job ID, Name, Priority, Type, Preferred/Recommended Region, Scheduled Slot, Mean Carbon Intensity, Avoided $CO_2$, Status, and Action Controls.
- **8 Workload Lifecycle Statuses:**
  - `submitted`: Registered in the queue.
  - `analyzing`: Evaluating candidate windows.
  - `scheduled`: Assigned to an optimal future low-carbon window.
  - `ready`: Scheduled window has arrived; ready for execution.
  - `running`: Actively executing with an animated progress bar.
  - `completed`: Successfully executed and audited in history.
  - `failed`: Simulated execution error; available for retry.
  - `cancelled`: Aborted by operator.
- **Action Buttons:**
  - *Inspect (Eye Icon):* Opens the Decision Audit Modal displaying natural-language rationale and the complete candidate evaluation table.
  - *Execute (Play Icon):* Dispatches ready jobs or executes early with an override warning.
  - *Retry (Rotate Icon):* Resets failed jobs back to `ready` status.
  - *Cancel / Delete:* Terminates running jobs or removes entries with confirmation.

---

### 8.4 Regional Carbon Intelligence (`/carbon`)
- Displays real-time intensity, renewable percentage, and 24-hour forecasts for all 3 regions.
- **Cleanest Window Highlight:** Identifies the lowest-emission window and optimal start hour for each region.
- **Peak Carbon Warning:** Flags dirty grid hours to be avoided.
- **"Simulate Grid Fluctuation" Button:** Simulates dynamic wind drops or solar ramp-ups and triggers automatic re-evaluation of all pending flexible workloads.

---

### 8.5 Deterministic Smart Scheduler & Explainability (`/scheduler`)
- Workload selector allowing examiners to audit any specific job.
- **Decision Audit Card:** Natural-language explanation generated by the engine detailing why a specific region and start hour were chosen.
- **Candidate Evaluation Explorer:** Complete table of every evaluated start hour, runtime window, mean carbon intensity, emissions, feasibility flag, and rejection reasons (e.g., SLA deadline violations).

---

### 8.6 Workload Execution History (`/history`)
- Immutable log of all executed jobs containing: Job ID, Name, Submission Time, Scheduled Time, Actual Execution Time, Original vs. Actual Region, Baseline vs. Actual Intensity, Energy Consumed, Baseline vs. Actual Emissions, Avoided $CO_2$, Duration, and Final Status.
- Multi-dimensional filters: Search by name, region filter, workload type filter, and status filter.
- **"Export Audit Log (CSV)" Button:** Generates a standards-compliant CSV file download for external reporting.

---

### 8.7 Sustainability & Emissions Reports (`/reports`)
- Scope 2 GHG protocol report view.
- Realized vs. Projected impact tabs preventing duplicate accounting.
- **Real-World Environmental Equivalency Cards:**
  - 🌳 Urban trees growing for 1 year (based on $21\,kg\,CO_2/\text{tree-year}$).
  - 🚗 Passenger vehicle driving distance avoided (based on $0.21\,kg\,CO_2/\text{km}$).
  - 💡 LED bulb illumination hours (based on $0.005\,kg\,CO_2/\text{hour}$).
  - 📱 Smartphone full battery recharge cycles (based on $0.008\,kg\,CO_2/\text{charge}$).
- One-click CSV report export.

---

### 8.8 Demonstration Scenario Library (`/scenarios`)
8 independently verifiable test scenarios covering edge cases:
1. **Urgent Workload:** Customer Payment API $\rightarrow$ immediate recommendation (0 delay).
2. **Flexible Workload:** AI Model Training $\rightarrow$ selects lowest-emission North Europe window.
3. **Tight Deadline:** Customer Data Sync $\rightarrow$ filters candidate search to only feasible windows.
4. **Region Restriction:** Regional Database Backup $\rightarrow$ restricts placement to India only.
5. **Changing Carbon Intensity:** Forecast shift re-evaluates flexible jobs while urgent jobs stay unchanged.
6. **No Optimization Opportunity:** Immediate Data Processing ($D = R = 6h$) $\rightarrow$ immediate start recommended.
7. **Equal Carbon Intensity:** Identical emission candidates $\rightarrow$ deterministic tie-break selects earliest slot.
8. **Execution Failure:** Simulates mid-run failure $\rightarrow$ marks failed, logs zero savings, supports retry.

---

### 8.9 Presentation Demo Mode (`/presentation`)
A structured 6-stage presentation module with projector-optimized typography:
- **Stage 1 (Environmental Problem):** Explains regional grid disparities.
- **Stage 2 (Urgent Workload):** Submits live payment job; demonstrates immediate execution guarantee.
- **Stage 3 (Flexible Workload):** Submits live ML job; demonstrates multi-region carbon shifting.
- **Stage 4 (Dynamic Grid Changes):** Simulates wind drops; demonstrates reactive re-scheduling.
- **Stage 5 (Workload Execution):** Advances clock by +4h; executes ready workloads in real-time.
- **Stage 6 (Environmental Impact):** Summarizes avoided carbon emissions and equivalency metrics.

---

### 8.10 System Settings & Controls (`/settings`)
- Configuration of default baseline comparison region (India by default).
- Automatic cross-region placement toggle.
- Minimum carbon reduction threshold slider.
- Simulation clock advance controls (+1h, +4h, +8h, +12h, +24h).
- Full database export as JSON backup.
- Reset demo button to restore initial sample workloads.

---

## 9. Pre-Loaded Demo Dataset (Initial 10 Workloads)

The platform initializes with 10 academic benchmark workloads:

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

*Every initial workload is processed through the deterministic scheduling engine upon application boot; zero KPI values are hardcoded.*

---

## 10. Automated Verification Tests (19 Passing Tests)

Run the automated test suite directly via:

```bash
npm test
```

### Verified Test Output:
```
========================================
🧪 RUNNING GREENQUEUE VERIFICATION TESTS
========================================

Test Suite 1: Carbon Forecast Generation
  ✅ PASS: Generates exactly 3 regions
  ✅ PASS: Contains India region
  ✅ PASS: Contains North Europe region
  ✅ PASS: Contains West US region
  ✅ PASS: India forecast has 24 hourly data points
  ✅ PASS: India intensity within simulated range (was 589 g)
  ✅ PASS: North Europe intensity within range (was 129 g)

Test Suite 2: Urgent Workload (No Intentional Delay)
  ✅ PASS: Urgent job recommended start time is IMMEDIATE (0 delay)
  ✅ PASS: Urgent job only considers immediate execution candidate
  ✅ PASS: Scheduling explanation notes urgent classification

Test Suite 3: Flexible Workload (Lowest-Emission Window Search)
  ✅ PASS: Flexible job evaluated multiple candidate windows (63)
  ✅ PASS: Savings is non-negative (63.36 kg)
  ✅ PASS: Selected lowest carbon region (North Europe, got north-europe)

Test Suite 4: Strict Deadline Constraint Enforcement
  ✅ PASS: Execution window finishes strictly on or before deadline

Test Suite 5: Regional Restriction Guarantee
  ✅ PASS: Job stayed in restricted India region
  ✅ PASS: Only India candidates were considered

Test Suite 6: No Delayed Opportunity (Runtime = Deadline)
  ✅ PASS: Recommends immediate start when deadline equals runtime

Test Suite 7: Emissions Calculation Formulas
  ✅ PASS: 100 kWh @ 500 gCO2/kWh = exactly 50 kg CO2
  ✅ PASS: 1250 kg formatted as tonnes

========================================
RESULTS: 19 PASSED, 0 FAILED
========================================
```

---

## 11. 5–7 Minute Guided Presentation Walkthrough

When presenting to evaluators, professors, or examiners, follow this structured demo script:

### Step 1: Open Presentation Mode (Minute 1)
- Navigate to `http://localhost:5173/` and click **"Presentation Mode"** on the top navigation bar.
- **Stage 1 (Environmental Problem):** Direct attention to the regional carbon intensity disparity: India's coal-heavy grid ($\sim 600\,gCO_2/kWh$) vs. North Europe's wind-heavy grid ($\sim 120\,gCO_2/kWh$). Highlight that running the same compute job in different regions causes wildly different environmental footprints.

### Step 2: Urgent Workload Guarantee (Minute 2)
- Advance to **Stage 2 (Urgent Workload)**.
- Click **"Submit Live Payment API Job"**.
- Point out that GreenQueue recommends **immediate execution with 0-hour delay**, proving the platform does not compromise critical business operations for carbon optimization.

### Step 3: Flexible Workload Optimization (Minute 3)
- Advance to **Stage 3 (Flexible Workload)**.
- Click **"Submit Live ML Training Job"** (140 kWh, 4h runtime, 24h deadline).
- Show how the scheduling algorithm evaluated 60+ candidate windows across 3 regions and identified that shifting execution to North Europe during clean night-time wind hours saves over **$60\,kg\,CO_2$ (65% reduction)**.

### Step 4: Dynamic Grid Adaptation (Minute 4)
- Advance to **Stage 4 (Dynamic Grid Changes)**.
- Click **"Simulate Wind Drop & Solar Ramp"**.
- Explain that renewable generation fluctuates in real life; demonstrate that GreenQueue dynamically detected the forecast shift and re-evaluated pending flexible workloads in real-time.

### Step 5: Workload Execution Simulator (Minute 5)
- Advance to **Stage 5 (Workload Execution)**.
- Click **"Advance +4h"** on the toolbar to advance the simulated clock to the scheduled execution window.
- Click **"Execute Ready Workloads"** and observe the live progress bars as jobs transition from `ready` $\rightarrow$ `running` $\rightarrow$ `completed`.

### Step 6: Quantified Impact & Compliance Audit (Minute 6–7)
- Advance to **Stage 6 (Environmental Impact)**.
- Review total avoided carbon emissions, overall reduction percentage, and tangible equivalencies (trees grown, car kilometers avoided).
- Navigate to **"Execution History"** and click **"Export Audit Log (CSV)"** to demonstrate academic accountability, data persistence, and ISO 14064 Scope 2 auditing capability.

---

## 12. Local Setup & Execution Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- Modern web browser (Chrome, Edge, Firefox, Brave)

### 1. Installation
Clone or open the project folder in your terminal:

```bash
cd "greenqueue"
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser to: **`http://localhost:5173/`**

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 13. Limitations, Assumptions & Future Cloud Roadmap

### Current Academic Assumptions
1. **Simulated Carbon Data:** Carbon intensity numbers are simulated diurnal models representative of typical regional grid mixes (not live API feeds), ensuring offline reliability during presentations.
2. **Workload Execution Simulation:** Compute executions are simulated via configurable timers and progress states rather than provisioning physical AWS/Azure virtual machines.
3. **Network Transfer Emissions:** Inter-region network transfer energy is assumed negligible compared to multi-hour computational workloads.

### Future Engineering Roadmap
1. **Live Grid Telemetry Integration:** Connect real-time carbon intensity streams via the **Electricity Maps API** or **WattTime API**.
2. **Kubernetes Kube-Scheduler Integration:** Package GreenQueue as an external Kubernetes scheduling plugin (`kube-scheduler` extender) to dynamically annotate Pod specifications and schedule container workloads to green Kubernetes clusters.
3. **Cloud Hyperscaler Webhook Handlers:** Automatically trigger AWS Batch, Azure Container Instances (ACI), or Google Cloud Run jobs via REST webhooks when optimal execution windows arrive.

---

## 14. Academic Standards & ISO 14064 Compliance

GreenQueue carbon accounting adheres to the following frameworks:
- **GHG Protocol Scope 2 Guidance:** Quantifies indirect greenhouse gas emissions resulting from electricity purchased and consumed by cloud data center operations.
- **ISO 14064-1 Standards:** Provides specification with guidance at the organization level for quantification and reporting of greenhouse gas emissions and removals.
- **Zero Greenwashing Policy:** Realized savings are exclusively calculated from verified, completed workloads; zero artificial or projected savings are accredited to cancelled or failed workloads.

---

### Project Attribution
- **Institution:** Nitte Meenakshi Institute of Technology (NMIT), Bangalore
- **Curriculum:** Green IT & Sustainability Engineering
- **Version:** 1.0.0 (Presentation-Ready Release)
- **Status:** Verified Complete
