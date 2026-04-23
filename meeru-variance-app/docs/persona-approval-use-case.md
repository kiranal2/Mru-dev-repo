# Persona-Based Permissions & Approval Flow — Design Doc

**Version:** 1.0
**Date:** 2026-04-23
**Status:** Implemented in prototype (`meeru-variance-app`)
**Author:** Demo engineering

---

## 1. Summary

The Meeru Variance Workbench now models the real financial-controls workflow that separates **work preparation** from **work review** from **executive approval**. Three personas — **Staff Accountant**, **Controller**, and **CFO** — each hold a distinct set of capabilities. The UI surfaces only the actions a persona is authorized to execute, so the same screen shows different next-best actions depending on who is signed in.

This both (a) improves demo realism — a CFO will not see "Submit for approval" because they _are_ the approver — and (b) validates a real enterprise-controls requirement (SOX segregation of duties) for future back-end integration.

---

## 2. The three personas

| Persona | Title | Name in demo | Reports to | Primary work |
|---|---|---|---|---|
| **STAFF** | Staff Accountant | Maya Gonzales | Controller | Prepare JEs, attach evidence, log variance notes |
| **CONTROLLER** | Corporate Controller | Raj Patel | CFO | Review staff work, post JEs up to materiality, sign off recs |
| **CFO** | Chief Financial Officer | Kate Morgan | CEO | Approve large JEs, lock periods, publish reports |

> **Naming note.** "STAFF" is the machine key (stored in `localStorage`, in PERSONAS). "Staff Accountant" is the human-facing title. A migration shim transparently rewrites legacy `PREPARER` keys in localStorage to `STAFF` on first load — no user action required.

---

## 3. Capability matrix

Capabilities are fine-grained keys declared per persona. The UI calls `hasPermission(persona, key)` to gate any action.

| Capability | Staff | Controller | CFO | What it controls |
|---|:---:|:---:|:---:|---|
| `log_note` | ✓ | ✓ | ✓ | Add commentary on a variance or recon |
| `attach_evidence` | ✓ | ✓ | ✓ | Upload supporting documents |
| `prepare_je` | ✓ | ✓ | ✓ | Draft a JE (no posting) |
| `submit_for_approval` | ✓ | ✓ | ✓ | Push a JE into the review queue |
| `review_work` | — | ✓ | ✓ | Accept/reject staff work, route to CFO |
| `post_je` | — | ✓ | ✓ | Post a JE to GL if amount ≤ $1M |
| `approve_recon` | — | ✓ | ✓ | Sign off a reconciliation |
| `signoff_close_phase` | — | ✓ | ✓ | Mark a close-day phase complete |
| `post_je_over_1m` | — | — | ✓ | Post JEs above the $1M materiality ceiling |
| `approve_je_over_1m` | — | — | ✓ | Final CFO approval for large JEs |
| `lock_period` | — | — | ✓ | Lock a period/segment (immutable after) |
| `publish_reports` | — | — | ✓ | Push board-level reports externally |
| `override_materiality` | — | — | ✓ | Change the materiality threshold policy |

**SOX segregation of duties** is enforced by the `post_je_over_1m` / `approve_je_over_1m` split: the Controller can draft and post small JEs but cannot self-approve anything above $1M — the CFO must independently approve.

---

## 4. End-to-end use case — "Mexico Grocery variance triggers CFO approval gate"

This is the **canonical demo flow**. It exercises every persona, the approval gate, and the materiality threshold.

### Trigger

Week 10 (Mar 3–9 2026). **Mexico Grocery is running −$2.1M vs Plan** — Courier utilization has been at 68% for 3 consecutive weeks (red line is 63%). Trip dampening has been active since W8. The $2.1M variance exceeds the $1M SOX materiality ceiling, so any JE tied to closing it out needs CFO sign-off.

### Actors & hand-offs

```
Maya Gonzales (Staff)         Raj Patel (Controller)          Kate Morgan (CFO)
─────────────────────         ──────────────────────          ──────────────────
1. Open investigation
2. Log note + evidence
3. Prepare draft JE
4. Submit for approval  ───▶  5. Review note + JE
                              6. Post provisional JE
                              7. Route to CFO         ───▶    8. Review approval modal
                                                              9. Approve & Lock Period
                                                             10. Publish board report
```

### Walk-through — **Maya (Staff Accountant)**

1. Signs in. The header's **Context Switcher** reads `Performance · Staff Accountant`.
2. The **right-side Variance Deep-Dive** panel ranks Mexico Grocery as driver #1. She clicks **"Drill down"** → the page jumps to the Drill-Down tab and the Mexico Grocery card is highlighted with a brand ring.
3. She asks in the chat: _"What materiality rule applies to Mexico?"_ The AI returns a 3-step breakdown and a set of action cards.
4. Her NBA strip shows **only** the cards she can actually execute:
   - ✓ **Open investigation** (`requires: attach_evidence`)
   - ✓ **Submit for approval** (`requires: submit_for_approval`)
   - ✓ **Pin to my queue** (no gate)
   - ✗ "Post provisional JE" — **hidden** (requires `post_je`)
   - ✗ "Approve & Lock Period" — **hidden** (requires `approve_je_over_1m`)
