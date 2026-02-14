# MEERU AI — Frontend Implementation Context for Claude CLI

## PROJECT OVERVIEW

You are building the frontend for **MeeruAI** — an AI-powered operations platform that helps businesses automate financial operations. The platform has **9 modules** (Revenue Assurance is split into two: one for IGRS government use and one for enterprise business use), **40+ pages**, and **110+ use cases**.

**Current State**: The UI is ~91% built (Next.js 13.5.1 + TypeScript + Tailwind + shadcn/ui + Radix). BUT all data is mock/hardcoded inside components. There are 24 API routes that are all mock or broken proxies. No real database, no real auth.

**Your Goal**: Make every feature work end-to-end using **JSON data files** as the data source, with a **switchable data service layer** so we can later swap JSON for real API calls by changing one environment variable.

---

## TWO REVENUE ASSURANCE MODULES — KEY DISTINCTION

The platform has **two separate Revenue Assurance modules** with different domains, data models, and use cases:

### 1. IGRS Revenue Assurance (Government — Property Registration)
- **Domain**: Inspector General of Registration & Stamps, Government of Andhra Pradesh
- **Users**: Government auditors, revenue analysts, district collectors, SRO inspectors
- **What it does**: Scans property registration documents to detect revenue leakage — gaps between stamp duty payable vs paid, challan delays, prohibited land transactions, market value undervaluation, fake exemptions
- **Data entities**: SRO Offices, Registration Documents, Stamp Duty, Challan, Market Values, Exemptions, Prohibited Land records
- **Route prefix**: `/igrs/revenue-assurance/`
- **Sidebar section**: "IGRS" with sub-nav

### 2. MeeruAI Revenue Assurance (Enterprise — Business Revenue)
- **Domain**: Enterprise businesses (SaaS, manufacturing, services, retail)
- **Users**: Revenue operations analysts, finance controllers, billing managers, CFOs
- **What it does**: Detects revenue leakage across business operations — billing errors, contract non-compliance, pricing discrepancies, discount abuse, subscription churn leakage, unbilled services, revenue recognition anomalies
- **Data entities**: Customers, Contracts, Invoices, Subscriptions, Pricing Rules, Discounts, Products/Services
- **Route prefix**: `/revenue-assurance/`
- **Sidebar section**: "Revenue Assurance" under main nav

Both modules share the same **visual design language** (dashboard layout, case management, rules engine, AI chat) but have completely different data schemas, use cases, KPIs, and business logic.

---

## CRITICAL ARCHITECTURE: SWITCHABLE DATA LAYER

### Pattern (MUST follow this for ALL data access)

```
UI Components → React Hooks → Data Service Layer → JSON Provider OR API Provider
```

### How it works

1. **Environment Variable**: `NEXT_PUBLIC_DATA_SOURCE = "json"` (default) or `"api"`
2. **Data Service Layer** (`lib/data/data-service.ts`): Exports all data functions. Internally checks env var and delegates.
3. **JSON Provider** (`lib/data/providers/json-provider.ts`): Reads from `/public/data/*.json`. Handles filtering, sorting, pagination in-memory. Simulates mutations by updating in-memory state (persists during session via module-level variables).
4. **API Provider** (`lib/data/providers/api-provider.ts`): Makes fetch() calls to real API endpoints. For now, can be a skeleton with the same function signatures that throws "API not configured" errors.
5. **React Hooks** (`hooks/use-*.ts`): Call data service functions. Manage loading/error/data states. Components ONLY use hooks.
6. **UI Components**: Call hooks ONLY. NEVER import JSON directly. NEVER call fetch() directly.

### Data Service Interface Example

