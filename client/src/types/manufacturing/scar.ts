import { z } from "zod";
import { AttachmentSchema } from "./ncr";

export const ContainmentActionSchema = z.object({
  id: z.string(),
  description: z.string(),
  responsibleParty: z.enum(["supplier", "customer"]),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]),
  effectiveness: z.number().int().min(1).max(5).optional()
});

export const RootCauseSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  analysis: z.string().optional(),
  verificationMethod: z.string().optional(),
  verified: z.boolean().default(false),
  verifiedDate: z.string().optional(),
  verifiedBy: z.string().optional()
});

export const CorrectiveActionSchema = z.object({
  id: z.string(),
  description: z.string(),
  targetDate: z.string(),
  responsibleParty: z.string(),
  status: z.enum(["open", "in_progress", "completed", "pending_verification", "verified"]),
  completedDate: z.string().optional(),
  verificationMethod: z.string().optional(),
  verificationResults: z.string().optional(),
  verified: z.boolean().default(false),
  verifiedDate: z.string().optional(),
  verifiedBy: z.string().optional(),
  effectivenessRating: z.number().int().min(1).max(5).optional()
});

export const PreventiveActionSchema = z.object({
  id: z.string(),
  description: z.string(),
  targetDate: z.string(),
  responsibleParty: z.string(),
  status: z.enum(["open", "in_progress", "completed", "pending_verification", "verified"]),
  completedDate: z.string().optional(),
  implementationPlan: z.string().optional(),
  systemChanges: z.string().optional(),
  verified: z.boolean().default(false),
  verifiedDate: z.string().optional(),
  verifiedBy: z.string().optional()
});

export const SupplierResponseSchema = z.object({
  responseDate: z.string(),
  respondedBy: z.string(),
  acknowledgment: z.boolean().default(false),
  rootCauseAnalysis: z.string().optional(),
  proposedActions: z.string().optional(),
  attachments: z.array(z.string()).optional()
});

export const SCARSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum([
    "draft",
    "issued",
    "supplier_response",
    "review",
    "closed"
  ]),
  priority: z.enum([
    "low",
    "medium",
    "high",
    "critical"
  ]),
  
  // Supplier info
  supplierId: z.string(),
  supplierName: z.string(),
  supplierContact: z.string().optional(),
  supplierEmail: z.string().email().optional(),
  supplierPhone: z.string().optional(),
  
  // Related info
  sourceNCRId: z.string().optional(),
  sourceNCRNumber: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  partNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  
  // Issue details
  defectDescription: z.string().optional(),
  defectCategory: z.string().optional(),
  defectQuantity: z.number().optional(),
  containmentActions: z.array(ContainmentActionSchema).default([]),
  rootCauses: z.array(RootCauseSchema).default([]),
  correctiveActions: z.array(CorrectiveActionSchema).default([]),
  preventiveActions: z.array(PreventiveActionSchema).default([]),
  
  // Supplier response
  supplierResponse: SupplierResponseSchema.optional(),
  
  // Review
  reviewDate: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewComments: z.string().optional(),
  reviewStatus: z.enum(["approved", "rejected", "pending_info"]).optional(),
  
  // Effectiveness
  effectivenessVerification: z.string().optional(),
  effectivenessDate: z.string().optional(),
  effectivenessRating: z.number().int().min(1).max(5).optional(),
  
  // Timestamps
  issueDate: z.string().optional(),
  dueDate: z.string(),
  closeDate: z.string().optional(),
  closedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  
  // Attachments
  attachments: z.array(AttachmentSchema).default([])
});

export type SCAR = z.infer<typeof SCARSchema>;
export type ContainmentAction = z.infer<typeof ContainmentActionSchema>;
export type RootCause = z.infer<typeof RootCauseSchema>;
export type CorrectiveAction = z.infer<typeof CorrectiveActionSchema>;
export type PreventiveAction = z.infer<typeof PreventiveActionSchema>;
export type SupplierResponse = z.infer<typeof SupplierResponseSchema>;