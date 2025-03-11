import { z } from "zod";
import { generateUUID } from "@/lib/utils";

// Define schema for calibration records
export const CalibrationRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  performedBy: z.string(),
  result: z.enum(["pass", "fail", "conditional"]),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  nextCalibrationDate: z.string(),
  measurements: z.array(z.object({
    parameter: z.string(),
    nominal: z.number(),
    tolerance: z.number(),
    actual: z.number(),
    unit: z.string(),
    result: z.enum(["pass", "fail"]),
  })).optional(),
  certificationNumber: z.string().optional(),
  calibrationMethod: z.string().optional(),
});

// Define schema for gage attachments
const GageAttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  blobUrl: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
  category: z.enum(["certificate", "procedure", "image", "other"]).optional(),
  description: z.string().optional(),
});

// Define schema for maintenance records
const MaintenanceRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  performedBy: z.string(),
  type: z.enum(["preventive", "corrective", "inspection"]),
  description: z.string(),
  parts: z.array(z.object({
    name: z.string(),
    partNumber: z.string().optional(),
    quantity: z.number(),
  })).optional(),
  result: z.enum(["completed", "pending", "requires_followup"]),
  followUpActions: z.string().optional(),
});

// Define schema for gage validation study
const ValidationStudySchema = z.object({
  id: z.string(),
  type: z.enum(["gage_r&r", "linearity", "bias", "stability"]),
  date: z.string(),
  conductedBy: z.string(),
  result: z.enum(["acceptable", "marginal", "unacceptable"]),
  value: z.number().optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Main Gage schema
export const GageSchema = z.object({
  id: z.string(),
  number: z.string(), // Unique identifier like "GAGE-2023-0001"
  name: z.string(),
  description: z.string(),
  type: z.enum([
    "caliper", 
    "micrometer", 
    "indicator", 
    "gage_block", 
    "cmm", 
    "height_gage", 
    "thread_gage", 
    "pin_gage",
    "bore_gage",
    "depth_gage",
    "surface_plate",
    "optical_comparator",
    "scale",
    "other"
  ]),
  status: z.enum([
    "active", 
    "in_calibration", 
    "out_of_service", 
    "lost", 
    "scrapped",
    "loaned_out"
  ]),
  
  // Physical properties
  serialNumber: z.string(),
  manufacturer: z.string(),
  model: z.string().optional(),
  location: z.string(),
  department: z.string().optional(),
  resolution: z.string().optional(),
  range: z.string().optional(),
  accuracy: z.string().optional(),
  
  // Calibration information
  calibrationFrequency: z.number(), // in days
  lastCalibrationDate: z.string().optional(),
  nextCalibrationDate: z.string(),
  isCalibrationDue: z.boolean().default(false),
  calibrationProcedure: z.string().optional(),
  calibrationProvider: z.string().optional(), // External or internal
  calibrationRecords: z.array(CalibrationRecordSchema).default([]),
  
  // Maintenance
  maintenanceRecords: z.array(MaintenanceRecordSchema).default([]),
  
  // Validation studies (GR&R, etc.)
  validationStudies: z.array(ValidationStudySchema).default([]),
  
  // Usage tracking
  assignedTo: z.string().optional(),
  checkedOutTo: z.string().optional(),
  checkedOutDate: z.string().optional(),
  checkoutHistory: z.array(z.object({
    user: z.string(),
    checkoutDate: z.string(),
    returnDate: z.string().optional(),
    condition: z.string().optional(),
    notes: z.string().optional(),
  })).default([]),
  
  // Documentation
  attachments: z.array(GageAttachmentSchema).default([]),
  
  // Traceability
  certifications: z.array(z.string()).default([]),
  traceabilityNumber: z.string().optional(),
  purchaseInfo: z.object({
    purchaseDate: z.string().optional(),
    purchaseOrder: z.string().optional(),
    cost: z.number().optional(),
    supplier: z.string().optional(),
    warranty: z.object({
      expirationDate: z.string().optional(),
      coverage: z.string().optional(),
    }).optional(),
  }).optional(),
  
  // ISO 9001 related fields
  msa: z.object({
    lastStudyDate: z.string().optional(),
    studyResult: z.enum(["acceptable", "marginal", "unacceptable"]).optional(),
    repeatability: z.number().optional(),
    reproducibility: z.number().optional(),
    percent: z.number().optional(),
  }).optional(),
  
  // Audit fields
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export type Gage = z.infer<typeof GageSchema>;
export type CalibrationRecord = z.infer<typeof CalibrationRecordSchema>;
export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;
export type ValidationStudy = z.infer<typeof ValidationStudySchema>;
export type GageAttachment = z.infer<typeof GageAttachmentSchema>;

// Default values for creating new records
export const defaultCalibrationRecord: Omit<CalibrationRecord, "id"> = {
  date: new Date().toISOString(),
  performedBy: "",
  result: "pass",
  nextCalibrationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default 1 year
  measurements: [],
};

export const defaultMaintenanceRecord: Omit<MaintenanceRecord, "id"> = {
  date: new Date().toISOString(),
  performedBy: "",
  type: "preventive",
  description: "",
  result: "completed",
};

export const defaultValidationStudy: Omit<ValidationStudy, "id"> = {
  type: "gage_r&r",
  date: new Date().toISOString(),
  conductedBy: "",
  result: "acceptable",
};

export const createDefaultGage = (): Gage => ({
  id: generateUUID(),
  number: `GAGE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  name: "",
  description: "",
  type: "other",
  status: "active",
  serialNumber: "",
  manufacturer: "",
  location: "",
  calibrationFrequency: 365, // Default to annual calibration
  nextCalibrationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  isCalibrationDue: false,
  calibrationRecords: [],
  maintenanceRecords: [],
  validationStudies: [],
  checkoutHistory: [],
  attachments: [],
  certifications: [],
  createdBy: "current-user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
});