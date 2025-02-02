import { z } from "zod";

export const NCRAttachmentSchema = z.object({
  id: z.string(),
  ncrId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  blobUrl: z.string(),
});

export type NCRAttachment = z.infer<typeof NCRAttachmentSchema>;

export const NCRSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["product", "process", "material", "documentation"]),
  severity: z.enum(["minor", "major", "critical"]),
  status: z.enum(["open", "under_review", "pending_disposition", "closed"]),
  disposition: z.enum(["use_as_is", "rework", "repair", "scrap", "return_to_supplier", "pending"]),
  area: z.string(),
  productLine: z.string(),
  projectNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  quantityAffected: z.number().optional(),
  containmentActions: z.array(z.object({
    action: z.string(),
    assignedTo: z.string(),
    dueDate: z.string(),
  })),
  attachments: z.array(NCRAttachmentSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reportedBy: z.string().optional(),
  userKey: z.string().optional(),
});

export type NCR = z.infer<typeof NCRSchema>;