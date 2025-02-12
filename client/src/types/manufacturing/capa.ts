import { z } from "zod";
import { NCRSchema } from "./ncr";

// Define schema for each 8D step
const EightDStepSchema = z.object({
  description: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  completedDate: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "verified"]),
  comments: z.string().optional(),
});

export const CAPASchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum([
    "draft",
    "open",
    "in_progress",
    "pending_review",
    "under_investigation",
    "implementing",
    "pending_verification",
    "completed",
    "verified",
    "closed",
    "cancelled"
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  type: z.enum(["corrective", "preventive", "improvement"]),
  category_id: z.number().optional().nullable(),

  // 8D Methodology steps
  d1_team: EightDStepSchema.extend({
    teamMembers: z.array(z.string()),
  }),
  d2_problem: EightDStepSchema,
  d3_containment: EightDStepSchema,
  d4_root_cause: EightDStepSchema,
  d5_corrective: EightDStepSchema,
  d6_implementation: EightDStepSchema,
  d7_preventive: EightDStepSchema,
  d8_recognition: EightDStepSchema,

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
export type EightDStep = z.infer<typeof EightDStepSchema>;

export const defaultEightDStep = {
  description: "",
  owner: "",
  dueDate: new Date().toISOString(),
  status: "pending" as const,
  comments: "",
};