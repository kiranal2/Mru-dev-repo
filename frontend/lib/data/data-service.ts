/**
 * Data Service — switchable data layer.
 *
 * Reads NEXT_PUBLIC_DATA_SOURCE to pick provider:
 *   - "json" (default) → loads from /public/data/*.json
 *   - "api" → calls real API (skeleton — throws until configured)
 *
 * Usage:
 *   import { dataService } from '@/lib/data';
 *   const cases = await dataService.igrsRevenue.getCases({ status: ['New'] });
 */

import * as jsonProvider from './providers/json-provider';
import * as apiProvider from './providers/api-provider';

const DATA_SOURCE = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'json'
  : process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'json';

function getProvider() {
  if (DATA_SOURCE === 'api') return apiProvider;
  return jsonProvider;
}

const provider = getProvider();

export const dataService = {
  /** IGRS Revenue Assurance (Indian government registration) */
  igrsRevenue: provider.igrsRevenue,
  /** Enterprise Revenue Assurance (corporate billing/pricing) */
  revenueAssurance: provider.revenueAssurance,
  /** Cash Application */
  cashApplication: provider.cashApplication,
  /** Financial Reports */
  reports: provider.reports,
  /** Close Management */
  closeManagement: provider.closeManagement,
  /** Reconciliations */
  reconciliations: provider.reconciliations,
  /** Workspace (pins, watchlist, activity) */
  workspace: provider.workspace,
  /** Automation */
  automation: provider.automation,
  /** AI Chat */
  ai: provider.ai,
  /** Common (notifications, audit, users) */
  common: provider.common,
};

export type DataService = typeof dataService;
