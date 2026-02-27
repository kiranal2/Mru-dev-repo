/**
 * JSON Data Provider — loads data from /public/data/*.json files.
 * Maintains mutable in-memory copies for session mutations.
 * Implements filtering, sorting, pagination, and search in pure JS.
 */

import type {
  IGRSCase, IGRSRule, SROOffice, IGRSDashboardKPIs, IGRSTrend,
  IGRSPattern, MVHotspot, IGRSSettings, IGRSExport, IGRSSignal,
  CashReconciliationRecord, StampInventoryRecord,
  StampVendorAnalysis, MVGrowthAttribution, MVRevisionComparison, MVAnomaliesData,
  PredictiveForecastingData, DocumentRiskScoringData, SROIntegrityIndexData, PromptEngineData, WeblandVerificationData,
  RevenueCase, RevenueRule, Customer, Contract, RevenueDashboardKPIs,
  RevenueTrend, RevenuePattern, RevenueExport, RevenueSettings, RevenueSignal,
  CashPayment, CashRemittance, CashInvoice, CashMatchResult, CashException,
  CashBankLine, CashRemittanceEmail,
  BalanceSheetNode, IncomeStatementLine, TrialBalanceAccount, JournalEntry, FluxVariance,
  CloseTask, Reconciliation, ReconRun,
  Pin, WatchlistItem, ActivityEvent, DataTemplate,
  Workflow, WorkflowExecution,
  MrpSignal, MrpSupplier, MrpSeverityCounts, MrpGroupedCounts, MrpMetrics, MrpSignalFilters,
  Notification, AuditEntry, User, ChatSession,
  MerchantAccount, MerchantInvoice, MerchantPayment, MerchantDispute,
  MerchantCreditMemo, MerchantPaymentMethod, MerchantNotification, MerchantContact,
  CollectionRecord, Customer360, DunningSequence, DunningTemplate,
  PromiseToPay, Correspondence,
  IGRSCaseFilters, RevenueCaseFilters, PaymentFilters, RemittanceFilters,
  ExceptionFilters, CloseTaskFilters, ReconFilters, AuditFilters,
  MerchantInvoiceFilters, CollectionFilters, DunningFilters,
  PaginatedResult, BaseFilters,
} from '../types';

// ─── In-memory data store ─────────────────────────────────────────────────────

const cache: Record<string, unknown> = {};

async function loadJson<T>(path: string): Promise<T> {
  if (cache[path] !== undefined) return cache[path] as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = await res.json();
  cache[path] = data;
  return data as T;
}

// Deep clone helper for mutation safety
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Generic filtering/sorting/pagination ──────────────────────────────────────

function applySearch<T extends Record<string, unknown>>(items: T[], search?: string): T[] {
  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter((item) =>
    Object.values(item).some((val) =>
      String(val ?? '').toLowerCase().includes(lower)
    )
  );
}

function applyArrayFilter<T>(items: T[], field: keyof T, values?: string[]): T[] {
  if (!values || values.length === 0) return items;
  return items.filter((item) => values.includes(String(item[field])));
}

function applySort<T>(items: T[], sortBy?: string, sortOrder?: 'asc' | 'desc'): T[] {
  if (!sortBy) return items;
  const dir = sortOrder === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortBy];
    const bVal = (b as Record<string, unknown>)[sortBy];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
    return String(aVal).localeCompare(String(bVal)) * dir;
  });
}

function applyPagination<T>(items: T[], page?: number, pageSize?: number): PaginatedResult<T> {
  const p = page ?? 1;
  const ps = pageSize ?? items.length;
  const total = items.length;
  const totalPages = Math.ceil(total / ps);
  const start = (p - 1) * ps;
  return {
    data: items.slice(start, start + ps),
    total,
    page: p,
    pageSize: ps,
    totalPages,
  };
}

// ─── IGRS Revenue Assurance ────────────────────────────────────────────────────

let igrsCases: IGRSCase[] | null = null;

async function getIGRSCases(): Promise<IGRSCase[]> {
  if (!igrsCases) igrsCases = clone(await loadJson<IGRSCase[]>('/data/igrs/cases.json'));
  return igrsCases;
}

