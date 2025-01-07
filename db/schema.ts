import { pgTable, text, serial, timestamp, jsonb, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Tables
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: serial("version").notNull(),
  chatId: integer("chat_id").references(() => chats.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  searchableText: text("searchable_text"),
  metadata: jsonb("metadata"),
});

export const documentCollaborators = pgTable("document_collaborators", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  userId: text("user_id").notNull(),
  canEdit: boolean("can_edit").default(true).notNull(),
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

// New tables for Club Control
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

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  collaborators: many(documentCollaborators),
  workflows: many(documentWorkflows),
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

// Schemas
export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

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

// Types
export type Document = typeof documents.$inferSelect;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type DocumentWorkflow = typeof documentWorkflows.$inferSelect;
export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type FloorPlan = typeof floorPlans.$inferSelect;