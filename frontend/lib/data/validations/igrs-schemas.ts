import { z } from "zod";

/** Schema for creating a new IGRS case */
export const createIGRSCaseSchema = z.object({
  documentNumber: z.string().min(1, "Document number is required"),
  sroOfficeId: z.string().min(1, "SRO office is required"),
  propertyType: z.enum(["Residential", "Commercial", "Agricultural", "Industrial", "Mixed Use"]),
  transactionType: z.enum(["Sale", "Gift", "Mortgage", "Lease", "Partition", "Exchange"]),
  declaredValue: z.number().min(0, "Declared value must be positive"),
  guideline: z.number().min(0, "Guideline value must be positive"),
  marketValue: z.number().min(0, "Market value must be positive"),
  stampDutyPaid: z.number().min(0, "Stamp duty paid must be positive"),
  registrationFeePaid: z.number().min(0, "Registration fee must be positive"),
  buyerName: z.string().min(1, "Buyer name is required"),
  sellerName: z.string().min(1, "Seller name is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
  surveyNumber: z.string().optional(),
  area: z.number().min(0).optional(),
  areaUnit: z.enum(["sqft", "sqm", "acres", "hectares", "guntha"]).optional(),
  notes: z.string().optional(),
});

export type CreateIGRSCaseInput = z.infer<typeof createIGRSCaseSchema>;

/** Schema for creating/editing an IGRS rule */
export const igrsRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  category: z.enum([
    "Valuation",
    "StampDuty",
    "Exemption",
    "Compliance",
    "Operational",
    "Systemic",
  ]),
  description: z.string().min(1, "Description is required"),
  condition: z.string().min(1, "Condition is required"),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  enabled: z.boolean(),
  thresholdPct: z.number().min(0).max(100).optional(),
  thresholdAbs: z.number().min(0).optional(),
});

export type IGRSRuleInput = z.infer<typeof igrsRuleSchema>;
