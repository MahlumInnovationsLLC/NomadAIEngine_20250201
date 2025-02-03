import { pgTable, text, serial, timestamp, jsonb, boolean, decimal, integer, uuid } from "drizzle-orm/pg-core";
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
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
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
  modelNumber: text("model_number"),
  modelYear: integer("model_year"),
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
  imageUrl: text("image_url"),
  imagePath: text("image_path"),
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

// New tables for skill assessment
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  level: integer("level").notNull(),
  prerequisites: jsonb("prerequisites"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  skillId: integer("skill_id").references(() => skills.id),
  score: decimal("score", { precision: 4, scale: 2 }),
  confidenceLevel: decimal("confidence_level", { precision: 4, scale: 2 }),
  assessmentData: jsonb("assessment_data"),
  recommendedModules: jsonb("recommended_modules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const requiredSkills = pgTable("required_skills", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id),
  skillId: integer("skill_id").references(() => skills.id),
  requiredLevel: integer("required_level").notNull(),
  importance: text("importance", { enum: ['critical', 'important', 'nice_to_have'] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  skillId: integer("skill_id").references(() => skills.id),
  currentLevel: integer("current_level").notNull(),
  targetLevel: integer("target_level"),
  lastAssessedAt: timestamp("last_assessed_at"),
  progress: jsonb("progress"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ['module_assigned', 'assessment_due', 'achievement_earned', 'module_completed', 'system'] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  metadata: jsonb("metadata"),
  priority: text("priority", { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  notificationId: integer("notification_id").references(() => notifications.id),
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add to the existing schema, after notifications table
export const facilityNotifications = pgTable("facility_notifications", {
  id: serial("id").primaryKey(),
  buildingSystemId: integer("building_system_id").references(() => buildingSystems.id),
  type: text("type", {
    enum: ['maintenance_due', 'system_error', 'inspection_required', 'health_alert', 'status_change']
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority", {
    enum: ['low', 'medium', 'high', 'critical']
  }).notNull().default('medium'),
  status: text("status", {
    enum: ['unread', 'read', 'acknowledged', 'resolved']
  }).notNull().default('unread'),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
});

// Add support ticket tables
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", {
    enum: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']
  }).notNull().default('open'),
  priority: text("priority", {
    enum: ['low', 'medium', 'high', 'urgent']
  }).notNull().default('medium'),
  category: text("category").notNull(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  submitterCompany: text("submitter_company").notNull(),
  assignedTo: text("assigned_to"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
});

export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id),
  authorId: text("author_id").notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ticketHistory = pgTable("ticket_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: text("changed_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Update the ai_engine_activity table schema
export const aiEngineActivity = pgTable("ai_engine_activity", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  feature: text("feature", {
    enum: ['chat', 'web_search', 'document_analysis', 'equipment_prediction', 'report_generation']
  }).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: decimal("duration_minutes", { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add integration configs table
export const integrationConfigs = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  integrationId: text("integration_id").notNull(),
  apiKey: text("api_key"),
  enabled: boolean("enabled").default(false).notNull(),
  syncFrequency: text("sync_frequency").default("daily").notNull(),
  webhookUrl: text("webhook_url"),
  customFields: jsonb("custom_fields").default({}).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Add new member-related tables
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  joinDate: timestamp("join_date").defaultNow().notNull(),
  membershipStatus: text("membership_status", {
    enum: ['active', 'inactive', 'pending', 'cancelled']
  }).notNull().default('active'),
  membershipType: text("membership_type").notNull(),
  lastVisit: timestamp("last_visit"),
  totalVisits: integer("total_visits").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memberHealthData = pgTable("member_health_data", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  metricType: text("metric_type", {
    enum: ['steps', 'heart_rate', 'sleep', 'calories', 'weight', 'blood_pressure']
  }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  source: text("source").notNull(), // Device or platform that provided the data
  confidence: decimal("confidence", { precision: 4, scale: 2 }),
  metadata: jsonb("metadata"),
});

export const memberPreferences = pgTable("member_preferences", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  category: text("category", {
    enum: ['workout', 'nutrition', 'communication', 'goals']
  }).notNull(),
  preferences: jsonb("preferences").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memberAiInsights = pgTable("member_ai_insights", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  insightType: text("insight_type", {
    enum: ['health_trend', 'behavior_pattern', 'recommendation', 'risk_assessment']
  }).notNull(),
  content: jsonb("content").notNull(),
  confidence: decimal("confidence", { precision: 4, scale: 2 }).notNull(),
  status: text("status", {
    enum: ['active', 'archived', 'invalidated']
  }).notNull().default('active'),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  validUntil: timestamp("valid_until"),
  metadata: jsonb("metadata"),
});

// Add after the member-related tables and before relations section
export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  workoutPlanId: text("workout_plan_id").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  status: text("status", { enum: ['in_progress', 'completed', 'cancelled'] }).notNull().default('in_progress'),
  notes: text("notes"),
  totalCaloriesBurned: decimal("total_calories_burned", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workoutSetLogs = pgTable("workout_set_logs", {
  id: serial("id").primaryKey(),
  workoutLogId: integer("workout_log_id").references(() => workoutLogs.id),
  exerciseId: text("exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  reps: integer("reps"),
  timeToComplete: integer("time_to_complete"), // in seconds
  difficultyRating: integer("difficulty_rating"), // 1-5 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add new tables for building systems and inspections
export const buildingSystems = pgTable("building_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status", {
    enum: ['operational', 'maintenance', 'offline', 'error']
  }).notNull().default('operational'),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  healthScore: decimal("health_score", { precision: 5, scale: 2 }), // Increased precision to handle scores up to 999.99
  location: text("location"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const facilityInspections = pgTable("facility_inspections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  status: text("status", {
    enum: ['pending', 'in_progress', 'completed', 'overdue']
  }).notNull().default('pending'),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  inspector: text("inspector"),
  findings: jsonb("findings"),
  issues: jsonb("issues"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add after the existing tables
export const customerSegments = pgTable("customer_segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  aiGenerated: boolean("ai_generated").default(false),
  confidenceScore: decimal("confidence_score", { precision: 4, scale: 2 }),
  totalCustomers: integer("total_customers").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const customerSegmentMemberships = pgTable("customer_segment_memberships", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").references(() => customerSegments.id),
  customerId: text("customer_id").notNull(),
  score: decimal("score", { precision: 4, scale: 2 }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const segmentAnalytics = pgTable("segment_analytics", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").references(() => customerSegments.id),
  metricType: text("metric_type", {
    enum: ['engagement_rate', 'conversion_rate', 'revenue', 'churn_risk']
  }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  period: text("period").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Add after the customerSegments table and before relations section
export const marketingEvents = pgTable("marketing_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  type: text("type", {
    enum: ['campaign', 'meeting', 'deadline', 'event', 'social_media', 'email_blast']
  }).notNull(),
  status: text("status", {
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled']
  }).notNull().default('scheduled'),
  location: text("location"),
  createdBy: text("created_by").notNull(),
  outlookEventId: text("outlook_event_id"),
  outlookCalendarId: text("outlook_calendar_id"),
  lastSyncedAt: timestamp("last_synced_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingEventAttendees = pgTable("marketing_event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => marketingEvents.id),
  userId: text("user_id").notNull(),
  status: text("status", {
    enum: ['pending', 'accepted', 'declined', 'tentative']
  }).notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add new tables for module notes and bookmarks
export const moduleNotes = pgTable("module_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moduleId: integer("module_id").references(() => trainingModules.id),
  sectionId: text("section_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moduleBookmarks = pgTable("module_bookmarks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moduleId: integer("module_id").references(() => trainingModules.id),
  sectionId: text("section_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modulePrerequisites = pgTable("module_prerequisites", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => trainingModules.id),
  prerequisiteId: integer("prerequisite_id").references(() => trainingModules.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add after the existing tables
export const fitnessMillestones = pgTable("fitness_milestones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type", {
    enum: ['workout', 'nutrition', 'health', 'progress', 'consistency']
  }).notNull(),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  icon: text("icon"),
  badgeImage: text("badge_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userMilestones = pgTable("user_milestones", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  milestoneId: integer("milestone_id").references(() => fitnessMillestones.id),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  progress: decimal("progress", { precision: 5, scale: 2 }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const milestoneCelebrations = pgTable("milestone_celebrations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  milestoneId: integer("milestone_id").references(() => fitnessMillestones.id),
  celebratedAt: timestamp("celebrated_at").defaultNow().notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
});

// Add after existing tables
export const capaCategories = pgTable("capa_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  severity: text("severity", {
    enum: ["low", "medium", "high", "critical"]
  }).notNull(),
  requiresApproval: boolean("requires_approval").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add category field to capas table
export const capas = pgTable("capas", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", {
    enum: ["draft", "open", "in_progress", "completed", "verified", "closed"]
  }).notNull().default("draft"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "critical"]
  }).notNull(),
  type: text("type", {
    enum: ["corrective", "preventive", "improvement"]
  }).notNull(),
  category_id: integer("category_id").references(() => capaCategories.id),

  // 8D Methodology Steps
  d1_description: text("d1_description").notNull(),
  d1_owner: text("d1_owner").notNull(),
  d1_due_date: timestamp("d1_due_date").notNull(),
  d1_status: text("d1_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d1_completed_date: timestamp("d1_completed_date"),
  d1_comments: text("d1_comments"),
  d1_team_members: text("d1_team_members").array(),

  d2_description: text("d2_description").notNull(),
  d2_owner: text("d2_owner").notNull(),
  d2_due_date: timestamp("d2_due_date").notNull(),
  d2_status: text("d2_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d2_completed_date: timestamp("d2_completed_date"),
  d2_comments: text("d2_comments"),

  d3_description: text("d3_description").notNull(),
  d3_owner: text("d3_owner").notNull(),
  d3_due_date: timestamp("d3_due_date").notNull(),
  d3_status: text("d3_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d3_completed_date: timestamp("d3_completed_date"),
  d3_comments: text("d3_comments"),

  d4_description: text("d4_description").notNull(),
  d4_owner: text("d4_owner").notNull(),
  d4_due_date: timestamp("d4_due_date").notNull(),
  d4_status: text("d4_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d4_completed_date: timestamp("d4_completed_date"),
  d4_comments: text("d4_comments"),

  d5_description: text("d5_description").notNull(),
  d5_owner: text("d5_owner").notNull(),
  d5_due_date: timestamp("d5_due_date").notNull(),
  d5_status: text("d5_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d5_completed_date: timestamp("d5_completed_date"),
  d5_comments: text("d5_comments"),

  d6_description: text("d6_description").notNull(),
  d6_owner: text("d6_owner").notNull(),
  d6_due_date: timestamp("d6_due_date").notNull(),
  d6_status: text("d6_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d6_completed_date: timestamp("d6_completed_date"),
  d6_comments: text("d6_comments"),

  d7_description: text("d7_description").notNull(),
  d7_owner: text("d7_owner").notNull(),
  d7_due_date: timestamp("d7_due_date").notNull(),
  d7_status: text("d7_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d7_completed_date: timestamp("d7_completed_date"),
  d7_comments: text("d7_comments"),

  d8_description: text("d8_description").notNull(),
  d8_owner: text("d8_owner").notNull(),
  d8_due_date: timestamp("d8_due_date").notNull(),
  d8_status: text("d8_status", { enum: ["pending", "in_progress", "completed", "verified"] }).notNull().default("pending"),
  d8_completed_date: timestamp("d8_completed_date"),
  d8_comments: text("d8_comments"),

  verificationMethod: text("verification_method").notNull(),
  effectivenessReview: text("effectiveness_review"),
  scheduledReviewDate: timestamp("scheduled_review_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
  department: text("department").notNull(),
  area: text("area").notNull(),
  sourceNcrId: text("source_ncr_id"),
  sourceInspectionId: text("source_inspection_id"),
});

export const capaActions = pgTable("capa_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  capaId: uuid("capa_id").references(() => capas.id),
  action: text("action").notNull(),
  type: text("type", {
    enum: ["corrective", "preventive"]
  }).notNull(),
  assignedTo: text("assigned_to").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status", {
    enum: ["pending", "in_progress", "completed", "verified"]
  }).notNull().default("pending"),
  completedDate: timestamp("completed_date"),
  verifiedBy: text("verified_by"),
  verificationDate: timestamp("verification_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Update the supplier corrective actions table schema
export const supplierCorrectiveActions = pgTable("supplier_corrective_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull(),
  supplierId: text("supplier_id").notNull(),
  supplierName: text("supplier_name").notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  responseRequired: timestamp("response_required").notNull(),
  status: text("status", {
    enum: ["draft", "issued", "supplier_response", "review", "closed"]
  }).notNull().default("draft"),

  // Issue Details
  issueDescription: text("issue_description").notNull(),
  issuePartNumbers: text("issue_part_numbers").array(),
  issueLotNumbers: text("issue_lot_numbers").array(),
  issueQuantityAffected: integer("issue_quantity_affected"),
  issueOccurrenceDate: timestamp("issue_occurrence_date").notNull(),
  issueCategory: text("issue_category", {
    enum: ["quality", "delivery", "documentation", "other"]
  }).notNull(),
  issueSeverity: text("issue_severity", {
    enum: ["minor", "major", "critical"]
  }).notNull(),

  // Containment Actions
  containmentActions: jsonb("containment_actions").notNull(),

  // Root Cause Analysis
  rootCauseMethod: text("root_cause_method"),
  rootCauseFindings: text("root_cause_findings"),
  rootCauseAttachments: text("root_cause_attachments").array(),

  // Corrective Actions
  correctiveActions: jsonb("corrective_actions").notNull(),

  // Preventive Actions
  preventiveActions: jsonb("preventive_actions").notNull(),

  // Verification
  verificationMethod: text("verification_method").notNull(),
  verificationResults: text("verification_results"),
  verifiedBy: text("verified_by"),
  verificationDate: timestamp("verification_date"),

  attachments: text("attachments").array(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add after existing tables and before relations section
export const materialReviewBoards = pgTable("material_review_boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", {
    enum: ["material", "assembly", "component", "finished_product"]
  }).notNull(),
  severity: text("severity", {
    enum: ["minor", "major", "critical"]
  }).notNull(),
  status: text("status", {
    enum: ["pending_review", "in_review", "disposition_pending", "approved", "rejected", "closed"]
  }).notNull().default("pending_review"),

  // Material/Part Information
  partNumber: text("part_number").notNull(),
  lotNumber: text("lot_number"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  location: text("location").notNull(),

  // Related Documents
  ncrNumber: text("ncr_number"),
  capaNumber: text("capa_number"),

  // Review Details
  nonconformanceDescription: text("nonconformance_description").notNull(),
  detectedBy: text("detected_by").notNull(),
  detectedDate: timestamp("detected_date").notNull(),
  defectType: text("defect_type").notNull(),
  rootCause: text("root_cause"),

  // Cost Impact
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  reworkCost: decimal("rework_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),

  // Disposition
  dispositionDecision: text("disposition_decision", {
    enum: ["use_as_is", "rework", "repair", "return_to_supplier", "scrap", "deviate"]
  }),
  dispositionJustification: text("disposition_justification"),
  dispositionConditions: text("disposition_conditions"),
  approvedBy: text("approved_by").array(),
  approvalDate: timestamp("approval_date"),

  // Engineering Review
  engineeringReviewer: text("engineering_reviewer"),
  engineeringReviewDate: timestamp("engineering_review_date"),
  engineeringFindings: text("engineering_findings"),
  engineeringRecommendations: text("engineering_recommendations"),
  engineeringApproved: boolean("engineering_approved"),

  // Attachments
  attachments: jsonb("attachments").default([]),

  // Audit Trail
  history: jsonb("history").default([]),

  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mrbActions = pgTable("mrb_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  mrbId: uuid("mrb_id").references(() => materialReviewBoards.id),
  description: text("description").notNull(),
  assignedTo: text("assigned_to").notNull(),
  dueDate: timestamp("due_date").notNull(),
  completedDate: timestamp("completed_date"),
  status: text("status", {
    enum: ["pending", "in_progress", "completed"]
  }).notNull().default("pending"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const documentsRelations =relations(documents, ({ many }) => ({
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
    references: [documents.id],  }),
}));

export const chatsRelations = relations(chats, ({ many }) => ({messages:many(messages),
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
  notes: many(moduleNotes),
  bookmarks: many(moduleBookmarks),
  prerequisites: many(modulePrerequisites),
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

// Add relations for new tables
export const skillsRelations = relations(skills, ({ many }) => ({
  assessments: many(skillAssessments),
  requiredFor: many(requiredSkills),
  userSkills: many(userSkills),
}));

export const skillAssessmentsRelations = relations(skillAssessments, ({ one }) => ({
  skill: one(skills, {
    fields: [skillAssessments.skillId],
    references: [skills.id],
  }),
}));

export const requiredSkillsRelations = relations(requiredSkills, ({ one }) => ({
  role: one(roles, {
    fields: [requiredSkills.roleId],
    references: [roles.id],
  }),
  skill: one(skills, {
    fields: [requiredSkills.skillId],
    references: [skills.id],
  }),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

// Add to relations section
export const notificationsRelations = relations(notifications, ({ many }) => ({
  userNotifications: many(userNotifications),
}));

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  notification: one(notifications, {
    fields: [userNotifications.notificationId],
    references: [notifications.id],
  }),
}));

// Add to relations section
export const aiEngineActivityRelations = relations(aiEngineActivity, ({ many }) => ({
  // Future relations can be added here
}));

// Add relations
export const supportTicketsRelations = relations(supportTickets, ({ many }) => ({
  comments: many(ticketComments),
  history: many(ticketHistory),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketComments.ticketId],
    references: [supportTickets.id],
  }),
}));

export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketHistory.ticketId],
    references: [supportTickets.id],
  }),
}));

// Add to relations section
export const integrationConfigsRelations = relations(integrationConfigs, ({ }) => ({
  // Future relations can be added here if needed
}));

// Add relations
export const customerSegmentsRelations = relations(customerSegments, ({ many }) => ({
  memberships: many(customerSegmentMemberships),
  analytics: many(segmentAnalytics),
}));

export const customerSegmentMembershipsRelations = relations(customerSegmentMemberships, ({ one }) => ({
  segment: one(customerSegments, {
    fields: [customerSegmentMemberships.segmentId],
    references: [customerSegments.id],
  }),
}));

export const segmentAnalyticsRelations = relations(segmentAnalytics, ({ one }) => ({
  segment: one(customerSegments, {
    fields: [segmentAnalytics.segmentId],
    references: [customerSegments.id],
  }),
}));

// Add to relations section
export const marketingEventsRelations = relations(marketingEvents, ({ many }) => ({
  attendees: many(marketingEventAttendees),
}));

export const marketingEventAttendeesRelations = relations(marketingEventAttendees, ({ one }) => ({
  event: one(marketingEvents, {
    fields: [marketingEventAttendees.eventId],
    references: [marketingEvents.id],
  }),
}));

// Add relations for the new tables
export const moduleNotesRelations = relations(moduleNotes, ({ one }) => ({
  module: one(trainingModules, {
    fields: [moduleNotes.moduleId],
    references: [trainingModules.id],
  }),
}));

export const moduleBookmarksRelations = relations(moduleBookmarks, ({ one }) => ({
  module: one(trainingModules, {
    fields: [moduleBookmarks.moduleId],
    references: [trainingModules.id],
  }),
}));

export const modulePrerequisitesRelations = relations(modulePrerequisites, ({ one }) => ({
  module: one(trainingModules, {
    fields: [modulePrerequisites.moduleId],
    references: [trainingModules.id],
  }),
  prerequisite: one(trainingModules, {
    fields: [modulePrerequisites.prerequisiteId],
    references: [trainingModules.id],
  }),
}));

// Add relations for milestone tables
export const fitnessmilestonesRelations = relations(fitnessMillestones, ({ many }) => ({
  userMilestones: many(userMilestones),
  celebrations: many(milestoneCelebrations),
}));

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  milestone: one(fitnessMillestones, {
    fields: [userMilestones.milestoneId],
    references: [fitnessMillestones.id],
  }),
}));

export const milestoneCelebrationsRelations = relations(milestoneCelebrations, ({ one }) => ({
  milestone: one(fitnessMillestones, {
    fields: [milestoneCelebrations.milestoneId],
    references: [fitnessMillestones.id],
  }),
}));

// Add relations
export const workoutLogsRelations = relations(workoutLogs, ({ many, one }) => ({
  sets: many(workoutSetLogs),
  member: one(members, {
    fields: [workoutLogs.memberId],
    references: [members.id],
  }),
}));

export const workoutSetLogsRelations = relations(workoutSetLogs, ({ one }) => ({
  workoutLog: one(workoutLogs, {
    fields: [workoutSetLogs.workoutLogId],
    references: [workoutLogs.id],
  }),
}));

// Add relations
export const buildingSystemsRelations = relations(buildingSystems, ({ many }) => ({
  notifications: many(facilityNotifications)
}));

export const facilityInspectionsRelations = relations(facilityInspections, ({ }) => ({
  // Future relations can be added here
}));

// Add to relations section
export const facilityNotificationsRelations = relations(facilityNotifications, ({ one }) => ({
  buildingSystem: one(buildingSystems, {
    fields: [facilityNotifications.buildingSystemId],
    references: [buildingSystems.id],
  }),
}));
// Add after the capaCategories relations section
export const capasRelations = relations(capas, ({ one }) => ({
  category: one(capaCategories, {
    fields: [capas.category_id],
    references: [capaCategories.id],
  }),
}));

export const capaCategoriesRelations = relations(capaCategories, ({ many }) => ({
  capas: many(capas),
}));

export const capaActionsRelations = relations(capaActions, ({ one }) => ({
  capa: one(capas, {
    fields: [capaActions.capaId],
    references: [capas.id],
  }),
}));

// Add to relations section
export const materialReviewBoardsRelations = relations(materialReviewBoards, ({ many }) => ({
  actions: many(mrbActions)
}));

export const mrbActionsRelations = relations(mrbActions, ({ one }) => ({
  mrb: one(materialReviewBoards, {
    fields: [mrbActions.mrbId],
    references: [materialReviewBoards.id],
  }),
}));

// Schemas
export const insertMemberSchema = createInsertSchema(members);
export const selectMemberSchema = createSelectSchema(members);

export const insertMemberHealthDataSchema = createInsertSchema(memberHealthData);
export const selectMemberHealthDataSchema = createSelectSchema(memberHealthData);

export const insertMemberPreferencesSchema = createInsertSchema(memberPreferences);
export const selectMemberPreferencesSchema = createSelectSchema(memberPreferences);

export const insertMemberAiInsightsSchema = createInsertSchema(memberAiInsights);
export const selectMemberAiInsightsSchema = createSelectSchema(memberAiInsights);

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs);
export const selectWorkoutLogSchema = createSelectSchema(workoutLogs);

export const insertWorkoutSetLogSchema = createInsertSchema(workoutSetLogs);
export const selectWorkoutSetLogSchema = createSelectSchema(workoutSetLogs);

// Add schemas for new tables
export const insertCustomerSegmentSchema = createInsertSchema(customerSegments);
export const selectCustomerSegmentSchema = createSelectSchema(customerSegments);

export const insertCustomerSegmentMembershipSchema = createInsertSchema(customerSegmentMemberships);
export const selectCustomerSegmentMembershipSchema = createSelectSchema(customerSegmentMemberships);

export const insertSegmentAnalyticSchema = createInsertSchema(segmentAnalytics);
export const selectSegmentAnalyticSchema = createSelectSchema(segmentAnalytics);

// Add to schemas section
export const insertMarketingEventSchema = createInsertSchema(marketingEvents);
export const selectMarketingEventSchema = createSelectSchema(marketingEvents);

export const insertMarketingEventAttendeeSchema = createInsertSchema(marketingEventAttendees);
export const selectMarketingEventAttendeeSchema = createSelectSchema(marketingEventAttendees);

// Add schemas for new tables
export const insertModuleNoteSchema = createInsertSchema(moduleNotes);
export const selectModuleNoteSchema = createSelectSchema(moduleNotes);

export const insertModuleBookmarkSchema = createInsertSchema(moduleBookmarks);
export const selectModuleBookmarkSchema = createSelectSchema(moduleBookmarks);

export const insertModulePrerequisiteSchema = createInsertSchema(modulePrerequisites);
export const selectModulePrerequisiteSchema = createSelectSchema(modulePrerequisites);

// Add schemas for milestone tables
export const insertFitnessMilestoneSchema = createInsertSchema(fitnessMillestones);
export const selectFitnessMilestoneSchema = createSelectSchema(fitnessMillestones);

export const insertUserMilestoneSchema = createInsertSchema(userMilestones);
export const selectUserMilestoneSchema = createSelectSchema(userMilestones);

export const insertMilestoneCelebrationSchema = createInsertSchema(milestoneCelebrations);
export const selectMilestoneCelebrationSchema = createSelectSchema(milestoneCelebrations);

// Add schemas
export const insertBuildingSystemSchema = createInsertSchema(buildingSystems);
export const selectBuildingSystemSchema = createSelectSchema(buildingSystems);

export const insertFacilityInspectionSchema = createInsertSchema(facilityInspections);
export const selectFacilityInspectionSchema = createSelectSchema(facilityInspections);

// Add schemas
export const insertFacilityNotificationSchema = createInsertSchema(facilityNotifications);
export const selectFacilityNotificationSchema = createSelectSchema(facilityNotifications);

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

// Add types for new tables
export type Skill = typeof skills.$inferSelect;
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type RequiredSkill = typeof requiredSkills.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;

// Add to types section
export type Notification = typeof notifications.$inferSelect;
export type UserNotification = typeof userNotifications.$inferSelect;

// Add to types section
export type AiEngineActivity = typeof aiEngineActivity.$inferSelect;

// Add types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type TicketComment = typeof ticketComments.$inferSelect;
export type TicketHistory = typeof ticketHistory.$inferSelect;

// Add to types section
export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type NewIntegrationConfig = typeof integrationConfigs.$inferInsert;

//Add types for new tables
export type CustomerSegment = typeof customerSegments.$inferSelect;
export type CustomerSegmentMembership = typeof customerSegmentMemberships.$inferSelect;
export type SegmentAnalytic = typeof segmentAnalytics.$inferSelect;

//Add types for new tables
export type MarketingEvent = typeof marketingEvents.$inferSelect;
export type NewMarketingEvent = typeof marketingEvents.$inferInsert;
export type MarketingEventAttendee = typeof marketingEventAttendees.$inferSelect;
export type NewMarketingEventAttendee = typeof marketingEventAttendees.$inferInsert;

// Add types for new tables
export type ModuleNote = typeof moduleNotes.$inferSelect;
export type ModuleBookmark = typeof moduleBookmarks.$inferSelect;
export type ModulePrerequisite = typeof modulePrerequisites.$inferSelect;

// Add types for milestone tables
export type FitnessMilestone = typeof fitnessMillestones.$inferSelect;
export type UserMilestone = typeof userMilestones.$inferSelect;
export type MilestoneCelebration = typeof milestoneCelebrations.$inferSelect;

// Add types for the new tables
export type Member = typeof members.$inferSelect;
export type MemberHealthData = typeof memberHealthData.$inferSelect;
export type MemberPreferences = typeof memberPreferences.$inferSelect;
export type MemberAiInsights = typeof memberAiInsights.$inferSelect;

export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;
export type SelectWorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutSetLog = typeof workoutSetLogs.$inferInsert;
export type SelectWorkoutSetLog = typeof workoutSetLogs.$inferSelect;

export type BuildingSystem = typeof buildingSystems.$inferSelect;
export type FacilityInspection = typeof facilityInspections.$inferSelect;

// Add types for facility notifications
export type FacilityNotification = typeof facilityNotifications.$inferSelect;

// Add types for CAPA
export type Capa = typeof capas.$inferSelect;
export type CapaAction = typeof capaActions.$inferSelect;
export type MaterialReviewBoard = typeof materialReviewBoards.$inferSelect;
export type MrbAction = typeof mrbActions.$inferSelect;
import { integer } from "drizzle-orm/pg-core";