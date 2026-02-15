import { z } from "zod";

/** Schema for creating a watchlist item */
export const createWatchlistSchema = z.object({
  label: z.string().min(1, "Label is required"),
  entity: z.string().min(1, "Entity is required"),
  metric: z.string().min(1, "Metric is required"),
  condition: z.enum(["above", "below", "equals", "changes"]),
  threshold: z.number(),
});

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>;

/** Schema for creating a live pin */
export const createPinSchema = z.object({
  title: z.string().min(1, "Title is required"),
  entityName: z.string().min(1, "Entity name is required"),
  pinType: z.string().min(1, "Pin type is required"),
  params: z.record(z.string(), z.any()).optional(),
});

export type CreatePinInput = z.infer<typeof createPinSchema>;

/** Schema for bulk action confirmation */
export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, "Select at least one item"),
  action: z.string().min(1, "Action is required"),
  reason: z.string().optional(),
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;