```typescript
// lib/data/data-service.ts
import { jsonProvider } from './providers/json-provider';
import { apiProvider } from './providers/api-provider';

const getProvider = () => {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === 'api' ? apiProvider : jsonProvider;
};

// IGRS Revenue Assurance
export const igrsRevenue = {
  cases: {
    getAll: (filters?: IGRSCaseFilters) => getProvider().igrsRevenue.cases.getAll(filters),
    getById: (id: string) => getProvider().igrsRevenue.cases.getById(id),
    update: (id: string, data: Partial<IGRSCase>) => getProvider().igrsRevenue.cases.update(id, data),
    create: (data: CreateIGRSCaseInput) => getProvider().igrsRevenue.cases.create(data),
    getDashboardKPIs: () => getProvider().igrsRevenue.cases.getDashboardKPIs(),
  },
  rules: { /* ... */ },
  signals: { /* ... */ },
  sroOffices: { /* ... */ },
};

// MeeruAI Revenue Assurance (Enterprise)
export const revenueAssurance = {
  cases: {
    getAll: (filters?: RevenueCaseFilters) => getProvider().revenueAssurance.cases.getAll(filters),
    getById: (id: string) => getProvider().revenueAssurance.cases.getById(id),
    update: (id: string, data: Partial<RevenueCase>) => getProvider().revenueAssurance.cases.update(id, data),
    create: (data: CreateRevenueCaseInput) => getProvider().revenueAssurance.cases.create(data),
    getDashboardKPIs: () => getProvider().revenueAssurance.cases.getDashboardKPIs(),
  },
  rules: { /* ... */ },
  leakageCategories: { /* ... */ },
  customers: { /* ... */ },
};

// Cash Application, Reports, etc. follow same pattern
export const cashApplication = { /* ... */ };
export const reports = { /* ... */ };
```

### JSON Provider Mutation Pattern

For create/update/delete operations in JSON mode, the provider loads JSON once into a module-level variable, then mutates that in-memory copy. This gives us working CRUD during a session:

```typescript
// lib/data/providers/json-provider.ts
import igrsCasesData from '@/public/data/igrs/cases.json';

let igrsCases = [...igrsCasesData]; // Mutable in-memory copy

export const jsonProvider = {
  igrsRevenue: {
    cases: {
      getAll: async (filters) => {
        let result = [...igrsCases];
        if (filters?.status) result = result.filter(c => c.status === filters.status);
        if (filters?.search) result = result.filter(c =>
          c.id.includes(filters.search) || c.documentNumber.includes(filters.search)
        );
        return { data: result, total: result.length };
      },
      update: async (id, data) => {
        const idx = igrsCases.findIndex(c => c.id === id);
        if (idx !== -1) igrsCases[idx] = { ...igrsCases[idx], ...data, updatedAt: new Date().toISOString() };
        return igrsCases[idx];
      },
      create: async (input) => {
        const newCase = { id: `RL-${Date.now()}`, ...input, createdAt: new Date().toISOString() };
        igrsCases.unshift(newCase);
        return newCase;
      },
    }
  },
  revenueAssurance: {
    // Same pattern for enterprise revenue cases
  }
};
```

### React Hook Pattern

```typescript
// hooks/use-igrs-cases.ts
import { useState, useEffect, useCallback } from 'react';
import { igrsRevenue } from '@/lib/data/data-service';

export function useIGRSCases(filters?: IGRSCaseFilters) {
  const [data, setData] = useState<IGRSCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await igrsRevenue.cases.getAll(filters);
      setData(result.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateCase = async (id: string, updates: Partial<IGRSCase>) => {
    const updated = await igrsRevenue.cases.update(id, updates);
    setData(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  return { cases: data, loading, error, refetch: fetch, updateCase };
}
```

---

## JSON DATA FILES — FOLDER STRUCTURE

