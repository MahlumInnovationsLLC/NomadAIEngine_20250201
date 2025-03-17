import express, { Response } from "express";
import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../../auth-middleware";
import { CosmosClient, Container, Database, SqlQuerySpec } from "@azure/cosmos";

const router: Router = express.Router();

// Initialize cosmos client and containers
let cosmosClient: CosmosClient;
let database: Database;
let analyticsContainer: Container;
let productionLineContainer: Container;
let equipmentContainer: Container;
let manufacturingProjectsContainer: Container;

// Initialize necessary containers for the analytics module
async function initializeContainers() {
  try {
    const COSMOS_ENDPOINT = process.env.NOMAD_AZURE_COSMOS_ENDPOINT;
    const COSMOS_KEY = process.env.NOMAD_AZURE_COSMOS_KEY;

    // Check if the environment variables are set
    if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
      console.error("Missing Azure Cosmos DB credentials in environment variables");
      return;
    }

    // Create a new CosmosClient
    cosmosClient = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      key: COSMOS_KEY,
    });

    // Get a reference to the database
    database = cosmosClient.database("nomad-manufacturing");

    // Get references to the containers
    analyticsContainer = database.container("manufacturing-analytics");
    productionLineContainer = database.container("production-lines");
    equipmentContainer = database.container("equipment");
    manufacturingProjectsContainer = database.container("manufacturing-projects");

    console.log("Manufacturing analytics containers initialized");
  } catch (error) {
    console.error("Error initializing manufacturing analytics containers:", error);
  }
}

// Initialize containers on module load
initializeContainers();

// Daily Analytics Endpoint
router.get('/daily', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get the date from query parameters, or use today's date
    const requestedDate = req.query.date as string || new Date().toISOString().split('T')[0];
    const lineId = req.query.lineId as string;

    // Build the query to get daily analytics data
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.type = 'daily-analytics' AND c.date = @date" + (lineId ? " AND c.lineId = @lineId" : ""),
      parameters: [
        {
          name: "@date",
          value: requestedDate
        },
        ...(lineId ? [{ name: "@lineId", value: lineId }] : [])
      ]
    };

    // Execute the query
    const { resources: analyticsData } = await analyticsContainer.items.query(querySpec).fetchAll();

    if (analyticsData.length === 0) {
      // If no data exists for this date, generate a default dataset
      const generatedData = await generateDailyAnalyticsData(requestedDate, lineId);
      res.json(generatedData);
    } else {
      res.json(analyticsData[0]);
    }
  } catch (error) {
    console.error("Error retrieving daily analytics:", error);
    res.status(500).json({ error: "Failed to retrieve daily analytics data" });
  }
});

// Weekly Analytics Endpoint
router.get('/weekly', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get the week from query parameters (format: YYYY-WW)
    const weekParam = req.query.week as string;
    const lineId = req.query.lineId as string;

    // Parse the week parameter
    let year: string, weekNum: string;
    if (weekParam && weekParam.includes('-')) {
      [year, weekNum] = weekParam.split('-');
    } else {
      // Calculate current week if not provided
      const now = new Date();
      year = now.getFullYear().toString();
      weekNum = getWeekNumber(now).toString().padStart(2, '0');
    }

    // Build the query to get weekly analytics data
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.type = 'weekly-analytics' AND c.year = @year AND c.weekNum = @weekNum" + (lineId ? " AND c.lineId = @lineId" : ""),
      parameters: [
        {
          name: "@year",
          value: year
        },
        {
          name: "@weekNum",
          value: weekNum
        },
        ...(lineId ? [{ name: "@lineId", value: lineId }] : [])
      ]
    };

    // Execute the query
    const { resources: analyticsData } = await analyticsContainer.items.query(querySpec).fetchAll();

    if (analyticsData.length === 0) {
      // If no data exists for this week, generate a default dataset
      const generatedData = await generateWeeklyAnalyticsData(year, weekNum, lineId);
      res.json(generatedData);
    } else {
      res.json(analyticsData[0]);
    }
  } catch (error) {
    console.error("Error retrieving weekly analytics:", error);
    res.status(500).json({ error: "Failed to retrieve weekly analytics data" });
  }
});

