# Gartner Demo — Master Implementation Plan

**Created:** 2026-04-15  
**Last Updated:** 2026-04-15  
**Source:** All meeting transcripts + Shawn's demo HTML v2.5 + Flux Primer HTML + previous implementation work

---

## Executive Summary

A focused, immersive demo experience for the Gartner conference. No sidebar navigation — users stay inside the workbench they selected. Three personas, three industries, three workbenches. Dark mode for Decision Intelligence, light mode for Close Intelligence. Guided tour highlights actual UI elements. Industry data switches in real-time.

---

## Architecture: How The Demo Works

```
┌─ Onboarding (3 steps) ───────────────────────────────┐
│  Step 1: Role (CFO / CAO / Controller)                │
│  Step 2: Analysis Type → determines workbench         │
│          - Performance Intelligence → UberFlux (dark)  │
│          - Margin Intelligence → Form Factor (dark)    │
│          - Flux Intelligence → Standard Flux (light)   │
│  Step 3: Industry (Technology / Healthcare / Retail)   │
│  Launch Screen → "Enter Workbench"                     │
└───────────────────────────────────────────────────────┘
                        ↓
┌─ Demo Experience (NO SIDEBAR) ────────────────────────┐
│                                                        │
│  ┌─ Demo Context Bar (36px, fixed top) ─────────────┐ │
│  │ MeeruAI · CFO · Technology · Performance Intel    │ │
│  │                    [Switch Context] [Tour] [Reset] │ │
│  └──────────────────────────────────────────────────-┘ │
│                                                        │
│  ┌─ Workbench (full screen, no sidebar) ────────────┐ │
│  │                                                    │ │
│  │  UberFlux (dark) OR Form Factor (dark)            │ │
│  │  OR Standard Flux (light)                          │ │
│  │                                                    │ │
│  └──────────────────────────────────────────────────-┘ │
│                                                        │
│  ┌─ Guided Tour Overlay ────────────────────────────┐ │
│  │ Backdrop dim → Target element elevated above      │ │
│  │ Gold highlight ring → Dark callout bubble          │ │
│  │ Persona-aware content · Skip/Next · Progress bar   │ │
│  └──────────────────────────────────────────────────-┘ │
│                                                        │
│  ┌─ Context Switcher (bottom-left popup) ───────────┐ │
│  │ Role / Industry / Workbench dropdowns              │ │
│  │ "Apply & Restart Tour"                             │ │
│  └──────────────────────────────────────────────────-┘ │
└────────────────────────────────────────────────────────┘
```

**Key principle (Shawn):** "I don't want the side left nav. Once you go in, that's all you're going to focus on. After the guided tour, they can play with whatever they want within the workbench, but we're not going to let them click around and find something they're not supposed to."

---

## The Three Workbenches

| Workbench | Category | Theme | Primary Persona | What It Shows |
|-----------|----------|-------|-----------------|---------------|
| **UberFlux** (Performance Intelligence) | Decision Intelligence | Dark | CFO | Weekly regional performance, revenue/margin by segment, AI signals, exception flags |
| **Form Factor** (Margin Intelligence) | Decision Intelligence | Dark | CFO / VP Finance | Margin bridge (waterfall), price/volume/mix decomposition, forecast vs actual |
| **Standard Flux** (Flux Intelligence) | Close Intelligence | Light | CAO / Controller | IS/BS/CF flux table, AI commentary with human-in-the-loop, driver attribution, close workflow |

---

## The Three Personas

| Persona | Title | Default Workbench | Focus |
|---------|-------|-------------------|-------|
| **CFO** | Chief Financial Officer | Performance Intelligence (UberFlux) | Strategic, board-level — "What's the headline?" |
| **VP Finance / CAO** | VP Finance | Margin Intelligence (Form Factor) | Operating performance — "What's driving margin?" |
| **CAO / Controller** | Controller | Flux Intelligence (Standard Flux) | Close management — "Is the commentary done?" |

**Fake profiles for demo:**
- CFO: "Sarah Chen, CFO" 
- CAO: "Michael Torres, CAO"
- Controller: "David Park, Controller"

