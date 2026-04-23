# Command Center — Prompt Reference

**Version:** 1.0
**Date:** 2026-04-23
**Scope:** Delivery (Uberflux) industry preset + 3 personas (CFO / Controller / Staff Accountant)

---

## How prompt matching works

The Command Center's AI response system works in three layers:

1. **Persona-tagged prompts** — the system first looks for a CHAT_RESPONSE whose `persona` field matches the active persona AND whose regex matches the user's text.
2. **Shared (untagged) prompts** — if no persona-tagged match, it falls back to CHAT_RESPONSES without a `persona` tag.
3. **FALLBACK_RESPONSE** — a generic "Got it, pick from the action strip" response if nothing matches.

Every persona sees different **default chips** (the 3 starter prompts before typing) and a different **suggestion library** (the chip list that appears when you click the 💡 icon or when you start typing).

Switch persona via the **Context Switcher pill** in the header (top-right of the app). Prompts + default chips update immediately.

---

## Default chips (3 shown on load)

| Persona | Default chips |
|---|---|
| **CFO** | *Show items needing my approval* · *Draft a W10 board summary* · *What is the Q1 cumulative exposure?* |
| **Controller** | *Show my review queue* · *What are the close-day blockers?* · *Reconciliation status across segments* |
| **Staff Accountant** | *What are my tasks for today?* · *How do I prepare the Mexico investigation?* · *What evidence am I missing?* |

---

## Shared prompts (work for all personas)

These prompts hit untagged CHAT_RESPONSES — same answer regardless of who's signed in. Focused on operational diagnosis of the Week 10 Uberflux data.

| Prompt | What you get back |
|---|---|
| **Why did LATAM underperform this week?** | Mexico Grocery drives 87% of the −$2.4M miss. Full breakdown by segment, W8→W9→W10 compounding, W11 projection. Action cards: raise supply ceiling, Slack LATAM ops, route to CFO, Brazil incentive what-if. |
| **What should we watch before Tuesday?** | Mexico supply threshold + Brazil early-warning. Explicit recommendations with $ and courier counts. Auto-recovering items called out as monitor-only. |
| **Which regions are most at risk next week?** | Full W11 risk ranking across 5 regions. LATAM critical; APAC/NA low; EMEA positive but softening. |
| **What are the most significant exceptions this week?** | 6 exceptions ranked (3 critical, 2 warning, 2 positive) with severity, $, and owner. |
| **Why is Mexico Grocery in dampening?** | (Matches LATAM handler) · courier-util breakdown, historical W34 2024 comparison. |
| **Explain the US Convenience exit rate spike** | 1.8σ above seasonal baseline, Super Bowl effect, 87% confidence on full W11 recovery. No action needed. |
| **What is driving EUP Grocery outperformance?** | School holiday confirmed, FR +18% / UK +14% / Benelux +11%. W25 planning lever for next year. |
| **What caused the AU Grocery miss?** | 100-year rainfall event, 14-event historical rebound analysis, no-action recommendation. |
| **How serious is the Brazil Convenience risk?** | Courier util 61% approaching 63% threshold. 20× ROI on $40K pre-authorized incentive. |

### Keyword triggers (case-insensitive regex)

| Response | Regex |
|---|---|
| LATAM deep-dive | `/latam\|mexico grocery\|brazil convenience/i` |
| Watch-before-Tuesday | `/watch.*tuesday\|before tuesday\|tuesday\|most important/i` |
| W11 risk ranking | `/regions.*risk\|most at risk\|next week\|w11\|risk next/i` |
| US Convenience | `/us convenience\|exit rate\|super bowl/i` |
| EUP Grocery | `/eup grocery\|school holiday\|europe holiday\|holiday.*demand/i` |
| AU Grocery | `/au grocery\|australia\|weather\|rainfall/i` |
| Exceptions ranked | `/exceptions\|significant\|flagged\|critical/i` |
| Materiality / approval path | `/materiality\|supply ceiling\|mexico.*11%\|approve.*je\|post.*je\|lock.*period/i` |

---

## CFO-tagged prompts

**Only match when `persona.key === 'CFO'`.** Focused on executive decision points, board prep, materiality, and period lock.