```
/public/data/
├── igrs/                        # IGRS Revenue Assurance (Government)
│   ├── cases.json               # 50-100 property registration leakage cases
│   ├── rules.json               # 20-30 IGRS-specific detection rules
│   ├── signals.json             # 200-500 signal instances
│   ├── sro-offices.json         # 20-40 Sub-Registrar offices
│   ├── dashboard-kpis.json      # Pre-computed KPIs
│   ├── trends.json              # 12-24 months of gap trends
│   ├── patterns.json            # 10-20 detected patterns
│   ├── mv-hotspots.json         # 50-100 market value geographic data
│   ├── exports.json             # 10-20 export records
│   └── settings.json            # IGRS system configuration
├── revenue/                     # MeeruAI Revenue Assurance (Enterprise)
│   ├── cases.json               # 50-100 enterprise revenue leakage cases
│   ├── rules.json               # 20-30 business detection rules
│   ├── leakage-signals.json     # 200-500 signal instances
│   ├── customers.json           # 30-50 customer profiles
│   ├── contracts.json           # 40-60 contracts
│   ├── dashboard-kpis.json      # Pre-computed enterprise KPIs
│   ├── trends.json              # 12-24 months leakage trends
│   ├── patterns.json            # 10-20 business patterns
│   ├── exports.json             # 10-20 export records
│   └── settings.json            # Enterprise configuration
├── cash/                        # Cash Application
│   ├── payments.json            # 100-200 payments
│   ├── remittances.json         # 50-100 remittances
│   ├── invoices.json            # 200-400 invoices
│   ├── match-results.json       # 150-300 AI match suggestions
│   ├── exceptions.json          # 30-50 exceptions
│   ├── bank-lines.json          # 200-500 bank statement lines
│   └── emails.json              # 20-50 remittance emails
├── reports/                     # Financial Reports
│   ├── balance-sheet.json
│   ├── income-statement.json
│   ├── trial-balance.json       # 150-200 accounts
│   ├── journal-entries.json     # 100-200 entries
│   └── flux-analysis.json       # 30-50 variances with AI explanations
├── close/
│   └── tasks.json               # 30-50 close tasks
├── recons/
│   └── reconciliations.json     # 10-20 reconciliations with run history
├── workspace/
│   ├── pins.json                # 5-15 pinned metrics
│   ├── watchlist.json           # 5-10 watchlist items
│   ├── activity-feed.json       # 50-100 activity events
│   └── templates.json           # 5-10 data templates
├── automation/
│   └── workflows.json           # 5-10 workflows with execution history
├── ai/
│   └── chat-sessions.json       # 10-20 AI conversation sessions
├── common/
│   ├── notifications.json       # 20-50 notifications
│   └── audit-log.json           # 100-200 audit entries
└── admin/
    └── users.json               # 5-15 users
```

Total: **37 JSON files**

---

## JSON SCHEMAS — IGRS REVENUE ASSURANCE

