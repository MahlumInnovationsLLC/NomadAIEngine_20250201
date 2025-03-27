export interface Project {
  id: string;
  name: string;
  projectNumber?: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  customer?: string;
  location?: string;
  meAssigned?: string;
  eeAssigned?: string;
  meCadProgress?: number;
  eeDesignProgress?: number;
  productionProgress?: number;
  testingProgress?: number;
  notes?: string;
  isDelayed?: boolean;
  attachments?: Attachment[];
  teams?: ProjectTeam[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProjectTeam {
  id: string;
  name: string;
  role?: string;
  members?: number;
}

export interface ProjectCreationForm {
  name: string;
  description: string;
  projectNumber?: string;
  customer?: string;
  priority: string;
  startDate: string;
  targetCompletionDate: string;
  location?: string;
  meAssigned?: string;
  eeAssigned?: string;
}