5. She opens the investigation, attaches the courier-utilization chart + Cencosud co-funding email as evidence, logs her note, and clicks **Submit for approval**. A Slack DM drafts to Raj with the context pre-attached.

### Walk-through — **Raj (Controller)**

6. Switches persona via the Context Switcher pill in the header. Header re-renders, cards reshuffle, status chip now reads `Close Day 4 · 2 blockers open`.
7. The same Mexico Grocery row now carries a "Review Queue" chip. The NBA strip shows new cards:
   - ✓ **Post provisional JE** (`requires: post_je`) — Raj can post to draft
   - ✓ **Route to CFO for sign-off** (`requires: review_work`)
   - ✓ **Open investigation**, **Submit for approval** (inherited — Controller can also prepare)
   - ✗ "Approve & Lock Period" — still hidden (requires `approve_je_over_1m`, CFO-only)
8. Raj reviews Maya's note, drafts the JE for $2.1M, clicks **Post provisional JE**. The action modal confirms the draft was recorded, then auto-dismisses and routes him to the Drill-Down detail.
9. Because the amount exceeds $1M materiality, a **"Needs CFO sign-off"** banner appears. He clicks **Route to CFO for sign-off**. An email drafts to Kate with the JE attached + Maya's original evidence bundle.

### Walk-through — **Kate (CFO)**

10. Switches persona. Header chip reads `Variance flagged · action recommended`. NBA strip now shows her gated actions at the top because `CFO.order` prioritizes email/pin/approve:
    - ✓ **Approve & Lock Period** (`requires: approve_je_over_1m`)
    - ✓ **What-If: Raise materiality threshold** (`requires: override_materiality`)
    - ✓ All lower-tier actions (review, post, submit) remain visible
11. Kate clicks **Approve & Lock Period**. The modal shows: proposed JE ($2.1M), Controller's note, auto-computed materiality check (_"$2.1M > $1M threshold → requires CFO sign-off"_), plus Maya's evidence bundle.
12. She confirms. The period locks for Mexico Grocery (no further edits). A toast confirms `Approved · locked · audit trail recorded`. The approval audit entry shows all three signatures: `prepared_by: Maya`, `posted_by: Raj`, `approved_by: Kate`.
13. She optionally clicks **Publish board report** to push the locked snapshot to the W10 board deck.

### Why this is the right demo

- **It exercises every persona** without contrivance — the flow _requires_ all three because of the $1M threshold.
- **It makes the permission gating visible** — the same screen shows three different action strips depending on who is signed in.
- **It mirrors a real SOX control** — preparer / reviewer / approver separation, with an independent executive sign-off above materiality.
- **It ties to the variance data we already authored** — Mexico Grocery is the hero segment in the Uberflux port, so the demo context is already on-screen when the user arrives.

---

## 5. Implementation details

### 5.1 Types (`src/types.ts`)

```ts
export type Role = 'CFO' | 'CONTROLLER' | 'STAFF';

export type Permission =
  | 'log_note'
  | 'attach_evidence'
  | 'prepare_je'
  | 'submit_for_approval'
  | 'review_work'
  | 'post_je'
  | 'post_je_over_1m'
  | 'approve_recon'
  | 'signoff_close_phase'
  | 'approve_je_over_1m'
  | 'lock_period'
  | 'publish_reports'
  | 'override_materiality';

export interface Persona {
  key: Role;
  // … other fields
  capabilities?: Permission[];
}

export interface ActionCard {
  kind: ActionKind;
  label: string;
  who: string;
  body: string;
  requires?: Permission;   // NEW — gates the card per persona
}
```

### 5.2 Store helper (`src/store.tsx`)

```ts
export function hasPermission(persona: Persona | null | undefined, perm: Permission): boolean {
  if (!persona?.capabilities) return false;
  return persona.capabilities.includes(perm);
}

export function usePermission(perm: Permission): boolean {
  const ctx = useContext(AuthContext);
  return hasPermission(ctx?.user ?? null, perm);
}
```

Two styles:
- `hasPermission(persona, key)` — pure function, usable in useMemo filters.
- `usePermission(key)` — React hook, re-evaluates on persona change.

### 5.3 Capability sets per persona (`src/data.ts`)

```ts
CFO.capabilities = [
  'log_note', 'attach_evidence',
  'prepare_je', 'submit_for_approval', 'review_work',
  'post_je', 'post_je_over_1m', 'approve_recon', 'signoff_close_phase',
  'approve_je_over_1m', 'lock_period', 'publish_reports', 'override_materiality',
];

CONTROLLER.capabilities = [
  'log_note', 'attach_evidence',
  'prepare_je', 'submit_for_approval', 'review_work',
  'post_je', 'approve_recon', 'signoff_close_phase',
  // NOT post_je_over_1m, approve_je_over_1m, lock_period, publish_reports,
  // override_materiality — must route to CFO
];

STAFF.capabilities = [
  'log_note', 'attach_evidence',
  'prepare_je', 'submit_for_approval',
  // NOT review_work, post_je, approve_recon, signoff_close_phase,
  // or anything CFO-tier
];
```

