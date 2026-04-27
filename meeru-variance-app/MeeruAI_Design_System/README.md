# MeeruAI Design System

MeeruAI is an **AI-native finance intelligence platform** (currently embodied as the **Variance Workbench** product). It helps finance leaders — CFOs, Controllers, Staff Accountants — investigate variance, manage the period-end close, run reconciliations, and take one-click action directly from AI-generated insights.

The flagship product is a desktop web application that combines:
- A four-zone **workbench template** (left drill rail · top category tabs · center canvas · right pinned AI chat).
- A contextual **Next Best Action strip** — AI replies generate role-ranked action cards (Slack, email, pin, what-if).
- **Persona-aware UX** — CFO, Controller, Staff Accountant each get a re-ranked action order and scoped data.
- **Guided missions** — a wake-up-to-action flow narrated by "Marin," an in-product guide agent.
- **Close Intelligence** — period-end close orchestration with blockers, owners, and critical-path view.

## Source materials

- **Codebase**: `meeru-variance-app/` (Vite + React + TypeScript + Tailwind). Read-only mount via File System Access API.
  - Entry: `src/main.tsx`, `src/App.tsx`
  - Tokens: `src/index.css`, `tailwind.config.js`
  - Icons: `src/icons.tsx` (inline stroke SVGs, 24×24 viewBox, stroke-width 2, round caps/joins)
  - Components: `src/components/` (WorkbenchShell, ChatPanel, ActionStrip, KpiRow, VarianceChart, ui, …)
  - Pages: `src/pages/` (Workspace, Performance, Margin, Flux, Close, Recons, Login, Settings)
- **Logo asset**: `src/assets/meeru-logo.png` (copied → `assets/meeru-logo.png`).
- **Favicon**: `public/favicon.svg` — blue gradient square with a white "M".

## Products represented

There is **one product** (the Variance Workbench web app) — not a marketing site, not a mobile app. The design system focuses on that single surface. Within it, the distinct "kit-worthy" areas are:
1. **Application shell** (sidebar, header, login).
2. **Variance workbench canvas** (KPIs, chart, AI commentary, action strip).

## Content fundamentals

**Voice.** Operator-first, crisp, and evidence-led. Copy reads like a finance analyst briefing a CFO: direct, quantified, never salesy.

- **Labels are terse and functional.** "Performance Intelligence", "Drivers", "Exceptions", "Signals", "History", "Flux", "Close Day 4 / 5". No marketing adjectives.
- **Numbers-first.** Variance deltas lead ("-$4.2M", "+$0.3M"). Currency shown with sign. Tabular-nums everywhere — the whole app uses `font-variant-numeric: tabular-nums`.
- **Casing.** Sentence case for copy. `UPPERCASE + TRACKING` for eyebrow labels ("LIVE PINS", "AI SUMMARY", "NEXT BEST ACTION") — at `var(--fs-10)` with wide letter-spacing.
- **Pronouns.** App addresses "you" sparingly — mostly structural ("Your workspace", "ranked for [persona]"). Never "we" from the product.
- **Tone of AI replies.** Matter-of-fact with sources: "Enterprise churn spiked because three logos — Voltair, Meridian, Cinder — did not renew." Then **proposes action** via action cards.
- **Emoji.** Not used. Icons are inline SVG with stroke-width 2.
- **Punctuation.** Middle dot (`·`) as a soft separator in scope strings and metadata: `"Week 10 · Global · Q1 FY2026"`. Em-dashes for aside clauses.
- **Time & scope language.** "Tuesday · Week 10 · Global". "Day 4 / 5". "9 days" (board). "just now", "12s ago", "1m ago" for activity.
- **Status verbs.** "Flagged", "At risk", "On track", "Blocked", "Pinned", "Approved", "Sent", "Scheduled".

Examples lifted from the app:
> "Tuesday · Week 10 · Global — 3 items need your attention before Thursday."
> "Variance flagged · action recommended"
> "Meeru is analyzing…" · "Scanning sources…" · "Pulling latest data…"
> "Enterprise churn spike — 4 logos churned, $2.1M ARR impact"
> "Ranked for CFO"

## Visual foundations

**Overall vibe.** A professional finance tool rendered with product-design polish. Dense, quiet, confident. Think Linear/Notion-grade craftsmanship applied to a Bloomberg-terminal-adjacent problem domain.

**Color.**
- Neutrals do 90% of the work. Slate surfaces (`#FFFFFF → #F8FAFC → #F1F5F9`) stacked in three subtle steps for card/background/inset.
- **Brand is a single warm coral** (`#FE8953` — the Meeru wordmark color). Used for CTAs, active tabs, chart primary series, chat agent accents, and the "AI" glyph in the logo. Paired with `--primary-tint` (`#FFF1E7`) for hover washes and `--primary-weak` (`#FED5BC`) for active chip fills.
- **Color is status-only.** Positive = green (`#16A34A`), Warning = amber (`#D97706`), Negative = red (`#DC2626`). Never used decoratively.
- Dark theme is **near-black** (`#0A0A0A` → `#141414` → `#1F1F1F`) with a brighter coral (`#FF9B6C`) for contrast.`) for active chip fills.
- **Color is status-only.** Positive = green (`#16A34A`), Warning = amber (`#D97706`), Negative = red (`#DC2626`). Never used decoratively.
- Dark theme is **near-black** (`#0A0A0A` → `#141414` → `#1F1F1F`) with a brighter blue (`#3B82F6`) for contrast.

