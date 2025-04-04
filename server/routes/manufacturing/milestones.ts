import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getContainerClient, containerNames } from "../../services/azure/blob_service";
import { streamToString } from "../../services/azure/helper_functions";
import { Milestone } from "../../types/milestones";

const router = Router();

// Constants
const MILESTONES_CONTAINER = containerNames.MILESTONES || 'milestones';

// Helper function to get milestone data for a project
async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  try {
    console.log(`Fetching milestones for project: ${projectId}`);
    
    // Get container client
    const container = await getContainerClient(MILESTONES_CONTAINER);
    
    if (!container) {
      console.error(`Failed to get container client for ${MILESTONES_CONTAINER}`);
      return [];
    }
    
    const milestones: Milestone[] = [];
    
    try {
      // List all blobs that match the project ID prefix
      // Using a prefix with projectId to organize milestones by project
      const prefix = `${projectId}/`;
      
      for await (const blob of container.listBlobsFlat({ prefix })) {
        try {
          const blobClient = container.getBlockBlobClient(blob.name);
          const downloadResponse = await blobClient.download();
          const milestoneData = await streamToString(downloadResponse.readableStreamBody);
          
          if (!milestoneData) {
            console.warn(`Empty data in blob: ${blob.name}`);
            continue;
          }
          
          try {
            const milestone = JSON.parse(milestoneData) as Milestone;
            milestones.push(milestone);
          } catch (parseError) {
            console.error(`Error parsing JSON from blob ${blob.name}:`, parseError);
          }
        } catch (blobError) {
          console.error(`Error processing blob ${blob.name}:`, blobError);
        }
      }
      
      console.log(`Successfully fetched ${milestones.length} milestones for project ${projectId}`);
      return milestones;
    } catch (listError) {
      console.error(`Error listing blobs from container ${MILESTONES_CONTAINER}:`, listError);
      return [];
    }
  } catch (error) {
    console.error(`Unexpected error in getProjectMilestones for project ${projectId}:`, error);
    return [];
  }
}

// GET all milestones for a project
router.get("/projects/:projectId/milestones", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }
    
    const milestones = await getProjectMilestones(projectId);
    
    return res.status(200).json(milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return res.status(500).json({
      error: "Failed to fetch milestones",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET specific milestone
router.get("/projects/:projectId/milestones/:milestoneId", async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    
    if (!projectId || !milestoneId) {
      return res.status(400).json({ error: "Project ID and Milestone ID are required" });
    }
    
    // Get container client
    const container = await getContainerClient(MILESTONES_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }
    
    // Fetch the specific milestone
    const blobName = `${projectId}/${milestoneId}.json`;
    const blobClient = container.getBlockBlobClient(blobName);
    
    try {
      const downloadResponse = await blobClient.download();
      const milestoneData = await streamToString(downloadResponse.readableStreamBody);
      
      if (!milestoneData) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      const milestone = JSON.parse(milestoneData) as Milestone;
      return res.status(200).json(milestone);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching milestone:", error);
    return res.status(500).json({
      error: "Failed to fetch milestone",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// CREATE a new milestone
router.post("/projects/:projectId/milestones", async (req, res) => {
  try {
    const { projectId } = req.params;
    const milestoneData = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }
    
    if (!milestoneData || !milestoneData.title || !milestoneData.start || !milestoneData.end) {
      return res.status(400).json({ error: "Milestone data is incomplete. Title, start, and end dates are required." });
    }
    
    // Get container client
    const container = await getContainerClient(MILESTONES_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }
    
    // Generate a new milestone ID if not provided
    const milestoneId = milestoneData.id || uuidv4();
    const now = new Date().toISOString();
    
    // Create the complete milestone object
    const milestone: Milestone = {
      id: milestoneId,
      title: milestoneData.title,
      start: milestoneData.start,
      end: milestoneData.end,
      color: milestoneData.color || "#3B82F6", // Default blue color
      projectId: projectId,
      duration: milestoneData.duration || 0,
      dependencies: milestoneData.dependencies || [],
      indent: milestoneData.indent || 0,
      parent: milestoneData.parent || null,
      completed: milestoneData.completed || 0,
      isExpanded: milestoneData.isExpanded !== undefined ? milestoneData.isExpanded : true,
      key: milestoneData.key || milestoneId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Save to Azure Blob Storage
    const blobName = `${projectId}/${milestoneId}.json`;
    const blockBlobClient = container.getBlockBlobClient(blobName);
    const content = JSON.stringify(milestone);
    
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      }
    });
    
    return res.status(201).json(milestone);
  } catch (error) {
    console.error("Error creating milestone:", error);
    return res.status(500).json({
      error: "Failed to create milestone",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// UPDATE a milestone
router.put("/projects/:projectId/milestones/:milestoneId", async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const milestoneData = req.body;
    
    if (!projectId || !milestoneId) {
      return res.status(400).json({ error: "Project ID and Milestone ID are required" });
    }
    
    if (!milestoneData || !milestoneData.title || !milestoneData.start || !milestoneData.end) {
      return res.status(400).json({ error: "Milestone data is incomplete. Title, start, and end dates are required." });
    }
    
    // Get container client
    const container = await getContainerClient(MILESTONES_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }
    
    // Check if the milestone exists
    const blobName = `${projectId}/${milestoneId}.json`;
    const blobClient = container.getBlockBlobClient(blobName);
    
    try {
      await blobClient.getProperties();
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      throw error;
    }
    
    // Update the milestone
    const now = new Date().toISOString();
    
    // Create the updated milestone object
    const milestone: Milestone = {
      id: milestoneId,
      title: milestoneData.title,
      start: milestoneData.start,
      end: milestoneData.end,
      color: milestoneData.color || "#3B82F6",
      projectId: projectId,
      duration: milestoneData.duration || 0,
      dependencies: milestoneData.dependencies || [],
      indent: milestoneData.indent || 0,
      parent: milestoneData.parent || null,
      completed: milestoneData.completed || 0,
      isExpanded: milestoneData.isExpanded !== undefined ? milestoneData.isExpanded : true,
      key: milestoneData.key || milestoneId,
      createdAt: milestoneData.createdAt || now, // Preserve original creation date if available
      updatedAt: now,
    };
    
    // Save to Azure Blob Storage
    const blockBlobClient = container.getBlockBlobClient(blobName);
    const content = JSON.stringify(milestone);
    
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      }
    });
    
    return res.status(200).json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return res.status(500).json({
      error: "Failed to update milestone",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE a milestone
router.delete("/projects/:projectId/milestones/:milestoneId", async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    
    if (!projectId || !milestoneId) {
      return res.status(400).json({ error: "Project ID and Milestone ID are required" });
    }
    
    // Get container client
    const container = await getContainerClient(MILESTONES_CONTAINER);
    
    if (!container) {
      return res.status(503).json({ 
        error: "Azure Storage is not available", 
        message: "Storage connection not initialized. Please check connection string configuration."
      });
    }
    
    // Delete the milestone
    const blobName = `${projectId}/${milestoneId}.json`;
    const blobClient = container.getBlockBlobClient(blobName);
    
    try {
      await blobClient.delete();
      return res.status(200).json({ message: "Milestone deleted successfully" });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return res.status(500).json({
      error: "Failed to delete milestone",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;