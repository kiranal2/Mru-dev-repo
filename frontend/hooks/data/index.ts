// Data hooks — barrel file
// Re-exports every hook from the data layer for convenient single-import usage.

// IGRS Revenue Assurance
export { useIGRSCases, useIGRSCase, useIGRSCaseMutation } from "./use-igrs-cases";
export { useIGRSRules, useIGRSRuleMutation } from "./use-igrs-rules";
export { useIGRSDashboard } from "./use-igrs-dashboard";
export { useIGRSSignals } from "./use-igrs-signals";
export { useIGRSOffices } from "./use-igrs-offices";
export { useIGRSTrends } from "./use-igrs-trends";
export { useIGRSPatterns } from "./use-igrs-patterns";
export { useIGRSMVHotspots } from "./use-igrs-mv-hotspots";
export { useIGRSExports } from "./use-igrs-exports";
export { useIGRSSettings } from "./use-igrs-settings";
export { useIGRSCashReconciliation } from "./use-igrs-cash-reconciliation";
export { useIGRSStampInventory } from "./use-igrs-stamp-inventory";
export { useIGRSStampIntelligence } from "./use-igrs-stamp-intelligence";
export { useIGRSMVGrowthAttribution } from "./use-igrs-mv-growth-attribution";
export { useIGRSMVRevisionComparison } from "./use-igrs-mv-revision-comparison";
export { useIGRSMVAnomalies } from "./use-igrs-mv-anomalies";
export { useIGRSGovernance } from "./use-igrs-governance";
export { useAIIntelligence } from "./use-igrs-ai-intelligence";

// Enterprise Revenue Assurance
export { useRevenueCases, useRevenueCase, useRevenueCaseMutation } from "./use-revenue-cases";
export { useRevenueRules, useRevenueRuleMutation } from "./use-revenue-rules";
export { useRevenueDashboard } from "./use-revenue-dashboard";
export { useRevenueCustomers } from "./use-revenue-customers";
export { useRevenueContracts } from "./use-revenue-contracts";

// Cash Application
export { useCashPayments, useCashPayment } from "./use-cash-payments";
export { useCashRemittances } from "./use-cash-remittances";
export { useCashMatching } from "./use-cash-matching";
export { useCashExceptions } from "./use-cash-exceptions";

// Financial Reports
export {
  useBalanceSheet,
  useIncomeStatement,
  useTrialBalance,
  useJournalEntries,
  useFluxAnalysis,
} from "./use-reports";

// Close Management
export { useCloseTasks } from "./use-close-tasks";

// Reconciliations
export { useReconciliations } from "./use-reconciliations";

// Workspace
export {
  usePins,
  useWatchlist,
  useActivityFeed,
  useDataTemplates,
} from "./use-workspace";

// Automation
export { useWorkflows } from "./use-automation";

// Common
export {
  useNotifications,
  useAuditLog,
  useUsers,
  useChatSessions,
} from "./use-common";
