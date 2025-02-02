import { z } from "zod";
import { NCRSchema } from "./ncr";

export const CAPASchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["draft", "open", "in_progress", "completed", "verified", "closed"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  type: z.enum(["corrective", "preventive", "improvement"]),
  rootCause: z.string(),
  correctiveActions: z.array(z.object({
    action: z.string(),
    assignedTo: z.string(),
    dueDate: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "verified"]),
    completedDate: z.string().optional(),
    verifiedBy: z.string().optional(),
    verificationDate: z.string().optional(),
  })),
  preventiveActions: z.array(z.object({
    action: z.string(),
    assignedTo: z.string(),
    dueDate: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "verified"]),
    completedDate: z.string().optional(),
    verifiedBy: z.string().optional(),
    verificationDate: z.string().optional(),
  })),
  verificationMethod: z.string(),
  effectivenessReview: z.string().optional(),
  relatedNCRs: z.array(NCRSchema),
  scheduledReviewDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  department: z.string(),
  area: z.string(),
  sourceNcrId: z.string().optional(),
  sourceInspectionId: z.string().optional(),
});

export type CAPA = z.infer<typeof CAPASchema>;

export type CAPAAction = {
  action: string;
  assignedTo: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  completedDate?: string;
  verifiedBy?: string;
  verificationDate?: string;
};