// Monthly OEE Analytics Endpoint
router.get('/monthly/oee', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get the month from query parameters (format: YYYY-MM)
    const monthParam = req.query.month as string;
    const lineId = req.query.lineId as string;

    // Parse the month parameter
    let year: string, monthNum: string;
    if (monthParam && monthParam.includes('-')) {
      [year, monthNum] = monthParam.split('-');
    } else {
      // Calculate current month if not provided
      const now = new Date();
      year = now.getFullYear().toString();
      monthNum = (now.getMonth() + 1).toString().padStart(2, '0');
    }

    // Build the query to get monthly analytics data
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.type = 'monthly-analytics' AND c.year = @year AND c.monthNum = @monthNum" + (lineId ? " AND c.lineId = @lineId" : ""),
      parameters: [
        {
          name: "@year",
          value: year
        },
        {
          name: "@monthNum",
          value: monthNum
        },
        ...(lineId ? [{ name: "@lineId", value: lineId }] : [])
      ]
    };

    // Execute the query
    const { resources: analyticsData } = await analyticsContainer.items.query(querySpec).fetchAll();

    if (analyticsData.length === 0) {
      // If no data exists for this month, generate a default dataset
      const generatedData = await generateMonthlyAnalyticsData(year, monthNum, lineId);
      res.json(generatedData);
    } else {
      res.json(analyticsData[0]);
    }
  } catch (error) {
    console.error("Error retrieving monthly analytics:", error);
    res.status(500).json({ error: "Failed to retrieve monthly analytics data" });
  }
});

// Get Manufacturing Analytics Summary
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Fetch data from multiple sources to build the summary
    const [productionLines, equipment, projects] = await Promise.all([
      getProductionLines(),
      getEquipment(),
      getProjects()
    ]);

    // Build a summary object
    const summary = {
      totalProductionLines: productionLines.length,
      activeProductionLines: productionLines.filter(line => line.status === 'operational').length,
      equipmentHealth: calculateAverageEquipmentHealth(equipment),
      activeProjects: projects.filter(proj => proj.status === 'active' || proj.status === 'in_progress').length,
      overallOEE: calculateOverallOEE(productionLines),
      productionEfficiency: calculateProductionEfficiency(productionLines),
      qualityRate: calculateQualityRate(productionLines),
      downtime: calculateTotalDowntime(productionLines)
    };

    res.json(summary);
  } catch (error) {
    console.error("Error retrieving manufacturing analytics summary:", error);
    res.status(500).json({ error: "Failed to retrieve manufacturing analytics summary" });
  }
});

// Record Manufacturing Standup Meeting
router.post('/standup', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, teamMembers, blockers, achievements, goals, notes } = req.body;

    // Basic validation
    if (!date || !teamMembers || !blockers || !achievements || !goals) {
      return res.status(400).json({ error: "Missing required standup fields" });
    }

    // Create the standup record
    const standupRecord = {
      id: `standup-${date}-${Date.now()}`,
      type: 'standup',
      date,
      teamMembers,
      blockers,
      achievements,
      goals,
      notes: notes || '',
      createdBy: req.user?.id || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to the database
    const { resource: createdItem } = await analyticsContainer.items.create(standupRecord);
    res.status(201).json(createdItem);
  } catch (error) {
    console.error("Error recording manufacturing standup:", error);
    res.status(500).json({ error: "Failed to record manufacturing standup" });
  }
});

