import { Router } from "express";
import { ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import multer from 'multer';
import * as XLSX from 'xlsx';

// Import the consolidated blob service
import { 
  containerNames, 
  getContainerClient 
} from '../../services/azure/blob_service';

// Import the calculateProjectStatus function 
import { calculateProjectStatus } from '../../services/azure/facility_service';

// Configure multer for file upload
const storage = multer.memoryStorage();

// Define types for use in routes and exports
export type ProjectStatus =
  | 'active' 
  | 'in_progress' 
  | 'planning' 
  | 'on_hold' 
  | 'completed'
  | 'cancelled'
  | 'NOT_STARTED'
  | 'IN_FAB'
  | 'IN_ASSEMBLY'
  | 'IN_WRAP'
  | 'IN_NTC_TESTING'
  | 'IN_QC'
  | 'PLANNING'
  | 'COMPLETED'
  | 'SHIPPING';

// Project interface definition
export interface Project {
  id: string;
  projectNumber?: string;
  name?: string;
  location?: string;
  team?: string;
  status: string;
  manualStatus?: boolean;
  contractDate?: string;
  chassisEta?: string;
  paymentMilestones?: string;
  lltsOrdered?: string;
  meAssigned?: string;
  meCadProgress?: string | number;
  eeAssigned?: string;
  eeDesignProgress?: string | number;
  itDesignProgress?: string | number;
  ntcDesignProgress?: string | number;
  ntcAssigned?: string;
  notes?: string;
  fabricationStart?: string;
  assemblyStart?: string;
  wrapGraphics?: string;
  ntcTesting?: string;
  qcStart?: string;
  executiveReview?: string;
  ship?: string;
  delivery?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Column mapping configuration
const columnMappings: { [key: string]: string[] } = {
  projectNumber: ['Project Number', 'ProjectNumber', '__EMPTY_2'],
  location: ['Location', '__EMPTY'],
  team: ['Team', '__EMPTY_1'],
  status: ['Tier IV Project Status', 'Status'],
  contractDate: ['Contract Date', 'ContractDate'],
  chassisEta: ['Chassis ETA', 'ChassisETA'],
  paymentMilestones: ['Payment Milestones', 'PaymentMilestones'],
  lltsOrdered: ['LLTs Ordered', 'LLTsOrdered'],
  meAssigned: ['ME Assigned', 'MEAssigned', '__EMPTY_8'],
  meCadProgress: ['ME CAD %', 'MECADProgress'],
  eeAssigned: ['EE Assigned', 'EEAssigned', '__EMPTY_10'],
  eeDesignProgress: ['EE Design / Orders %', 'EEDesignProgress'],
  itDesignProgress: ['IT Design / Orders %', 'ITDesignProgress'],
  ntcDesignProgress: ['NTC Design / Orders %', 'NTCDesignProgress'],
  ntcAssigned: ['NTC Assigned', 'NTCAssigned', '__EMPTY_12'],
  fabricationStart: ['Fabrication Start', '__EMPTY_14'],
  assemblyStart: ['Assembly Start', '__EMPTY_15'],
  wrapGraphics: ['Wrap Graphics', '__EMPTY_16'],
  ntcTesting: ['NTC Testing', '__EMPTY_17'],
  qcStart: ['QC Start', 'QC START', '__EMPTY_18'],
  executiveReview: ['Executive Review', 'EXECUTIVE REVIEW'],
  ship: ['Ship', '__EMPTY_21'],
  delivery: ['Delivery', '__EMPTY_22'],
  notes: ['Notes', '__EMPTY_23']
};

// Helper function to find matching column
function findMatchingColumn(headers: string[], possibleNames: string[]): string | undefined {
  return headers.find(header =>
    possibleNames.some(name =>
      header?.toLowerCase().trim() === name.toLowerCase().trim()
    )
  );
}

// Helper function to get value from row using column mapping
function getValueFromRow(row: any, headers: string[], fieldName: string): any {
  const possibleNames = columnMappings[fieldName];
  const matchingColumn = findMatchingColumn(headers, possibleNames);
  return matchingColumn ? row[matchingColumn] : undefined;
}

// Helper function to parse dates from Excel
function parseExcelDate(value: any): string | undefined {
  if (!value) return undefined;

  try {
    if (typeof value === 'number') {
      // Handle Excel date number
      // Excel dates are number of days since 1900-01-01
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString();
    } else if (typeof value === 'string') {
      // Try parsing string date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  } catch (error) {
    console.error('Error parsing date:', value, error);
  }
  return undefined;
}

// Preview projects from Excel
router.post("/preview", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Processing preview data...');

    // Get headers from first row
    const headers = Object.keys(rawData[0] || {});
    console.log('Found headers:', headers);

    // Process preview data
    const processedData: Partial<Project>[] = rawData.map(row => {
      const now = new Date().toISOString();
      
      const project: Partial<Project> = {
        id: uuidv4(), // Generate id for preview purpose
        projectNumber: getValueFromRow(row, headers, 'projectNumber'),
        location: getValueFromRow(row, headers, 'location'),
        team: getValueFromRow(row, headers, 'team'),
        status: getValueFromRow(row, headers, 'status') || 'NOT_STARTED',
        contractDate: parseExcelDate(getValueFromRow(row, headers, 'contractDate')),
        chassisEta: parseExcelDate(getValueFromRow(row, headers, 'chassisEta')),
        paymentMilestones: getValueFromRow(row, headers, 'paymentMilestones'),
        lltsOrdered: getValueFromRow(row, headers, 'lltsOrdered'),
        meAssigned: getValueFromRow(row, headers, 'meAssigned'),
        meCadProgress: getValueFromRow(row, headers, 'meCadProgress'),
        eeAssigned: getValueFromRow(row, headers, 'eeAssigned'),
        eeDesignProgress: getValueFromRow(row, headers, 'eeDesignProgress'),
        itDesignProgress: getValueFromRow(row, headers, 'itDesignProgress'),
        ntcDesignProgress: getValueFromRow(row, headers, 'ntcDesignProgress'),
        ntcAssigned: getValueFromRow(row, headers, 'ntcAssigned'),
        notes: getValueFromRow(row, headers, 'notes') || '',
        fabricationStart: parseExcelDate(getValueFromRow(row, headers, 'fabricationStart')),
        assemblyStart: parseExcelDate(getValueFromRow(row, headers, 'assemblyStart')),
        wrapGraphics: parseExcelDate(getValueFromRow(row, headers, 'wrapGraphics')),
        ntcTesting: parseExcelDate(getValueFromRow(row, headers, 'ntcTesting')),
        qcStart: parseExcelDate(getValueFromRow(row, headers, 'qcStart')),
        executiveReview: parseExcelDate(getValueFromRow(row, headers, 'executiveReview')),
        ship: parseExcelDate(getValueFromRow(row, headers, 'ship')),
        delivery: parseExcelDate(getValueFromRow(row, headers, 'delivery')),
        progress: 0,
        createdAt: now,
        updatedAt: now
      };

      return project;
    });

    res.status(200).json({
      message: "Projects preview generated successfully",
      count: processedData.length,
      projects: processedData
    });

  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({
      error: "Failed to generate preview",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import projects
router.post("/import", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get container client from consolidated service
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    // Check if the client is initialized
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Parsing Excel data...');

    // Get headers from first row
    const headers = Object.keys(rawData[0] || {});
    console.log('Found headers:', headers);

    const importedProjects: Project[] = [];
    const now = new Date().toISOString();

    for (const row of rawData) {
      const projectId = uuidv4();

      // Map fields using column mappings
      const project: Project = {
        id: projectId,
        projectNumber: getValueFromRow(row, headers, 'projectNumber'),
        location: getValueFromRow(row, headers, 'location'),
        team: getValueFromRow(row, headers, 'team'),
        status: 'NOT_STARTED', // Using consistent underscore format
        manualStatus: false,
        contractDate: parseExcelDate(getValueFromRow(row, headers, 'contractDate')),
        chassisEta: parseExcelDate(getValueFromRow(row, headers, 'chassisEta')),
        paymentMilestones: getValueFromRow(row, headers, 'paymentMilestones'),
        lltsOrdered: getValueFromRow(row, headers, 'lltsOrdered'),
        meAssigned: getValueFromRow(row, headers, 'meAssigned'),
        meCadProgress: getValueFromRow(row, headers, 'meCadProgress'),
        eeAssigned: getValueFromRow(row, headers, 'eeAssigned'),
        eeDesignProgress: getValueFromRow(row, headers, 'eeDesignProgress'),
        itDesignProgress: getValueFromRow(row, headers, 'itDesignProgress'),
        ntcDesignProgress: getValueFromRow(row, headers, 'ntcDesignProgress'),
        ntcAssigned: getValueFromRow(row, headers, 'ntcAssigned'),
        notes: getValueFromRow(row, headers, 'notes') || '',
        fabricationStart: parseExcelDate(getValueFromRow(row, headers, 'fabricationStart')),
        assemblyStart: parseExcelDate(getValueFromRow(row, headers, 'assemblyStart')),
        wrapGraphics: parseExcelDate(getValueFromRow(row, headers, 'wrapGraphics')),
        ntcTesting: parseExcelDate(getValueFromRow(row, headers, 'ntcTesting')),
        qcStart: parseExcelDate(getValueFromRow(row, headers, 'qcStart')),
        executiveReview: parseExcelDate(getValueFromRow(row, headers, 'executiveReview')),
        ship: parseExcelDate(getValueFromRow(row, headers, 'ship')),
        delivery: parseExcelDate(getValueFromRow(row, headers, 'delivery')),
        progress: 0, // Add initial progress value
        createdAt: now,
        updatedAt: now
      };

      try {
        // Save to Azure Blob Storage
        const blockBlobClient = container.getBlockBlobClient(`${projectId}.json`);
        const content = JSON.stringify(project);

        await blockBlobClient.upload(content, content.length, {
          blobHTTPHeaders: {
            blobContentType: "application/json"
          }
        });
        
        importedProjects.push(project);
      } catch (uploadError) {
        console.error(`Error uploading project ${projectId}:`, uploadError);
        // Continue with next project
      }
    }

    if (importedProjects.length === 0) {
      return res.status(500).json({
        error: "Failed to import any projects",
        message: "No projects were successfully imported"
      });
    }

    // Update the cache with new projects
    try {
      const currentProjects = projectCache.getAllProjectsFallback() || [];
      projectCache.setAllProjects([...currentProjects, ...importedProjects]);
    } catch (cacheError) {
      console.error("Error updating project cache:", cacheError);
    }

    res.status(200).json({
      message: "Projects imported successfully",
      count: importedProjects.length,
      projects: importedProjects
    });

  } catch (error) {
    console.error("Error importing projects:", error);
    res.status(500).json({
      error: "Failed to import projects",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Helper function to get project data from external sources or generate empty array
// Add constant for the container name using the standardized approach
const PROJECTS_CONTAINER = containerNames.PROJECTS;

/**
 * Get projects from Azure Blob Storage using the consolidated blob service
 * Enhanced with better error handling and parallel processing
 */
async function getProjects(generateFallbackData: boolean = false): Promise<Project[]> {
  try {
    console.log("Fetching projects from Azure storage...");
    
    // Get container client from the unified blob service
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      console.error(`Failed to get container client for ${PROJECTS_CONTAINER}`);
      return [];
    }
    
    const projects: Project[] = [];
    let blobCount = 0;
    let successCount = 0;
    
    try {
      // Use parallel processing for better performance
      const blobPromises: Promise<Project | null>[] = [];
      
      for await (const blob of container.listBlobsFlat()) {
        blobCount++;
        // Create a promise for each blob processing task
        const blobPromise = (async () => {
          try {
            const blobClient = container.getBlockBlobClient(blob.name);
            const downloadResponse = await blobClient.download();
            const projectData = await streamToString(downloadResponse.readableStreamBody);
            
            if (!projectData) {
              console.warn(`Empty data in blob: ${blob.name}`);
              return null;
            }
            
            try {
              const project = JSON.parse(projectData) as Project;
              
              // Calculate the project status based on dates
              if (!project.manualStatus) {
                project.status = calculateProjectStatus(project);
              }
              
              return project;
            } catch (parseError) {
              console.error(`Error parsing JSON from blob ${blob.name}:`, parseError);
              return null;
            }
          } catch (blobError) {
            console.error(`Error processing blob ${blob.name}:`, blobError);
            return null;
          }
        })();
        
        blobPromises.push(blobPromise);
      }
      
      // Wait for all blob processing to complete
      const results = await Promise.all(blobPromises);
      
      // Filter out any null results and add valid projects to the array
      for (const project of results) {
        if (project) {
          projects.push(project);
          successCount++;
        }
      }
      
      console.log(`Processed ${blobCount} blobs, successfully loaded ${successCount} projects`);
      
      if (projects.length > 0) {
        console.log(`Successfully fetched ${projects.length} projects from Azure storage`);
        return projects;
      } else {
        console.warn(`No valid projects found in Azure storage container: ${PROJECTS_CONTAINER}`);
      }
    } catch (listError) {
      console.error(`Error listing blobs from container ${PROJECTS_CONTAINER}:`, listError);
    }
    
    // If data couldn't be retrieved from primary storage
    return [];
  } catch (error) {
    console.error("Unexpected error in getProjects:", error);
    return [];
  }
}

// Import the centralized project cache
import { projectCache } from '../../cache';

// Standard TTL for cache freshness
const CACHE_TTL = 300000; // 5 minutes cache for better reliability

// Count projects by status for dashboard metrics
router.get("/count-by-status", async (req, res) => {
  try {
    console.log("Received count-by-status request");
    
    // Try to get projects from cache first
    const projects = projectCache.getAllProjects(CACHE_TTL) || await getProjects();
    
    if (!projects || projects.length === 0) {
      return res.status(404).json({ error: "No projects found to count" });
    }
    
    // Count projects by status
    const statusCounts: Record<string, number> = {};
    
    // Count active, planning, and completed projects
    let activeCount = 0;
    let planningCount = 0;
    let completedCount = 0;
    
    projects.forEach(project => {
      // Normalize the status
      const status = String(project.status || '').toUpperCase().trim();
      
      // Update the specific status count
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Update category counts based on strict rules
      if (status === 'NOT_STARTED') {
        planningCount++;
      } else if (status === 'COMPLETED') {
        completedCount++;
      } else { 
        // Any other status goes to active
        activeCount++;
      }
    });
    
    // Return both detailed and category counts
    res.status(200).json({
      status: statusCounts,
      categories: {
        active: activeCount,
        planning: planningCount,
        completed: completedCount
      },
      total: projects.length
    });
  } catch (error) {
    console.error("Error getting count by status:", error);
    res.status(500).json({ 
      error: "Failed to get project counts", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get project statistics and metrics for the dashboard
router.get("/stats", async (req, res) => {
  try {
    console.log("Received project stats request");
    
    // Try to get projects from cache first
    const projects = projectCache.getAllProjects(CACHE_TTL) || await getProjects();
    
    if (!projects || projects.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Calculate metrics based on current date
    const now = new Date();
    
    // Count projects by status category
    const activeCount = projects.filter(p => {
      const status = String(p.status || '').toUpperCase().trim();
      return status !== 'NOT_STARTED' && status !== 'COMPLETED';
    }).length;
    
    const planningCount = projects.filter(p => {
      const status = String(p.status || '').toUpperCase().trim();
      return status === 'NOT_STARTED';
    }).length;
    
    const completedCount = projects.filter(p => {
      const status = String(p.status || '').toUpperCase().trim();
      return status === 'COMPLETED';
    }).length;
    
    // Calculate on-time vs delayed projects
    const onTimeProjects = projects.filter(p => {
      // A project is on time if it's not delayed or if it's completed
      return !p.isDelayed || String(p.status || '').toUpperCase().trim() === 'COMPLETED';
    }).length;
    
    const delayedProjects = projects.length - onTimeProjects;
    
    // Calculate projects by location
    const locationCounts: Record<string, number> = {};
    projects.forEach(project => {
      const location = project.location || 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    // Return dashboard statistics
    res.status(200).json({
      total: projects.length,
      categories: {
        active: activeCount,
        planning: planningCount,
        completed: completedCount
      },
      performance: {
        onTime: onTimeProjects,
        delayed: delayedProjects,
        onTimePercentage: Math.round((onTimeProjects / projects.length) * 100)
      },
      locations: locationCounts,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting project stats:", error);
    res.status(500).json({ 
      error: "Failed to get project statistics", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get all projects with enhanced reliability through centralized caching
router.get("/", async (req, res) => {
  try {
    console.log("Received projects request");
    
    // Try to get projects from cache first
    const cachedProjects = projectCache.getAllProjects(CACHE_TTL);
    
    if (cachedProjects) {
      // We have fresh cached data, return it immediately
      return res.json(cachedProjects);
    }
    
    console.log("Cache expired or empty, fetching fresh projects data...");
    const projects = await getProjects();
    
    // If no projects were found, try to use cache as fallback
    if (!projects || projects.length === 0) {
      console.warn("No projects found in storage during fetch");
      
      // Try to get stale data from cache as fallback
      const fallbackProjects = projectCache.getAllProjectsFallback();
      if (fallbackProjects) {
        console.log(`Falling back to cache with ${fallbackProjects.length} projects`);
        return res.json(fallbackProjects);
      }
      
      // No fallback data available, return empty array
      console.warn("No projects available in storage or cache");
      return res.json([]);
    }
    
    // Update cache with new data
    projectCache.setAllProjects(projects);
    
    // Return the fresh data
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // Try to get stale data from cache as fallback
    const fallbackProjects = projectCache.getAllProjectsFallback();
    if (fallbackProjects) {
      console.log(`Error occurred but returning ${fallbackProjects.length} projects from cache`);
      return res.json(fallbackProjects);
    }
    
    // No fallback available, return error
    res.status(500).json({ error: "Failed to fetch projects and no cached data available" });
  }
});

/**
 * Get a single project by ID using the consolidated blob service
 * Enhanced with better error handling and caching
 */
async function getProjectById(id: string): Promise<Project | null> {
  try {
    // First check the centralized cache for the project
    const cachedProject = projectCache.getProjectById(id);
    if (cachedProject) {
      return cachedProject;
    }
    
    console.log(`Project ${id} not found in fresh cache, checking storage...`);
    
    // Get container client from consolidated service
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      console.error(`Failed to get container client for ${PROJECTS_CONTAINER}`);
      
      // Check stale cache for the project as fallback when storage isn't available
      const staleProject = projectCache.getProjectByIdFallback(id);
      if (staleProject) {
        console.log(`Found project ${id} in stale cache, using fallback data`);
        return staleProject;
      }
      
      return null;
    }

    try {
      // Not in cache, fetch from storage
      console.log(`Fetching project ${id} from Azure storage...`);
      const blobClient = container.getBlockBlobClient(`${id}.json`);
      
      try {
        const downloadResponse = await blobClient.download();
        const projectData = await streamToString(downloadResponse.readableStreamBody);
        
        if (!projectData) {
          console.warn(`Empty data in blob for project ${id}`);
          return null;
        }
        
        try {
          const project = JSON.parse(projectData.trim()) as Project;
          
          // Calculate the project status based on dates if not manually set
          if (!project.manualStatus) {
            project.status = calculateProjectStatus(project);
          }
          
          // Update cache with fresh data
          projectCache.setProject(project);
          
          return project;
        } catch (parseError) {
          console.error(`Error parsing project data for ${id}:`, parseError);
          return null;
        }
      } catch (error: any) {
        if (error.statusCode === 404) {
          console.warn(`Project with ID ${id} not found in storage`);
        } else {
          console.error(`Error downloading project ${id}:`, error);
          
          // Try with stale cache as fallback after error
          const staleProject = projectCache.getProjectByIdFallback(id);
          if (staleProject) {
            console.log(`Found project ${id} in stale cache after error, using fallback data`);
            return staleProject;
          }
        }
        return null;
      }
    } catch (blobError) {
      console.error(`Error accessing blob for project ${id}:`, blobError);
      
      // Try fallback cache one more time
      const staleProject = projectCache.getProjectByIdFallback(id);
      if (staleProject) {
        console.log(`Found project ${id} in stale cache after blob access error, using fallback data`);
        return staleProject;
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Unexpected error in getProjectById for ${id}:`, error);
    
    // Final attempt with stale cache
    const staleProject = projectCache.getProjectByIdFallback(id);
    if (staleProject) {
      console.log(`Found project ${id} in stale cache after unexpected error, using fallback data`);
      return staleProject;
    }
    
    return null;
  }
}

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);
    
    if (project) {
      return res.json(project);
    }
    
    // Check if the storage is accessible
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (container) {
      // If storage is accessible but project not found, return 404
      return res.status(404).json({ error: "Project not found" });
    } else {
      // If storage is not accessible, return service unavailable
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

/**
 * Update a project using the consolidated blob service
 * Enhanced with better error handling and caching
 */
async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    console.log(`Updating project ${id} with:`, updates);
    
    // Get container client from consolidated service
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      console.error(`Failed to get container client for ${PROJECTS_CONTAINER}`);
      return null;
    }

    // First get the current project
    const currentProject = await getProjectById(id);
    if (!currentProject) {
      console.warn(`Project ${id} not found for update`);
      return null;
    }

    // Merge updates with current project
    const updatedProject: Project = {
      ...currentProject,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      // Upload updated project
      const blobClient = container.getBlockBlobClient(`${id}.json`);
      const content = JSON.stringify(updatedProject);
      
      console.log(`Uploading updated project ${id} to blob storage`);
      await blobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: "application/json" }
      });
      
      // CRITICAL: Update the centralized cache to ensure persistence across components
      console.log(`Updating project cache for project ${id}`);
      projectCache.setProject(updatedProject);
      
      return updatedProject;
    } catch (error) {
      console.error("Error uploading updated project:", error);
      return null;
    }
  } catch (error) {
    console.error("Unexpected error in updateProject:", error);
    return null;
  }
}

// Update project
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Updating project:', id, 'with:', updates);

    // Check if storage is accessible
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }

    const updatedProject = await updateProject(id, updates);
    
    if (updatedProject) {
      return res.json(updatedProject);
    } else {
      const currentProject = await getProjectById(id);
      if (!currentProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      return res.status(500).json({ 
        error: "Failed to update project",
        message: "Failed to save project updates. Please try again later."
      });
    }
  } catch (error) {
    console.error("Unexpected error during project update:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

/**
 * Update a project's notes using the consolidated blob service
 * This is optimized for the common notes update operation
 */
async function updateProjectNotes(id: string, notes: string): Promise<Project | null> {
  try {
    console.log(`Updating notes for project ${id}`);
    
    // Get container client from consolidated service
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      console.error(`Failed to get container client for ${PROJECTS_CONTAINER}`);
      return null;
    }

    // First get the current project
    const currentProject = await getProjectById(id);
    if (!currentProject) {
      console.warn(`Project ${id} not found for notes update`);
      return null;
    }

    // Update only the notes field
    const updatedProject: Project = {
      ...currentProject,
      notes: notes,
      updatedAt: new Date().toISOString()
    };

    try {
      // Upload updated project
      const blobClient = container.getBlockBlobClient(`${id}.json`);
      const content = JSON.stringify(updatedProject);
      
      console.log(`Uploading updated project notes for ${id}`);
      await blobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: "application/json" }
      });
      
      // CRITICAL: Update the centralized cache to ensure persistence across components
      console.log(`Updating project cache for project ${id}`);
      projectCache.setProject(updatedProject);
      
      return updatedProject;
    } catch (error) {
      console.error("Error uploading updated project notes:", error);
      return null;
    }
  } catch (error) {
    console.error("Unexpected error in updateProjectNotes:", error);
    return null;
  }
}

// Update project notes
router.put("/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    console.log('Updating project notes:', id);

    // Check if storage is accessible
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }

    const updatedProject = await updateProjectNotes(id, notes);
    
    if (updatedProject) {
      return res.json(updatedProject);
    } else {
      const currentProject = await getProjectById(id);
      if (!currentProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      return res.status(500).json({ 
        error: "Failed to update project notes",
        message: "Failed to save project notes. Please try again later."
      });
    }
  } catch (error) {
    console.error("Unexpected error during project notes update:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    return "";
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}

/**
 * Delete a project using the consolidated blob service
 */
async function deleteProject(id: string): Promise<boolean> {
  try {
    // Get container client from consolidated service
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      console.error(`Failed to get container client for ${PROJECTS_CONTAINER}`);
      return false;
    }

    try {
      const blobClient = container.getBlockBlobClient(`${id}.json`);
      
      // Check if blob exists before trying to delete
      const exists = await blobClient.exists();
      if (!exists) {
        console.warn(`Project with ID ${id} not found for deletion`);
        return false;
      }
      
      await blobClient.delete();
      console.log(`Successfully deleted project ${id}`);
      
      // Clear project from cache
      try {
        // For now, the simplest way to remove a project is to clear all cache
        // In a future update we could add a removeProject method to the cache
        projectCache.clearCache();
        console.log(`Cleared project ${id} from cache`);
      } catch (cacheError) {
        console.warn(`Failed to clear project ${id} from cache:`, cacheError);
        // Non-critical error, continue with success
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return false;
    }
  } catch (error) {
    console.error("Unexpected error in deleteProject:", error);
    return false;
  }
}

// Delete single project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if storage is accessible
    const container = await getContainerClient(PROJECTS_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }

    // Check if project exists first
    const project = await getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Try to delete the project
    const deleted = await deleteProject(id);
    
    if (deleted) {
      res.setHeader('Content-Type', 'application/json');
      return res.json({ message: "Project deleted successfully" });
    } else {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: "Failed to delete project",
        message: "Project exists but could not be deleted. Please try again later."
      });
    }
  } catch (error) {
    console.error("Unexpected error during project deletion:", error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

export default router;