# Meeru Frontend

## What is Meeru?

Meeru AI is an **enterprise financial operations platform** that automates and optimizes finance workflows across revenue assurance, cash management, financial reporting, period-end close, and business operations. It serves finance teams (analysts, accountants, controllers, CFOs) with AI-powered automation, intelligent matching, and variance analysis.

**Currency**: USD for enterprise modules, INR (Crores/Lakhs) for IGRS module.

## Tech Stack

Next.js 13 App Router, TypeScript, Tailwind CSS, Shadcn/UI, Lucide icons. Current page count: 91 (`find app -name page.tsx | wc -l`). No testing framework.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (use to verify zero TS errors)
npm run lint         # ESLint (ignored during builds)
npm run typecheck    # tsc --noEmit
npm run format       # Prettier write
npm run format:check # Prettier check
```

Always run `npm run build` after significant changes to verify zero TypeScript errors.

## Environment

```bash
NEXT_PUBLIC_DATA_SOURCE=json   # "json" (default) or "api" — switches data provider at runtime
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api  # Only needed when DATA_SOURCE=api
API_BASE_URL=http://localhost:8000  # Used by Next.js server routes (SSE/query/sessions proxies)
```

## Path Aliases

Prefer `@/` imports for cross-folder/shared modules. Relative imports are acceptable for local same-feature files.
```ts
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIgrsCases } from "@/hooks/data"
```

---

## The 6 Rails — Functional Overview

### Rail 1: HOME (Personal Workspace & AI)
Personal command center and collaboration hub.

| Page | What It Does |
|------|-------------|
| **Command Center** | AI chat interface — query financial data in natural language, generate visualizations, execute bulk actions |
| **My Workspace** | Customizable dashboard with live KPIs, recent items, quick actions |
| **Live Pins** | Monitor critical metrics with auto-refresh, alert thresholds, sparkline trends |
| **Watchlist** | Track high-value entities (customers, cases, invoices) with condition-based alerts |
| **Autonomy Studio** | Visual workflow builder — create scheduled/event-triggered automations for finance processes |
| **Narratives** | AI-generated business summaries explaining month-end performance |
| **Process-to-Automation** | Identifies manual finance processes that can be automated |
| **Dynamic Sheets** | Spreadsheet-like data editor with formula support |
| **Data Template** | AG Grid-based template management for recurring data operations |

### Rail 2: AUTOMATION (Data Movement & Execution)
Manages scheduled data imports/exports, reconciliation engine runs, and workflow execution.

| Page | What It Does |
|------|-------------|
| **Data Templates** | ETL job management — import bank statements, payment files, ERP GL exports; map fields, schedule runs |
| **All Runs** | Execution history of all templates/workflows (status, duration, errors, retries) |
| **Reconciliation** | Automated GL-to-subledger matching engine (target: >80% auto-match) |
| **Worklist** | Task queue for manual work items that can't be automated, with SLA tracking |
| **Workflow** | Advanced multi-step process designer for close orchestration, approval chains |
| **TaskFlow** | Task dependency management and critical path tracking |
| **Autonomy Studio** | Same as Home's — entry point for workflow automation |

### Rail 3: REPORTS (Financial Analysis & Compliance)
Read-only financial statements with drill-down and AI-powered variance analysis. All 6 pages use AG Grid + hooks.

| Page | What It Does |
|------|-------------|
| **Balance Sheet** | Asset/liability/equity position — multi-period comparison, drill-down to GL, AI anomaly detection |
| **Income Statement** | Period revenue & expense performance with trend analysis |
| **Trial Balance** | Complete GL account listing with opening/closing balances, pre-close verification |
| **Account Activity** | Transaction-level detail for any GL account (drill from BS → TB → here) |
| **One-Click Variance** | AI auto-identifies >10% variances and generates narrative explanations |
| **Flux Analysis** | Deep variance breakdown by driver: volume, price, mix, FX impact, one-time items. SVG charts |

### Rail 4: WORKBENCH (Operational Execution)
Action-oriented tools for deep operational work. Unlike Reports, Workbenches are fully editable.

#### Order-to-Cash (O2C) — Cash Management & Collections
**Core flow**: Bank files imported → AI matching engine suggests payment-to-invoice matches → analyst reviews by confidence score → post to GL.

| Page | What It Does |
|------|-------------|
| **Cash Application** (14 pages) | Main workbench: payment matching, remittance extraction, exception handling, GL posting. AI confidence scores: >95% auto-approve, 70-95% review, <70% manual |
| **Cash Collection** | Collections management — AI-prioritized aging invoices, log attempts, track payment plans |
| **Disputes** | Invoice dispute management — log reason/amount, coordinate resolution, track timelines |
| **Merchant Dashboard** | Merchant payment operations overview |

**Key metrics**: Auto-match rate (>85%), processing time (<2hr), unapplied cash aging, DSO (<45 days)

#### Procure-to-Pay (P2P)
| Page | What It Does |
|------|-------------|
| **SaaS Renewal** | Contract lifecycle management — renewals, volume discounts, usage vs. licensed seats. Uses Chart.js |
| **AP Exceptions** | 3-way match exceptions (invoice vs PO vs receipt) — quantity/price mismatches, duplicates |

#### Record-to-Report (R2R) — Period-End Close
**Close phases**: Pre-Close (Day 1-10) → Core Close (Day 10-11) → Post-Close (Day 12-14) → Reporting (Day 15+)

| Page | What It Does |
|------|-------------|
| **Close Workbench** | Orchestrates 30-100 month-end tasks — dependencies, critical path, SLA alerts, blocker escalation. Target: <5 days to close |
| **Reconciliations** | GL-to-subledger reconciliation — auto-match, investigate unmatched, certify, attach evidence |

**SOX stage workflow**: DRAFT → PREPARED → IN_REVIEW → APPROVED → POSTED_LOCKED (immutable)

#### Other Workbench Modules
| Page | What It Does |
|------|-------------|
| **MRP** (Supply Chain) | Material Requirements Planning — PO status tracking, supplier performance, delivery delays |
| **BPO Setup** | Configure Business Process Outsourcing vendors — SLA targets, staff, accuracy, contract management |
| **Variance Drivers** (FP&A) | Root cause analysis of budget variances — volume, price, mix, timing, FX, one-time items |
| **Revenue Recognition** (Rev Ops) | ASC 606 compliance — performance obligations, deferred revenue, contract amendments |
| **Liquidity** (Treasury) | Cash position monitoring — 13-week forecast, bank balances, debt covenant compliance |

### Rail 5: IGRS (Indian Government Revenue Assurance)
Dedicated module for stamp duty revenue assurance across Indian sub-registrar offices. All amounts in INR. **NOT part of Meeru AI enterprise scope.**

#### 8 Leakage Signal Types
1. **RevenueGap** — Mismatch between expected stamp duty and actual payment
2. **ChallanDelay** — Abnormal delay (>10 days) between presentation and registration
3. **ExemptionRisk** — Suspicious or ineligible exemption claims
4. **MarketValueRisk** — Declared value deviates from market rate card
5. **ProhibitedLand** — Transaction involves prohibited zones
6. **DataIntegrity** — Missing/inconsistent registration data fields
7. **CashReconciliation** — Cash collection GL vs treasury mismatch
8. **StampInventory** — Physical stamp paper inventory discrepancy

| Page | What It Does |
|------|-------------|
| **Overview** | Executive dashboard — total payable/paid/gap, high-risk cases, daily cash risk score, top offices by gap |
| **Cases** | Case management (New → In Review → Confirmed → Resolved/Rejected) with risk levels, confidence scores |
| **Insights** | AI-powered pattern analysis — top drivers by jurisdiction, exemption abuse patterns |
| **Patterns** | Statistical anomaly detection — spikes, drops, drifts, seasonal patterns |
| **MV Trends** | Market value trend tracking by district/zone, hotspot identification |
| **Governance** | Office config, jurisdiction settings, policy management |
| **AI Chat** | Natural language queries about IGRS data |
| **Admin** | IGRS-specific user management and audit trail |

**Key metrics**: Detection accuracy (>90%), recovery rate (>70%), case SLA compliance (>95%)

### Rail 6: ADMIN (Platform Administration)

| Page | What It Does |
|------|-------------|
| **Users** | User provisioning, role assignment, team organization by department |
| **Integrations** | ERP connectors (NetSuite, SAP, Oracle), bank connectors (BAI2/CSV/OFX), email integration |
| **Audit Log** | Immutable compliance trail — who modified what, when, from where. Exportable for auditors |
| **Settings** | Company config, fiscal calendar, currency/FX rates, chart of accounts, materiality thresholds |

---

## User Roles (6 Roles)

| Role | Can Do | Typical User |
|------|--------|-------------|
| **PREPARER** | Create tasks, fill forms, prepare docs | Analyst, Staff Accountant |
| **REVIEWER** | Review work, approve/reject | Senior Analyst, Manager |
| **APPROVER** | Final approval on critical items | Director, VP Finance |
| **CONTROLLER** | Post to GL, lock periods | Accounting Controller |
| **CFO** | View-only across all modules | CFO, Finance VP |
| **ADMIN** | Full system access + configuration | System Administrator |

---

## Key Domain Terminology

- **O2C / P2P / R2R**: Order-to-Cash / Procure-to-Pay / Record-to-Report (finance cycles)
- **DTC**: Days to Close (target: <5 days)
- **DSO**: Days Sales Outstanding (target: <45 days)
- **GL**: General Ledger (master accounting system)
- **AR / AP**: Accounts Receivable / Accounts Payable
- **Remittance**: Payment detail from customer (which invoices are being paid)
- **Auto-match**: High-confidence AI matches approved without human review
- **Unapplied cash**: Payments received but not yet matched to invoices
- **Close task**: Individual item on period-end checklist
- **Critical path**: Longest dependent task chain determining close duration
- **Leakage signal**: Indicator of potential revenue loss (IGRS: 8 signal types)
- **SR Office**: Sub-Registrar office (IGRS government property registration)
- **Challan delay**: Days between property presentation and registration

---

## Project Structure

```
app/
  (main)/                              # Main app group (wrapped by AppShell + AuthProvider)
    <rail>/<section>/<page>/page.tsx   # All page routes
  api/                                 # Next.js API routes (mock endpoints)
  layout.tsx                           # Root: AuthProvider → QueryClient → Sonner
  providers.tsx                        # React Query (5-min stale, no refetch on focus) + Sonner toast
  globals.css                          # Tailwind base + custom design tokens