| Prompt | Response summary |
|---|---|
| **Show items needing my approval** · *"needs my approval" / "approval queue" / "awaiting sign-off"* | Lists 3 open items: Mexico supply ceiling lift, Q1 period lock for Mexico Grocery, Brazil $40K pre-authorization. Total exposure if unapproved: ~$6M. Action cards require `approve_je_over_1m`, `lock_period`. |
| **Draft a W10 board summary** · *"board summary" / "board deck" / "board-ready"* | Full 3-paragraph CFO-voice draft covering W10 variance, Q1 cumulative (−$12.4M), W11 projection, and actions already taken. Action cards: pin to board-prep folder, send to board list, share link, publish as pre-read (`publish_reports` gated). |
| **What is the Q1 cumulative exposure?** · *"exposure" / "materiality" / "cumulative" / "QTD" / "quarter-to-date"* | Q1 compound materiality breakdown — Mexico $4.1M cumulative (above threshold), AU + US below threshold. Total Q1 variance −$12.4M. Action cards: exceptions tab, materiality override (`override_materiality`), share memo. |
| **What segments are ready for period lock?** · *"lock period" / "period-end" / "close lock"* | 3 clean segments ready (EMEA Grocery, US Alcohol, Japan Convenience), 3 deferred (Mexico, AU, Brazil). Action cards: lock 3 clean + defer 3 (`lock_period` gated). |

### Keyword triggers

| Response | Regex |
|---|---|
| Approvals queue | `/my approval\|needs (?:my \|cfo )?approval\|approval queue\|needs sign.?off\|awaiting sign.?off/i` |
| Board summary | `/board\|board summary\|board prep\|board deck\|board.?ready/i` |
| Q1 exposure | `/exposure\|materiality\|cumulative\|quarter.?to.?date\|qtd/i` |
| Period lock | `/lock period\|period lock\|period.?end\|close.*lock/i` |

---

## Controller-tagged prompts

**Only match when `persona.key === 'CONTROLLER'`.** Focused on the review queue, close operations, reconciliations, posting decisions, and audit trails.

| Prompt | Response summary |
|---|---|
| **Show my review queue** · *"review queue" / "pending review" / "staff submission"* | 4 items awaiting review: Mexico Grocery variance (highest priority), AR aging recon Mexico, Voltair remittance JE, Bank recon Chicago. Action cards: post Mexico provisional JE (`post_je`), route to CFO (`review_work`), approve recons (`approve_recon`). |
| **What are the close-day blockers?** · *"close day" / "day 4" / "day 5" / "close status"* | Day 4 status — 2 blockers (AR aging, depreciation schedule) + 3 in review + 2 completed. Critical-path 4pm checkpoint. Action cards: escalate tax team, sign off Day 4 phase (`signoff_close_phase`). |
| **Reconciliation status across segments** · *"recon" / "reconciliation"* | 8 recons total — 3 unmatched (AR, Intercompany, FX), 5 fully matched. Materiality-exceeding items for sign-off. Action cards: approve AR post-evidence + FX (`approve_recon`). |
| **Show the Mexico audit trail** · *"audit trail" / "approval chain" / "who approved" / "signoff history"* | Full 6-step audit trail for Mexico $2.1M: Prepared by Maya → Submitted → Reviewed by Raj → Provisional JE posted → Routed to CFO → Awaiting approval. Timestamps + signatures. |

### Keyword triggers

| Response | Regex |
|---|---|
| Review queue | `/review queue\|my review\|pending.*review\|awaiting.*review\|staff submission/i` |
| Close-day blockers | `/close.*day\|close.*blocker\|day 4\|day 5\|close status/i` |
| Recon status | `/recon\|reconciliation\|recon status/i` |
| Audit trail | `/audit trail\|approval chain\|who approved\|signoff history/i` |

---

## Staff Accountant-tagged prompts

**Only match when `persona.key === 'STAFF'`.** Focused on the personal work queue, preparation guidance, evidence gathering, and submission flow.

| Prompt | Response summary |
|---|---|
| **What are my tasks for today?** · *"my tasks" / "my queue" / "todo" / "what should I do"* | 3 due today (Mexico investigation, Voltair JE, Bank recon evidence), 3 in review, 1 blocker (AR $142K critical path). Action cards: open Mexico investigation (`attach_evidence`), submit for review (`submit_for_approval`). |
| **How do I prepare the Mexico investigation?** · *"how to prepare" / "how to file" / "how to submit" / "how to document"* | Step-by-step variance preparation playbook — note format, required evidence checklist (2 of 4 attached for Mexico), submit instructions, wait-for-review. |
| **What evidence am I missing?** · *"evidence" / "attach" / "upload" / "what need" / "missing"* | Evidence status across 3 items: Mexico (2 of 4), Voltair (1 of 2, bank confirm pending), Bank recon (6 of 8). Prioritization + action cards. |
| **Submit Mexico for Controller review** · *"submit for" / "send for review" / "push to controller"* | Readiness check — 2 evidence items short, recommendation to complete first (15 min) OR submit early with caveat. Action cards for both paths. |