**`igrs/cases.json`** — Each case represents a property registration document with detected revenue leakage:
```typescript
interface IGRSCase {
  id: string;                    // "RL-2024-0001"
  documentNumber: string;        // "SR01/1/4421/2024" (SRO/book/serial/year)
  sroOfficeId: string;           // "SR01" → sro-offices.json
  sroOfficeName: string;         // "Chennai Central"
  district: string;
  registrationDate: string;
  documentType: string;          // "Sale Deed", "Gift Deed", "Mortgage Deed", "Lease Deed", "Partition Deed"
  executantName: string;         // Seller
  claimantName: string;          // Buyer
  propertyType: string;          // "Residential", "Agricultural", "Commercial", "Industrial"
  propertyDescription: string;
  surveyNumber: string;
  extentArea: string;            // "2400 sq ft", "1.5 acres"
  guidelineValue: number;        // Govt guideline value
  marketValue: number;           // Declared market value
  considerationValue: number;    // Transaction amount
  stampDutyPayable: number;
  stampDutyPaid: number;
  registrationFeePayable: number;
  registrationFeePaid: number;
  totalPayable: number;
  totalPaid: number;
  gapAmount: number;
  gapPercentage: number;
  challanNumber: string;
  challanDate: string;
  paymentDate: string;
  challanDelayDays: number;
  exemptionClaimed: boolean;
  exemptionType: string | null;  // "Government Transfer", "Family Partition", "SC/ST", "Agricultural"
  exemptionAmount: number;
  exemptionValid: boolean | null;
  isProhibitedLand: boolean;
  prohibitedLandType: string | null; // "Agricultural (Rural)", "Forest", "Government Land"
  signals: string[];
  signalDetails: { signalType: string; ruleId: string; description: string; impact: number; confidence: number; }[];
  riskLevel: "High" | "Medium" | "Low";
  confidenceScore: number;
  status: "New" | "In Review" | "Confirmed" | "Resolved" | "Dismissed";
  assignedTo: string | null;
  comments: { id: string; author: string; text: string; timestamp: string; }[];
  timeline: { id: string; action: string; actor: string; timestamp: string; details: string; }[];
  aiExplanation: string;
  suggestedActions: string[];
  relatedCaseIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

**`igrs/rules.json`**:
```typescript
interface IGRSRule {
  id: string;                    // "R-PAY-01"
  name: string;                  // "Paid < Payable"
  description: string;
  category: "Valuation" | "StampDuty" | "Exemption" | "Compliance" | "Operational" | "Systemic";
  signalType: "RevenueGap" | "ChallanDelay" | "ExemptionRisk" | "MarketValue" | "ProhibitedLand" | "DataIntegrity";
  condition: string;
  threshold: number | null;
  thresholdUnit: string | null;  // "INR", "percentage", "days"
  severity: "Critical" | "High" | "Medium" | "Low";
  isEnabled: boolean;
  triggerCount: number;
  lastTriggered: string | null;
  totalImpact: number;
  avgConfidence: number;
  falsePositiveRate: number;
  createdAt: string;
  updatedAt: string;
}
```

**`igrs/sro-offices.json`**:
```typescript
interface SROOffice {
  id: string; code: string; name: string; fullName: string;
  district: string; zone: string; state: string; address: string;
  latitude: number; longitude: number; registrar: string;
  totalDocuments: number; totalCases: number; totalGap: number;
  highRiskPercentage: number; avgChallanDelay: number;
  prohibitedLandMatches: number; performanceScore: number;
}
```

**`igrs/dashboard-kpis.json`**: Single object with totalPayable, totalPaid, totalGap (all in ₹), change %, highRiskCases, avgChallanDelay, awaitingReview, signal breakdowns, case funnel, highlights, top offices, top rules, system health.

**`igrs/trends.json`**: Array of { month, gap, payable, paid, rollingAvg, caseCount, documentCount }

**`igrs/patterns.json`**: Array of patterns like "Holiday Exploitation", "Benami Clustering" with affected cases, SROs, impact.

**`igrs/mv-hotspots.json`**: Geographic data with lat/lng, guideline vs declared values, undervaluation %.

**`igrs/settings.json`**: Stamp duty rates, registration fee slabs, prohibited land sources, thresholds.

---

## JSON SCHEMAS — MEERU AI REVENUE ASSURANCE (Enterprise)

**`revenue/cases.json`** — Each case represents a business revenue leakage:
```typescript
interface RevenueCase {
  id: string;                    // "RC-2024-0001"
  customerId: string;            // → customers.json
  customerName: string;
  contractId: string | null;     // → contracts.json
  contractName: string | null;
  leakageCategory: "Billing Error" | "Pricing Discrepancy" | "Discount Abuse" | "Contract Non-Compliance" | "Unbilled Services" | "Subscription Churn" | "Revenue Recognition" | "Commission Error" | "Duplicate Charge" | "Refund Anomaly";
  title: string;
  description: string;
  invoiceIds: string[];
  productService: string;
  expectedRevenue: number;
  actualRevenue: number;
  leakageAmount: number;
  leakagePercentage: number;
  recurrenceRisk: "One-time" | "Recurring" | "Systemic";
  affectedPeriod: string;
  signals: string[];
  signalDetails: { signalType: string; ruleId: string; description: string; impact: number; confidence: number; }[];
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  confidenceScore: number;
  status: "Detected" | "Under Investigation" | "Confirmed" | "Recovery In Progress" | "Recovered" | "Written Off" | "False Positive";
  assignedTo: string | null;
  assignedTeam: string | null;
  recoveryAmount: number | null;
  recoveryDate: string | null;
  rootCause: string | null;
  preventiveAction: string | null;
  comments: { id: string; author: string; text: string; timestamp: string; }[];
  timeline: { id: string; action: string; actor: string; timestamp: string; details: string; }[];
  aiExplanation: string;
  suggestedActions: string[];
  relatedCaseIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

**`revenue/rules.json`**:
```typescript
interface RevenueRule {
  id: string;                    // "BIZ-PRICE-01"
  name: string;                  // "Price Increase Not Applied"
  description: string;
  category: "Pricing" | "Billing" | "Contract" | "Discount" | "Subscription" | "Commission" | "Recognition" | "Compliance";
  signalType: "PricingMismatch" | "BillingError" | "ContractBreach" | "DiscountAnomaly" | "ChurnRisk" | "VolumeAnomaly" | "RecognitionGap" | "CommissionError";
  condition: string;
  threshold: number | null;
  thresholdUnit: string | null;
  severity: "Critical" | "High" | "Medium" | "Low";
  isEnabled: boolean;
  triggerCount: number;
  lastTriggered: string | null;
  totalImpact: number;
  avgConfidence: number;
  falsePositiveRate: number;
  createdAt: string;
  updatedAt: string;
}
```

**`revenue/customers.json`**:
```typescript
interface Customer {
  id: string; name: string; industry: string;
  tier: "Enterprise" | "Mid-Market" | "SMB";
  accountManager: string; annualRevenue: number;
  contractCount: number; activeSubscriptions: number;
  totalLeakage: number; openCases: number;
  riskScore: number; region: string; since: string;
}
```

**`revenue/contracts.json`**:
```typescript
interface Contract {
  id: string; customerId: string; customerName: string;
  name: string; type: "Subscription" | "License" | "Services" | "Maintenance" | "Usage-Based";
  status: "Active" | "Expiring" | "Expired" | "Renewed" | "Cancelled";
  startDate: string; endDate: string; totalValue: number; annualValue: number;
  products: { name: string; quantity: number; unitPrice: number; total: number; }[];
  discounts: { type: string; amount: number; reason: string; approvedBy: string; }[];
  billingFrequency: "Monthly" | "Quarterly" | "Annually";
  priceEscalation: number | null;
  complianceScore: number;
}
```

**`revenue/dashboard-kpis.json`**: totalExpectedRevenue, totalActualRevenue, totalLeakage, activeLeakageCases, totalRecovered, recoveryRate, leakageByCategory, leakageByCustomerTier, leakageTrend, topCustomers, topRules, caseFunnel, highlights, systemHealth.

Remaining revenue/ files follow same patterns as IGRS equivalents but with business terminology.

---

## JSON SCHEMAS — OTHER MODULES (Cash, Reports, Close, Recons, Workspace, Automation, AI, Common, Admin)

These are identical to the schemas already defined above in the switchable data layer section. Key files:

- **cash/**: payments, remittances, invoices, match-results, exceptions, bank-lines, emails
- **reports/**: balance-sheet (hierarchical), income-statement, trial-balance, journal-entries, flux-analysis
- **close/tasks.json**: tasks with phase, dependencies, compliance status
- **recons/reconciliations.json**: recons with matching rules and run history
- **workspace/**: pins, watchlist, activity-feed, templates
- **automation/workflows.json**: visual workflows with execution history
- **ai/chat-sessions.json**: conversation history
- **common/**: notifications, audit-log
- **admin/users.json**: user accounts

(Full TypeScript interfaces for each are provided in the data layer section above)

---

## USE CASES — IGRS REVENUE ASSURANCE (27 use cases, prefix UC-I)

**Page: /igrs/revenue-assurance/overview**
- UC-I1: View 6 KPI cards (Total Payable ₹, Total Paid ₹, Total Gap ₹, High Risk Cases, Avg Challan Delay, Awaiting Review) with change % and sparklines
- UC-I2: Gap Trend Over Time line chart (monthly gap vs payable with rolling average)
- UC-I3: Leakage by Signal stacked bar (Revenue, Challan, Exemption, Market, Prohibited, Data by risk) + Impact Share donut
- UC-I4: Top 10 Offices by Gap table (SRO code+name, gap ₹, cases, high%, delay, prohibited)
- UC-I5: Top Rules Triggered table (rule ID+name, triggers, impact ₹, confidence bars)
- UC-I6: Newest High Risk Cases table (case ID, document, signal badges, confidence %, gap ₹, action)
- UC-I7: Case Status Funnel (New→In Review→Confirmed→Resolved with counts/%)
- UC-I8: AI Highlights section (6 insight cards)
- UC-I9: Currency toggle (Auto/₹/Lakhs/Crores)
- UC-I10: Filters (date, SRO, district, signal, risk)
- UC-I11: Run Detection button with progress
- UC-I12: + Create Case form (document number, SRO, property, signals)
- UC-I13: System health (Sync, last run, doc count, Rules Health)

**Page: /igrs/revenue-assurance/cases**
- UC-I14: Browse with IGRS filters (SRO, district, doc type, property type, exemption, signal, status, risk)
- UC-I15: Search by case ID, document number, party name, survey number
- UC-I16: Case detail (registration info, stamp duty breakdown, challan, exemption, prohibited land, AI explanation, timeline, comments)
- UC-I17: AI Explainability panel
- UC-I18: Change status with audit trail
- UC-I19: Add investigation notes
- UC-I20: Bulk operations
- UC-I21: Export CSV/Excel

**Page: /igrs/revenue-assurance/rules**
- UC-I22: Rules by IGRS categories
- UC-I23: Create IGRS-specific rule
- UC-I24: Edit thresholds
- UC-I25: Toggle enabled/disabled
- UC-I26: Rule performance metrics
- UC-I27: Dry-run against historical docs

**Pages: insights, ai-chat, mv-trends, patterns, admin, settings, exports** — see navigation structure for details

---

## USE CASES — MEERU AI REVENUE ASSURANCE (25 use cases, prefix UC-R)

**Page: /revenue-assurance/overview**
- UC-R1: 6 KPI cards (Expected Revenue $, Actual Revenue $, Total Leakage $, Active Cases, Recovered $, Recovery Rate %)
- UC-R2: Leakage Trend (monthly detected vs recovered vs net)
- UC-R3: Leakage by Category (Billing, Pricing, Discount, Contract, Unbilled, Churn, Recognition, Commission)
- UC-R4: Leakage by Customer Tier
- UC-R5: Top Customers by Leakage table
- UC-R6: Top Rules Triggered
- UC-R7: Case Pipeline funnel (Detected→Investigation→Confirmed→Recovery→Recovered)
- UC-R8: AI Highlights
- UC-R9: Filters (date, customer, category, product, contract, team)
- UC-R10: Run Scan button
- UC-R11: + Create Case (customer, contract, category, amount)

**Page: /revenue-assurance/cases**
- UC-R12: Browse with business filters (customer, category, contract, product, team, status, risk, recurrence)
- UC-R13: Search by case ID, customer, invoice, contract
- UC-R14: Case detail (customer/contract info, leakage calc, invoices, root cause, AI explanation, recovery tracking)
- UC-R15: AI Explanation (business context)
- UC-R16: Status lifecycle (Detected→Investigation→Confirmed→Recovery→Recovered/Written Off/False Positive)
- UC-R17: Log recovery actions
- UC-R18: Record root cause and preventive action
- UC-R19: Bulk operations
- UC-R20: Export

**Page: /revenue-assurance/rules**
- UC-R21: Rules by business categories
- UC-R22: Create business rules
- UC-R23: Edit and toggle
- UC-R24: Performance metrics
- UC-R25: Test against historical data

**Pages: customers, contracts, insights, ai-chat, patterns, exports, settings**

---

## USE CASES — CASH APPLICATION (16 use cases, prefix UC-C)

- UC-C1: View payments (paginated, status, confidence)
- UC-C2: Payment detail (bank info, invoices, JE, attachments)
- UC-C3: Submit journal entry
- UC-C4: Compose email
- UC-C5: Upload documents
- UC-C6: View remittances
- UC-C7: AI extraction review
- UC-C8: Email inbox processing
- UC-C9: AI extract from attachments
- UC-C10: Matching studio split-screen
- UC-C11: Accept/reject matches
- UC-C12: Manual drag-and-drop matching
- UC-C13: Partial payment allocation
- UC-C14: Exception queue (assign/resolve/escalate)
- UC-C15: Bank reconciliation side-by-side
- UC-C16: Cash app reports and metrics

---

## USE CASES — FINANCIAL REPORTS (9 use cases, prefix UC-F)

- UC-F1: Balance Sheet hierarchical view
- UC-F2: Drill-down category→account→transactions
- UC-F3: Period comparison
- UC-F4: Income Statement with budget variance
- UC-F5: Trial Balance
- UC-F6: Account Activity with running balance
- UC-F7: Flux Analysis
- UC-F8: AI variance explanations
- UC-F9: One-Click Variance auto-detect

---

## USE CASES — CLOSE MANAGEMENT (6), RECONCILIATIONS (5), WORKSPACE (10), AUTONOMY (5), ADMIN (12)

**Close Management** (UC-CL1 to CL6): Checklist by phase, mark complete, progress dashboard, worklist, compliance, history comparison

**Reconciliations** (UC-RE1 to RE5): List, create, run with progress, drill unmatched, history trends

**Workspace** (UC-W1 to W10): My Workspace, metric cards, live pins, pin refresh, watchlist, breach alerts, data templates, schedule runs, AI chat, AI suggestions

**Autonomy Studio** (UC-A1 to A5): Visual workflow builder, prompt builder, SOP parsing, execute, history

**Admin & Platform** (UC-P1 to P12): Login, session, logout, notifications (bell/dropdown/types), audit log, user management, global search, sidebar navigation, table exports, user profile

---

## NAVIGATION STRUCTURE

```
HOME
  ├── My Workspace
  ├── Live Pins
  ├── Watchlist
  ├── Data Templates
  └── Command Center (AI Chat)

IGRS
  └── Revenue Assurance
       ├── Overview
       ├── Cases
       ├── Rules
       ├── Insights
       ├── AI Chat
       ├── MV Trends
       ├── Patterns
       ├── Admin
       ├── Settings
       └── Exports

REVENUE ASSURANCE
  ├── Overview
  ├── Cases
  ├── Rules
  ├── Customers
  ├── Contracts
  ├── Insights
  ├── AI Chat
  ├── Patterns
  ├── Exports
  └── Settings

CASH APPLICATION
  ├── Payments
  ├── Remittances (List + Email Inbox)
  ├── Matching Studio
  ├── Exceptions
  ├── Bank Reconciliation
  └── Reports

REPORTS
  ├── Balance Sheet
  ├── Income Statement
  ├── Trial Balance
  ├── Account Activity
  ├── Flux Analysis
  └── One-Click Variance

CLOSE MANAGEMENT

RECONCILIATIONS

AUTOMATION (Autonomy Studio)

ADMIN (Users, Audit Log, Settings)
```

---

## IMPLEMENTATION INSTRUCTIONS

### Order of Implementation

1. **Data Layer**: data-service.ts, json-provider.ts, api-provider.ts (skeleton), all TypeScript interfaces
2. **JSON Files**: All 37 files with realistic interconnected data
3. **React Hooks**: Hooks for every data domain
4. **Modules** (in order):
   - IGRS Revenue Assurance (most complete in existing UI)
   - MeeruAI Revenue Assurance (reuse IGRS patterns with business data/terminology)
   - Cash Application
   - Reports
   - Close Management
   - Reconciliations
   - Workspace
   - Autonomy Studio
   - Admin & Platform

### Key Rules

1. **NEVER** hardcode data in components — all through hooks → data service → provider
2. **NEVER** call fetch() directly in components
3. **ALL** mutations work in JSON mode via in-memory copies
4. **ALL** tables: sorting, filtering, pagination, search, CSV/Excel export
5. **ALL** forms: validation with error messages
6. **ALL** pages: loading states, error states, empty states
7. Cross-reference IDs consistent across JSON files
8. **IGRS module**: ₹ (INR), Lakhs/Crores formatting, government terminology
9. **Enterprise module**: $ (USD), standard formatting, business terminology
10. Both Revenue modules share visual design but have distinct data, KPIs, terminology
11. Use existing shadcn/ui components and design system
12. TypeScript strict mode — all data properly typed

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_DATA_SOURCE=json
NEXT_PUBLIC_APP_NAME=MeeruAI
NEXT_PUBLIC_APP_VERSION=1.0.0

# When backend is ready:
# NEXT_PUBLIC_DATA_SOURCE=api
# NEXT_PUBLIC_API_BASE_URL=https://api.meeru.ai
```
