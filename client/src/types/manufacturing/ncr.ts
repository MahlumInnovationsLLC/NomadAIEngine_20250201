import { z } from "zod";

export const NCRAttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  blobUrl: z.string(),
  uploadedBy: z.string().optional(),
  uploadedAt: z.string().optional(),
});

export type NCRAttachment = z.infer<typeof NCRAttachmentSchema>;

export const DispositionSchema = z.object({
  decision: z.enum(['use_as_is', 'rework', 'scrap', 'return_to_supplier']),
  justification: z.string(),
  conditions: z.string(),
  approvedBy: z.array(z.object({
    approver: z.string(),
    date: z.string(),
    comment: z.string().optional(),
  })),
});

export type Disposition = z.infer<typeof DispositionSchema>;

export const ContainmentActionSchema = z.object({
  action: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
});

export type ContainmentAction = z.infer<typeof ContainmentActionSchema>;

export const NCRSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["product", "process", "material", "documentation"]),
  severity: z.enum(["minor", "major", "critical"]),
  status: z.enum(["open", "closed", "under_review", "pending_disposition", "draft"]),
  area: z.string(),
  productLine: z.string().optional(),
  projectNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  quantityAffected: z.number().optional(),
  reportedBy: z.string().optional(),
  disposition: DispositionSchema,
  containmentActions: z.array(ContainmentActionSchema).optional(),
  attachments: z.array(NCRAttachmentSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userKey: z.string().optional(),
  linkedCapaId: z.string().optional(),
});

export type NonConformanceReport = z.infer<typeof NCRSchema>;
export type NCR = NonConformanceReport; // For backward compatibility