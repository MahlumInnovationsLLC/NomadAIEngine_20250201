import { z } from "zod";

// Define schema for MRB actions and dispositions
const MRBActionSchema = z.object({
  description: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
  completedDate: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]),
  comments: z.string().optional(),
});

export const MRBSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["material", "assembly", "component", "finished_product"]),
  severity: z.enum(["minor", "major", "critical"]),
  status: z.enum([
    "pending_review",
    "in_review",
    "disposition_pending",
    "approved",
    "rejected",
    "closed"
  ]),
  
  // Material/Part Information
  partNumber: z.string(),
  lotNumber: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  location: z.string(),
  
  // Related Documents
  ncrNumber: z.string().optional(),
  capaNumber: z.string().optional(),
  
  // Review Details
  nonconformance: z.object({
    description: z.string(),
    detectedBy: z.string(),
    detectedDate: z.string(),
    defectType: z.string(),
    rootCause: z.string().optional(),
  }),
  
  // Cost Impact
  costImpact: z.object({
    materialCost: z.number(),
    laborCost: z.number(),
    reworkCost: z.number().optional(),
    totalCost: z.number(),
    currency: z.string().default("USD"),
  }).optional(),
  
  // Disposition
  disposition: z.object({
    decision: z.enum([
      "use_as_is",
      "rework",
      "repair",
      "return_to_supplier",
      "scrap",
      "deviate"
    ]),
    justification: z.string(),
    conditions: z.string().optional(),
    approvedBy: z.array(z.string()),
    approvalDate: z.string().optional(),
  }),
  
  // Required Actions
  actions: z.array(MRBActionSchema),
  
  // Quality Engineering Review
  engineeringReview: z.object({
    reviewer: z.string(),
    reviewDate: z.string().optional(),
    findings: z.string(),
    recommendations: z.string(),
    approved: z.boolean(),
  }).optional(),
  
  // Attachments and Documentation
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadedBy: z.string(),
    uploadedAt: z.string(),
  })),
  
  // Audit Trail
  history: z.array(z.object({
    action: z.string(),
    performedBy: z.string(),
    timestamp: z.string(),
    notes: z.string().optional(),
  })),
  
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MRB = z.infer<typeof MRBSchema>;
export type MRBAction = z.infer<typeof MRBActionSchema>;

export const defaultMRBAction = {
  description: "",
  assignedTo: "",
  dueDate: new Date().toISOString(),
  status: "pending" as const,
  comments: "",
};
