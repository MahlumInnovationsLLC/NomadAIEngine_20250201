import { z } from 'zod';

// Field schemas for different types of inspection fields
export const inspectionFieldSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["boolean", "text", "measurement", "select", "number", "date", "visual", "image"]),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.string()).optional(),
  acceptable: z.array(z.string()).optional(),
  multiple: z.boolean().optional(),
  defaultValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string())
  ]).optional(),
});

export const inspectionSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
  fields: z.array(inspectionFieldSchema),
});

export const inspectionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  version: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isArchived: z.boolean().optional().default(false),
  sections: z.array(inspectionSectionSchema),
  metadata: z.record(z.any()).optional(),
});

// Schema for inspection result fields
export const inspectionFieldResultSchema = z.object({
  fieldId: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.date()
  ]),
  status: z.enum(["pass", "fail", "na"]).optional(),
  comments: z.string().optional(),
  images: z.array(z.string()).optional()
});

export const sectionResultSchema = z.object({
  sectionId: z.string(),
  status: z.enum(["complete", "incomplete", "skipped"]),
  results: z.array(inspectionFieldResultSchema),
  comments: z.string().optional()
});

export const inspectionResultSchema = z.object({
  id: z.string().optional(),
  templateId: z.string(),
  inspectionDate: z.string(),
  inspectorId: z.string(),
  inspectorName: z.string(),
  status: z.enum(["draft", "in_progress", "completed", "approved", "rejected"]),
  projectId: z.string().optional(),
  productId: z.string().optional(),
  locationId: z.string().optional(),
  sections: z.array(sectionResultSchema),
  overallResult: z.enum(["pass", "fail", "conditional"]).optional(),
  approvals: z.array(
    z.object({
      approvalId: z.string(),
      approverId: z.string(),
      approverName: z.string(),
      status: z.enum(["pending", "approved", "rejected"]),
      comments: z.string().optional(),
      timestamp: z.string()
    })
  ).optional(),
  comments: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Export types
export type InspectionField = z.infer<typeof inspectionFieldSchema>;
export type InspectionSection = z.infer<typeof inspectionSectionSchema>;
export type InspectionTemplate = z.infer<typeof inspectionTemplateSchema>;
export type InspectionFieldResult = z.infer<typeof inspectionFieldResultSchema>;
export type SectionResult = z.infer<typeof sectionResultSchema>;
export type InspectionResult = z.infer<typeof inspectionResultSchema>;