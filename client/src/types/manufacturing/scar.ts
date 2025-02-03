import { z } from "zod";

// Define schema for SCAR actions
const SCARActionSchema = z.object({
  description: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  completedDate: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "verified"]),
  comments: z.string().optional(),
  verificationMethod: z.string().optional(),
  verificationResults: z.string().optional(),
});

export const SCARSchema = z.object({
  id: z.string(),
  number: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  issueDate: z.string(),
  responseRequired: z.string(),
  status: z.enum(["draft", "issued", "supplier_response", "review", "closed"]),
  
  // Initial Problem Description
  issue: z.object({
    description: z.string(),
    partNumbers: z.array(z.string()).optional(),
    lotNumbers: z.array(z.string()).optional(),
    quantityAffected: z.number().optional(),
    occurrenceDate: z.string(),
    category: z.enum(["quality", "delivery", "documentation", "other"]),
    severity: z.enum(["minor", "major", "critical"]),
  }),

  // Immediate Containment Actions
  containmentActions: z.array(SCARActionSchema.extend({
    responsibility: z.enum(["supplier", "internal"]),
    verification: z.string().optional(),
  })),

  // Root Cause Analysis
  rootCauseAnalysis: z.object({
    method: z.string(),
    findings: z.string(),
    attachments: z.array(z.string()).optional(),
  }).optional(),

  // Corrective Actions
  correctiveActions: z.array(SCARActionSchema.extend({
    type: z.enum(["immediate", "long_term"]),
    responsibility: z.string(),
  })),

  // Preventive Actions
  preventiveActions: z.array(SCARActionSchema.extend({
    responsibility: z.string(),
  })),

  // Verification
  verification: z.object({
    method: z.string(),
    results: z.string().optional(),
    verifiedBy: z.string().optional(),
    verificationDate: z.string().optional(),
  }),

  attachments: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SCAR = z.infer<typeof SCARSchema>;
export type SCARAction = z.infer<typeof SCARActionSchema>;

export const defaultSCARAction = {
  description: "",
  owner: "",
  dueDate: new Date().toISOString(),
  status: "pending" as const,
  comments: "",
};