// Record Production Metrics
router.post('/metrics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lineId, metrics } = req.body;

    // Basic validation
    if (!lineId || !metrics || !Array.isArray(metrics)) {
      return res.status(400).json({ error: "Invalid metrics data" });
    }

    // Update the production line with the new metrics
    // First get the current line data
    const { resource: productionLine } = await productionLineContainer.item(lineId, lineId).read();
    
    if (!productionLine) {
      return res.status(404).json({ error: "Production line not found" });
    }

    // Add new metrics to the existing metrics array
    const updatedMetrics = [...(productionLine.metrics || []), ...metrics.map(m => ({
      ...m,
      recordedBy: req.user?.id || 'unknown',
      recordedAt: new Date().toISOString()
    }))];

    // Update the production line
    const updatedLine = {
      ...productionLine,
      metrics: updatedMetrics,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || 'unknown'
    };

    // Save the updated production line
    const { resource: result } = await productionLineContainer.items.upsert(updatedLine);
    res.json(result);
  } catch (error) {
    console.error("Error recording production metrics:", error);
    res.status(500).json({ error: "Failed to record production metrics" });
  }
});

// Record Production Downtime
router.post('/downtime', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lineId, reason, startTime, endTime, description, impactedEquipment } = req.body;

    // Basic validation
    if (!lineId || !reason || !startTime) {
      return res.status(400).json({ error: "Missing required downtime fields" });
    }

    // Create the downtime record
    const downtimeRecord = {
      id: `downtime-${lineId}-${Date.now()}`,
      type: 'downtime',
      lineId,
      reason,
      startTime,
      endTime: endTime || null,
      description: description || '',
      impactedEquipment: impactedEquipment || [],
      status: endTime ? 'resolved' : 'ongoing',
      recordedBy: req.user?.id || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to the database
    const { resource: createdItem } = await analyticsContainer.items.create(downtimeRecord);
    res.status(201).json(createdItem);
  } catch (error) {
    console.error("Error recording production downtime:", error);
    res.status(500).json({ error: "Failed to record production downtime" });
  }
});

// Helper functions

// Get week number from a date
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Calculate average equipment health
function calculateAverageEquipmentHealth(equipment: any[]): number {
  if (!equipment.length) return 0;
  const sum = equipment.reduce((total, eq) => total + (eq.healthScore || 0), 0);
  return Math.round((sum / equipment.length) * 10) / 10; // Round to 1 decimal place
}

// Calculate overall OEE
function calculateOverallOEE(productionLines: any[]): number {
  if (!productionLines.length) return 0;
  const sum = productionLines.reduce((total, line) => {
    return total + (line.performance?.oee || 0);
  }, 0);
  return Math.round((sum / productionLines.length) * 1000) / 10; // To percentage with 1 decimal
}

// Calculate production efficiency
function calculateProductionEfficiency(productionLines: any[]): number {
  if (!productionLines.length) return 0;
  const sum = productionLines.reduce((total, line) => {
    return total + (line.performance?.efficiency || 0);
  }, 0);
  return Math.round((sum / productionLines.length) * 1000) / 10; // To percentage with 1 decimal
}

// Calculate quality rate
function calculateQualityRate(productionLines: any[]): number {
  if (!productionLines.length) return 0;
  const sum = productionLines.reduce((total, line) => {
    return total + (line.performance?.quality || 0);
  }, 0);
  return Math.round((sum / productionLines.length) * 1000) / 10; // To percentage with 1 decimal
}

// Calculate total downtime
function calculateTotalDowntime(productionLines: any[]): number {
  return productionLines.reduce((total, line) => {
    return total + (line.downtime?.total || 0);
  }, 0);
}

// Helper function to get production lines
async function getProductionLines(): Promise<any[]> {
  try {
    const query = {
      query: "SELECT * FROM c WHERE c.type = 'production-line'"
    };
    const { resources } = await productionLineContainer.items.query(query).fetchAll();
    return resources;
  } catch (error) {
    console.error("Error getting production lines:", error);
    return [];
  }
}

// Helper function to get equipment
async function getEquipment(): Promise<any[]> {
  try {
    const query = {
      query: "SELECT * FROM c WHERE c.type = 'equipment'"
    };
    const { resources } = await equipmentContainer.items.query(query).fetchAll();
    return resources;
  } catch (error) {
    console.error("Error getting equipment:", error);
    return [];
  }
}

