import { z } from "zod";
import { AttachmentSchema } from "./ncr";

export const CAPAActionSchema = z.object({
  id: z.string(),
  type: z.enum(["corrective", "preventive", "status_change"]),
  description: z.string(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]),
  assignedTo: z.string(),
  dueDate: z.string(),
  completedDate: z.string().optional(),
  completedBy: z.string().optional(),
  verificationRequired: z.boolean().default(true),
  verificationMethod: z.string().optional(),
  verificationResult: z.string().optional(),
  verificationDate: z.string().optional(),
  verifiedBy: z.string().optional(),
  notes: z.string().optional()
});

export const EightDStepSchema = z.object({
  id: z.string(),
  stepNumber: z.number().int().min(1).max(8),
  name: z.string(),
  description: z.string(),
  status: z.enum(["not_started", "in_progress", "completed", "skipped"]),
  startDate: z.string().optional(),
  completedDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  teamMembers: z.array(z.string()).optional(),
  content: z.string().optional()
});

export const RiskAssessmentSchema = z.object({
  severityBefore: z.number().int().min(1).max(10),
  probabilityBefore: z.number().int().min(1).max(10),
  detectionBefore: z.number().int().min(1).max(10),
  rpnBefore: z.number().int().min(1).max(1000),
  severityAfter: z.number().int().min(1).max(10).optional(),
  probabilityAfter: z.number().int().min(1).max(10).optional(),
  detectionAfter: z.number().int().min(1).max(10).optional(),
  rpnAfter: z.number().int().min(1).max(1000).optional(),
  notes: z.string().optional()
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
    "pending_verification",
    "verified",
    "closed",
    "cancelled",
    "pending_review",
    "under_investigation",
    "implementing"
  ]),
  
  // Classification details
  type: z.enum(["corrective", "preventive", "improvement"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  category: z.string().optional(),
  area: z.string(),
  scope: z.string().optional(),
  
  // Personnel
  requestedBy: z.string(),
  assignedTo: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
  
  // Related info
  sourceNCRId: z.string().optional(),
  sourceNCRNumber: z.string().optional(),
  sourceInspectionId: z.string().optional(),
  
  // Issue details
  rootCause: z.string().optional(),
  rootCauseCategory: z.string().optional(),
  rootCauseAnalysisMethod: z.enum([
    "5-why",
    "fishbone",
    "pareto",
    "fmea",
    "other"
  ]).optional(),
  rootCauseAnalysisDetails: z.string().optional(),
  
  // Actions
  correctiveActions: z.array(CAPAActionSchema).default([]),
  preventiveActions: z.array(CAPAActionSchema).default([]),
  containmentActions: z.string().optional(),
  eightDSteps: z.array(EightDStepSchema).optional(),
  
  // Verification
  verificationMethod: z.string().optional(),
  verificationResults: z.string().optional(),
  verificationDate: z.string().optional(),
  verifiedBy: z.string().optional(),
  scheduledVerificationDate: z.string().optional(),
  
  // Risk Assessment
  riskAssessment: RiskAssessmentSchema.optional(),
  
  // Effectiveness
  effectivenessReview: z.string().optional(),
  effectivenessRating: z.number().int().min(1).max(5).optional(),
  
  // Attachments
  attachments: z.array(AttachmentSchema).default([]),
  
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
  submittedDate: z.string().optional(),
  implementationStartDate: z.string().optional(),
  implementationEndDate: z.string().optional(),
  closedDate: z.string().optional(),
  closedBy: z.string().optional(),
  
  // Review
  reviewComments: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewDate: z.string().optional(),
  
  // Compliance
  regulatoryReference: z.string().optional(),
  isoClause: z.string().optional()
});

export type CAPA = z.infer<typeof CAPASchema>;
export type CAPAAction = z.infer<typeof CAPAActionSchema>;
export type EightDStep = z.infer<typeof EightDStepSchema>;
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const defaultEightDStep: Omit<EightDStep, "id"> = {
  stepNumber: 1,
  name: "",
  description: "",
  status: "not_started",
  content: ""
};