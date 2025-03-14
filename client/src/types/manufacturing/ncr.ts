import { z } from "zod";

export const DispositionSchema = z.object({
  decision: z.enum([
    "use_as_is",
    "rework",
    "scrap",
    "return_to_supplier"
  ]),
  justification: z.string(),
  conditions: z.string().optional(),
  approvedBy: z.array(z.object({
    approver: z.string(),
    date: z.string(),
    comment: z.string().optional()
  })).default([]),
  approvalDate: z.string().optional()
});

export const AttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  blobUrl: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string().optional()
});

export const NCRSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum([
    "material",
    "documentation",
    "product",
    "process",
    "equipment"
  ]),
  severity: z.enum([
    "minor",
    "major",
    "critical"
  ]),
  status: z.enum([
    "draft",
    "open",
    "under_review",
    "pending_disposition",
    "closed"
  ]),
  
  // Classification details
  area: z.string(),
  defectCode: z.string().optional(),
  defectCategory: z.string().optional(),
  lotNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  partNumber: z.string().optional(),
  quantityAffected: z.number().optional(),
  unitOfMeasure: z.string().optional(),
  
  // Personnel
  reportedBy: z.string(),
  reportedDate: z.string(),
  assignedTo: z.string().optional(),
  investigatedBy: z.string().optional(),
  
  // Related info
  projectNumber: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  
  // Disposition
  disposition: DispositionSchema.optional(),
  dispositionNotes: z.string().optional(),
  containmentActions: z.string().optional(),
  
  // Links to other records
  capaId: z.string().optional(),
  capaNumber: z.string().optional(),
  mrbId: z.string().optional(),
  mrbNumber: z.string().optional(),
  
  // Root cause
  rootCause: z.string().optional(),
  rootCauseCategory: z.string().optional(),
  rootCauseVerification: z.string().optional(),
  
  // Attachments
  attachments: z.array(AttachmentSchema).optional().default([]),
  
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
  investigationStartDate: z.string().optional(),
  investigationEndDate: z.string().optional(),
  closedDate: z.string().optional(),
  closedBy: z.string().optional(),
  
  // Cost impact
  costImpact: z.number().optional(),
  timeImpact: z.number().optional(),
  
  // Review data
  reviewComments: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewDate: z.string().optional()
});

export type NCR = z.infer<typeof NCRSchema>;
export type Disposition = z.infer<typeof DispositionSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;