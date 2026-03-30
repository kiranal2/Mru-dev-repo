// Data hooks — barrel file
// Re-exports every hook from the data layer for convenient single-import usage.

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

// Merchant Portal
export {
  useMerchantAccounts,
  useMerchantAccount,
  useMerchantInvoices,
  useMerchantPayments,
  useMerchantPaymentMutation,
  useMerchantDisputes,
  useMerchantDisputeMutation,
  useMerchantCreditMemos,
  useMerchantPaymentMethods,
  useMerchantNotifications,
} from "./use-merchant-portal";

// Collections
export {
  useCollections,
  useCollection,
  useCollectionMutation,
} from "./use-collections";

// Customer 360
export {
  useCustomer360,
  useCustomer360List,
} from "./use-customer360";

// Dunning & Correspondence
export {
  useDunningSequences,
  useDunningSequenceMutation,
  useDunningTemplates,
  usePromisesToPay,
  usePromiseToPayMutation,
  useCorrespondence,
  useCorrespondenceMutation,
} from "./use-dunning";
