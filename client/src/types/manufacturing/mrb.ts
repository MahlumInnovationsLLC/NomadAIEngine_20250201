import { z } from "zod";
import { AttachmentSchema } from "./ncr";

export const MRBMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  department: z.string(),
  isChair: z.boolean().default(false),
  hasVoted: z.boolean().default(false),
  vote: z.enum(['approve', 'reject', 'abstain']).optional(),
  comments: z.string().optional()
});

export const MRBDispositionSchema = z.object({
  decision: z.enum(['approved', 'rejected']).optional(),
  justification: z.string().optional(),
  conditions: z.string().optional(),
  approvedBy: z.array(z.object({
    approver: z.string(),
    date: z.string(),
    comment: z.string().optional()
  })).default([]),
  approvalDate: z.string().optional()
});

export const MRBActionItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
  status: z.enum(['open', 'in_progress', 'completed', 'overdue']),
  completedDate: z.string().optional(),
  completedBy: z.string().optional(),
  notes: z.string().optional()
});

export const MRBNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string(),
  createdBy: z.string().optional(),
  category: z.enum(['general', 'technical', 'quality', 'regulatory']).default('general'),
  isPrivate: z.boolean().default(false)
});

export const MRBTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  assignedTo: z.string(),
  dueDate: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'on_hold']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  completedDate: z.string().optional(),
  completedBy: z.string().optional(),
  comments: z.string().optional()
});

export const MRBSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum([
    'pending_review',
    'in_review',
    'pending_disposition',
    'approved',
    'rejected',
    'closed'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),

  // Classification details
  type: z.enum([
    'material',
    'process',
    'product',
    'equipment',
    'documentation'
  ]),
  area: z.string(),
  productLine: z.string().optional(),
  projectNumber: z.string().optional(),

  // Related items
  sourceNCRId: z.string().optional(),
  sourceNCRNumber: z.string().optional(),
  relatedCAPAs: z.array(z.string()).optional(),

  // Meeting details
  scheduledDate: z.string().optional(),
  meetingNotes: z.string().optional(),
  location: z.string().optional(),
  reviewDate: z.string().optional(),
  reviewStartDate: z.string().optional(),
  reviewEndDate: z.string().optional(),

  // Board members
  members: z.array(MRBMemberSchema).default([]),
  quorumRequired: z.number().int().min(1).default(3),

  // Review content
  technicalReview: z.string().optional(),
  qualityReview: z.string().optional(),
  regulatoryReview: z.string().optional(),
  disposition: MRBDispositionSchema.optional(),
  actionItems: z.array(MRBActionItemSchema).default([]),
  
  // Management content
  notes: z.array(MRBNoteSchema).default([]),
  tasks: z.array(MRBTaskSchema).default([]),

  // Item details
  partNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  quantity: z.number().optional(),
  supplierName: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),

  // Attachments
  attachments: z.array(AttachmentSchema).default([]),

  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
  closedDate: z.string().optional(),
  closedBy: z.string().optional(),

  // Cost impact
  costImpact: z.number().optional(),
  scheduleImpact: z.number().optional(),
  riskAssessment: z.string().optional()
});

export type MRB = z.infer<typeof MRBSchema>;
export type MRBMember = z.infer<typeof MRBMemberSchema>;
export type MRBDisposition = z.infer<typeof MRBDispositionSchema>;
export type MRBActionItem = z.infer<typeof MRBActionItemSchema>;
export type MRBNote = z.infer<typeof MRBNoteSchema>;
export type MRBTask = z.infer<typeof MRBTaskSchema>;

// Default values for use in forms
export const defaultMRBNote: Omit<MRBNote, "id"> = {
  text: "",
  createdAt: new Date().toISOString(),
  category: "general",
  isPrivate: false
};

export const defaultMRBTask: Omit<MRBTask, "id"> = {
  title: "",
  assignedTo: "",
  dueDate: new Date().toISOString(),
  status: "pending",
  priority: "medium"
};