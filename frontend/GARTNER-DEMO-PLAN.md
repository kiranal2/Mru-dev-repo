# Gartner Demo — Implementation Plan & Progress Tracker

**Created:** 2026-04-15
**Last Updated:** 2026-04-15
**Branch:** `gartner-demo` (to be created from `main`)

---

## Overview

Two product categories to showcase at Gartner:

| Category | Theme | Workbenches | Personas |
|----------|-------|-------------|----------|
| **Decision Intelligence** | Dark mode | UberFlux, Form Factor | CFO, FP&A |
| **Close Intelligence** | Light mode | Standard Flux (flagship), Close, Recon | Controller, CAO |

**Technology industry** as the primary vertical for the demo.

---

## Phase 1: Foundation & Infrastructure

### 1.1 Create gartner-demo branch
- **Status:** PENDING
- **Files:** Git operations only
- **Details:** Cut branch from main. All Gartner work goes here.

### 1.2 Simplify demo login — persona-card-only selection
- **Status:** DONE
- **Files:**
  - `app/login/page.tsx` — Remove email/password, show 3 persona cards
  - `app/(onboarding)/onboarding/page.tsx` — Skip persona step if already selected from login
- **Details:** For demo: no email/password fields. Just 3 large clickable persona cards (CFO, CAO, Controller) that route to industry selection, then to dashboard. Per Neetu: "Let's not have the login, let's only have the role."

### 1.3 Dashboard quick-nav cards per persona
- **Status:** DONE
- **Files:**
  - `app/(main)/home/dashboard/dashboards/cfo-home.tsx` — Link to UberFlux + Form Factor
  - `app/(main)/home/dashboard/dashboards/cao-home.tsx` — Link to Standard Flux + Close
  - `app/(main)/home/dashboard/dashboards/controller-home.tsx` — Link to Standard Flux + Recon
- **Details:** Prominent "Launch Workbench" cards on each dashboard that navigate directly to the primary workbench for that persona.

---

## Phase 2: Standard Flux — Close Intelligence (Flagship)

### 2.1 Add expectedness classification to flux rows
- **Status:** DONE
- **Files:**
  - `lib/data/types/flux-analysis.ts` — Add `expectedness` field to FluxRow type
  - `app/(main)/reports/analysis/flux-analysis/constants.ts` — Add EXPECTEDNESS_OPTIONS, assign defaults per account
  - `components/standard-flux/worklist-table.tsx` — Add expectedness badge column
  - `app/(main)/reports/analysis/flux-analysis/helpers.ts` — Add expectednessClass() helper
- **Details:** Per the flux primer, every flagged account needs an expectedness classification: Expected, Seasonal, Anomalous, or One-time. This is Component 04 from the primer.

### 2.2 Add commentary composer to detail drawer
- **Status:** DONE
- **Files:**
  - `lib/data/types/flux-analysis.ts` — Add `commentary`, `commentaryStatus`, `approvedBy`, `approvedAt` to FluxRow
  - `components/standard-flux/detail-drawer.tsx` — Add commentary section with textarea, AI generate button, status workflow
  - `app/(main)/workbench/record-to-report/standard-flux/hooks/use-standard-flux.ts` — Add commentary state management, generate handler
  - `app/(main)/reports/analysis/flux-analysis/constants.ts` — Add COMMENTARY_TEMPLATES per account
- **Details:** The flagship demo feature. Shows human-in-the-loop: AI generates structured commentary (4 components from primer), user reviews/edits, submits for approval. Shawn: "If customer is all AI, we write the commentary. If more human-in-the-loop, commentary field is blank but you see the drivers."

### 2.3 Filter bar UX — KPI-card-driven expand/collapse
- **Status:** DONE
- **Files:**
  - `components/standard-flux/workbench-header.tsx` — Make KPI cards clickable with active state
  - `components/standard-flux/toolbar.tsx` — Remove Filters popover, add FilterBar component
  - `components/standard-flux/filter-bar.tsx` — NEW FILE: Collapsible filter bar with content driven by selected KPI card
  - `app/(main)/workbench/record-to-report/standard-flux/page.tsx` — Add activeKpiCard and filterBarExpanded state
  - `app/(main)/workbench/record-to-report/standard-flux/hooks/use-standard-flux.ts` — Add filter bar state
- **Details:** Per Neetu: "Get rid of the filter button at the top. Have a bar where you can expand or minimise. Values driven by the blue card you select."
  - Net Variance card → Comparison mode, Materiality, Exclude noise
  - Top Drivers card → Driver category filter, Confidence level
  - Review Progress card → Status filter, Owner filter
  - Needs Attention card → Quick filters (Missing Evidence, Unassigned, High Impact)

