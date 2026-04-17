# Meeru Variance Workbench — React Prototype

A standalone Vite + React + TypeScript + Tailwind prototype that demonstrates the
four-zone workbench template, adaptive action strip, persona-aware UX, guided
missions, and Close Intelligence rail — matching the strategy document.

## Quick start

```bash
npm install
npm run dev
```

Visit http://localhost:5173.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript compiler in no-emit mode |

## What's inside

### Pages (routes)
- `/login` — Persona picker (CFO · Controller · Preparer). No passwords; persona is stored in `localStorage`.
- `/workspace` — Post-login landing. Live Pins, Watchlist, Recent Activity, mission launcher.
- `/variance/performance` — Performance Intelligence workbench (Regions / Comparison / Drivers).
- `/variance/margin` — Margin Intelligence workbench (Product / Channel / Period).
- `/variance/flux` — Flux Intelligence workbench (Compare / Materiality / Owner).
- `/close` — Close Workbench (12 tasks, blockers, critical path).
- `/reconciliations` — GL-to-subledger matching (8 recs, material variances flagged).
- `/settings` — Adaptive preferences (theme, density, pinned actions, persona defaults).

### The four-zone template
Every variance workbench uses `src/components/WorkbenchShell.tsx` which renders the
canonical grid: **Left drill rail · Top category tabs · Centre canvas · Right pinned
chat · Bottom adaptive action strip**. Pages supply only the left rail content,
top nav tabs, and centre canvas — the chat and strip come for free.

### The adaptive action strip
`src/components/ActionStrip.tsx`. Layer 1 (universal Pin / Remind / Share) is always
visible. Layer 2 (contextual cards from the latest AI reply) appears on chat response
and re-orders per persona. Send a card → marked ✓ Sent, toast confirms, no app switch.

### The chat engine
Pre-authored pattern-matched responses in `src/data.ts` (CHAT_RESPONSES). Each
response includes a `proposed_actions` array that becomes the contextual cards.
Triggers include: enterprise / churn, California / labor, cloud cost, NRR, at-risk
accounts, expansion, close / blocker, reconciliation.

### Missions (guided walkthrough)
Three missions — one per persona:
- **CFO** — "Tuesday Morning, West Coast Crisis" (6 beats)
- **Controller** — "Close-Day Blocker" (4 beats)
- **Preparer** — "The 3% Discrepancy" (4 beats)

Click **Start Mission** in the header. The Marin guide appears in the bottom-right,
glows the next element to interact with, and auto-advances when you complete the
action. Missions are defined declaratively in `src/data.ts` (MISSIONS).

### Personas
Three demo users in `src/data.ts` (PERSONAS), each with a distinct `order` array
that determines action-strip card priority. Switch via the header select —
page re-renders, cards re-order, scoping updates.

### Design tokens
All colour, spacing, and typography tokens are CSS variables in `src/index.css`
with a clean dark-mode override. Tailwind is configured to expose them as colour
utilities (`bg-brand`, `text-positive`, `border-rule`, etc.). Colour is
status-only — slate for everything that is not good/bad/warning.

## File map

```
meeru-variance-app/
├── package.json · vite.config.ts · tsconfig.json · tailwind.config.js
├── index.html
└── src/
    ├── main.tsx               · React entry
    ├── App.tsx                · Router + providers
    ├── index.css              · Design tokens + globals
    ├── types.ts               · Core TS types
    ├── icons.tsx              · Inline SVG icons
    ├── store.tsx              · All React contexts (auth, persona, theme, mission, toasts, chat, settings)
    ├── data.ts                · Mock data — workbenches, chat, missions, close, recons
    ├── components/
    │   ├── AppShell.tsx       · Header + sidebar wrapper
    │   ├── WorkbenchShell.tsx · 4-zone template
    │   ├── LeftRail.tsx       · Reusable drill-rail groups
    │   ├── TopNav.tsx         · Category-tab row
    │   ├── ChatPanel.tsx      · Pinned right chat
    │   ├── ActionStrip.tsx    · Bottom adaptive cards
    │   ├── KpiRow.tsx         · 3-tile KPI row
    │   ├── Commentary.tsx     · Ranked commentary card
    │   ├── VarianceChart.tsx  · Inline SVG bar chart
    │   ├── MarinGuide.tsx     · Mission guide + end card
    │   ├── Toast.tsx          · Toast host
    │   └── ui.tsx             · Badge, StatusChip, Card, Eyebrow
    └── pages/
        ├── Login.tsx          · Persona picker
        ├── Workspace.tsx      · Home landing
        ├── Performance.tsx    · Performance workbench
        ├── Margin.tsx         · Margin workbench
        ├── Flux.tsx           · Flux workbench
        ├── Close.tsx          · Close Workbench + chat + strip
        ├── Recons.tsx         · Reconciliations
        └── Settings.tsx       · Adaptive preferences
```

## Try the close-loop

1. Log in as any persona (default: CFO).
2. On the workspace, click **Start today's mission** — or navigate to Performance Intelligence and click **Start Mission** in the header.
3. Follow Marin — she glows the next element.
4. When the chat responds, the bottom strip fills with role-ranked action cards. Click **Send** on the one Marin points to.
5. Toast confirms. Card collapses. No app leaving. Mission advances.

## Customise

- Add a new workbench: duplicate `pages/Performance.tsx`, add a `WorkbenchMeta` entry in `data.ts`, wire a route in `App.tsx`.
- Add a chat response: append to `CHAT_RESPONSES` in `data.ts` with a regex and action list.
- Add a mission: append to `MISSIONS` in `data.ts` with a beat sequence.
- Change colours: edit CSS variables in `src/index.css`.

## Known limitations

This is a design-spec prototype, not a production app:
- No backend — all data is in `src/data.ts`.
- Chat is pre-authored pattern matching, not a real LLM.
- Auth is `localStorage`; no real sessions.
- No tests.
- No i18n, no a11y audit, no analytics wiring.
