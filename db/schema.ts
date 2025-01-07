import { pgTable, text, serial, timestamp, jsonb, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: serial("chat_id").references(() => chats.id),
  role: text("role", { enum: ['user', 'assistant'] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: serial("version").notNull(),
  chatId: serial("chat_id").references(() => chats.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  searchableText: text("searchable_text"),
  metadata: jsonb("metadata"),
});

export const documentEmbeddings = pgTable("document_embeddings", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").references(() => documents.id),
  embedding: real("embedding").array(),
  section: text("section").notNull(),
  sectionText: text("section_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentCollaborators = pgTable("document_collaborators", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").references(() => documents.id),
  userId: text("user_id").notNull(),
  canEdit: boolean("can_edit").default(true).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  path: text("path").notNull(),
  messageId: serial("message_id").references(() => messages.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  chatId: serial("chat_id").references(() => chats.id),
  content: text("content").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").references(() => documents.id),
  content: text("content").notNull(),
  version: serial("version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
  changeDescription: text("change_description"),
});

export const workflowTemplates = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(),
  userId: text("user_id").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentWorkflows = pgTable("document_workflows", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").references(() => documents.id),
  templateId: serial("template_id").references(() => workflowTemplates.id),
  currentStep: integer("current_step").notNull(),
  status: text("status", { enum: ['active', 'completed', 'paused'] }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const chatRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  reports: many(reports),
  documents: many(documents),
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  files: many(files)
}));

export const documentRelations = relations(documents, ({ many, one }) => ({
  collaborators: many(documentCollaborators),
  embeddings: many(documentEmbeddings),
  chat: one(chats, {
    fields: [documents.chatId],
    references: [chats.id],
  }),
}));

export const documentEmbeddingsRelations = relations(documentEmbeddings, ({ one }) => ({
  document: one(documents, {
    fields: [documentEmbeddings.documentId],
    references: [documents.id],
  }),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
}));

export const workflowTemplateRelations = relations(workflowTemplates, ({ many }) => ({
  documentWorkflows: many(documentWorkflows),
}));

export const documentWorkflowRelations = relations(documentWorkflows, ({ one }) => ({
  document: one(documents, {
    fields: [documentWorkflows.documentId],
    references: [documents.id],
  }),
  template: one(workflowTemplates, {
    fields: [documentWorkflows.templateId],
    references: [workflowTemplates.id],
  }),
}));

// Schemas and Types exports
export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

export const insertFileSchema = createInsertSchema(files);
export const selectFileSchema = createSelectSchema(files);

export const insertReportSchema = createInsertSchema(reports);
export const selectReportSchema = createSelectSchema(reports);

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export const insertDocumentEmbeddingSchema = createInsertSchema(documentEmbeddings);
export const selectDocumentEmbeddingSchema = createSelectSchema(documentEmbeddings);

export const insertDocumentCollaboratorSchema = createInsertSchema(documentCollaborators);
export const selectDocumentCollaboratorSchema = createSelectSchema(documentCollaborators);

export const insertDocumentVersionSchema = createInsertSchema(documentVersions);
export const selectDocumentVersionSchema = createSelectSchema(documentVersions);

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates);
export const selectWorkflowTemplateSchema = createSelectSchema(workflowTemplates);

export const insertDocumentWorkflowSchema = createInsertSchema(documentWorkflows);
export const selectDocumentWorkflowSchema = createSelectSchema(documentWorkflows);

export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type File = typeof files.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type DocumentWorkflow = typeof documentWorkflows.$inferSelect;