export const igrsRevenue = {
  async getCases(filters?: IGRSCaseFilters): Promise<PaginatedResult<IGRSCase>> {
    let items = await getIGRSCases();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as IGRSCase[];
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applyArrayFilter(items, 'riskLevel', filters?.riskLevel);
    if (filters?.signals?.length) {
      items = items.filter(c => c.leakageSignals.some(s => filters.signals!.includes(s)));
    }
    if (filters?.office?.length) {
      items = items.filter(c => filters.office!.includes(c.office.srCode));
    }
    if (filters?.assignedTo) {
      items = items.filter(c => c.assignedTo === filters.assignedTo);
    }
    if (filters?.minGap != null) items = items.filter(c => c.gapInr >= filters.minGap!);
    if (filters?.maxGap != null) items = items.filter(c => c.gapInr <= filters.maxGap!);
    items = applySort(items, filters?.sortBy ?? 'createdAt', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getCase(id: string): Promise<IGRSCase | undefined> {
    const items = await getIGRSCases();
    return items.find(c => c.id === id);
  },

  async createCase(data: Partial<IGRSCase>): Promise<IGRSCase> {
    const items = await getIGRSCases();
    const newCase: IGRSCase = {
      id: `IGRS-${Date.now()}`,
      caseId: `IGRS-${Date.now()}`,
      documentKey: { srCode: '', bookNo: '', doctNo: '', regYear: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskLevel: 'Medium',
      riskScore: 50,
      confidence: 60,
      status: 'New',
      assignedTo: null,
      leakageSignals: [],
      impactAmountInr: 0,
      payableTotalInr: 0,
      paidTotalInr: 0,
      gapInr: 0,
      office: { srCode: '', srName: '', district: '', zone: '' },
      docType: { tranMajCode: '', tranMinCode: '', tranDesc: '', abDesc: '' },
      dates: { pDate: '', eDate: '', rDate: '' },
      propertySummary: { isUrban: false, extent: '', unit: '' },
      partiesSummary: [],
      payableBreakdown: { sdPayable: 0, tdPayable: 0, rfPayable: 0, dsdPayable: 0, otherFee: 0, finalTaxableValue: 0 },
      evidence: { triggeredRules: [], receiptCount: 0, prohibitedMatchCount: 0, mvDeviationPct: 0, exemptionCount: 0 },
      notes: [],
      activityLog: [{ id: `log-${Date.now()}`, ts: new Date().toISOString(), actor: 'User', action: 'Case created', detail: 'Manual creation' }],
      ...data,
    };
    items.unshift(newCase);
    return newCase;
  },

  async updateCase(id: string, updates: Partial<IGRSCase>): Promise<IGRSCase | undefined> {
    const items = await getIGRSCases();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async deleteCase(id: string): Promise<boolean> {
    const items = await getIGRSCases();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },

  async getRules(): Promise<IGRSRule[]> {
    return loadJson<IGRSRule[]>('/data/igrs/rules.json');
  },

  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const rules = await this.getRules();
    const rule = rules.find(r => r.ruleId === ruleId);
    if (rule) rule.enabled = enabled;
  },

  async getSignals(caseId?: string): Promise<IGRSSignal[]> {
    const signals = await loadJson<IGRSSignal[]>('/data/igrs/signals.json');
    if (caseId) return signals.filter(s => s.caseId === caseId);
    return signals;
  },

  async getOffices(): Promise<SROOffice[]> {
    return loadJson<SROOffice[]>('/data/igrs/sro-offices.json');
  },

  async getDashboardKPIs(): Promise<IGRSDashboardKPIs> {
    return loadJson<IGRSDashboardKPIs>('/data/igrs/dashboard-kpis.json');
  },

  async getTrends(): Promise<IGRSTrend[]> {
    return loadJson<IGRSTrend[]>('/data/igrs/trends.json');
  },

  async getPatterns(): Promise<IGRSPattern[]> {
    return loadJson<IGRSPattern[]>('/data/igrs/patterns.json');
  },

  async getMvHotspots(): Promise<MVHotspot[]> {
    return loadJson<MVHotspot[]>('/data/igrs/mv-hotspots.json');
  },

  async getExports(): Promise<IGRSExport[]> {
    return loadJson<IGRSExport[]>('/data/igrs/exports.json');
  },

  async getSettings(): Promise<IGRSSettings> {
    return loadJson<IGRSSettings>('/data/igrs/settings.json');
  },

  async getCashReconciliation(srCode?: string): Promise<CashReconciliationRecord[]> {
    const records = await loadJson<CashReconciliationRecord[]>('/data/igrs/cash-reconciliation.json');
    if (srCode) return records.filter(r => r.srCode === srCode);
    return records;
  },

  async getStampInventory(srCode?: string): Promise<StampInventoryRecord[]> {
    const records = await loadJson<StampInventoryRecord[]>('/data/igrs/stamp-inventory.json');
    if (srCode) return records.filter(r => r.srCode === srCode);
    return records;
  },

  async getStampVendorAnalysis(): Promise<StampVendorAnalysis> {
    return loadJson<StampVendorAnalysis>('/data/igrs/stamp-vendor-analysis.json');
  },

  async getMVGrowthAttribution(): Promise<MVGrowthAttribution> {
    return loadJson<MVGrowthAttribution>('/data/igrs/mv-growth-attribution.json');
  },

  async getMVRevisionComparison(): Promise<MVRevisionComparison> {
    return loadJson<MVRevisionComparison>('/data/igrs/mv-revision-comparison.json');
  },

  async getMVAnomalies(): Promise<MVAnomaliesData> {
    return loadJson<MVAnomaliesData>('/data/igrs/mv-anomalies.json');
  },

  async getAIPredictiveForecasting(): Promise<PredictiveForecastingData> {
    return loadJson<PredictiveForecastingData>('/data/igrs/ai-predictive-forecasting.json');
  },

  async getAIRiskScoring(): Promise<DocumentRiskScoringData> {
    return loadJson<DocumentRiskScoringData>('/data/igrs/ai-risk-scoring.json');
  },

  async getAISROIntegrity(): Promise<SROIntegrityIndexData> {
    return loadJson<SROIntegrityIndexData>('/data/igrs/ai-sro-integrity.json');
  },

  async getAIPromptEngine(): Promise<PromptEngineData> {
    return loadJson<PromptEngineData>('/data/igrs/ai-prompt-engine.json');
  },

  async getGovernanceData(tab: string): Promise<unknown> {
    const fileMap: Record<string, string> = {
      'revenue-growth': 'governance-revenue-growth.json',
      'district-ranking': 'governance-district-ranking.json',
      'low-performing': 'governance-low-performers.json',
      'classification': 'governance-classification.json',
      'prohibited-property': 'governance-prohibited-property.json',
      'anywhere-registration': 'governance-anywhere-registration.json',
      'sla-monitoring': 'governance-sla-monitoring.json',
      'demographics': 'governance-demographics.json',
      'officer-accountability': 'governance-officer-accountability.json',
    };
    const file = fileMap[tab];
    if (!file) throw new Error(`Unknown governance tab: ${tab}`);
    return loadJson<unknown>(`/data/igrs/${file}`);
  },

  async getWeblandVerification(): Promise<WeblandVerificationData> {
    return loadJson<WeblandVerificationData>('/data/igrs/webland-verification.json');
  },
};

// ─── Enterprise Revenue Assurance ──────────────────────────────────────────────

let revenueCases: RevenueCase[] | null = null;

async function getRevenueCases(): Promise<RevenueCase[]> {
  if (!revenueCases) revenueCases = clone(await loadJson<RevenueCase[]>('/data/revenue/cases.json'));
  return revenueCases;
}

export const revenueAssurance = {
  async getCases(filters?: RevenueCaseFilters): Promise<PaginatedResult<RevenueCase>> {
    let items = await getRevenueCases();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as RevenueCase[];
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applyArrayFilter(items, 'riskLevel', filters?.riskLevel);
    items = applyArrayFilter(items, 'category', filters?.category);
    if (filters?.customerId) items = items.filter(c => c.customerId === filters.customerId);
    items = applyArrayFilter(items, 'customerTier', filters?.customerTier);
    if (filters?.assignedTo) items = items.filter(c => c.assignedTo === filters.assignedTo);
    if (filters?.minAmount != null) items = items.filter(c => c.leakageAmountUsd >= filters.minAmount!);
    if (filters?.maxAmount != null) items = items.filter(c => c.leakageAmountUsd <= filters.maxAmount!);
    items = applySort(items, filters?.sortBy ?? 'createdAt', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getCase(id: string): Promise<RevenueCase | undefined> {
    const items = await getRevenueCases();
    return items.find(c => c.id === id);
  },

  async createCase(data: Partial<RevenueCase>): Promise<RevenueCase> {
    const items = await getRevenueCases();
    const newCase: RevenueCase = {
      id: `REV-${Date.now()}`,
      caseNumber: `REV-${Date.now()}`,
      title: '',
      description: '',
      category: 'Billing',
      status: 'Open',
      riskLevel: 'Medium',
      riskScore: 50,
      customerId: '',
      customerName: '',
      customerTier: 'Mid-Market',
      leakageAmountUsd: 0,
      recoveredAmountUsd: 0,
      recurrenceFlag: false,
      detectedAt: new Date().toISOString(),
      assignedTo: null,
      assignedTeam: '',
      relatedInvoices: [],
      relatedProducts: [],
      tags: [],
      notes: [],
      activityLog: [{ id: `log-${Date.now()}`, ts: new Date().toISOString(), actor: 'User', action: 'Case created', detail: 'Manual creation' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.unshift(newCase);
    return newCase;
  },

  async updateCase(id: string, updates: Partial<RevenueCase>): Promise<RevenueCase | undefined> {
    const items = await getRevenueCases();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async deleteCase(id: string): Promise<boolean> {
    const items = await getRevenueCases();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },

  async getRules(): Promise<RevenueRule[]> {
    return loadJson<RevenueRule[]>('/data/revenue/rules.json');
  },

  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const rules = await this.getRules();
    const rule = rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = enabled;
  },

  async getSignals(caseId?: string): Promise<RevenueSignal[]> {
    const signals = await loadJson<RevenueSignal[]>('/data/revenue/leakage-signals.json');
    if (caseId) return signals.filter(s => s.caseId === caseId);
    return signals;
  },

  async getCustomers(): Promise<Customer[]> {
    return loadJson<Customer[]>('/data/revenue/customers.json');
  },

  async getCustomer(id: string): Promise<Customer | undefined> {
    const customers = await this.getCustomers();
    return customers.find(c => c.id === id);
  },

  async getContracts(customerId?: string): Promise<Contract[]> {
    const contracts = await loadJson<Contract[]>('/data/revenue/contracts.json');
    if (customerId) return contracts.filter(c => c.customerId === customerId);
    return contracts;
  },

  async getDashboardKPIs(): Promise<RevenueDashboardKPIs> {
    return loadJson<RevenueDashboardKPIs>('/data/revenue/dashboard-kpis.json');
  },

  async getTrends(): Promise<RevenueTrend[]> {
    return loadJson<RevenueTrend[]>('/data/revenue/trends.json');
  },

  async getPatterns(): Promise<RevenuePattern[]> {
    return loadJson<RevenuePattern[]>('/data/revenue/patterns.json');
  },

  async getExports(): Promise<RevenueExport[]> {
    return loadJson<RevenueExport[]>('/data/revenue/exports.json');
  },

  async getSettings(): Promise<RevenueSettings> {
    return loadJson<RevenueSettings>('/data/revenue/settings.json');
  },
};

// ─── Cash Application ──────────────────────────────────────────────────────────

let cashPayments: CashPayment[] | null = null;

async function getCashPayments(): Promise<CashPayment[]> {
  if (!cashPayments) cashPayments = clone(await loadJson<CashPayment[]>('/data/cash/payments.json'));
  return cashPayments;
}

let cashMatchResults: CashMatchResult[] | null = null;

async function getCashMatchResults(): Promise<CashMatchResult[]> {
  if (!cashMatchResults) cashMatchResults = clone(await loadJson<CashMatchResult[]>('/data/cash/match-results.json'));
  return cashMatchResults;
}

let cashExceptions: CashException[] | null = null;

async function getCashExceptions(): Promise<CashException[]> {
  if (!cashExceptions) cashExceptions = clone(await loadJson<CashException[]>('/data/cash/exceptions.json'));
  return cashExceptions;
}

export const cashApplication = {
  async getPayments(filters?: PaymentFilters): Promise<PaginatedResult<CashPayment>> {
    let items = await getCashPayments();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as CashPayment[];
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applyArrayFilter(items, 'method', filters?.method);
    if (filters?.customerName) {
      const lower = filters.customerName.toLowerCase();
      items = items.filter(p => p.customerName.toLowerCase().includes(lower));
    }
    if (filters?.minAmount != null) items = items.filter(p => p.amount >= filters.minAmount!);
    if (filters?.maxAmount != null) items = items.filter(p => p.amount <= filters.maxAmount!);
    items = applySort(items, filters?.sortBy ?? 'date', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getPayment(id: string): Promise<CashPayment | undefined> {
    const items = await getCashPayments();
    return items.find(p => p.id === id);
  },

  async updatePayment(id: string, updates: Partial<CashPayment>): Promise<CashPayment | undefined> {
    const items = await getCashPayments();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async getRemittances(filters?: RemittanceFilters): Promise<PaginatedResult<CashRemittance>> {
    let items = await loadJson<CashRemittance[]>('/data/cash/remittances.json');
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as CashRemittance[];
    items = applyArrayFilter(items, 'source', filters?.source);
    items = applySort(items, filters?.sortBy ?? 'receivedDate', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getInvoices(): Promise<CashInvoice[]> {
    return loadJson<CashInvoice[]>('/data/cash/invoices.json');
  },

  async getMatchResults(paymentId?: string): Promise<CashMatchResult[]> {
    const items = await getCashMatchResults();
    if (paymentId) return items.filter(m => m.paymentId === paymentId);
    return items;
  },

  async updateMatchResult(id: string, updates: Partial<CashMatchResult>): Promise<CashMatchResult | undefined> {
    const items = await getCashMatchResults();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates };
    return items[idx];
  },

  async getExceptions(filters?: ExceptionFilters): Promise<PaginatedResult<CashException>> {
    let items = await getCashExceptions();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as CashException[];
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applySort(items, filters?.sortBy ?? 'createdAt', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async updateException(id: string, updates: Partial<CashException>): Promise<CashException | undefined> {
    const items = await getCashExceptions();
    const idx = items.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates };
    return items[idx];
  },

  async getBankLines(): Promise<CashBankLine[]> {
    return loadJson<CashBankLine[]>('/data/cash/bank-lines.json');
  },

  async getEmails(): Promise<CashRemittanceEmail[]> {
    return loadJson<CashRemittanceEmail[]>('/data/cash/emails.json');
  },
};

// ─── Reports ───────────────────────────────────────────────────────────────────

export const reports = {
  async getBalanceSheet(): Promise<BalanceSheetNode[]> {
    return loadJson<BalanceSheetNode[]>('/data/reports/balance-sheet.json');
  },

  async getIncomeStatement(): Promise<IncomeStatementLine[]> {
    return loadJson<IncomeStatementLine[]>('/data/reports/income-statement.json');
  },

  async getTrialBalance(): Promise<TrialBalanceAccount[]> {
    return loadJson<TrialBalanceAccount[]>('/data/reports/trial-balance.json');
  },

  async getJournalEntries(): Promise<JournalEntry[]> {
    return loadJson<JournalEntry[]>('/data/reports/journal-entries.json');
  },

  async getFluxAnalysis(): Promise<FluxVariance[]> {
    return loadJson<FluxVariance[]>('/data/reports/flux-analysis.json');
  },

  async getJournalEntriesForTask(taskId: string): Promise<JournalEntry[]> {
    const entries = await this.getJournalEntries();
    return entries.filter(e => e.relatedCloseTaskId === taskId);
  },
};

// ─── Close Management ──────────────────────────────────────────────────────────

let closeTasks: CloseTask[] | null = null;

async function getCloseTasks(): Promise<CloseTask[]> {
  if (!closeTasks) closeTasks = clone(await loadJson<CloseTask[]>('/data/close/tasks.json'));
  return closeTasks;
}

export const closeManagement = {
  async getTasks(filters?: CloseTaskFilters): Promise<PaginatedResult<CloseTask>> {
    let items = await getCloseTasks();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as CloseTask[];
    items = applyArrayFilter(items, 'phase', filters?.phase);
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applyArrayFilter(items, 'priority', filters?.priority);
    if (filters?.assignedTo) items = items.filter(t => t.assignedTo === filters.assignedTo);
    items = applySort(items, filters?.sortBy ?? 'dueDate', filters?.sortOrder ?? 'asc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async updateTask(id: string, updates: Partial<CloseTask>): Promise<CloseTask | undefined> {
    const items = await getCloseTasks();
    const idx = items.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async getTasksForJournalEntry(jeId: string): Promise<CloseTask[]> {
    const tasks = await getCloseTasks();
    return tasks.filter(t => t.linkedJournalEntryIds?.includes(jeId));
  },
};

// ─── Reconciliations ───────────────────────────────────────────────────────────

export const reconciliations = {
  async getReconciliations(filters?: ReconFilters): Promise<PaginatedResult<Reconciliation>> {
    let items = await loadJson<Reconciliation[]>('/data/recons/reconciliations.json');
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as Reconciliation[];
    items = applyArrayFilter(items, 'type', filters?.type);
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applySort(items, filters?.sortBy ?? 'periodEnd', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },
};

// ─── Workspace ─────────────────────────────────────────────────────────────────

let pins: Pin[] | null = null;
let watchlist: WatchlistItem[] | null = null;

async function getPins(): Promise<Pin[]> {
  if (!pins) pins = clone(await loadJson<Pin[]>('/data/workspace/pins.json'));
  return pins;
}

async function getWatchlist(): Promise<WatchlistItem[]> {
  if (!watchlist) watchlist = clone(await loadJson<WatchlistItem[]>('/data/workspace/watchlist.json'));
  return watchlist;
}

export const workspace = {
  async getPins(): Promise<Pin[]> {
    return getPins();
  },

  async addPin(pin: Partial<Pin>): Promise<Pin> {
    const items = await getPins();
    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      label: '',
      value: 0,
      format: 'number',
      source: '',
      module: '',
      lastRefreshed: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      order: items.length,
      ...pin,
    };
    items.push(newPin);
    return newPin;
  },

  async removePin(id: string): Promise<boolean> {
    const items = await getPins();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },

  async getWatchlist(): Promise<WatchlistItem[]> {
    return getWatchlist();
  },

  async addWatchlistItem(item: Partial<WatchlistItem>): Promise<WatchlistItem> {
    const items = await getWatchlist();
    const newItem: WatchlistItem = {
      id: `watch-${Date.now()}`,
      label: '',
      description: '',
      module: '',
      entityType: '',
      entityId: '',
      currentValue: 0,
      status: 'Normal',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...item,
    };
    items.push(newItem);
    return newItem;
  },

  async removeWatchlistItem(id: string): Promise<boolean> {
    const items = await getWatchlist();
    const idx = items.findIndex(w => w.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },

  async getActivityFeed(): Promise<ActivityEvent[]> {
    return loadJson<ActivityEvent[]>('/data/workspace/activity-feed.json');
  },

  async getDataTemplates(): Promise<DataTemplate[]> {
    return loadJson<DataTemplate[]>('/data/workspace/templates.json');
  },
};

// ─── Automation ────────────────────────────────────────────────────────────────

export const automation = {
  async getWorkflows(): Promise<Workflow[]> {
    return loadJson<Workflow[]>('/data/automation/workflows.json');
  },
};

// ─── AI ────────────────────────────────────────────────────────────────────────

export const ai = {
  async getChatSessions(): Promise<ChatSession[]> {
    return loadJson<ChatSession[]>('/data/ai/chat-sessions.json');
  },

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const sessions = await this.getChatSessions();
    return sessions.find(s => s.id === id);
  },
};

// ─── Common ────────────────────────────────────────────────────────────────────

export const common = {
  async getNotifications(): Promise<Notification[]> {
    return loadJson<Notification[]>('/data/common/notifications.json');
  },

  async getAuditLog(filters?: AuditFilters): Promise<PaginatedResult<AuditEntry>> {
    let items = await loadJson<AuditEntry[]>('/data/common/audit-log.json');
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as AuditEntry[];
    items = applyArrayFilter(items, 'category', filters?.category);
    items = applyArrayFilter(items, 'module', filters?.module);
    items = applySort(items, filters?.sortBy ?? 'timestamp', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getUsers(): Promise<User[]> {
    return loadJson<User[]>('/data/admin/users.json');
  },
};

// ─── Merchant Portal ────────────────────────────────────────────────────────

let merchantAccounts: MerchantAccount[] | null = null;
let merchantInvoices: MerchantInvoice[] | null = null;
let merchantPayments: MerchantPayment[] | null = null;
let merchantDisputes: MerchantDispute[] | null = null;

async function getMerchantAccounts(): Promise<MerchantAccount[]> {
  if (!merchantAccounts) merchantAccounts = clone(await loadJson<MerchantAccount[]>('/data/merchant/accounts.json'));
  return merchantAccounts;
}

async function getMerchantInvoices(): Promise<MerchantInvoice[]> {
  if (!merchantInvoices) merchantInvoices = clone(await loadJson<MerchantInvoice[]>('/data/merchant/invoices.json'));
  return merchantInvoices;
}

async function getMerchantPayments(): Promise<MerchantPayment[]> {
  if (!merchantPayments) merchantPayments = clone(await loadJson<MerchantPayment[]>('/data/merchant/payments.json'));
  return merchantPayments;
}

async function getMerchantDisputes(): Promise<MerchantDispute[]> {
  if (!merchantDisputes) merchantDisputes = clone(await loadJson<MerchantDispute[]>('/data/merchant/disputes.json'));
  return merchantDisputes;
}

export const merchantPortal = {
  async getAccounts(filters?: BaseFilters): Promise<PaginatedResult<MerchantAccount>> {
    let items = await getMerchantAccounts();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as MerchantAccount[];
    items = applySort(items, filters?.sortBy ?? 'name', filters?.sortOrder ?? 'asc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getAccount(id: string): Promise<MerchantAccount | undefined> {
    const items = await getMerchantAccounts();
    return items.find(a => a.id === id);
  },

  async getInvoices(filters?: MerchantInvoiceFilters): Promise<PaginatedResult<MerchantInvoice>> {
    let items = await getMerchantInvoices();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as MerchantInvoice[];
    items = applyArrayFilter(items, 'status', filters?.status);
    if (filters?.accountId) items = items.filter(i => i.accountId === filters.accountId);
    if (filters?.minAmount != null) items = items.filter(i => i.totalAmount >= filters.minAmount!);
    if (filters?.maxAmount != null) items = items.filter(i => i.totalAmount <= filters.maxAmount!);
    items = applySort(items, filters?.sortBy ?? 'issueDate', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getInvoice(id: string): Promise<MerchantInvoice | undefined> {
    const items = await getMerchantInvoices();
    return items.find(i => i.id === id);
  },

  async getPayments(accountId?: string): Promise<PaginatedResult<MerchantPayment>> {
    let items = await getMerchantPayments();
    if (accountId) items = items.filter(p => p.accountId === accountId);
    items = applySort(items, 'paymentDate', 'desc');
    return applyPagination(items);
  },

  async createPayment(data: Partial<MerchantPayment>): Promise<MerchantPayment> {
    const items = await getMerchantPayments();
    const newPayment: MerchantPayment = {
      id: `MPAY-${Date.now()}`,
      paymentNumber: `PAY-${Date.now()}`,
      accountId: '',
      accountName: '',
      amount: 0,
      method: 'ACH',
      status: 'Pending',
      paymentDate: new Date().toISOString().split('T')[0],
      allocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.unshift(newPayment);
    return newPayment;
  },

  async getPaymentMethods(accountId?: string): Promise<MerchantPaymentMethod[]> {
    const items = await loadJson<MerchantPaymentMethod[]>('/data/merchant/payment-methods.json');
    if (accountId) return items.filter(m => m.accountId === accountId);
    return items;
  },

  async getDisputes(accountId?: string): Promise<PaginatedResult<MerchantDispute>> {
    let items = await getMerchantDisputes();
    if (accountId) items = items.filter(d => d.accountId === accountId);
    items = applySort(items, 'filedDate', 'desc');
    return applyPagination(items);
  },

  async createDispute(data: Partial<MerchantDispute>): Promise<MerchantDispute> {
    const items = await getMerchantDisputes();
    const newDispute: MerchantDispute = {
      id: `DSP-${Date.now()}`,
      disputeNumber: `DSP-${Date.now()}`,
      accountId: '',
      accountName: '',
      invoiceId: '',
      invoiceNumber: '',
      type: 'Other',
      status: 'Open',
      amount: 0,
      description: '',
      communications: [],
      filedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.unshift(newDispute);
    return newDispute;
  },

  async updateDispute(id: string, updates: Partial<MerchantDispute>): Promise<MerchantDispute | undefined> {
    const items = await getMerchantDisputes();
    const idx = items.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async getCreditMemos(accountId?: string): Promise<MerchantCreditMemo[]> {
    const items = await loadJson<MerchantCreditMemo[]>('/data/merchant/credit-memos.json');
    if (accountId) return items.filter(m => m.accountId === accountId);
    return items;
  },

  async getNotifications(accountId?: string): Promise<MerchantNotification[]> {
    const items = await loadJson<MerchantNotification[]>('/data/merchant/notifications.json');
    if (accountId) return items.filter(n => n.accountId === accountId);
    return items;
  },

  async getContacts(accountId: string): Promise<MerchantContact[]> {
    // Contacts are embedded in accounts for now; extract from customer360 data
    const customer360 = await loadJson<Customer360[]>('/data/collections/customer360.json');
    const customer = customer360.find(c => c.customerId === accountId);
    if (!customer) return [];
    return customer.contacts.map((c, i) => ({
      id: `CONT-${accountId}-${i}`,
      accountId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      title: c.title,
      isPrimary: c.isPrimary,
    }));
  },
};

// ─── Collections ────────────────────────────────────────────────────────────

let collectionRecords: CollectionRecord[] | null = null;
let dunningSequences: DunningSequence[] | null = null;
let promisesToPay: PromiseToPay[] | null = null;

async function getCollectionRecords(): Promise<CollectionRecord[]> {
  if (!collectionRecords) collectionRecords = clone(await loadJson<CollectionRecord[]>('/data/collections/records.json'));
  return collectionRecords;
}

async function getDunningSequences(): Promise<DunningSequence[]> {
  if (!dunningSequences) dunningSequences = clone(await loadJson<DunningSequence[]>('/data/collections/dunning-sequences.json'));
  return dunningSequences;
}

async function getPromisesToPay(): Promise<PromiseToPay[]> {
  if (!promisesToPay) promisesToPay = clone(await loadJson<PromiseToPay[]>('/data/collections/promises.json'));
  return promisesToPay;
}

export const collections = {
  async getRecords(filters?: CollectionFilters): Promise<PaginatedResult<CollectionRecord>> {
    let items = await getCollectionRecords();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as CollectionRecord[];
    items = applyArrayFilter(items, 'severity', filters?.severity);
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applyArrayFilter(items, 'agingBucket', filters?.bucket);
    if (filters?.collector) items = items.filter(r => r.assignedTo === filters.collector);
    if (filters?.minPastDue != null) items = items.filter(r => r.pastDueAmount >= filters.minPastDue!);
    if (filters?.maxPastDue != null) items = items.filter(r => r.pastDueAmount <= filters.maxPastDue!);
    items = applySort(items, filters?.sortBy ?? 'riskScore', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getRecord(id: string): Promise<CollectionRecord | undefined> {
    const items = await getCollectionRecords();
    return items.find(r => r.id === id);
  },

  async updateRecord(id: string, updates: Partial<CollectionRecord>): Promise<CollectionRecord | undefined> {
    const items = await getCollectionRecords();
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async getCustomer360(customerId: string): Promise<Customer360 | undefined> {
    const items = await loadJson<Customer360[]>('/data/collections/customer360.json');
    return items.find(c => c.customerId === customerId);
  },

  async getCustomer360List(filters?: BaseFilters): Promise<PaginatedResult<Customer360>> {
    let items = await loadJson<Customer360[]>('/data/collections/customer360.json');
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as Customer360[];
    items = applySort(items, filters?.sortBy ?? 'customerName', filters?.sortOrder ?? 'asc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async getDunningSequences(filters?: DunningFilters): Promise<PaginatedResult<DunningSequence>> {
    let items = await getDunningSequences();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as DunningSequence[];
    items = applyArrayFilter(items, 'status', filters?.status);
    items = applyArrayFilter(items, 'currentStep', filters?.currentStep);
    if (filters?.customerId) items = items.filter(d => d.customerId === filters.customerId);
    items = applySort(items, filters?.sortBy ?? 'createdAt', filters?.sortOrder ?? 'desc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async createDunningSequence(data: Partial<DunningSequence>): Promise<DunningSequence> {
    const items = await getDunningSequences();
    const newSeq: DunningSequence = {
      id: `DUN-${Date.now()}`,
      customerId: '',
      customerName: '',
      currentStep: 'Friendly Reminder',
      currentStepNumber: 1,
      totalSteps: 5,
      status: 'Active',
      totalAmount: 0,
      invoiceIds: [],
      steps: [],
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.unshift(newSeq);
    return newSeq;
  },

  async updateDunningSequence(id: string, updates: Partial<DunningSequence>): Promise<DunningSequence | undefined> {
    const items = await getDunningSequences();
    const idx = items.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async getDunningTemplates(): Promise<DunningTemplate[]> {
    return loadJson<DunningTemplate[]>('/data/collections/dunning-templates.json');
  },

  async getPromises(filters?: BaseFilters): Promise<PaginatedResult<PromiseToPay>> {
    let items = await getPromisesToPay();
    items = applySearch(items as unknown as Record<string, unknown>[], filters?.search) as unknown as PromiseToPay[];
    items = applySort(items, filters?.sortBy ?? 'promisedDate', filters?.sortOrder ?? 'asc');
    return applyPagination(items, filters?.page, filters?.pageSize);
  },

  async createPromise(data: Partial<PromiseToPay>): Promise<PromiseToPay> {
    const items = await getPromisesToPay();
    const newPromise: PromiseToPay = {
      id: `PTP-${Date.now()}`,
      customerId: '',
      customerName: '',
      promisedAmount: 0,
      promisedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      invoiceIds: [],
      capturedBy: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.unshift(newPromise);
    return newPromise;
  },

  async updatePromise(id: string, updates: Partial<PromiseToPay>): Promise<PromiseToPay | undefined> {
    const items = await getPromisesToPay();
    const idx = items.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  async getCorrespondence(customerId?: string): Promise<PaginatedResult<Correspondence>> {
    let items = await loadJson<Correspondence[]>('/data/collections/correspondence.json');
    if (customerId) items = items.filter(c => c.customerId === customerId);
    items = applySort(items, 'sentAt', 'desc');
    return applyPagination(items);
  },

  async createCorrespondence(data: Partial<Correspondence>): Promise<Correspondence> {
    // Correspondence is read from static JSON; create returns a mock
    const newCorr: Correspondence = {
      id: `COR-${Date.now()}`,
      customerId: '',
      customerName: '',
      type: 'General',
      channel: 'Email',
      content: '',
      direction: 'Outbound',
      sentBy: '',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    return newCorr;
  },
};