---

## The Three Industries

Each industry changes: KPI labels, line item names, driver terminology, AI suggestions, chart data.

| Industry | Revenue Term | Key Metrics | Segments |
|----------|-------------|-------------|----------|
| **Technology** | ARR / SaaS Revenue | NRR, Churn, Expansion, Cloud spend | Enterprise, Mid-Market, SMB |
| **Healthcare** | Net Patient Revenue | Inpatient, Outpatient, CMI, NRPPD | Medical, Surgical, Emergency |
| **Retail** | Net Sales | Comp Store, AUR, Basket Size, Traffic | Footwear, Apparel, Accessories |

---

## Implementation Phases

### Phase 1: Demo Shell (No Sidebar Mode)

**Goal:** When in demo mode, hide the sidebar navigation entirely. User sees only the demo context bar + full-screen workbench.

| Task | Files | Details |
|------|-------|---------|
| **1.1 Demo mode flag** | `lib/persona-context.tsx` | Add `demoMode: boolean` to config. Set from onboarding. |
| **1.2 Hide sidebar in demo mode** | `components/layout/app-shell.tsx` | When `demoMode=true`: hide sidebar, hide nav panel, remove left padding. Workbench fills entire screen below the demo bar. |
| **1.3 Demo context bar** | `components/demo/demo-context-bar.tsx` (NEW) | Fixed 36px dark bar at top. Shows: MeeruAI logo, persona chip, industry chip, workbench chip, green pulse dot. Actions: Switch Context, Restart Tour, Reset Demo. Matches Shawn's HTML design. |
| **1.4 Context switcher popup** | `components/demo/context-switcher.tsx` (NEW) | Bottom-left popup (or triggered from bar). Dropdowns for Role, Industry, Workbench. "Apply & Restart Tour" button. Changes data without going back to onboarding. |
| **1.5 Offset workbench content** | CSS | When demo bar active, workbench content starts 36px from top. |

### Phase 2: Onboarding Flow (3 Steps)

**Goal:** Match Shawn's HTML v2.5 onboarding — elegant, minimal, serif typography.