// Helper function to get projects
async function getProjects(): Promise<any[]> {
  try {
    const query = {
      query: "SELECT * FROM c WHERE c.type = 'manufacturing-project'"
    };
    const { resources } = await manufacturingProjectsContainer.items.query(query).fetchAll();
    return resources;
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
}

// Generate daily analytics data for a specific date
async function generateDailyAnalyticsData(date: string, lineId?: string): Promise<any> {
  // This function generates realistic-looking data for demonstration purposes
  // In a real system, this would fetch actual data from the database or other sources

  // Generate random KPIs
  const kpis = {
    oee: 0.78 + (Math.random() * 0.08 - 0.04), // 74-82%
    availability: 0.85 + (Math.random() * 0.1 - 0.05), // 80-90%
    performance: 0.82 + (Math.random() * 0.08 - 0.04), // 78-86%
    quality: 0.95 + (Math.random() * 0.05 - 0.025), // 92.5-97.5%
    downtime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
    taktTime: 45 + Math.floor(Math.random() * 10) - 5, // 40-50 seconds
    cycleTime: 42 + Math.floor(Math.random() * 14) - 7, // 35-49 seconds
  };

  // Generate hourly production data
  const hourlyProduction = [];
  for (let hour = 6; hour <= 18; hour++) {
    const target = 8 + Math.floor(Math.random() * 4);
    const actual = target - Math.floor(Math.random() * 4);
    const efficiency = actual / target;
    hourlyProduction.push({
      hour: `${hour}:00`,
      target,
      actual,
      efficiency: Math.round(efficiency * 100) / 100
    });
  }

  // Generate downtime events
  const downtimeEvents = [];
  const reasons = ['Maintenance', 'Setup', 'Material Shortage', 'Operator Break', 'Equipment Failure'];
  const productionLine = lineId || 'Line 1';
  
  // Create 1-3 downtime events
  const numEvents = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numEvents; i++) {
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const duration = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
    const hour = 6 + Math.floor(Math.random() * 12); // Between 6am and 6pm
    const minute = Math.floor(Math.random() * 60);
    
    downtimeEvents.push({
      id: `dt-${date}-${i}`,
      reason,
      time: `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
      duration,
      line: productionLine,
      status: Math.random() > 0.2 ? 'resolved' : 'ongoing'
    });
  }

  // Generate quality issues
  const qualityIssues = [];
  const qualityTypes = ['Dimensional Error', 'Surface Defect', 'Missing Feature', 'Assembly Issue', 'Material Flaw'];
  const severities = ['minor', 'major', 'critical'];
  
  // Create 0-3 quality issues
  const numIssues = Math.floor(Math.random() * 4);
  for (let i = 0; i < numIssues; i++) {
    const type = qualityTypes[Math.floor(Math.random() * qualityTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const hour = 6 + Math.floor(Math.random() * 12);
    const minute = Math.floor(Math.random() * 60);
    
    qualityIssues.push({
      id: `qi-${date}-${i}`,
      type,
      severity,
      time: `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
      line: productionLine,
      status: Math.random() > 0.5 ? 'resolved' : (Math.random() > 0.5 ? 'open' : 'investigating')
    });
  }

  // Generate standup notes
  const standupNotes = {
    leader: 'Sarah Johnson',
    discussionPoints: 'Reviewed yesterday\'s production targets and quality issues. Planned for today\'s batch schedule and discussed maintenance requirements.',
    actionItems: [
      { item: 'Follow up on material delivery delay', owner: 'Carlos R.' },
      { item: 'Schedule preventive maintenance for Line 2', owner: 'Tina M.' },
      { item: 'Update production schedule for Week 35', owner: 'Alex W.' }
    ]
  };

  // Return the complete daily analytics dataset
  return {
    id: `daily-${date}-${lineId || 'all'}`,
    type: 'daily-analytics',
    date,
    lineId: lineId || 'all',
    kpis,
    hourlyProduction,
    downtimeEvents,
    qualityIssues,
    standupNotes
  };
}

