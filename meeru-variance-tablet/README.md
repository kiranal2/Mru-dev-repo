# MeeruAI Variance Workbench — Tablet Edition (MVP)

A React Native + Expo tablet app. Runs on iPad and Android tablets (and iPhone and Android phone for that matter, though it's tablet-first). No Xcode or Android Studio required — runs in Expo Go.

## Quick start

```bash
cd meeru-variance-tablet
npm install
npx expo start
```

Then:

1. Install **Expo Go** on your iPad or Android tablet (App Store / Play Store).
2. Make sure the tablet and your laptop are on the same Wi-Fi network.
3. Scan the QR code printed in your terminal.
4. The app loads on the tablet.

Alternatively, press `i` in the terminal to launch the iOS simulator (requires Xcode), or `a` for the Android emulator (requires Android Studio), or `w` to open in a web browser.

## What's in the MVP (this Phase-1 scaffold)

| Screen | Status |
|---|---|
| Login / persona picker | ✅ Working |
| Workspace (Live Pins, Watchlist, Quick-access tiles) | ✅ Working |
| Performance Intelligence · Analysis tab (KPIs + commentary + SVG chart) | ✅ Working |
| Performance · other sub-tabs | 🟡 Stubbed |
| Margin Intelligence | 🟡 Stubbed |
| Flux Intelligence | 🟡 Stubbed |
| Close Workbench (task list with blockers) | ✅ Working (read-only) |
| Reconciliations | 🟡 Stubbed |
| Notebook (Pinned / Saved) | 🟡 Stubbed |
| Profile (details + persona switch + logout) | ✅ Working |
| AI Chat — bottom sheet with typing indicator, suggestions, NBA cards, toolbar | ✅ Working |
| Next Best Action cards — role-ranked, with verbs per kind | ✅ Working |
| Toasts with haptics on send | ✅ Working |
| Voice input button | 🟡 UI only (no ASR wired yet) |
| Missions / Marin guide | 🟡 Phase 3 |
| Board / Presentation mode | 🟡 Phase 3 |
| Apple Pencil annotations | 🟡 Phase 3 |
| Home-screen widgets | 🟡 Phase 3 |

## Architecture

```
meeru-variance-tablet/
├── App.tsx                  # Providers + navigation root
├── index.ts                 # Expo entry
├── app.json                 # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js          # NativeWind + Reanimated
├── tailwind.config.js
├── nativewind-env.d.ts
└── src/
    ├── types.ts             # Shared types (portable to web)
    ├── data.ts              # Mock data (personas, pins, chat responses)
    ├── store.tsx            # Contexts: Auth, Chat, Toasts (AsyncStorage-backed)
    ├── navigation.tsx       # React Navigation setup (bottom tabs + stacks)
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── WorkspaceScreen.tsx
    │   ├── PerformanceScreen.tsx
    │   ├── MarginScreen.tsx, FluxScreen.tsx     (stubs)
    │   ├── CloseScreen.tsx                      (task list)
    │   ├── NotebookScreen.tsx                   (stub)
    │   └── ProfileScreen.tsx
    └── components/
        ├── icons.tsx         # react-native-svg icon library
        ├── KpiCard.tsx
        ├── Commentary.tsx
        ├── VarianceChart.tsx (SVG)
        ├── ChatSheet.tsx      (@gorhom/bottom-sheet)
        └── ToastHost.tsx
```

## What's ported from the web app

About 60% of the web app's code reuses verbatim or with minor tweaks:

| Web (`Mru-dev-repo/meeru-variance-app`) | Tablet | Notes |
|---|---|---|
| `src/types.ts` | `src/types.ts` | Identical |
| `src/data.ts` | `src/data.ts` | Narrower MVP subset; same shape |
| `src/store.tsx` (Auth + Chat contexts) | `src/store.tsx` | `localStorage` → `AsyncStorage` |
| `src/components/VarianceChart.tsx` | `src/components/VarianceChart.tsx` | SVG → `react-native-svg` |
| Tailwind classes | NativeWind | Most classes work verbatim |
| React Router | React Navigation | Bottom tabs + stacks |
| Toast pattern | `ToastHost` with Reanimated | Same shape, native animations |

## Tech stack

- **Expo SDK 50** — managed workflow, runs in Expo Go
- **React Native 0.73** + **TypeScript**
- **React Navigation 6** — bottom tabs + native-stack
- **NativeWind** — Tailwind CSS for React Native
- **@gorhom/bottom-sheet** — the chat sheet
- **react-native-svg** — charts + icons
- **react-native-reanimated** — toast animations
- **expo-haptics** — tactile feedback on actions
- **@react-native-async-storage/async-storage** — local persistence

## How to test the close-loop demo

1. Tap **CFO · Sarah** on the login screen.
2. Land on **Workspace** — glance at the 4 Live Pins and 5-row Watchlist.
3. Tap the **Variance** tab → **Performance Intelligence** opens.
4. Scroll through KPIs, commentary, and the weekly variance chart.
5. Tap the sparkle icon in the top-right of the screen (or swipe up on the bottom sheet handle) to expand the **AI chat**.
6. Tap one of the **Suggested** chips — e.g. *"Why did Enterprise churn spike this quarter?"*
7. Watch the typing indicator, then see the AI reply with **Next Best Action** cards below it.
8. Tap **Send** on any action card. A toast confirms with haptic feedback; card flips to ✓ Sent.
9. Tap **Profile** tab → try switching to **Controller · Raj** or **Preparer · Maya** — the persona chip and action-card ordering re-calibrate (reopen a workbench and re-run the chat to see it).

## Next steps (Phase 2+)

See `MeeruAI_Variance_Workbench_Tablet_Spec.docx` in the Meeru AI output folder for the full 29-page roadmap. Highlights:

- **Phase 2** — port remaining workbenches (Margin, Flux, Reconciliations, Notebook, full Drill-Down)
- **Phase 3** — tablet-native: Board / Presentation Mode, Apple Pencil annotations, home-screen widgets, Lock Screen Live Activity, Handoff, Siri Shortcuts
- **Phase 4** — accessibility audit (VoiceOver / TalkBack), performance profiling, App Store + Play Store submission

## Known limitations

- Voice input button is UI-only — wiring to `expo-speech` / `@react-native-voice` is a Phase 2 item
- Chat has pre-authored responses only (same as web); real LLM integration is Phase 2
- Missions / Marin guide not ported yet
- No offline mode — every session starts fresh except persona + Notebook (when Notebook is implemented)
- No split view / Slide Over adaptation — the app works at 50% width but the layout isn't optimized