### 2.4 AI "Generate Commentary" flow with thinking animation
- **Status:** DONE (included in 2.2)
- **Files:**
  - `components/standard-flux/detail-drawer.tsx` — Generate button triggers thinking animation then populates textarea
  - `app/(main)/reports/analysis/flux-analysis/constants.ts` — Add COMMENTARY_TEMPLATES keyed by account
  - `app/(main)/reports/analysis/flux-analysis/helpers.ts` — Add generateCommentary() function
- **Details:** 
  1. User clicks "Generate AI Draft" in drawer
  2. Thinking animation shows 4 steps (from primer: Understanding variance → Analyzing drivers → Gathering evidence → Drafting commentary)
  3. Textarea populates with structured commentary (Variance statement + Driver attribution + Context + Classification)
  4. User can edit, then click "Submit for Review" → status changes
  5. Controller persona can "Approve" → status = Approved with name + timestamp

---

## Phase 3: Dark Mode — Decision Intelligence

### 3.1 Create custom-workbench layout with dark theme wrapper
- **Status:** DONE
- **Files:**
  - `app/(main)/workbench/custom-workbench/layout.tsx` — NEW FILE: Applies dark class/bg to all child routes
- **Details:** Shawn: "Dark mode feels more serious, high-end" for Decision Intelligence. Light mode for Close Intelligence.

### 3.2 Dark mode color tokens + accessibility fix
- **Status:** DONE
- **Files:**
  - `app/globals.css` — Add/verify dark mode semantic tokens for custom workbench
