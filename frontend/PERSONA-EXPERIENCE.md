# MeeruAI — Persona-Driven Experience

## How the Persona System Works

### End-to-End Flow

```
1. User visits /                                    (app/page.tsx)
   |
   |-- localStorage has meeru-demo-config? ---------+
   |   YES: redirect to /home/dashboard             |
   |   NO:  redirect to /onboarding                 |
   |                                                |
2. /onboarding                                      (app/(onboarding)/onboarding/page.tsx)
   |-- Step 1: Select role (CFO / VP Finance / Controller)
   |-- Step 2: Select industry (Technology / Healthcare / Manufacturing)
   |-- Step 3: Confirm + "Enter Platform"
   |-- Saves { persona, industry } to localStorage
   |-- Redirects to /home/dashboard
   |
3. /home/dashboard                                  (app/(main)/home/dashboard/page.tsx)
   |-- Reads persona from PersonaContext (localStorage-backed)
   |-- Renders persona-specific dashboard:
   |   CFO         -> CFOHomeDashboard
   |   VP Finance  -> VPFinanceHomeDashboard
   |   Controller  -> ControllerHomeDashboard
   |
4. Sidebar + Navigation filtered by persona
   |-- Sidebar shows only relevant rails
   |-- Nav panel shows only relevant items within each rail
   |
5. Header shows persona badge ("CFO") + Reset Demo button
   |-- Reset clears localStorage + redirects to /onboarding
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/persona-context.tsx` | PersonaProvider, usePersona() hook, Persona/Industry types |
| `lib/demo-routing.ts` | Persona-to-rail mapping, item-level filtering, display labels |
| `app/(onboarding)/onboarding/page.tsx` | 3-step onboarding wizard |
| `app/(main)/home/dashboard/` | Persona dashboard route + container + 3 views |
| `components/layout/app-shell.tsx` | Wires persona filtering into sidebar + nav panel |
| `components/layout/sidebar.tsx` | Dynamic rail rendering (respects `visibleRails` prop) |
| `components/layout/header.tsx` | Persona badge + Reset Demo button |

---

## Personas

### Chief Financial Officer (CFO)
- **Focus**: Strategic, board-level view
- **Keywords**: Performance Intelligence, UberFlux, Margin
- **Dashboard KPIs**: Close Progress %, On-Time Rate, Projected Close Date, Risk Score
- **Dashboard sections**: Critical Area Status, Performance Snapshot, AI Narratives
- **Quick navigation**: UberFlux, Flux Analysis, Form Factor

### VP Finance
- **Focus**: Operating performance, variance analysis, forecast accuracy
- **Keywords**: Flux Analysis, Forecasting, Variance
- **Dashboard KPIs**: Total Variance, Material Items, Reviewed %, Recon Exceptions
- **Dashboard sections**: Top 5 Variance Movers, Reconciliation Status
- **Quick navigation**: Flux Analysis, One-Click Variance, Standard Flux

### CAO / Controller
- **Focus**: Close management, operational execution, audit readiness
- **Keywords**: Close Intelligence, Reconciliation, Close Workbench
- **Dashboard KPIs**: Team Size, Total Tasks, On Track %, At Risk
- **Dashboard sections**: Close Progress by Phase, Reconciliation Summary, Team Performance
- **Quick navigation**: Close Workbench, Reconciliations, Standard Flux

---

## Navigation Filtering

### Rails Visible Per Persona

| Rail | CFO | VP Finance | Controller |
|------|-----|-----------|------------|
| Home | Yes | Yes | Yes |
| Automation | No | No | Yes |
| Reports | Yes | Yes | Yes |
| Workbench | Yes | Yes | Yes |
| Admin | No | No | No |

### Workbench Items Visible Per Persona

| Workbench Group | CFO | VP Finance | Controller |
|-----------------|-----|-----------|------------|
| Custom Workbench (UberFlux, Form Factor) | Yes | Yes | No |
| Record-to-Report (Close, Recon, Flux) | No | Yes | Yes |
| Order-to-Cash (Cash App, Collections) | No | No | Yes |
| Other (P2P, Supply Chain, FP&A, etc.) | No | No | No |