components/
  layout/                              # Shell: app-shell, sidebar, navigation-panel, breadcrumb, header
  ui/                                  # 48 Shadcn/UI components
  chat/                                # AI chat interface
  cash-app/                            # Cash application UI
  workspace/                           # Workspace features
  igrs/                                # IGRS module components
  shared/                              # Cross-module reusable components

lib/
  navigation.ts                        # NAVIGATION_STRUCTURE (6 rails, 40+ nav items)
  utils.ts                             # cn() helper (clsx + tailwind-merge)
  auth-context.tsx                     # Auth context (6 roles)
  permissions.ts                       # Role-based access control
  data/
    data-service.ts                    # Central data service (10 modules, switchable provider)
    providers/json-provider.ts         # JSON data provider (reads from public/data/)
    providers/api-provider.ts          # API provider (skeleton)
    types/                             # TypeScript types (12 modules)
    utils/                             # Data transformation utilities
    validations/                       # Zod schemas
  cash-app-store.tsx                   # Cash app state management
  dynamic-sheets-store.tsx             # Spreadsheet-like state

hooks/data/                            # 42 custom data hooks (barrel export: hooks/data/index.ts)
public/data/                           # JSON data files (mock data source)
```

## App Layout Chain

```
RootLayout → QueryClientProvider (5-min stale) + Sonner Toaster → AuthProvider
  → (main)/layout.tsx → AppShell + PrivateRoute + ErrorBoundary (dynamic, no SSR) → Page
