import { pgTable, text, serial, timestamp, jsonb, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Tables
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  blobStorageUrl: text("blob_storage_url").notNull(),
  blobStorageContainer: text("blob_storage_container").notNull(),
  blobStoragePath: text("blob_storage_path").notNull(),
  version: text("version").notNull(),
  status: text("status", { enum: ['draft', 'in_review', 'approved', 'released', 'archived'] }).notNull(),
  documentType: text("document_type").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"),
  checksum: text("checksum"),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  searchableText: text("searchable_text"),
  tags: text("tags").array(),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  version: text("version").notNull(),
  blobStorageUrl: text("blob_storage_url").notNull(),
  blobStoragePath: text("blob_storage_path").notNull(),
  changelog: text("changelog"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  status: text("status", { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reviewerUserId: text("reviewer_user_id"),
  reviewerNotes: text("reviewer_notes"),
  approvedAt: timestamp("approved_at"),
});

export const documentApprovals = pgTable("document_approvals", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  version: text("version").notNull(),
  approverUserId: text("approver_user_id").notNull(),
  status: text("status", { enum: ['pending', 'approved', 'rejected'] }).notNull(),
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentCollaborators = pgTable("document_collaborators", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  userId: text("user_id").notNull(),
  role: text("role", { enum: ['viewer', 'editor', 'approver', 'owner'] }).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id),
  role: text("role", { enum: ['user', 'assistant'] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentWorkflows = pgTable("document_workflows", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  status: text("status", { enum: ['active', 'completed', 'paused'] }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const equipmentTypes = pgTable("equipment_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  category: text("category").notNull(),
  connectivityType: text("connectivity_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  equipmentTypeId: integer("equipment_type_id").references(() => equipmentTypes.id),
  serialNumber: text("serial_number"),
  lastMaintenance: timestamp("last_maintenance"),
  nextMaintenance: timestamp("next_maintenance"),
  status: text("status", { enum: ['active', 'maintenance', 'offline', 'error'] }).notNull(),
  healthScore: decimal("health_score", { precision: 4, scale: 2 }),
  maintenanceScore: decimal("maintenance_score", { precision: 4, scale: 2 }),
  riskFactors: jsonb("risk_factors"),
  lastPredictionUpdate: timestamp("last_prediction_update"),
  position: jsonb("position"),
  metadata: jsonb("metadata"),
  maintenanceType: text("maintenance_type"),
  maintenanceNotes: text("maintenance_notes"),
  deviceConnectionStatus: text("device_connection_status", { enum: ['connected', 'disconnected', 'pairing'] }),
  deviceType: text("device_type"),
  deviceIdentifier: text("device_identifier"),
  lastSyncTime: timestamp("last_sync_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const floorPlans = pgTable("floor_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dimensions: jsonb("dimensions").notNull(),
  gridSize: integer("grid_size").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New tables for roles and training
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  level: integer("level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  assignedBy: text("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  requiredRoleLevel: integer("required_role_level").notNull(),
  dueDate: timestamp("due_date"),
  content: jsonb("content"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTraining = pgTable("user_training", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moduleId: integer("module_id").references(() => trainingModules.id),
  status: text("status", { enum: ['not_started', 'in_progress', 'completed'] }).notNull(),
  progress: integer("progress").default(0),
  assignedBy: text("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const documentPermissions = pgTable("document_permissions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  roleLevel: integer("role_level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  versions: many(documentVersions),
  approvals: many(documentApprovals),
  collaborators: many(documentCollaborators),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
}));

export const documentApprovalsRelations = relations(documentApprovals, ({ one }) => ({
  document: one(documents, {
    fields: [documentApprovals.documentId],
    references: [documents.id],
  }),
}));

export const documentCollaboratorsRelations = relations(documentCollaborators, ({ one }) => ({
  document: one(documents, {
    fields: [documentCollaborators.documentId],
    references: [documents.id],
  }),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  documents: many(documents),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const documentWorkflowsRelations = relations(documentWorkflows, ({ one }) => ({
  document: one(documents, {
    fields: [documentWorkflows.documentId],
    references: [documents.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  type: one(equipmentTypes, {
    fields: [equipment.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
}));

//Add relations for new tables
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const trainingModulesRelations = relations(trainingModules, ({ many }) => ({
  userTraining: many(userTraining),
}));

export const userTrainingRelations = relations(userTraining, ({ one }) => ({
  module: one(trainingModules, {
    fields: [userTraining.moduleId],
    references: [trainingModules.id],
  }),
}));

export const documentPermissionsRelations = relations(documentPermissions, ({ one }) => ({
  document: one(documents, {
    fields: [documentPermissions.documentId],
    references: [documents.id],
  }),
}));


// Schemas
export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export const insertDocumentVersionSchema = createInsertSchema(documentVersions);
export const selectDocumentVersionSchema = createSelectSchema(documentVersions);

export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals);
export const selectDocumentApprovalSchema = createSelectSchema(documentApprovals);

export const insertDocumentCollaboratorSchema = createInsertSchema(documentCollaborators);
export const selectDocumentCollaboratorSchema = createSelectSchema(documentCollaborators);

export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

export const insertDocumentWorkflowSchema = createInsertSchema(documentWorkflows);
export const selectDocumentWorkflowSchema = createSelectSchema(documentWorkflows);

export const insertEquipmentTypeSchema = createInsertSchema(equipmentTypes);
export const selectEquipmentTypeSchema = createSelectSchema(equipmentTypes);

export const insertEquipmentSchema = createInsertSchema(equipment);
export const selectEquipmentSchema = createSelectSchema(equipment);

export const insertFloorPlanSchema = createInsertSchema(floorPlans);
export const selectFloorPlanSchema = createSelectSchema(floorPlans);

//Add schemas for new tables
export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);

export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);

export const insertTrainingModuleSchema = createInsertSchema(trainingModules);
export const selectTrainingModuleSchema = createSelectSchema(trainingModules);

export const insertUserTrainingSchema = createInsertSchema(userTraining);
export const selectUserTrainingSchema = createSelectSchema(userTraining);

export const insertDocumentPermissionSchema = createInsertSchema(documentPermissions);
export const selectDocumentPermissionSchema = createSelectSchema(documentPermissions);

// Types
export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type DocumentApproval = typeof documentApprovals.$inferSelect;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type DocumentWorkflow = typeof documentWorkflows.$inferSelect;
export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type FloorPlan = typeof floorPlans.$inferSelect;

//Add types for new tables
export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type UserTraining = typeof userTraining.$inferSelect;
export type DocumentPermission = typeof documentPermissions.$inferSelect;