**Type.**
- **Inter**, weights 400/500/600/700, served from Google Fonts.
- Base 13px — intentionally dense. Scales down to 10px for eyebrows/meta and up to 26px for KPI values; 28px max for login display.
- Tabular-nums is global.
- Tracking: `-0.01em` on display/titles, `0.08em` on uppercase eyebrows.

**Spacing & density.**
- Compact. Cards use `p-3.5` (14px) / `p-4` (16px). Row gaps are 8–12px. Tables use `py-2`.
- Grid gaps: `gap-2.5` (10px) for KPI rows, `gap-3`/`gap-4` for section grids.

**Backgrounds.**
- Flat surfaces only. **No gradients** in the product canvas — the single exception is a subtle `from-brand-tint to-transparent` wash on the AI summary callout and inside the profile-menu header.
- **No imagery, no illustration, no pattern, no texture.**
- The sidebar is `#0F172A` (slate-900) in light mode and `#000000` in dark.

**Borders.**
- Hairline, 1px, `--rule` (`#E2E8F0`). Dashed borders used only for "More" / placeholder affordances.
- Focused inputs: `border-brand` + a 2px `--primary-tint` halo via `box-shadow: 0 0 0 2px`.

**Radii.**
- `4px` chips / small buttons. `6px` menu items. `8px` cards & buttons. `12px` large cards (`rounded-xl`). Pills (`999px`) for status chips and persona tags.

**Shadows (elevation scale).**
- `e1`: `0 1px 2px rgba(15,23,42,0.04)` — default card rest state.
- `e2`: `0 4px 12px rgba(15,23,42,0.08)` — hover lift.
- `e3`: `0 12px 32px rgba(15,23,42,0.15)` — dropdowns, popovers, mission end card.
- No inner shadows.

**Cards.**
- White fill, 1px `--rule` border, `rounded-xl` (12px), `shadow-e1` rest. Hover = `-translate-y-0.5` + `shadow-e2`.
- **No** colored left-border accents (avoided intentionally).

**Animation.**
- Short, functional, never decorative.
  - `slide-in` 0.25s ease-out (new cards entering from right).
  - `fade-up` 0.3s ease-out (modals, dropdowns, callouts).
  - `pulse2` 1.5s infinite (mission-focus glow — a 2px brand-colored ring).
  - `dot-pulse` 1.2s (3-dot "AI is thinking" indicator).
  - `breathe` 2s (live-status dot, positive green).
  - `soft-pulse` 1.8s (red alert ping).
  - `shimmer` 2.5s linear (KPI "watching" bg, chat header while thinking).
  - `ticker` 40s linear (horizontal marquee of live insights).
  - `live-new` 2.2s ease-out (brief blue flash when a new insight row arrives).

**Hover / press states.**
- Hover: background shifts to `--surface-soft` (neutral) or `--primary-tint` (brand-affordance).
- Hover on cards: `-translate-y-0.5` + `shadow-e2` + `border-brand-weak`.
- Press: relies on browser defaults — no explicit scale-down.
- Destructive hover: `text-negative` + `bg-negative-weak`.

**Buttons.**
- **Primary**: `bg-brand text-white rounded-md`, hover `opacity-90`.
- **Secondary**: `border border-rule text-muted hover:text-ink`.
- **Mission CTA**: the only gradient in the product — amber-to-orange (`#F59E0B → #D97706`), on the "Start today's mission" button only.

**Transparency & blur.**
- Used sparingly. The profile-menu quick-stat uses `bg-surface/70 backdrop-blur` over the brand-tint header.

**Focus rings.**
- Buttons/links: `outline: 2px solid var(--primary); outline-offset: 2px`.
- Inputs: no outline — the container handles focus via `focus-within:border-brand` + halo.

**Imagery vibe.**
- None. The product has zero photographs or illustrations. The only raster asset is the MeeruAI wordmark/logo.

**Data-viz.**
- Bar charts are inline SVG, hand-rolled. Plan bars are light `--rule` gray; Actual bars use the semantic tone color (`--negative`/`--positive`/`--warning`/`--primary`). Forecast bars use a 45° diagonal-line `<pattern>` fill over the same tone.
- Sparklines: 80×22px, 1.5px stroke, color = `--positive` if trending up else `--negative`.

**Layout rules.**
- Fixed 44px app header. 56px icon sidebar. Workbench grid: 200px left rail / fluid canvas / pinned right chat (typ. 360px).
- Primary content max-width: 1080–1280px for marketing-ish pages (Workspace, Close); full-width for workbench canvas.
- Scrollbars are thin (8px) with an invisible track — `--rule` thumb that darkens on hover.

## Iconography