### No persona set (fallback)
All rails and all items are visible.

---

## Feature Mapping: Product Pillars to Existing Pages

### Close Intelligence

| Module | Route | Page File | Status |
|--------|-------|-----------|--------|
| Close Checklist | `/workbench/record-to-report/close` | `close/page.tsx` | Built (task management, phases, AI panel) |
| Reconciliation | `/workbench/record-to-report/reconciliations` | `reconciliations/page.tsx` | Built (matching, exceptions, wizard, AI panel) |
| Reconciliation Insight | Embedded in Reconciliations | (AI panel) | Partial (no standalone resolution view) |
| Flux Analysis | `/reports/analysis/flux-analysis` | `flux-analysis/page.tsx` | Built (variance views, AI sidebar) |
| Flux Insight | `/workbench/record-to-report/standard-flux` | `standard-flux/page.tsx` | Built (AI panel, sensitivity, evidence) |

### Performance Intelligence

| Module | Route | Page File | Status |
|--------|-------|-----------|--------|
| Flux Intelligence + Forecasting | `/workbench/custom-workbench/form-factor` | `form-factor/page.tsx` | Built (actuals vs forecast, drivers, margins) |
| Margin Intelligence | (Embedded in Form Factor) | — | Gap: no standalone workbench |
| Performance Intelligence | `/workbench/custom-workbench/uberflux` | `uberflux/page.tsx` | Built (regional analysis, signals, AI panel) |

### The Platform

| Module | Route | Page File | Status |
|--------|-------|-----------|--------|
| Finance Command Center | `/home/command-center` + embedded panels | `command-center/` + `components/ai/` | Built (full page + embeddable panels) |
| Autonomy Studio | `/automation/autonomy-studio` | `autonomy-studio/page.tsx` | Built (workflow builder, NLP, SOP upload) |
| Contextual Data Model | `/admin/integrations` | `integrations/page.tsx` | Minimal (connector config only) |

---

## Known Gaps

1. **Margin Intelligence** — No standalone workbench page. Margin data exists inside Form Factor but there's no dedicated margin analysis experience.
2. **Reconciliation Insight** — AI panel provides explanations, but no dedicated resolution guidance workflow.
3. **Data Model / Lineage** — Only connector configuration exists. No data lineage visualization or data model explorer.
4. **Industry-specific data** — Industry selection (Technology/Healthcare/Manufacturing) is stored but does not affect the data shown in any workbench. All pages use the same mock data regardless of industry.
5. **Agentic Suites Manager** — Referenced in product marketing but no dedicated management UI exists.

---

## Industry Selection (Future Enhancement)

The onboarding wizard captures industry choice and stores it in localStorage alongside persona. Currently:
- **Stored**: `{ persona: "cfo", industry: "technology" }` in `meeru-demo-config`
- **Read by**: `usePersona()` hook (exposes `industry` field)
- **Used by**: Nothing (no page reads `industry` to switch data)

To implement industry-specific data:
1. Create `lib/demo-data/technology.ts`, `healthcare.ts`, `manufacturing.ts` with mock data variants
2. Have workbench pages read `industry` from `usePersona()` and swap data source
3. Update suggested prompts per industry in `components/ai/suggested-prompts-config.ts`

---

## Embedded AI (Command Center Panel)

Every workbench and the persona dashboard has an AI panel toggle:

| Page | Context | Theme |
|------|---------|-------|
| Persona Dashboard | `dashboard` | Light |
| UberFlux | `uberflux` | Dark |
| Form Factor | `form-factor` | Dark |
| Close Workbench | `close-workbench` | Light |
| Reconciliations | `reconciliations` | Light |

Suggested prompts are context-specific (defined in `components/ai/suggested-prompts-config.ts`).

The panel uses `useStreamingQuery` hook which connects to `/api/sse`. When `API_BASE_URL` is not set, mock SSE responses are returned automatically.
