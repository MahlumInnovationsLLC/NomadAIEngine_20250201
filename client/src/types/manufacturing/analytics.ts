// Types for manufacturing analytics data

// Daily Performance Types
export interface HourlyProduction {
  hour: string;
  actual: number;
  target: number;
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

export interface QualityIssue {
  id: string;
  time: string;
  type: string;
  severity: 'minor' | 'major' | 'critical';
  line: string;
  status: 'open' | 'resolved' | 'investigating';
}

export interface StandupNote {
  leader: string;
  discussionPoints: string;
  actionItems: {
    item: string;
    owner: string;
  }[];
}

export interface DailyAnalyticsData {
  date: string;
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
  qualityIssues: QualityIssue[];
  standupNotes: StandupNote;
}

// Weekly Analysis Types
export interface WeeklyAnalyticsData {
  startDate: string;
  endDate: string;
  kpis: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    downtime: number;
    maintenanceCompliance: number;
  };
  dailyPerformance: Array<{
    day: string;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    target: number;
  }>;
  inventoryData: Array<{
    day: string;
    inStock: number;
    allocated: number;
    backOrdered: number;
  }>;
  downtimeReasons: Array<{
    name: string;
    value: number;
  }>;
  production: Array<{
    day: string;
    actual: number;
    planned: number;
  }>;
  improvements: {
    kaizens: Array<{
      id: string;
      title: string;
      status: string;
      impact: string;
      owner: string;
    }>;
    gembaFindings: Array<{
      id: string;
      area: string;
      finding: string;
      status: string;
      owner: string;
    }>;
  };
}

// Monthly OEE Dashboard Types
export interface MonthlyKPI {
  value: number;
  target: number;
  trend: number;
}

export interface ProductionLine {
  line: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface OEETrend {
  month: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  target: number;
}

export interface BottleneckData {
  name: string;
  value: number;
}

export interface CapacityData {
  name: string;
  actual: number;
  forecast: number;
  capacity: number;
}

export interface TechnologyData {
  subject: string;
  A: number;
  fullMark: number;
}

export interface WasteData {
  category: string;
  current: number;
  previous: number;
}

export interface FPYData {
  line: string;
  current: number;
  target: number;
  delta: number;
}

export interface MonthlyAnalyticsData {
  month: string;
  year: number;
  kpis: {
    oee: MonthlyKPI;
    availability: MonthlyKPI;
    performance: MonthlyKPI;
    quality: MonthlyKPI;
    downtime: MonthlyKPI;
  };
  productionLines: ProductionLine[];
  oeeTrend: OEETrend[];
  bottlenecks: BottleneckData[];
  capacityUtilization: CapacityData[];
  technologyRadar: TechnologyData[];
  waste: WasteData[];
  firstPassYield: FPYData[];
}

// Manufacturing Analytics Summary
export interface ManufacturingAnalyticsSummary {
  totalProductionLines: number;
  activeProductionLines: number;
  equipmentHealth: number;
  activeProjects: number;
  overallOEE: number;
  productionEfficiency: number;
  qualityRate: number;
  downtime: number;
}