### Keyword triggers

| Response | Regex |
|---|---|
| My task queue | `/my task\|my queue\|my work\|todo\|what.*today\|what.*should.*do/i` |
| Preparation playbook | `/how.*prepare\|how.*file\|how.*submit\|how.*write\|how.*document/i` |
| Evidence status | `/evidence\|attach\|upload\|what.*need\|missing/i` |
| Submit for review | `/submit for\|submit.*review\|send.*review\|push.*controller/i` |

---

## Legacy prompts (from the pre-Uber build — still work)

These SaaS-era CHAT_RESPONSES remain in the library as fallbacks for questions that mention ARR/NRR/Enterprise etc.

| Prompt theme | Regex | Notes |
|---|---|---|
| Enterprise churn | `/enterprise\|churn/i` | Acme/GlobalTech/DataStar Q1 churn narrative |
| California Retail labor | `/california\|labor\|west\|staffing/i` | LA/SF minimum-wage surge |
| Cloud / AI workload cost | `/cloud\|infrastructure\|cost/i` | FinOps reservation strategy |
| NRR trend | `/nrr\|retention\|trend/i` | 4-quarter NRR breakdown |
| At-risk accounts | `/risk\|at[- ]?risk\|account/i` | Voltair etc. retention flags |
| Expansion / ARR segments | `/expansion\|arr\|segment/i` | Mid-Market attach analysis |
| Close tasks / blockers | `/close\|task\|blocker/i` | Generic close narrative |
| Reconciliations | `/reconcil/i` | AR recon deep-dive |

**Note:** These are shadowed by the newer delivery/persona responses where regex overlaps occur (e.g. "risk next week" now goes to the delivery W11-risk response before the generic at-risk response).

---

## Where the prompt text is authored

| Artifact | File |
|---|---|
| 3 default chips per persona | `src/components/CommandCenter.tsx` → `PROMPTS_BY_PERSONA[persona.key].defaults` |
| Type-ahead library per persona | `src/components/CommandCenter.tsx` → `PROMPTS_BY_PERSONA[persona.key].library` |
| Shared typeahead pool | `src/components/CommandCenter.tsx` → `SHARED_PROMPTS` |
| Grouped suggestion popover | `src/components/CommandCenter.tsx` → `SHARED_SUGGESTION_GROUPS` |
| CHAT_RESPONSES (text, actions, follow-ups, persona tag) | `src/data.ts` → `CHAT_RESPONSES[]` |
| FALLBACK_RESPONSE | `src/data.ts` → `FALLBACK_RESPONSE` |

---

## How to add a new prompt

**1. Add the prompt text** to the right pool in `CommandCenter.tsx`:
- Persona-specific → `PROMPTS_BY_PERSONA[ROLE].library`
- Shared across personas → `SHARED_PROMPTS`

**2. Add a CHAT_RESPONSE** entry in `data.ts`:
```ts
{
  persona: 'CFO',           // OR omit for all-persona
  match: /my new prompt|key phrase/i,
  text: '<strong>Data-backed answer.</strong> 2-3 sentences with $ amounts + percentages.',
  actions: [
    { kind: 'approve', label: '…', who: '…', body: '…', requires: 'approve_je_over_1m' },
    // 4–6 action cards, some with `requires` gates
  ],
  followUps: [
    '3 related prompts',
    'That chain from the answer',
    'A what-if or comparison',
  ],
},
```

**3. Order matters.** Persona-tagged responses are checked before untagged ones, but within the same persona, the first matching regex wins. Put more specific regexes earlier.

**4. If the prompt should surface as a default chip**, add it to `PROMPTS_BY_PERSONA[ROLE].defaults` (limit 3 so the chip row stays clean).

---

## Demo tips

- **Switch personas mid-conversation** — the default chips and suggestion library swap immediately, and the same prompt text can return different content depending on who's signed in.
- **Regex sensitivity** — if a prompt doesn't hit the expected response, the fallback ("Got it. Based on the current workbench…") tells you the matcher missed. Copy the exact prompt text into the regex or adjust the library to match what the UI is showing.
- **Persona-specific action cards** — because `ActionCard.requires` permissions are applied to every card, try clicking through an "Approvals Queue" response as Staff Accountant → the CFO-gated cards will be hidden automatically.
- **Follow-up chains** — every response ships 3 follow-ups, so you can demonstrate conversation depth by clicking through 3-4 rounds without typing.

---

**End of document.**