// Generate weekly analytics data
async function generateWeeklyAnalyticsData(year: string, weekNum: string, lineId?: string): Promise<any> {
  // Generate weekly KPIs
  const kpis = {
    oee: 0.76 + (Math.random() * 0.08 - 0.04), // 72-80%
    availability: 0.84 + (Math.random() * 0.1 - 0.05), // 79-89%
    performance: 0.81 + (Math.random() * 0.08 - 0.04), // 77-85%
    quality: 0.94 + (Math.random() * 0.05 - 0.025), // 91.5-96.5%
    downtime: Math.floor(Math.random() * 8) + 4, // 4-12 hours
    maintenanceCompliance: 0.92 + (Math.random() * 0.08 - 0.04), // 88-96%
  };

  // Generate daily performance data
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dailyPerformance = daysOfWeek.map(day => {
    const target = 85;
    const oee = Math.round((kpis.oee + (Math.random() * 0.1 - 0.05)) * 100);
    const availability = Math.round((kpis.availability + (Math.random() * 0.1 - 0.05)) * 100);
    const performance = Math.round((kpis.performance + (Math.random() * 0.1 - 0.05)) * 100);
    const quality = Math.round((kpis.quality + (Math.random() * 0.05 - 0.025)) * 100);
    
    return {
      day,
      oee,
      availability,
      performance,
      quality,
      target
    };
  });

  // Generate inventory data
  const inventoryData = daysOfWeek.map(day => {
    const inStock = 120 + Math.floor(Math.random() * 40) - 20;
    const allocated = 80 + Math.floor(Math.random() * 30) - 15;
    const backOrdered = Math.floor(Math.random() * 10);
    
    return {
      day,
      inStock,
      allocated,
      backOrdered
    };
  });

  // Generate downtime reasons
  const downtimeReasons = [
    {
      name: 'Equipment Failure',
      value: Math.floor(Math.random() * 180) + 60
    },
    {
      name: 'Setup Time',
      value: Math.floor(Math.random() * 120) + 30
    },
    {
      name: 'Material Shortage',
      value: Math.floor(Math.random() * 90) + 15
    },
    {
      name: 'Operator Breaks',
      value: Math.floor(Math.random() * 60) + 30
    },
    {
      name: 'Quality Checks',
      value: Math.floor(Math.random() * 45) + 15
    }
  ];

  // Generate production data
  const production = daysOfWeek.map(day => {
    const planned = 80 + Math.floor(Math.random() * 20);
    const actual = planned - Math.floor(Math.random() * 15);
    
    return {
      day,
      planned,
      actual
    };
  });

  // Generate improvement initiatives
  const improvements = {
    kaizens: [
      {
        id: `kz-${year}-${weekNum}-1`,
        title: 'Optimize Changeover Process',
        status: Math.random() > 0.5 ? 'completed' : (Math.random() > 0.5 ? 'in_progress' : 'planned'),
        impact: 'High',
        owner: 'James W.'
      },
      {
        id: `kz-${year}-${weekNum}-2`,
        title: 'Standardize Quality Check Procedure',
        status: Math.random() > 0.5 ? 'in_progress' : 'planned',
        impact: 'Medium',
        owner: 'Elena R.'
      },
      {
        id: `kz-${year}-${weekNum}-3`,
        title: 'Implement Visual Management Board',
        status: Math.random() > 0.7 ? 'completed' : 'in_progress',
        impact: 'Medium',
        owner: 'Carlos T.'
      }
    ],
    gembaFindings: [
      {
        id: `gmb-${year}-${weekNum}-1`,
        area: 'Assembly Station 2',
        finding: 'Tools not properly organized for quick access',
        status: Math.random() > 0.6 ? 'completed' : 'in_progress',
        owner: 'Sarah J.'
      },
      {
        id: `gmb-${year}-${weekNum}-2`,
        area: 'Material Staging',
        finding: 'Excess inventory blocking walkways',
        status: Math.random() > 0.4 ? 'in_progress' : 'planned',
        owner: 'Michael L.'
      },
      {
        id: `gmb-${year}-${weekNum}-3`,
        area: 'Quality Control',
        finding: 'Inspection lighting insufficient for detailed checks',
        status: Math.random() > 0.3 ? 'completed' : (Math.random() > 0.5 ? 'in_progress' : 'planned'),
        owner: 'Diana K.'
      }
    ]
  };

  // Return the complete weekly analytics dataset
  return {
    id: `weekly-${year}-${weekNum}-${lineId || 'all'}`,
    type: 'weekly-analytics',
    year,
    weekNum,
    startDate: `${year}-W${weekNum}-1`, // ISO week date format
    endDate: `${year}-W${weekNum}-5`,
    lineId: lineId || 'all',
    kpis,
    dailyPerformance,
    inventoryData,
    downtimeReasons,
    production,
    improvements
  };
}

