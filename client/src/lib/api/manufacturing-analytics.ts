// API client functions for manufacturing analytics
import {
  DailyAnalyticsData,
  WeeklyAnalyticsData,
  MonthlyAnalyticsData,
  ManufacturingAnalyticsSummary
} from '../../types/manufacturing/analytics';

/**
 * Fetches daily performance analytics data
 * @param date Optional date in YYYY-MM-DD format
 * @param lineId Optional production line ID
 * @returns Promise with daily analytics data
 */
export async function fetchDailyAnalytics(date?: string, lineId?: string): Promise<DailyAnalyticsData> {
  let url = '/api/manufacturing/analytics/daily';
  const params = new URLSearchParams();
  
  if (date) params.append('date', date);
  if (lineId) params.append('lineId', lineId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch daily analytics data');
  }
  
  return response.json();
}

/**
 * Fetches weekly trend analytics data
 * @param week Optional week in YYYY-WW format
 * @param lineId Optional production line ID
 * @returns Promise with weekly analytics data
 */
export async function fetchWeeklyAnalytics(week?: string, lineId?: string): Promise<WeeklyAnalyticsData> {
  let url = '/api/manufacturing/analytics/weekly';
  const params = new URLSearchParams();
  
  if (week) params.append('week', week);
  if (lineId) params.append('lineId', lineId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch weekly analytics data');
  }
  
  return response.json();
}

/**
 * Fetches monthly OEE analytics data
 * @param month Optional month in YYYY-MM format
 * @param lineId Optional production line ID
 * @returns Promise with monthly analytics data
 */
export async function fetchMonthlyAnalytics(month?: string, lineId?: string): Promise<MonthlyAnalyticsData> {
  let url = '/api/manufacturing/analytics/monthly/oee';
  const params = new URLSearchParams();
  
  if (month) params.append('month', month);
  if (lineId) params.append('lineId', lineId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch monthly analytics data');
  }
  
  return response.json();
}

/**
 * Fetches manufacturing analytics summary
 * @returns Promise with analytics summary data
 */
export async function fetchManufacturingAnalyticsSummary(): Promise<ManufacturingAnalyticsSummary> {
  const response = await fetch('/api/manufacturing/analytics');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch manufacturing analytics summary');
  }
  
  return response.json();
}

/**
 * Records a manufacturing standup meeting
 * @param standupData Standup meeting data
 * @returns Promise with created standup record
 */
export async function recordManufacturingStandup(standupData: {
  date: string;
  teamMembers: string[];
  blockers: string[];
  achievements: string[];
  goals: string[];
  notes?: string;
}): Promise<any> {
  const response = await fetch('/api/manufacturing/analytics/standup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(standupData)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record manufacturing standup');
  }
  
  return response.json();
}

// Production metric interface
export interface ProductionMetric {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  note?: string;
}

/**
 * Records production metrics for a production line
 * @param lineId Production line ID
 * @param metrics Array of production metrics
 * @returns Promise with created metrics record
 */
export async function recordProductionMetrics(
  lineId: string,
  metrics: ProductionMetric[]
): Promise<any> {
  const response = await fetch('/api/manufacturing/analytics/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lineId, metrics })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record production metrics');
  }
  
  return response.json();
}

// Downtime data interface
export interface DowntimeData {
  lineId: string;
  reason: string;
  startTime: string;
  endTime?: string;
  description?: string;
  impactedEquipment?: string[];
}

/**
 * Records downtime for a production line
 * @param downtimeData Downtime data
 * @returns Promise with created downtime record
 */
export async function recordProductionDowntime(downtimeData: DowntimeData): Promise<any> {
  const response = await fetch('/api/manufacturing/analytics/downtime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(downtimeData)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record production downtime');
  }
  
  return response.json();
}