- **System**: a hand-rolled set of ~40 inline-stroke SVGs in `src/icons.tsx` (`Icon.Home`, `Icon.Chart`, `Icon.Calendar`, `Icon.Bolt`, `Icon.File`, `Icon.Settings`, `Icon.Bars`, `Icon.Trend`, `Icon.Sheet`, `Icon.Sparkle`, `Icon.Send`, `Icon.Plus`, `Icon.Slack`, `Icon.Email`, `Icon.IM`, `Icon.Pin`, `Icon.Remind`, `Icon.Share`, `Icon.Approve`, `Icon.Open`, `Icon.Search`, `Icon.Moon`, `Icon.Sun`, `Icon.Refresh`, `Icon.Check`, `Icon.Alert`, `Icon.DownRight`, `Icon.Info`, `Icon.X`, `Icon.Flag`, `Icon.LogOut`, `Icon.Menu`, `Icon.Bell`, `Icon.ChevLeft/Right/Up/Down`, `Icon.Pencil`, `Icon.Star`, `Icon.Bulb`, `Icon.History`, `Icon.Target`).
- **Style**: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. Matches the Lucide/Feather convention exactly.
- **Sizes used**: `w-3 h-3` (12px) in dense chips, `w-3.5 h-3.5` (14px) default inline, `w-4 h-4` (16px) in headers, `w-5 h-5` (20px) in the left sidebar, `w-6 h-6` (24px) on workspace "jump to workbench" tiles.
- **Color**: always `currentColor` — inherits text tone. Tone-specific icons get a neutral bg pill (e.g., `bg-brand-tint text-brand` 24×24 rounded-md).
- **Emoji**: not used.
- **Unicode**: `·` and `→` are used liberally in copy; no other unicode icon usage.
- **CDN substitution for this design system**: Because the product uses a custom Feather/Lucide-style set, we link **[Lucide](https://lucide.dev/)** via CDN in the UI kits and slides — it's pixel-compatible with the in-app set (same viewBox, same stroke conventions). **Flag**: for production fidelity, use the project's `src/icons.tsx` directly — Lucide has more glyphs but occasionally differs in corner detail.

### Logo
- `assets/meeru-logo.png` — the **light-theme** wordmark (raster PNG).
- **Text fallback** is rendered as `Meeru<span>AI</span>` in 16/28px Inter 700, with `AI` in `--primary` (`#FE8953`) — the same coral used everywhere else in the product.
- Favicon (`assets/favicon.svg`): a 32×32 rounded square with a coral gradient (`#FE8953 → #FD7A3D`) and a white bold "M".

## Font substitution

No custom font files ship with the codebase. The product uses **Inter** via Google Fonts at weights 400/500/600/700 — we use the same. **No substitution needed.** If you want a local copy, request the Inter TTFs and we'll drop them in `fonts/`.

## Index / manifest

Files to read first:
- `README.md` — this file. Full brand, voice, and visual reference.
- `SKILL.md` — Agent-Skills-compatible entry point (cross-tool invocation).
- `colors_and_type.css` — CSS variable tokens for color, type, spacing, radii, shadows, + semantic element classes.

Assets (copy into your artifact; do **not** reference from outside this folder):
- `assets/meeru-logo.png` — light-theme wordmark.
- `assets/favicon.svg` — brand favicon (blue gradient square with "M").

Preview cards (these populate the **Design System tab**):
- `preview/colors-brand.html` · `colors-neutrals.html` · `colors-semantic.html` · `colors-dark.html`
- `preview/type-scale.html` · `type-specimens.html`
- `preview/spacing-radii.html` · `spacing-shadows.html`
- `preview/components-buttons.html` · `components-chips.html` · `components-kpi.html` · `components-commentary.html` · `components-chart.html` · `components-nba.html` · `components-shell.html`
- `preview/brand-icons.html` · `brand-logo.html`

UI kits:
- `ui_kits/variance_workbench/` — the flagship Workbench recreation. Open `index.html`. Components live in `components.jsx`; mock data in `data.js`; styles in `kit.css`.

## Folder tree

```
/
├── README.md                 — this file (brand, voice, visuals, icons)
├── SKILL.md                  — cross-compatible SKILL.md for Agent Skills
├── colors_and_type.css       — CSS variable tokens (color, type, spacing, radii, shadow) + semantic classes
├── assets/
│   ├── meeru-logo.png        — primary wordmark (light theme)
│   └── favicon.svg           — 32×32 brand favicon
├── preview/                  — Design System tab cards (registered assets)
│   ├── colors-*.html         — palette specimens
│   ├── type-*.html           — type scale & specimens
│   ├── spacing-*.html        — radii / shadow / spacing
│   ├── components-*.html     — buttons / chips / cards / KPI / chart / nav
│   └── brand-logo.html       — logo card
└── ui_kits/
    └── variance_workbench/
        ├── README.md
        ├── index.html        — interactive workbench recreation
        ├── components.jsx    — shell, header, sidebar, rail, topnav, KPI, chart, chat, NBA, commentary
        └── data.js           — mock data lifted from the real app
```
