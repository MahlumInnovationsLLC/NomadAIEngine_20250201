import api from './apiProxy';

export interface AnalyticsSummary {
  totalProductionLines: number;
  activeProductionLines: number;
  equipmentHealth: number;
  activeProjects: number;
  overallOEE: number;
  productionEfficiency: number;
  qualityRate: number;
  downtime: number;
}

export interface HourlyProduction {
  hour: string;
  target: number;
  actual: number;
  efficiency: number;
}

export interface DowntimeEvent {
  id: string;
  time: string;
  duration: number;
  reason: string;
  line: string;
  status: 'resolved' | 'ongoing';
}

export interface DailyAnalytics {
  id: string;
  type: 'daily-analytics';
  date: string;
  lineId?: string;
  kpis: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    downtime: number;
    taktTime: number;
    cycleTime: number;
  };
  hourlyProduction: HourlyProduction[];
  downtimeEvents: DowntimeEvent[];
  qualityIssues: {
    category: string;
    count: number;
  }[];
  topBottlenecks: {
    station: string;
    impact: number;
  }[];
}

export interface WeeklyAnalytics {
  id: string;
  type: 'weekly-analytics';
  year: string;
  weekNum: string;
  lineId?: string;
  dailyOEE: {
    day: string;
    value: number;
  }[];
  downtimeSummary: {
    reason: string;
    duration: number;
    percentage: number;
  }[];
  qualityTrend: {
    day: string;
    defects: number;
    firstPassYield: number;
  }[];
  productionVolume: {
    day: string;
    planned: number;
    actual: number;
  }[];
  kpis: {
    weeklyOEE: number;
    avgEfficiency: number;
    totalDowntime: number;
    avgQuality: number;
    plannedVolume: number;
    actualVolume: number;
  };
}

export interface MonthlyAnalytics {
  id: string;
  type: 'monthly-analytics';
  year: string;
  monthNum: string;
  lineId?: string;
  weeklyOEE: {
    week: string;
    availability: number;
    performance: number;
    quality: number;
    oee: number;
  }[];
  monthlyKPIs: {
    totalProduction: number;
    avgOEE: number;
    avgDowntime: number;
    defectRate: number;
    cycleTimeVariance: number;
  };
  equipmentReliability: {
    equipmentId: string;
    name: string;
    failureRate: number;
    mtbf: number;
    mttr: number;
  }[];
  maintenanceCompliance: number;
  energyConsumption: {
    week: string;
    consumption: number;
    baseline: number;
  }[];
  qualityByCategory: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

export type StandupMeeting = {
  id: string;
  type: 'standup';
  date: string;
  teamMembers: string[];
  blockers: string[];
  achievements: string[];
  goals: string[];
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

// Get manufacturing analytics summary
export async function getManufacturingAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const response = await api.get('/api/manufacturing/analytics');
    return response;
  } catch (error) {
    console.error('Failed to fetch manufacturing analytics summary:', error);
    throw error;
  }
}

// Get daily analytics
export async function getDailyAnalytics(date?: string, lineId?: string): Promise<DailyAnalytics> {
  try {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (lineId) queryParams.append('lineId', lineId);
    
    const url = `/api/manufacturing/analytics/daily?${queryParams.toString()}`;
    const response = await api.get(url);
    return response;
  } catch (error) {
    console.error('Failed to fetch daily analytics:', error);
    throw error;
  }
}

// Get weekly analytics
export async function getWeeklyAnalytics(week?: string, lineId?: string): Promise<WeeklyAnalytics> {
  try {
    const queryParams = new URLSearchParams();
    if (week) queryParams.append('week', week);
    if (lineId) queryParams.append('lineId', lineId);
    
    const url = `/api/manufacturing/analytics/weekly?${queryParams.toString()}`;
    const response = await api.get(url);
    return response;
  } catch (error) {
    console.error('Failed to fetch weekly analytics:', error);
    throw error;
  }
}

// Get monthly OEE analytics
export async function getMonthlyAnalytics(month?: string, lineId?: string): Promise<MonthlyAnalytics> {
  try {
    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month);
    if (lineId) queryParams.append('lineId', lineId);
    
    const url = `/api/manufacturing/analytics/monthly/oee?${queryParams.toString()}`;
    const response = await api.get(url);
    return response;
  } catch (error) {
    console.error('Failed to fetch monthly analytics:', error);
    throw error;
  }
}

// Record a manufacturing standup meeting
export async function recordStandupMeeting(standup: Omit<StandupMeeting, 'id' | 'type' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<StandupMeeting> {
  try {
    const response = await api.post('/api/manufacturing/analytics/standup', standup);
    return response;
  } catch (error) {
    console.error('Failed to record standup meeting:', error);
    throw error;
  }
}

// Record production metrics
export async function recordProductionMetrics(lineId: string, metrics: Array<{
  type: string;
  value: number;
  unit: string;
}>): Promise<any> {
  try {
    const response = await api.post('/api/manufacturing/analytics/metrics', {
      lineId,
      metrics
    });
    return response;
  } catch (error) {
    console.error('Failed to record production metrics:', error);
    throw error;
  }
}

// Record production downtime
export async function recordDowntime(downtime: {
  lineId: string;
  reason: string;
  startTime: string;
  endTime?: string;
  description?: string;
  impactedEquipment?: string[];
}): Promise<any> {
  try {
    const response = await api.post('/api/manufacturing/analytics/downtime', downtime);
    return response;
  } catch (error) {
    console.error('Failed to record downtime:', error);
    throw error;
  }
}

export default {
  getManufacturingAnalyticsSummary,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  recordStandupMeeting,
  recordProductionMetrics,
  recordDowntime
};