```

## Data Service Modules

```
dataService.igrsRevenue        — IGRS cases, rules, signals, dashboard
dataService.revenueAssurance   — Enterprise revenue (IGRS-only scope)
dataService.cashApplication    — payments, remittances, matching, exceptions, bank lines
dataService.reports            — balanceSheet, incomeStatement, trialBalance, journalEntries, fluxAnalysis
dataService.closeManagement    — getTasks, updateTask
dataService.reconciliations    — getReconciliations
dataService.workspace          — pins, watchlist, activityFeed, dataTemplates
dataService.automation         — workflows
dataService.ai                 — chat sessions
dataService.common             — notifications, auditLog, users
```

## Coding Conventions

- All pages use `"use client"` directive
- `cn()` from `@/lib/utils` for conditional class names
- Use `Array.from()` instead of Set spreading (not supported in tsconfig)
- Use `formatInr()` for INR currency (Cr for 10M+, L for 100K+, K for 1K+)
- Use `$` + `toLocaleString()` for USD amounts
- Badge variants: `"destructive"` for high/critical, `"secondary"` for medium, `"outline"` for low
- Badge color pattern: `className="bg-{color}-50 text-{color}-700 border-{color}-200"`
- Prefer inline SVG charts unless page already uses recharts/Chart.js
- AG Grid for Reports rail and data-template pages
- Prefer editing existing files over creating new ones

## Page Pattern

```
"use client"
imports → interface → MOCK_DATA → badge helpers → default export function
  → useState (search, filters, selected record)
  → useMemo (filtered data, KPI calculations)
  → return:
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      <header> sticky breadcrumb + icon + title + description + border </header>
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6">
          4x KPI cards (grid-cols-4, card-interactive class)
          Filter bar (search Input + Select dropdowns)
          Table with clickable rows → opens Sheet/Dialog drawer
        </div>
      </div>
      <Sheet> detail drawer: summary grid + action buttons </Sheet>
    </div>