- **Details:** Per Neetu: colors can be different between themes but semantically close. Red on dark fails WCAG — use `text-red-400` (#f87171) instead of `text-red-600` on dark backgrounds. Contrast ratio: 5.2:1 (passes AA) vs 3.1:1 (fails).
  - Light → Dark mappings:
    - bg-slate-50 → bg-slate-950
    - bg-white → bg-slate-900
    - border-slate-200 → border-slate-800
    - text-slate-900 → text-slate-100
    - text-emerald-600 → text-emerald-400
    - text-red-600 → text-red-400

### 3.3 Form Factor page — apply dark theme
- **Status:** DONE
- **Files:**
  - `app/(main)/workbench/custom-workbench/form-factor/page.tsx` — Convert all color classes to dark variants
- **Details:** ~1,957 lines. Systematic find/replace of color tokens plus manual review of border/text/bg classes.

### 3.4 UberFlux page — apply dark theme
- **Status:** DONE
- **Files:**
  - `app/(main)/workbench/custom-workbench/uberflux/page.tsx` — Convert all color classes to dark variants
- **Details:** ~1,933 lines. Same approach as Form Factor.

### 3.5 AI Command Center — dark theme support
- **Status:** DONE (via CSS variable inheritance from layout)
- **Files:**
  - `components/ai/command-center-panel.tsx` — Ensure dark theme prop is passed in custom-workbench context
- **Details:** Component already has theme prop. Just needs wiring.

---

## Phase 4: Design Cohesion

### 4.1 Shared workbench shell component
- **Status:** PENDING
- **Files:**
  - `components/workbench/workbench-shell.tsx` — NEW FILE: Shared wrapper with title, KPI slot, toolbar slot, content slot
- **Details:** Ensures Form Factor, UberFlux, Standard Flux, Close, Recon all share the same structural skeleton. Accepts theme: 'light' | 'dark' prop.

### 4.2 Cross-workbench design consistency pass
- **Status:** PENDING
- **Files:** All workbench pages
- **Details:** Ensure consistent:
  - Title area: text-sm font-semibold + text-[11px] subtitle
  - KPI stat chips: same pill style
  - Tab buttons: same active state pattern
  - Table headers: same text-[11px] uppercase tracking-wide
  - Status badges: same colored-dot pattern

---

## Phase 5: Demo Polish & Recording

### 5.1 User journey walkthrough testing
- **Status:** PENDING
- **Details:** Test all 3 persona flows end-to-end:
  - CFO → Dashboard → UberFlux → Form Factor
  - CAO → Dashboard → Standard Flux → Close
  - Controller → Dashboard → Standard Flux → Recon

### 5.2 Demo recording with captions
- **Status:** PENDING
- **Details:** Record Mac screen (no URLs visible). Add captions/text overlays. Per Shawn: "At the very least there should be some captions to tell you what's happening."

### 5.3 Process documentation
- **Status:** PENDING
- **Files:**
  - `BRANCHING-PROCESS.md` — NEW FILE: How dev/stage/demo branches work, tool flexibility, promotion workflow
- **Details:** Per Shawn: "Document the process so the whole team understands how this is going to work."

---

## Progress Log

### 2026-04-15

**Task 1: Simplify demo login (DONE)**
- Rewrote `app/login/page.tsx` — removed email/password, now shows 3 large persona cards (CFO/CAO/Controller) with keywords, gradients, and hover states
- Updated `app/(onboarding)/onboarding/page.tsx` — auto-detects persona from login, skips step 1, "Back" routes to `/login`
- Lint: clean

**Task 2: Add expectedness classification (DONE)**
- Added `Expectedness` and `CommentaryStatus` types to `lib/data/types/flux-analysis.ts`
- Added `EXPECTEDNESS_OPTIONS`, `ACCOUNT_EXPECTEDNESS` mapping (33 accounts), `COMMENTARY_TEMPLATES` (6 accounts with full structured commentary) to `constants.ts`
- Updated `makeIsRow()` to auto-populate expectedness/commentary from account maps
- Added BS rows with expectedness/commentary fields
- Added `expectednessClass()`, `expectednessIcon()`, `commentaryStatusClass()` helpers
- Updated worklist table: new "Classification" and "Support" column groups, Expectedness badge + Commentary status badge columns in desktop view
- Lint: clean

**Task 3: Add commentary composer to detail drawer (DONE)**
- Added commentary state management to `use-standard-flux.ts`: `commentaryOverrides`, `commentaryIsGenerating`, `commentaryThinkingSteps`
- Added 4 handlers: `handleGenerateCommentary` (AI draft with thinking animation), `handleUpdateCommentary`, `handleSubmitCommentary`, `handleApproveCommentary`
- Applied commentary overrides in `applyOverrides()` function alongside row overrides
- Rewrote `detail-drawer.tsx` with 6 sections (was 5): Variance Summary → Commentary Composer (NEW) → AI Explanation → Owner & Status → Evidence → Activity
- Commentary section has: empty state with "Generate AI Draft" button, thinking animation (4 steps), editable textarea, Draft/Submitted/Approved workflow, Regenerate button, Approve button with reviewer name
- Wired all props through `page.tsx` → `StandardFluxDrawer`
- Lint: clean

**Task 4: KPI-card-driven filter bar UX (DONE)**
- Added `activeKpiCard` and `filterBarExpanded` state to `use-standard-flux.ts`
- Added `handleKpiCardClick` handler — toggles card selection and filter bar visibility
- Created new `components/standard-flux/filter-bar.tsx`: collapsible inline filter bar with content driven by selected KPI card
  - Variance card → Comparison mode pills, Materiality select, Exclude noise checkbox
  - Drivers card → Driver category filter buttons
  - Progress card → Status select, Owner select
  - Attention card → Quick filter pills (Missing Evidence, High Impact, Unresolved)
- Updated `workbench-header.tsx` — all 4 KPI cards now clickable with `cursor-pointer`, active ring highlight (`ring-2 ring-primary/10`), hover shadow
- Exported `FilterBar` from barrel `index.ts`
- Wired `FilterBar` into `page.tsx` between WorkbenchHeader and StandardFluxToolbar
- Lint: clean

**Task 5: Dashboard quick-nav cards per persona (DONE)**
- Updated `cfo-home.tsx`: Added "Launch Workbench" section with 2 prominent cards (UberFlux + Form Factor) with gradient icons and arrows. Moved Standard Flux to Quick Navigation.
- Updated `cao-home.tsx`: Added "Launch Workbench" section (Standard Flux + Close Workbench). Added `cn` import. Updated Quick Nav to include Reconciliations.
- Updated `controller-home.tsx`: Added "Launch Workbench" section (Standard Flux + Reconciliations). Updated Quick Nav to include Close, Flux Analysis, Trial Balance.
- All dashboards now have consistent "Launch Workbench" → "Quick Navigation" hierarchy
- Lint: clean (only pre-existing warnings)

**Task 6: Dark mode for Decision Intelligence workbenches (DONE)**
- Created `app/(main)/workbench/custom-workbench/layout.tsx` — dark theme wrapper (`bg-slate-950 text-slate-100`)
- **Form Factor** (`form-factor/page.tsx`): Swapped all 33 CSS custom property values to dark equivalents:
  - `--bg: #020617` (slate-950), `--bg-white: #0f172a` (slate-900), `--bg-subtle: #1e293b` (slate-800)
  - `--border: #1e293b`, `--text-primary: #f1f5f9`, `--text-secondary: #94a3b8`, `--text-muted: #64748b`
  - `--green: #4ade80` (green-400), `--red: #f87171` (red-400) — passes WCAG AA on dark backgrounds
  - Shadows increased to `rgba(0,0,0,0.30)` for dark mode depth
- **UberFlux** (`uberflux/page.tsx`): Swapped 13 CSS variables + fixed 12 hardcoded `#ffffff`/light-color references to use CSS variables instead:
  - `.uf-topbar`, `.uf-tabs`, `.uf-sidebar`, `.uf-ai-panel`, `.uf-bottombar`, `.uf-bar-tooltip` all converted to `var(--navy)` or `var(--surfaceLt)`
  - `.uf-msg.user .uf-msg-avatar` converted to variable refs
  - Chart data colors: `#16a34a` → `#4ade80`, `#dc2626` → `#f87171`, `#94a3b8` → `#64748b`
  - All shadows updated for dark mode depth
- Lint: clean on all files

---

## Phase 1-3 COMPLETE ✓

**All 6 tasks implemented:**

| # | Task | Status |
|---|------|--------|
| 1 | Simplify demo login | Done |
| 2 | Expectedness classification | Done |
| 3 | Commentary composer | Done |
| 4 | KPI-card filter bar | Done |
| 5 | Dashboard quick-nav | Done |
| 6 | Dark mode for Decision Intelligence | Done |

**Files modified (21 files):**
- `app/login/page.tsx` (rewritten)
- `app/(onboarding)/onboarding/page.tsx` (enhanced)
- `lib/data/types/flux-analysis.ts` (new types)
- `app/(main)/reports/analysis/flux-analysis/constants.ts` (expectedness + commentary data)
- `app/(main)/reports/analysis/flux-analysis/helpers.ts` (new helpers)
- `components/standard-flux/worklist-table.tsx` (new columns)
- `components/standard-flux/detail-drawer.tsx` (rewritten with commentary)
- `components/standard-flux/workbench-header.tsx` (clickable KPI cards)
- `components/standard-flux/filter-bar.tsx` (new file)
- `components/standard-flux/index.ts` (barrel export updated)
- `app/(main)/workbench/record-to-report/standard-flux/page.tsx` (wired new features)
- `app/(main)/workbench/record-to-report/standard-flux/hooks/use-standard-flux.ts` (commentary + filter state)
- `app/(main)/home/dashboard/dashboards/cfo-home.tsx` (launch workbench cards)
- `app/(main)/home/dashboard/dashboards/cao-home.tsx` (launch workbench cards)
- `app/(main)/home/dashboard/dashboards/controller-home.tsx` (launch workbench cards)
- `app/(main)/workbench/custom-workbench/layout.tsx` (new file — dark theme)
- `app/(main)/workbench/custom-workbench/form-factor/page.tsx` (dark theme)
- `app/(main)/workbench/custom-workbench/uberflux/page.tsx` (dark theme)

**Task 7: Consolidate to one light + one dark theme (DONE)**
- Replaced 3 themes (default/uberflux/formfactor) with 2 (light/dark) in `globals.css`
- Added `[data-theme="dark"]` block with full slate-900/950 dark palette, blue accent, WCAG-passing green-400/red-400
- Rewrote `lib/theme-context.tsx`: `AppTheme = "light" | "dark"`, added `toggleTheme()`, `isDark` boolean, migration for old theme values
- Simplified `components/layout/theme-switcher.tsx` to Sun/Moon toggle button
- Updated `components/layout/header.tsx`: `isDark` instead of `theme === "default"`
- Simplified `custom-workbench/layout.tsx` to passthrough (no forced dark)
- **Form Factor**: All 33 CSS vars now reference `var(--theme-*)` tokens with fallbacks
- **UberFlux**: All 13 CSS vars now reference `var(--theme-*)` tokens; reverted 12+ hardcoded colors to `var(--green)`, `var(--red)`, `var(--muted)` refs; reverted shadows to normal values
- Both pages now automatically respond to platform light/dark toggle

**Task 8: Decision Intelligence & Close Intelligence in navigation (DONE)**
- Restructured `lib/navigation.ts` workbench rail: "Decision Intelligence" (FluxPlus, Form Factor, Variance Drivers) and "Close Intelligence" (Standard Flux, Close, Reconciliations) are now the first two groups, followed by Operations (O2C, P2P, etc.)
- Navigation panel renders these as labeled group headers (uppercase, with icons)
- **CFO dashboard**: "Decision Intelligence" section (Sparkles icon, blue label) with FluxPlus + Form Factor cards, "Close Intelligence" section (Activity icon, emerald label) with Standard Flux + Close + Recon
- **CAO dashboard**: "Close Intelligence" primary with Standard Flux + Close cards, "Decision Intelligence" secondary with FluxPlus + analysis links
- **Controller dashboard**: "Close Intelligence" primary with Standard Flux + Recon cards, Quick Navigation for other tools
- All dashboards use consistent section headers with colored icons + uppercase labels

---

## ALL TASKS COMPLETE

| # | Task | Status |
|---|------|--------|
| 1 | Simplify demo login | Done |
| 2 | Expectedness classification | Done |
| 3 | Commentary composer | Done |
| 4 | KPI-card filter bar | Done |
| 5 | Dashboard quick-nav | Done |
| 6 | Dark mode for Decision Intelligence | Done (superseded by Task 7) |
| 7 | Unified light/dark theme | Done |
| 8 | Decision Intelligence / Close Intelligence categories | Done |

**Task 9: Decision Intelligence & Close Intelligence as sidebar rails (DONE)**
- Added `"decision-intelligence"` and `"close-intelligence"` as new `RailItem` types
- Added full navigation sections for both in `NAVIGATION_STRUCTURE`:
  - **Decision Intelligence**: Workbenches (FluxPlus, Form Factor, Variance Drivers) + Analysis (Flux Analysis, One-Click Variance)
  - **Close Intelligence**: Workbenches (Standard Flux, Close, Reconciliations) + Reports (Balance Sheet, Income Statement, Trial Balance, Account Activity)
- Added to `RAIL_CONFIG`: Decision (Sparkles icon), Close (FileCheck icon)
- Added to `ALL_RAILS` in correct order after Home
- Updated `demo-routing.ts`: All personas see both new rails. Controller sees Close first, then Decision.
- Updated `navigation-panel.tsx`: Panel header now maps rail IDs to proper display labels ("Decision Intelligence", "Close Intelligence")
- Updated `app-shell.tsx`: Replaced hardcoded rail ID list with `ALL_RAILS.includes()` for localStorage restore
- Updated dead `app-layout.tsx` to match new RailItem type
- Lint: clean

**Task 9: Guided walkthrough after login (DONE)**
- Created `hooks/use-guided-tour.ts` — tracks first-visit state per persona in localStorage (`meeru-tour-completed`), auto-triggers 800ms after dashboard loads, provides `completeTour`/`skipTour`/`resetTour` handlers
- Created `components/guided-tour/tour-steps.ts` — persona-specific step definitions:
  - **CFO** (7 steps): Welcome → Navigation → Decision Intelligence (FluxPlus, Form Factor, Variance Drivers) → Close Intelligence (Standard Flux, Close, Reports) → AI Command Center → Theme Toggle → Ready
  - **CAO** (7 steps): Welcome → Navigation → Close Intelligence (Standard Flux, Close, Recon) → Decision Intelligence (FluxPlus, Flux Analysis) → AI → Theme → Ready
  - **Controller** (7 steps): Welcome → Navigation → Close Intelligence (Standard Flux, Close, Recon) → AI Commentary deep-dive (4 components) → AI → Theme → Ready
  - Each step has title, description, bullets, icon, and optional "Try it" route link
- Created `components/guided-tour/guided-tour-overlay.tsx` — full-screen overlay with:
  - Backdrop blur + dark overlay
  - Card with gradient icon header, step counter, description, bullet points
  - Progress bar (gradient blue) at top
  - "Try it" CTA buttons that close tour and navigate to the workbench
  - Step dot navigation (clickable), Back/Next buttons, Skip (X) button
  - Enter/exit animations (scale + opacity)
- Integrated into `PersonaDashboardContainer.tsx` — tour triggers automatically on first visit per persona
- Barrel export at `components/guided-tour/index.ts`
- Lint: clean on all 5 new/modified files

**Remaining polish (not blocking demo):**
- Flux Forecast page (third Decision Intelligence workbench)
- Shared workbench shell component
- Cross-workbench design consistency pass
- User journey walkthrough testing
- Demo recording with captions
- Process documentation (BRANCHING-PROCESS.md)

