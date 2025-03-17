import api from './apiProxy';

export interface TeamMember {
  id: string;
  type: "team_member";
  name: string;
  role: string;
  skills: string[];
  workload: number;
  availability: number;
  currentProjects: string[];
  hoursAllocated: number;
  hoursEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  type: "team";
  name: string;
  description: string;
  members: string[];
  lead?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAllocation {
  id: string;
  type: "resource_allocation";
  memberId: string;
  projectId: string;
  allocation: number;
  startDate: string;
  endDate?: string;
  role?: string;
  hoursAllocated: number;
  hoursEarned: number;
  createdAt: string;
  updatedAt: string;
}

// Get all team members
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await api.get('/api/manufacturing/resources/team');
    return response;
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    throw error;
  }
}

// Get all teams
export async function getAllTeams(): Promise<Team[]> {
  try {
    const response = await api.get('/api/manufacturing/resources/teams');
    return response;
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    throw error;
  }
}

// Get a single team by ID
export async function getTeamById(id: string): Promise<Team> {
  try {
    const response = await api.get(`/api/manufacturing/resources/teams/${id}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch team ${id}:`, error);
    throw error;
  }
}

// Create a new team member
export async function createTeamMember(teamMember: Omit<TeamMember, 'id' | 'type' | 'workload' | 'availability' | 'currentProjects' | 'hoursAllocated' | 'hoursEarned' | 'createdAt' | 'updatedAt'>): Promise<TeamMember> {
  try {
    const response = await api.post('/api/manufacturing/resources/team', teamMember);
    return response;
  } catch (error) {
    console.error('Failed to create team member:', error);
    throw error;
  }
}

// Create a new team
export async function createTeam(team: Omit<Team, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Team> {
  try {
    const response = await api.post('/api/manufacturing/resources/teams', team);
    return response;
  } catch (error) {
    console.error('Failed to create team:', error);
    throw error;
  }
}

// Update a team
export async function updateTeam(id: string, team: Partial<Omit<Team, 'id' | 'type' | 'createdAt' | 'updatedAt'>>): Promise<Team> {
  try {
    const response = await api.put(`/api/manufacturing/resources/teams/${id}`, team);
    return response;
  } catch (error) {
    console.error(`Failed to update team ${id}:`, error);
    throw error;
  }
}

// Add a member to a team
export async function addMemberToTeam(teamId: string, memberId: string): Promise<Team> {
  try {
    const response = await api.post(`/api/manufacturing/resources/teams/${teamId}/members/${memberId}`);
    return response;
  } catch (error) {
    console.error(`Failed to add member ${memberId} to team ${teamId}:`, error);
    throw error;
  }
}

// Get all resource allocations
export async function getAllAllocations(): Promise<ResourceAllocation[]> {
  try {
    const response = await api.get('/api/manufacturing/resources/allocations');
    return response;
  } catch (error) {
    console.error('Failed to fetch allocations:', error);
    throw error;
  }
}

// Get resource allocations by project
export async function getAllocationsByProject(projectId: string): Promise<ResourceAllocation[]> {
  try {
    const response = await api.get(`/api/manufacturing/resources/allocations/project/${projectId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch allocations for project ${projectId}:`, error);
    throw error;
  }
}

// Get resource allocations by team member
export async function getAllocationsByMember(memberId: string): Promise<ResourceAllocation[]> {
  try {
    const response = await api.get(`/api/manufacturing/resources/allocations/member/${memberId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch allocations for member ${memberId}:`, error);
    throw error;
  }
}

// Create a new resource allocation
export async function createAllocation(allocation: Omit<ResourceAllocation, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<ResourceAllocation> {
  try {
    const response = await api.post('/api/manufacturing/resources/allocations', allocation);
    return response;
  } catch (error) {
    console.error('Failed to create allocation:', error);
    throw error;
  }
}

// Update hours earned for an allocation
export async function updateAllocationHours(id: string, hoursEarned: number): Promise<ResourceAllocation> {
  try {
    const response = await api.put(`/api/manufacturing/resources/allocations/${id}/hours`, { hoursEarned });
    return response;
  } catch (error) {
    console.error(`Failed to update hours for allocation ${id}:`, error);
    throw error;
  }
}

export default {
  getAllTeamMembers,
  getAllTeams,
  getTeamById,
  createTeamMember,
  createTeam,
  updateTeam,
  addMemberToTeam,
  getAllAllocations,
  getAllocationsByProject,
  getAllocationsByMember,
  createAllocation,
  updateAllocationHours
};