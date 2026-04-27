---
name: meeruai-design
description: Use this skill to generate well-branded interfaces and assets for MeeruAI (the Variance Workbench — an AI-native finance intelligence platform for CFOs, Controllers, and Staff Accountants), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Brand**: MeeruAI — finance intelligence. Professional, dense, quiet, evidence-led. Linear/Notion-grade polish on a Bloomberg-adjacent problem.
- **Tokens**: `colors_and_type.css` (CSS vars for color, type, spacing, radii, shadow + semantic classes).
- **Logo**: `assets/meeru-logo.png` (light); text fallback `Meeru<span style="color:var(--primary)">AI</span>`. The "AI" glyph uses `--primary` (coral `#FE8953`) — the same token that drives all product CTAs, active states, and chart accents.
- **Icons**: Lucide via CDN (stroke-width 2, round caps) — matches the in-app Feather/Lucide-style set in `src/icons.tsx`.
- **Font**: Inter 400/500/600/700 via Google Fonts. No substitution.
- **UI kit**: `ui_kits/variance_workbench/` — drop-in JSX components (AppHeader, IconSidebar, WorkbenchTabs, LeftRail, KpiRow, VarianceChart, Commentary, NextBestAction, ChatPanel).
- **Preview cards**: `preview/*.html` — registered in the Design System tab.

## Hard rules (don't break)

- **Color is status-only.** Neutrals do the work. Never decorate with green/red/amber.
- **One brand gradient exists**: the amber "Start today's mission" CTA (`#F59E0B → #D97706`). No other gradients in the canvas.
- **No emoji.** Inline-stroke SVG icons only.
- **Tabular-nums everywhere** numbers appear.
- **13px base, 12–14px dense.** Eyebrows at 10px UPPERCASE tracking .08em.
- **Cards**: white + 1px `--rule` + `rounded-xl` (12px) + `shadow-e1`. Hover lifts with `shadow-e2`. No colored left-border accents.
- **Copy is terse and operator-first.** Numbers lead. Middle-dot (`·`) for soft separators.