| Task | Files | Details |
|------|-------|---------|
| **2.1 Add "Analysis Type" step** | `app/(onboarding)/onboarding/page.tsx` | Step 2 between Role and Industry. Options: Performance Intelligence, Margin Intelligence, Flux Intelligence. This determines which workbench loads. |
| **2.2 Launch screen** | `app/(onboarding)/onboarding/page.tsx` | After step 3: "Finance finally has a system that explains the business." Shows chips for selected role + analysis + industry. "Enter Workbench →" button. |
| **2.3 Route to workbench** | `lib/persona-context.tsx`, `lib/demo-routing.ts` | After launch, route directly to the selected workbench (not dashboard). UberFlux for Performance, Form Factor for Margin, Standard Flux for Flux. |
| **2.4 Design: serif headings** | Onboarding CSS | Use Cormorant Garamond or Georgia for questions. Gold (#C8A96E) accent for emphasis. Parchment (#F4F3EF) background. Minimal progress dots. Match Shawn's HTML aesthetic. |

### Phase 3: Route-Based Theming

**Goal:** Decision Intelligence pages always dark, Close Intelligence pages always light. Not a user toggle.

| Task | Files | Details |
|------|-------|---------|
| **3.1 Route-based theme switching** | `components/layout/app-shell.tsx` or `lib/theme-context.tsx` | Auto-set theme based on current route. `/workbench/custom-workbench/*` → dark. `/workbench/record-to-report/*` → light. No manual toggle in demo mode. |
| **3.2 Dark mode for DI workbenches** | `form-factor/page.tsx`, `uberflux/page.tsx` | CSS variables already reference `var(--theme-*)`. When `[data-theme="dark"]` is set, they auto-switch. Verify all hardcoded colors are gone. |
| **3.3 Light mode for CI workbenches** | `standard-flux/page.tsx`, `close/page.tsx`, `reconciliations/page.tsx` | These should always use light theme tokens. Already do. |
| **3.4 Demo bar always dark** | `components/demo/demo-context-bar.tsx` | Bar itself is always dark ink background regardless of workbench theme. |

### Phase 4: Guided Tour (Spotlight Style)

**Goal:** Match Shawn's HTML v2.5 callout system — dark bubble, gold accent, target element elevated above backdrop.

| Task | Files | Details |
|------|-------|---------|
| **4.1 Adopt Shawn's callout design** | `components/guided-tour/guided-tour-overlay.tsx` | Dark ink background bubble (not white). Gold (#C8A96E) accent for step label and "Next" button. Directional arrows. `.tour-elevated` class lifts target above backdrop. |
| **4.2 Persona-aware tour content** | `components/guided-tour/tour-steps.ts` | Tour body text changes based on role + industry. CFO sees "board-ready summary", Controller sees "evidence status and close readiness". Use `bodyFn()` pattern from Shawn's HTML. |
| **4.3 Tour targets per workbench** | `data-tour-id` attributes | Each workbench needs `data-tour-id` on: AI panel, KPI area, main table/chart, driver panel, alert area. 5-6 steps per workbench. |
| **4.4 Tour auto-starts on entry** | `PersonaDashboardContainer.tsx` or workbench page | Tour triggers automatically on first visit. Can be skipped. "Restart Tour" button in demo bar and bottom-right corner. |
| **4.5 Progress bar in callout** | Tour overlay | Segmented progress (not dots) — each segment fills as you advance. Matches Shawn's HTML. |

### Phase 5: Industry Data Switching

**Goal:** When user switches industry via context switcher, all data in the workbench changes.

| Task | Files | Details |
|------|-------|---------|
| **5.1 Industry data configs** | `lib/industry-data.ts` (NEW) | Three complete datasets — Technology, Healthcare, Retail. Each has: KPI labels, IS line items, BS accounts, drivers, AI suggestions, chart values. Based on Shawn's `INDUSTRY_DATA` from HTML v2.5. |
| **5.2 Data injection into workbenches** | Form Factor, UberFlux, Standard Flux | Each workbench reads industry from context/localStorage and renders industry-specific labels, data, and AI content. |
| **5.3 Real-time switching** | Context switcher | Changing industry in the switcher updates the workbench immediately without page reload. |

### Phase 6: AI Commentary (Standard Flux Flagship)

**Goal:** The Close Intelligence showcase — AI generates structured commentary with human-in-the-loop approval.

| Task | Files | Status |
|------|-------|--------|
| **6.1 Expectedness classification** | Types, constants, worklist table | **DONE** — Expected/Seasonal/Anomalous/One-time badges on each row |
| **6.2 Commentary composer in drawer** | Detail drawer, hook | **DONE** — Textarea, "Generate AI Draft" button, thinking animation, Draft/Submitted/Approved workflow |
| **6.3 KPI-card-driven filter bar** | Header, filter bar, toolbar | **DONE** — Click a KPI card to expand contextual filters |
| **6.4 Alert icon (not banner)** | Page layout | **DONE** — Shield icon with badge count, opens side sheet |
| **6.5 Commentary templates per industry** | Constants file | NEEDS UPDATE for Healthcare and Retail terminology |

### Phase 7: CFO Flow — End to End Polish

**Goal:** One persona, completely clean, no visual inconsistencies.

| Task | Details |
|------|---------|
| **7.1 Consistent branding** | No cream-to-dark jumps. Onboarding → dark workbench transition should feel smooth. |
| **7.2 Fake user profile** | "Sarah Chen, CFO" with avatar initials in demo bar and any user menu. |
| **7.3 Responsive** | Works on both laptop (1440px) and tablet (1024px). |
| **7.4 No dead-end clicks** | Every button does something or is visually disabled. No error pages reachable. |
| **7.5 Performance** | Workbench loads in <2s. Tour animations smooth at 60fps. |

### Phase 8: Future / Nice-to-Have

| Task | Details | Source |
|------|---------|--------|
| **Problem-based onboarding** | Instead of "Pick a persona", show "What's your biggest challenge?" — maps to persona behind the scenes | Neetu |
| **Gamification / crisis scenario** | "The board needs a decision by Friday. Your company just discovered a $2.3M variance..." → enter workbench | Shawn |
| **Flux Forecast workbench** | Third DI workbench — forecast vs actuals with command center | Original scope |
| **Demo recording** | Loom or CapCut for screen recordings with captions | Team decision |
| **Workbench naming** | Finalize names: "Performance Workbench", "Margin Workbench", "Flux Workbench" vs current | Shawn |

---

## What's Already Done vs. What's Needed

### DONE (from previous sessions)

| Feature | Status | Notes |
|---------|--------|-------|
| SSO login page with demo accounts | Done | Email field + 3 quick-select buttons |
| Onboarding (Role + Industry) | Done | Missing "Analysis Type" step |
| Persona dashboards (3) | Done | But may not be shown in demo mode |
| Decision Intelligence + Close Intelligence in navigation | Done | But sidebar will be hidden in demo |
| UberFlux page | Done | CSS vars reference theme tokens |
| Form Factor page | Done | CSS vars reference theme tokens |
| Standard Flux with AI commentary | Done | Expectedness, commentary composer, filter bar, alert icon |
| Close Workbench | Done | Existing page |
| Reconciliations | Done | Existing page |
| Guided tour (spotlight) | Done | But needs design upgrade to match Shawn's dark bubble style |
| Light/dark theme system | Done | But needs to become route-based, not toggle |
| `data-tour-id` attributes on sidebar/header | Done | Need to add to workbench page elements too |

### NEEDS BUILDING

| Feature | Priority | Effort |
|---------|----------|--------|
| **Hide sidebar in demo mode** | P0 | Medium — app-shell conditional rendering |
| **Demo context bar** | P0 | Medium — new component |
| **Add "Analysis Type" onboarding step** | P0 | Small — one more step in wizard |
| **Route-based dark/light (not toggle)** | P0 | Small — auto-set theme from pathname |
| **Context switcher popup** | P1 | Medium — new component |
| **Tour design upgrade** (dark bubble, gold accent) | P1 | Medium — restyle overlay |
| **Industry data switching** | P1 | Large — 3 full datasets + injection |
| **Fake user profiles** | P2 | Small — config |
| **Workbench `data-tour-id` targets** | P2 | Small — add attributes |
| **Problem-based onboarding** | P3 | Medium — new step logic |
| **Gamification / crisis intro** | P3 | Large — new feature |

---

## Priority Order for Implementation

### Sprint 1 (Immediate — CFO flow)

1. Hide sidebar in demo mode
2. Demo context bar (dark, fixed top)
3. Route-based dark/light theming
4. Add "Analysis Type" to onboarding
5. Route to workbench (not dashboard) after onboarding
6. Fake user profile for CFO

### Sprint 2 (Tour + Switching)

7. Upgrade tour to dark bubble / gold accent style
8. Add `data-tour-id` to workbench elements
9. Persona-aware tour content
10. Context switcher popup
11. Industry data for Technology (complete)

### Sprint 3 (Multi-Industry + Polish)

12. Healthcare industry data
13. Retail industry data
14. Real-time industry switching
15. Responsive testing (laptop + tablet)
16. Dead-end click audit
17. Demo recording

---

## Key Design Tokens (from Shawn's HTML)

| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#1A1F2E` | Dark text, callout bubble bg, demo bar bg |
| `--parchment` | `#F4F3EF` | Onboarding bg, callout text |
| `--gold` | `#C8A96E` | Accent — onboarding, callout labels, highlight ring, "Next" button |
| `--serif` | Cormorant Garamond | Onboarding headings, callout titles |
| `--sans` | DM Sans | Body text |
| `--mono` | DM Mono | Labels, chips, step indicators |

---

## File Reference

| File | Role |
|------|------|
| `GARTNER-DEMO-PLAN.md` | This document — master plan + progress tracker |
| `meeruai_demo_experience Gartner_v2_5.html` | Shawn's reference HTML — onboarding + tour + 3 workbenches |
| `public/standard-flux.html` | Static HTML version of Standard Flux (reference) |
| `lib/persona-context.tsx` | Persona/industry/demoMode state |
| `lib/demo-routing.ts` | Route-to-rail mapping, persona visibility |
| `lib/theme-context.tsx` | Light/dark theme provider |
| `components/layout/app-shell.tsx` | Main layout — sidebar hiding, route-based theme |
| `components/guided-tour/` | Tour overlay, steps, hooks |
| `components/demo/` | Demo bar, context switcher (TO BE CREATED) |
| `app/(onboarding)/onboarding/page.tsx` | 3-step onboarding wizard |
| `app/login/page.tsx` | SSO login + demo accounts |

---

## Progress Log

### 2026-04-15 — Session 1

**Completed:**
- Login page (SSO + demo accounts)
- Onboarding (Role + Industry, 2 steps)
- Expectedness classification in Standard Flux
- Commentary composer with AI draft + approval workflow
- KPI-card-driven filter bar
- Dashboard quick-nav cards per persona
- Dark mode CSS vars for Form Factor + UberFlux
- Unified light/dark theme system
- Decision Intelligence + Close Intelligence as sidebar rails
- Guided tour (spotlight style, 7 steps per persona)
- Alert icon (replaces inline banners)
- Sidebar `forwardRef` fix
- Root page always redirects to login
- Persona-based rail filtering with localStorage fallback

**Pending (from this plan):**
- Sprint 1: Demo shell (no sidebar), demo bar, route-based theme, analysis type step
- Sprint 2: Tour redesign, context switcher, workbench tour targets
- Sprint 3: Multi-industry data, polish, recording

### 2026-04-15 — Session 2

**Sprint 1 — Demo Shell: COMPLETE**
- Onboarding rewritten: 4-step wizard (Role → Analysis Type → Industry → Launch Screen)
- Saves `demoMode: true`, `analysisType`, routes to correct workbench
- Demo Context Bar (`components/demo/demo-context-bar.tsx`): dark 36px bar with persona/industry/workbench chips, Switch Context, Tour, Reset actions
- Context Switcher (`components/demo/context-switcher.tsx`): dark popup with role/analysis/industry selectors, Apply & Restart Tour
- AppShell demo mode: hides sidebar/header, renders demo bar + full-screen workbench offset 36px
- Route-based theming: `/workbench/custom-workbench/*` → dark, `/workbench/record-to-report/*` → light, auto-set from pathname

**Sprint 2 — Tour + Context Switching: COMPLETE**
- Tour overlay redesigned: dark ink bubble (#1A1F2E), gold (#C8A96E) accent, segmented progress bar
- Workbench-specific tour steps: UberFlux (7), Form Factor (6), Standard Flux (6) — persona-aware descriptions
- `data-tour-id` attributes added to all three workbenches (topbar, KPIs, content, chart, AI, sidebar, toolbar, worklist)
- Tour auto-starts on workbench entry in demo mode (`DemoTourWrapper`)
- "Restart Tour" wired via custom event from demo bar

**Sprint 3 — Industry Data: COMPLETE**
- `lib/industry-data.ts`: 3 complete datasets (Technology, Healthcare, Retail) — KPIs, regions, segments, drivers, IS/BS line items, narratives, AI suggestions
- `hooks/use-industry.ts`: hook reading industry from localStorage, listens for config change events
- UberFlux: industry-aware title, metric toggle, signal banner, KPI cards, commentary header
- Form Factor: industry-aware sidebar label, executive narrative text
- Standard Flux: industry-aware title and subtitle

**Phase 7 — Polish: COMPLETE**
- Fixed "Manufacturing" → "Retail" display in INDUSTRIES array + onboarding icon (Factory → ShoppingBag)
- Onboarding → workbench transition: fade-out animation (500ms opacity transition + 600ms delay before navigate)
- Dead-end click audit: all 3 workbenches self-contained (no router.push). Alert banner links go to valid pages that render in demo shell. Tour steps don't navigate away.
- Responsive demo bar: logo text hidden on small screens, persona full name hidden below lg, analysis type hidden below md, button labels collapse to icons on tablet. Min-width overflow protection.

**Pending:**
- Phase 8: Nice-to-have (problem-based onboarding, gamification, forecast workbench)
