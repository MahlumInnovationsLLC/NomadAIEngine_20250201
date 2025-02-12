import { z } from "zod";
import { generateUUID } from "@/lib/utils";

// Define schema for MRB actions and dispositions
const MRBActionSchema = z.object({
  description: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
  completedDate: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]),
  comments: z.string().optional(),
});

// Define schema for linked NCRs
const LinkedNCRSchema = z.object({
  ncrId: z.string(),
  dispositionNotes: z.string(),
});

// Define schema for collaborator tasks
const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  assignedTo: z.string(),
  dueDate: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "on_hold"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  blockedReason: z.string().optional(),
  comments: z.array(z.object({
    id: z.string(),
    text: z.string(),
    author: z.string(),
    timestamp: z.string(),
  })),
});

// Define schema for notes
const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string(),
  category: z.enum(["general", "technical", "quality", "disposition", "engineering", "production", "other"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()).optional(),
  relatedDocuments: z.array(z.string()).optional(),
});

// Define schema for attachments
const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string(),
  category: z.enum(["document", "image", "drawing", "report", "specification", "procedure", "other"]),
  description: z.string().optional(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  size: z.number(),
  metadata: z.record(z.string()).optional(),
  version: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
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
    "pending_disposition",
    "disposition_pending",
    "approved",
    "rejected",
    "closed"
  ]),

  // Source Information
  sourceType: z.enum(["NCR", "CAPA", "SCAR"]).optional(),
  sourceId: z.string().optional(),

  // Material/Part Information
  partNumber: z.string(),
  lotNumber: z.string().optional(),
  quantity: z.number(),
  unit: z.string().default("pcs"),
  location: z.string(),

  // Related Documents
  ncrNumber: z.string().optional(),
  capaNumber: z.string().optional(),
  linkedNCRs: z.array(LinkedNCRSchema).optional(),

  // Enhanced Collaboration Features
  tasks: z.array(TaskSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  collaborators: z.array(z.object({
    userId: z.string(),
    role: z.enum(["reviewer", "approver", "contributor"]),
    addedAt: z.string(),
  })).default([]),

  // Review Details
  nonconformance: z.object({
    description: z.string(),
    detectedBy: z.string(),
    detectedDate: z.string(),
    defectType: z.string(),
    rootCause: z.string().optional(),
    containmentActions: z.array(z.string()).optional(),
    correctiveActions: z.array(z.string()).optional(),
  }).optional(),

  // Cost Impact
  costImpact: z.object({
    materialCost: z.number(),
    laborCost: z.number(),
    reworkCost: z.number(),
    totalCost: z.number(),
    currency: z.string().default("USD"),
    comments: z.string().optional(),
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
    approvedBy: z.array(z.object({
      name: z.string(),
      role: z.string(),
      date: z.string(),
      comment: z.string().optional(),
    })),
    approvalDate: z.string().optional(),
    implementationPlan: z.string().optional(),
    verificationMethod: z.string().optional(),
  }),

  // Attachments and Documentation
  attachments: z.array(AttachmentSchema),

  // Audit Trail
  history: z.array(z.object({
    action: z.string(),
    type: z.string(),
    description: z.string(),
    user: z.string(),
    timestamp: z.string(),
    notes: z.string().optional(),
    changes: z.record(z.unknown()).optional(),
  })).optional(),

  // Enhanced tracking fields
  reviewDueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  tags: z.array(z.string()).default([]),
  department: z.string().optional(),
  projectId: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),

  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().optional(),
  closedBy: z.string().optional(),
});

export type MRB = z.infer<typeof MRBSchema>;
export type MRBAction = z.infer<typeof MRBActionSchema>;
export type LinkedNCR = z.infer<typeof LinkedNCRSchema>;
export type MRBTask = z.infer<typeof TaskSchema>;
export type MRBNote = z.infer<typeof NoteSchema>;
export type MRBAttachment = z.infer<typeof AttachmentSchema>;

export const defaultMRBAction = {
  description: "",
  assignedTo: "",
  dueDate: new Date().toISOString(),
  status: "pending" as const,
  comments: "",
};

export const defaultMRBTask = {
  id: generateUUID(),
  title: "",
  description: "",
  assignedTo: "",
  dueDate: new Date().toISOString(),
  status: "pending" as const,
  priority: "medium" as const,
  createdBy: "current-user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  comments: [],
};

export const defaultMRBNote = {
  id: generateUUID(),
  title: "",
  content: "",
  author: "current-user",
  category: "general" as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
};