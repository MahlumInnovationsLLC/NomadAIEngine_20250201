import { z } from 'zod';

// Define the field types that can be used in inspection templates
export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'boolean',
  'date',
  'select',
  'multi-select',
  'visual',
  'image',
  'measurement' // Custom type for manufacturing measurements
]);

export type FieldType = z.infer<typeof fieldTypeSchema>;

// Define the inspection field schema
export const inspectionFieldSchema = z.object({
  id: z.string().optional(),
  type: fieldTypeSchema,
  label: z.string(),
  required: z.boolean(),
  instructions: z.string().optional(),
  description: z.string().optional(),
  
  // Optional fields based on type
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  
  // Visual inspection specific fields
  acceptable: z.array(z.string()).optional(),
  
  // Validation
  validatePattern: z.string().optional(),
  
  // Measurement specific fields
  nominalValue: z.number().optional(),
  tolerance: z.object({
    upper: z.number(),
    lower: z.number()
  }).optional(),
  
  // Conditional display
  displayCondition: z.string().optional()
});

export type InspectionField = z.infer<typeof inspectionFieldSchema>;

// Define the inspection section schema
export const inspectionSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
  displayCondition: z.string().optional(),
  fields: z.array(inspectionFieldSchema)
});

export type InspectionSection = z.infer<typeof inspectionSectionSchema>;

// Define the inspection template schema
export const inspectionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  standard: z.string().optional(), // ISO or industry standard reference
  metadata: z.record(z.string(), z.any()).optional(),
  sections: z.array(inspectionSectionSchema)
});

export type InspectionTemplate = z.infer<typeof inspectionTemplateSchema>;

// Define the inspection result status
export const resultStatusSchema = z.enum(['pass', 'fail', 'na']);

export type ResultStatus = z.infer<typeof resultStatusSchema>;

// Define the section result schema (for completed inspections)
export const sectionResultSchema = z.object({
  sectionId: z.string(),
  status: z.enum(['complete', 'incomplete', 'skipped']),
  results: z.array(
    z.object({
      fieldId: z.string(),
      value: z.union([z.string(), z.number(), z.boolean(), z.date(), z.array(z.string())]),
      status: resultStatusSchema.optional(),
      images: z.array(z.string()).optional(),
      comments: z.string().optional()
    })
  ),
  comments: z.string().optional()
});

export type SectionResult = z.infer<typeof sectionResultSchema>;

// Define the inspection schema (for completed inspections)
export const inspectionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  templateVersion: z.number(),
  projectId: z.string().optional(),
  itemId: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'approved', 'rejected']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  inspectedBy: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      type: z.string(),
      size: z.number()
    })
  ).optional(),
  sectionResults: z.array(sectionResultSchema),
  metadata: z.record(z.string(), z.any()).optional()
});

export type Inspection = z.infer<typeof inspectionSchema>;

// Define the template category schema
export const templateCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean()
});

export type TemplateCategory = z.infer<typeof templateCategorySchema>;

// Define the template approval schema
export const templateApprovalSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  version: z.number(),
  requestedBy: z.string(),
  requestedAt: z.string(),
  approvers: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      status: z.enum(['pending', 'approved', 'rejected']),
      comments: z.string().optional(),
      actedAt: z.string().optional()
    })
  ),
  status: z.enum(['pending', 'approved', 'rejected']),
  completedAt: z.string().optional()
});

export type TemplateApproval = z.infer<typeof templateApprovalSchema>;

// Define the template history schema
export const templateHistorySchema = z.object({
  id: z.string(),
  templateId: z.string(),
  version: z.number(),
  action: z.enum(['created', 'updated', 'archived', 'activated', 'approved', 'rejected']),
  performedBy: z.string(),
  performedAt: z.string(),
  changes: z.array(
    z.object({
      field: z.string(),
      oldValue: z.any().optional(),
      newValue: z.any().optional()
    })
  ).optional(),
  comments: z.string().optional()
});

export type TemplateHistory = z.infer<typeof templateHistorySchema>;

// Define the inspection instance schema (for in-progress inspections)
export const inspectionInstanceSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  templateVersion: z.number(),
  projectId: z.string().optional(),
  itemId: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'approved', 'rejected']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  inspectedBy: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      type: z.string(),
      size: z.number()
    })
  ).optional(),
  sectionResults: z.array(sectionResultSchema),
  metadata: z.record(z.string(), z.any()).optional()
});

export type InspectionInstance = z.infer<typeof inspectionInstanceSchema>;

// Define the inspection result type for individual field results
export const inspectionResultSchema = z.object({
  fieldId: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.date(), z.array(z.string())]),
  status: resultStatusSchema.optional(),
  images: z.array(z.string()).optional(),
  comments: z.string().optional()
});

export type InspectionResult = z.infer<typeof inspectionResultSchema>;