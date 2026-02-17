/**
 * API Data Provider — skeleton with identical function signatures.
 * All methods throw an error instructing the user to configure the API.
 */

const API_NOT_CONFIGURED = 'API not configured — set NEXT_PUBLIC_DATA_SOURCE=json or configure NEXT_PUBLIC_API_BASE_URL';

function notConfigured(): never {
  throw new Error(API_NOT_CONFIGURED);
}

export const igrsRevenue = {
  getCases: notConfigured,
  getCase: notConfigured,
  createCase: notConfigured,
  updateCase: notConfigured,
  deleteCase: notConfigured,
  getRules: notConfigured,
  toggleRule: notConfigured,
  getSignals: notConfigured,
  getOffices: notConfigured,
  getDashboardKPIs: notConfigured,
  getTrends: notConfigured,
  getPatterns: notConfigured,
  getMvHotspots: notConfigured,
  getExports: notConfigured,
  getSettings: notConfigured,
  getCashReconciliation: notConfigured,
  getStampInventory: notConfigured,
};

export const revenueAssurance = {
  getCases: notConfigured,
  getCase: notConfigured,
  createCase: notConfigured,
  updateCase: notConfigured,
  deleteCase: notConfigured,
  getRules: notConfigured,
  toggleRule: notConfigured,
  getSignals: notConfigured,
  getCustomers: notConfigured,
  getCustomer: notConfigured,
  getContracts: notConfigured,
  getDashboardKPIs: notConfigured,
  getTrends: notConfigured,
  getPatterns: notConfigured,
  getExports: notConfigured,
  getSettings: notConfigured,
};

export const cashApplication = {
  getPayments: notConfigured,
  getPayment: notConfigured,
  updatePayment: notConfigured,
  getRemittances: notConfigured,
  getInvoices: notConfigured,
  getMatchResults: notConfigured,
  updateMatchResult: notConfigured,
  getExceptions: notConfigured,
  updateException: notConfigured,
  getBankLines: notConfigured,
  getEmails: notConfigured,
};

export const reports = {
  getBalanceSheet: notConfigured,
  getIncomeStatement: notConfigured,
  getTrialBalance: notConfigured,
  getJournalEntries: notConfigured,
  getFluxAnalysis: notConfigured,
};

export const closeManagement = {
  getTasks: notConfigured,
  updateTask: notConfigured,
};

export const reconciliations = {
  getReconciliations: notConfigured,
};

export const workspace = {
  getPins: notConfigured,
  addPin: notConfigured,
  removePin: notConfigured,
  getWatchlist: notConfigured,
  addWatchlistItem: notConfigured,
  removeWatchlistItem: notConfigured,
  getActivityFeed: notConfigured,
  getDataTemplates: notConfigured,
};

export const automation = {
  getWorkflows: notConfigured,
};

export const ai = {
  getChatSessions: notConfigured,
  getChatSession: notConfigured,
};

export const common = {
  getNotifications: notConfigured,
  getAuditLog: notConfigured,
  getUsers: notConfigured,
};
