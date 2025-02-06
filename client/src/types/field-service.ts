export interface ServiceStats {
  openTickets: number;
  activeTechnicians: number;
  pendingClaims: number;
  satisfactionScore: number;
  feedbackMetrics: {
    totalFeedback: number;
    averageRating: number;
    responseRate: number;
    trendsLastMonth: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

export interface ServiceTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  customer: {
    id: string;
    name: string;
    company: string;
    contact: string;
  };
  productInfo: {
    serialNumber: string;
    model: string;
    installationDate: string;
    warrantyStatus: 'active' | 'expired' | 'pending';
  };
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  aiAnalysis?: {
    priorityScore: number;
    suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    suggestedTechnicians: Array<{
      technicianId: string;
      matchScore: number;
      reasons: string[];
    }>;
    keywords: string[];
    category: string;
    estimatedResolutionTime: number;
    lastAnalyzed: string;
  };
  autoAssignment?: {
    status: 'pending' | 'completed' | 'failed';
    attemptCount: number;
    lastAttempt: string;
    assignmentHistory: Array<{
      timestamp: string;
      technicianId: string;
      status: 'accepted' | 'declined' | 'timeout';
      reason?: string;
    }>;
  };
}

export interface CustomerFeedbackItem {
  id: string;
  ticketId: string;
  rating: number;
  comment: string;
  categories: string[];
  createdAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  requestId?: string; 
  responses?: Array<{
    questionId: string;
    response: string | number | boolean | string[];
  }>;
  iso9001: {
    processDate: string;
    status: 'new' | 'under_review' | 'processed' | 'closed';
    correctiveActions?: Array<{
      id: string;
      description: string;
      assignedTo: string;
      dueDate: string;
      status: 'open' | 'in_progress' | 'completed';
      completionDate?: string;
      effectiveness?: string;
    }>;
    reviewNotes?: string;
    satisfactionCategory: 'product' | 'service' | 'communication' | 'timeliness' | 'other';
    impactLevel: 'low' | 'medium' | 'high';
    resolutionPriority: 'low' | 'medium' | 'high';
    qualityMetrics: {
      responseTime: number; 
      resolutionTime: number; 
      followUpCount: number;
    };
  };
}

export interface FeedbackFormTemplate {
  id: string;
  name: string;
  description: string;
  version: number;
  versionHistory: Array<{
    version: number;
    modifiedAt: string;
    modifiedBy: string;
    changes: string;
  }>;
  questions: Array<{
    id: string;
    type: 'rating' | 'text' | 'multiple_choice' | 'checkbox';
    text: string;
    required: boolean;
    options?: string[];
    category: 'product' | 'service' | 'communication' | 'timeliness' | 'other';
    iso9001Category?: string;
    validationRules?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      minValue?: number;
      maxValue?: number;
    };
  }>;
  isActive: boolean;
  createdAt: string;
  lastModified: string;
  reviewStatus: 'draft' | 'under_review' | 'approved' | 'archived';
  approvedBy?: string;
  approvalDate?: string;
  nextReviewDate: string;
  applicableProducts?: string[];
  targetAudience?: string[];
}

export interface FeedbackRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  templateId: string;
  templateVersion: number;
  status: 'sent' | 'delivered' | 'completed' | 'expired';
  sentAt: string;
  completedAt?: string;
  expiresAt: string;
  remindersSent: number;
  lastReminderAt?: string;
  ticketId?: string;
  responseId?: string;
  deliveryMethod: 'email' | 'sms' | 'portal';
  iso9001: {
    processOwner: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    followUpRequired: boolean;
    followUpDate?: string;
    qualityReviewStatus?: 'pending' | 'reviewed' | 'approved';
    reviewedBy?: string;
    reviewDate?: string;
  };
}