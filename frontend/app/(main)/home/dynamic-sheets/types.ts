export interface DynamicSheet {
  id: string;
  name: string;
  entity: string;
  sourceType: "Prompt" | "Template" | "Recon";
  promptText?: string;
  promptSummary?: string;
  rowCount: number;
  lastRefreshedAt?: string;
  isFavorite: boolean;
  status: "OK" | "Needs Refresh" | "Error";
  columns: any[];
  calculatedColumns: any[];
  filters: any[];
  ownerName: string;
  isDirty: boolean;
}