// Generate monthly analytics data
async function generateMonthlyAnalyticsData(year: string, monthNum: string, lineId?: string): Promise<any> {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[parseInt(monthNum) - 1];
  
  // Generate monthly KPIs
  const kpis = {
    oee: {
      value: 0.77 + (Math.random() * 0.08 - 0.04),
      target: 0.85,
      trend: Math.random() * 0.06 - 0.03
    },
    availability: {
      value: 0.83 + (Math.random() * 0.1 - 0.05),
      target: 0.9,
      trend: Math.random() * 0.08 - 0.04
    },
    performance: {
      value: 0.80 + (Math.random() * 0.08 - 0.04),
      target: 0.85,
      trend: Math.random() * 0.06 - 0.03
    },
    quality: {
      value: 0.93 + (Math.random() * 0.06 - 0.03),
      target: 0.98,
      trend: Math.random() * 0.04 - 0.02
    },
    downtime: {
      value: Math.floor(Math.random() * 20) + 15,
      target: 12,
      trend: Math.random() * 0.2 - 0.1
    }
  };

  // Generate production lines data
  const productionLines = [
    {
      line: 'Line 1',
      oee: Math.round((kpis.oee.value + (Math.random() * 0.1 - 0.05)) * 100),
      availability: Math.round((kpis.availability.value + (Math.random() * 0.1 - 0.05)) * 100),
      performance: Math.round((kpis.performance.value + (Math.random() * 0.08 - 0.04)) * 100),
      quality: Math.round((kpis.quality.value + (Math.random() * 0.06 - 0.03)) * 100)
    },
    {
      line: 'Line 2',
      oee: Math.round((kpis.oee.value + (Math.random() * 0.1 - 0.05)) * 100),
      availability: Math.round((kpis.availability.value + (Math.random() * 0.1 - 0.05)) * 100),
      performance: Math.round((kpis.performance.value + (Math.random() * 0.08 - 0.04)) * 100),
      quality: Math.round((kpis.quality.value + (Math.random() * 0.06 - 0.03)) * 100)
    },
    {
      line: 'Line 3',
      oee: Math.round((kpis.oee.value + (Math.random() * 0.1 - 0.05)) * 100),
      availability: Math.round((kpis.availability.value + (Math.random() * 0.1 - 0.05)) * 100),
      performance: Math.round((kpis.performance.value + (Math.random() * 0.08 - 0.04)) * 100),
      quality: Math.round((kpis.quality.value + (Math.random() * 0.06 - 0.03)) * 100)
    },
    {
      line: 'Line 4',
      oee: Math.round((kpis.oee.value + (Math.random() * 0.1 - 0.05)) * 100),
      availability: Math.round((kpis.availability.value + (Math.random() * 0.1 - 0.05)) * 100),
      performance: Math.round((kpis.performance.value + (Math.random() * 0.08 - 0.04)) * 100),
      quality: Math.round((kpis.quality.value + (Math.random() * 0.06 - 0.03)) * 100)
    }
  ];

  // Generate OEE trend data
  const oeeTrend = [];
  for (let i = 0; i < 6; i++) {
    const monthIndex = (parseInt(monthNum) - i - 1 + 12) % 12;
    const trendMonth = monthNames[monthIndex].substring(0, 3);
    
    oeeTrend.push({
      month: trendMonth,
      oee: Math.round((0.75 + Math.random() * 0.1) * 100),
      availability: Math.round((0.82 + Math.random() * 0.1) * 100),
      performance: Math.round((0.78 + Math.random() * 0.12) * 100),
      quality: Math.round((0.92 + Math.random() * 0.06) * 100),
      target: 85
    });
  }
  
  // Reverse the array so most recent month is last
  oeeTrend.reverse();

  // Generate bottleneck data
  const bottlenecks = [
    {
      name: 'Assembly Station',
      value: Math.floor(Math.random() * 10) + 5
    },
    {
      name: 'Paint Booth',
      value: Math.floor(Math.random() * 8) + 3
    },
    {
      name: 'Quality Inspection',
      value: Math.floor(Math.random() * 6) + 2
    },
    {
      name: 'Packaging',
      value: Math.floor(Math.random() * 4) + 1
    },
    {
      name: 'Material Handling',
      value: Math.floor(Math.random() * 3) + 1
    }
  ];

  // Generate capacity utilization data
  const capacityUtilization = [
    {
      name: 'Week 1',
      actual: Math.floor(Math.random() * 20) + 75,
      forecast: Math.floor(Math.random() * 10) + 85,
      capacity: 100
    },
    {
      name: 'Week 2',
      actual: Math.floor(Math.random() * 20) + 75,
      forecast: Math.floor(Math.random() * 10) + 85,
      capacity: 100
    },
    {
      name: 'Week 3',
      actual: Math.floor(Math.random() * 20) + 75,
      forecast: Math.floor(Math.random() * 10) + 85,
      capacity: 100
    },
    {
      name: 'Week 4',
      actual: Math.floor(Math.random() * 20) + 75,
      forecast: Math.floor(Math.random() * 10) + 85,
      capacity: 100
    }
  ];

  // Generate technology radar data
  const technologyRadar = [
    {
      subject: 'Automation',
      A: Math.floor(Math.random() * 30) + 60,
      fullMark: 100
    },
    {
      subject: 'Digital Twins',
      A: Math.floor(Math.random() * 40) + 30,
      fullMark: 100
    },
    {
      subject: 'AI/ML',
      A: Math.floor(Math.random() * 35) + 25,
      fullMark: 100
    },
    {
      subject: 'IoT',
      A: Math.floor(Math.random() * 30) + 45,
      fullMark: 100
    },
    {
      subject: 'Robotics',
      A: Math.floor(Math.random() * 25) + 50,
      fullMark: 100
    }
  ];

  // Generate waste data
  const waste = [
    {
      category: 'Material',
      current: Math.floor(Math.random() * 10) + 15,
      previous: Math.floor(Math.random() * 10) + 20
    },
    {
      category: 'Energy',
      current: Math.floor(Math.random() * 10) + 10,
      previous: Math.floor(Math.random() * 10) + 12
    },
    {
      category: 'Labor',
      current: Math.floor(Math.random() * 8) + 5,
      previous: Math.floor(Math.random() * 8) + 8
    },
    {
      category: 'Rework',
      current: Math.floor(Math.random() * 6) + 4,
      previous: Math.floor(Math.random() * 6) + 7
    },
    {
      category: 'Transport',
      current: Math.floor(Math.random() * 5) + 3,
      previous: Math.floor(Math.random() * 5) + 5
    }
  ];

  // Generate first pass yield data
  const firstPassYield = productionLines.map(line => {
    const current = Math.floor(Math.random() * 10) + 85;
    const target = 95;
    return {
      line: line.line,
      current,
      target,
      delta: target - current
    };
  });

  // Return the complete monthly analytics dataset
  return {
    id: `monthly-${year}-${monthNum}-${lineId || 'all'}`,
    type: 'monthly-analytics',
    month: monthName,
    monthNum: parseInt(monthNum),
    year: parseInt(year),
    lineId: lineId || 'all',
    kpis,
    productionLines,
    oeeTrend,
    bottlenecks,
    capacityUtilization,
    technologyRadar,
    waste,
    firstPassYield
  };
}

export default router;