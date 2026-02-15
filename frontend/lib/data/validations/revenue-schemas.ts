import { z } from "zod";

/** Schema for creating a new Enterprise Revenue Assurance case */
export const createRevenueCaseSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  contractId: z.string().optional(),
  category: z.enum([
    "Pricing",
    "Billing",
    "Contract",
    "Discount",
    "Subscription",
    "Commission",
    "Recognition",
  ]),
  leakageType: z.string().min(1, "Leakage type is required"),
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().default("USD"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  assignedTo: z.string().optional(),
  product: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateRevenueCaseInput = z.infer<typeof createRevenueCaseSchema>;

/** Schema for creating/editing a Revenue rule */
export const revenueRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  category: z.enum([
    "Pricing",
    "Billing",
    "Contract",
    "Discount",
    "Subscription",
    "Commission",
    "Recognition",
  ]),
  description: z.string().min(1, "Description is required"),
  condition: z.string().min(1, "Condition is required"),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  enabled: z.boolean(),
  thresholdPct: z.number().min(0).max(100).optional(),
  thresholdAbs: z.number().min(0).optional(),
});

export type RevenueRuleInput = z.infer<typeof revenueRuleSchema>;