```

## Tailwind Custom Tokens

Defined in `globals.css` and `tailwind.config.ts`:
- **Gradients**: `gradient-primary` (blue), `gradient-accent` (indigo), `gradient-success/warning/danger`
- **Elevation shadows**: `elevation-1` through `elevation-4`
- **Animations**: `card-lift`, `fade-in-up`, `slide-in-right`, `scale-in`, `glow-pulse`
- **Colors**: HSL CSS variables for theming (light + dark mode via `.dark` class)

## API Routes (Internal Mock)

Key routes in `app/api/`:
- `/api/close/tasks` — Close management tasks
- `/api/mrp-workbench` — MRP workbench CRUD
- `/api/data-templates` — Template management
- `/api/sessions/[userId]` — Chat sessions
- `/api/dynamic-sheets` — Spreadsheet CRUD
- `/api/recons` — Reconciliation
- `/api/sse` — Server-Sent Events (streaming)
- `/api/commandQuery` — Query submission proxy
- `/api/query/[queryId]/result` — Query result proxy/polling

## Important Notes

- Revenue Leakage is **IGRS-only**, NOT part of Meeru AI scope
- Old `revenue-assurance/` route is a duplicate of IGRS (11 pages, hook-based)
- Chart libraries vary: recharts, Chart.js, inline SVG — match the existing page's approach
- No testing framework — verify with `npm run build` and manual navigation
- Deployment: standalone output for Docker, Netlify-aware conditional config

## Documentation Maintenance Policy (Mandatory)

- `CLAUDE.md` must be updated whenever project behavior, structure, routes, APIs, conventions, tooling, environment variables, or architecture changes.
- This applies to **all** code changes, including changes made by Codex.
- Update this file in the same change set as the code change (same PR/commit batch), not later.
- Do **not** rewrite the whole document for routine updates. Use append-only updates in the `## Update Log (Append-Only)` section.
- Keep existing sections intact unless information is incorrect; in that case, correct the inaccurate line and add an append-only log entry explaining what changed.
- Each append-only update entry must include:
  - Date (`YYYY-MM-DD`)
  - What changed
  - Affected paths/routes/modules
  - Any required env/script/command changes
  - Backward-compatibility or migration notes (if any)

## Update Log (Append-Only)

### 2026-02-24
- Corrected stale/inaccurate metadata:
  - Page count updated to 91 with command reference.
  - Added `API_BASE_URL` to environment variables for Next.js server proxy routes.
  - Clarified import guidance (`@/` preferred; local relative imports allowed).
  - Corrected root layout/provider order to match implementation.
  - Updated API routes list to include `/api/commandQuery` and `/api/query/[queryId]/result`.
- Added mandatory policy requiring `CLAUDE.md` updates for every project/code change, including Codex-driven edits, with append-only logging.

### 2026-02-25
- **Enterprise Design System Overhaul** — migrated from `#0A3B77` brand navy to `#1E40AF` blue (`--primary: 217 91% 40%`).
  - **Phase 1 (Tokens)**: Updated `globals.css` HSL variables (`--primary`, `--ring`, `--border`, `--input`), gradient definitions, scrollbar colors, animation rgba values, tooltip styling. Added semantic color tokens (`--color-danger-*`, `--color-warning-*`, `--color-info-*`, `--color-success-*`). Updated `tailwind.config.ts` glow/border-glow keyframes.
  - **Phase 2 (UI Components)**: Updated 11 Shadcn components — `button.tsx` (added `danger` variant, replaced hardcoded colors with `bg-primary`), `badge.tsx`, `card.tsx`, `table.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `checkbox.tsx` (h-[18px], border-slate-300), `textarea.tsx` (rounded-lg, focus ring).
  - **Phase 3 (Layout Shell)**: Dark sidebar (`bg-slate-900`), white nav panel (`bg-white`, `w-60`), clean header (`bg-white border-slate-200`), `bg-slate-50` main content. Updated `sidebar.tsx`, `navigation-panel.tsx`, `header.tsx`, `main-content.tsx`, `breadcrumb.tsx`, `app-shell.tsx`.
  - **Phase 4 (Toast + Polish)**: Toast restyled to white with colored left border per type. Updated `providers.tsx`, `live-pin-modal.tsx`, `aging-summary-cards.tsx`, `prompt-composer.tsx`.
  - **Phase 5 (Page Fixes)**: Eliminated all ~98 `#0A3B77` references across ~30 files. Converted selected tab/chip states from `bg-slate-900` to `bg-primary`. Converted 3 dark table headers to light `bg-slate-50` style.
  - **Button variant type** now includes `'danger'` in addition to existing variants.
  - **Sidebar width** changed from `w-[72px]` to `w-16` (64px). Nav panel from `w-[280px]` to `w-60` (240px).
  - No env/script/command changes. No breaking API changes. Build verified with zero TypeScript errors.
