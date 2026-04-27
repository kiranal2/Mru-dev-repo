# Variance Workbench — UI Kit

A pixel-faithful recreation of the MeeruAI Variance Workbench — the flagship product of Meeru's finance intelligence platform.

## What it covers

- **App shell**: 44px header, 56px icon sidebar, context switcher, profile menu, theme toggle.
- **Workbench template**: 3 tabs (Performance · Margin · Flux) + left rail (regions + segments) + canvas + pinned right chat.
- **KPI row**: 3 metric tiles with a "Watch" pulse tag on the most concerning KPI.
- **Variance chart**: hand-rolled inline SVG bars — Actual vs Plan, with 45° hatch for forecast weeks.
- **AI Commentary**: ranked-by-impact narrative rows with numbered badges.
- **Next Best Action strip**: horizontally scrollable cards with channel icons, colored accent bars, Edit / Send flow.
- **Chat panel**: scoped to the current workbench, with fake send-and-reply roundtrip.

## Files

- `index.html` — interactive demo. Tabs switch, region selects, chat sends a user msg + fake AI reply, NBA "Send" confirms.
- `components.jsx` — all JSX components (IconSidebar, AppHeader, WorkbenchTabs, TopNav, LeftRail, KpiRow, VarianceChart, Commentary, NextBestAction, ChatPanel). Global `Ic.*` icon map.
- `data.js` — mock data (personas, regions, KPIs, chart bars, commentary, NBA, chat).
- `kit.css` — BEM-ish `.vw-*` styles built on `../../colors_and_type.css` tokens.

## Interactions

- Click a Workbench tab → tab state updates.
- Click a region in the rail → selection highlights.
- Type in chat composer + Enter → message appears, fake AI reply 600ms later.
- Click **Send** on a Next Best Action → button flips to ✓ Sent for 1.8s.

## What's deliberately omitted

- Real routing (it's a single screen).
- Marin (the guide agent), MissionEndCard, CommandCenter/`⌘K`, TopNav action toolbar overflow, Reconciliations, Close Day view — out of scope for the kit.
- Real data wiring / store — everything is static JSON in `data.js`.