### 5.4 Gating the action cards

Three render paths surface action cards — all three now filter:

- `src/components/NbaMainSection.tsx` — main content NBA row
- `src/components/ChatPanel.tsx` — right-side chat NBA strip
- `src/components/ActionStrip.tsx` — bottom universal action strip

Each calls `hasPermission(persona, card.requires)` before rendering. Cards without a `requires` field are always visible.

### 5.5 Example chat response with gated actions (`src/data.ts`)

```ts
{
  match: /materiality|supply ceiling|approve.*je|post.*je|lock.*period/i,
  text: 'Mexico Grocery variance is -$2.1M — above the $1M materiality ceiling …',
  actions: [
    // Staff tier
    { kind: 'investigate', label: 'Open investigation',
      requires: 'attach_evidence', ... },
    { kind: 'email', label: 'Submit for approval',
      requires: 'submit_for_approval', ... },
    // Controller tier
    { kind: 'approve', label: 'Post provisional JE',
      requires: 'post_je', ... },
    { kind: 'email', label: 'Route to CFO for sign-off',
      requires: 'review_work', ... },
    // CFO tier
    { kind: 'approve', label: 'Approve & Lock Period',
      requires: 'approve_je_over_1m', ... },
    { kind: 'whatif', label: 'What-If: Raise materiality threshold',
      requires: 'override_materiality', ... },
    // Universal
    { kind: 'pin',   label: 'Pin to my queue',  ... },
    { kind: 'share', label: 'Share snapshot',   ... },
  ],
}
```

### 5.6 How to trigger the flow in the demo

Ask any of these prompts to load the approval-gated action strip:

- _"What materiality rule applies to Mexico?"_
- _"Can we raise the Mexico supply ceiling?"_
- _"Approve the Mexico JE"_
- _"Post the JE to close this variance"_
- _"Lock the period for Mexico Grocery"_

The regex `/materiality|supply ceiling|mexico.*11%|approve.*je|post.*je|lock.*period/i` matches any of these.

---

## 6. What's **not** gated yet (out of scope for this pass)

These are candidates for future work:

- **Tab-level hiding.** All personas still see Analysis/Drill-Down/Exceptions/Signals/History. A future change could hide History for Staff (not their job) or route Staff directly to Exceptions on login.
- **Read-only modes.** A locked period should render all write-actions in a "Locked" state, not simply hide them. Today the flow is "Approve & Lock" but a re-opened page does not visibly reflect the lock.
- **Worklist scoping.** Staff should see "my tasks" only; Controller should see "team queue"; CFO should see "needs my approval". Right now Performance data is not persona-scoped.
- **Audit trail UI.** We record conceptual `prepared_by / posted_by / approved_by` in the use case but don't render an audit-trail panel. A follow-up would add a right-drawer listing signatures.
- **Route-level enforcement.** `/settings` → `Override materiality` page doesn't exist yet. When it does, it must be 403 for non-CFO.

---

## 7. File-by-file change log

| File | Change |
|---|---|
| `src/types.ts` | Role: `PREPARER` → `STAFF`. Added `Permission` union (13 keys). `ActionCard.requires?: Permission`. `Persona.capabilities?: Permission[]`. |
| `src/data.ts` | PERSONAS key renamed `PREPARER` → `STAFF`. Each persona got a `capabilities` array. New CHAT_RESPONSE matching materiality/approval keywords with gated action cards. Mission persona string renamed. |
| `src/store.tsx` | New `hasPermission()` and `usePermission()`. Import `Permission`. localStorage migration: `'PREPARER'` → `'STAFF'` on read. |
| `src/components/NbaMainSection.tsx` | `filterByPermission()` applied before ordering. |
| `src/components/ChatPanel.tsx` | Filter gated cards from the chat NBA strip. |
| `src/components/ActionStrip.tsx` | Filter gated UNIVERSAL_ACTIONS. |
| `src/components/AppShell.tsx` | Context Switcher persona list: `PREPARER` → `STAFF`. |
| `src/components/MarinGuide.tsx` | Mission cycle next-persona: `PREPARER` → `STAFF`. |
| `src/pages/Performance.tsx` | persona-chip branch: `PREPARER` → `STAFF`. |
| `src/pages/Login.tsx` | Persona card role: `PREPARER` → `STAFF`. |
| `docs/persona-approval-use-case.md` | This document. |

---

## 8. How to extend

Add a new permission:
1. Add the key to `Permission` union in `types.ts`.
2. Add it to the capability sets of the personas that should hold it (`data.ts`).
3. Tag any `ActionCard` with `requires: 'new_key'`.
4. Done — gating is automatic.

Add a new persona:
1. Add the role key to `Role` union in `types.ts`.
2. Add a PERSONAS entry in `data.ts` with `capabilities`.
3. Add it to the Context Switcher persona list in `AppShell.tsx`.
4. Optionally add a status-chip branch in `Performance.tsx`.

---

**End of document.**
