import { Router } from "express";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const containerName = "production-projects";

// Initialize Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.NOMAD_AZURE_STORAGE_CONNECTION_STRING || ""
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists
async function ensureContainer() {
  try {
    await containerClient.createIfNotExists();
  } catch (error) {
    console.error("Error creating container:", error);
  }
}

ensureContainer();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const downloadResponse = await blobClient.download();
      const projectData = await streamToString(downloadResponse.readableStreamBody);
      projects.push(JSON.parse(projectData));
    }
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const blobClient = containerClient.getBlobClient(`${req.params.id}.json`);
    const downloadResponse = await blobClient.download();
    const projectData = await streamToString(downloadResponse.readableStreamBody);
    res.json(JSON.parse(projectData));
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: "Project not found" });
    } else {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  }
});

// Create new project
router.post("/", async (req, res) => {
  try {
    const projectId = uuidv4();
    const now = new Date().toISOString();

    // Create a new project with necessary fields for Gantt chart
    const project = {
      id: projectId,
      projectNumber: `PRJ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate || now,
      endDate: req.body.endDate,
      status: req.body.status || 'not_started',
      progress: 0,
      tasks: (req.body.tasks || []).map(task => ({
        id: uuidv4(),
        name: task.name,
        description: task.description || '',
        startDate: task.startDate,
        endDate: task.endDate,
        progress: task.progress || 0,
        dependencies: task.dependencies || [],
        assignee: task.assignee || '',
        status: task.status || 'not_started'
      })),
      team: req.body.team || [],
      milestones: req.body.milestones || [],
      risks: req.body.risks || [],
      budget: {
        planned: req.body.budget?.planned || 0,
        actual: 0,
        currency: req.body.budget?.currency || 'USD'
      },
      metadata: {
        department: req.body.metadata?.department,
        priority: req.body.metadata?.priority || 'medium',
        tags: req.body.metadata?.tags || []
      },
      createdAt: now,
      updatedAt: now,
      createdBy: req.body.createdBy || 'system'
    };

    const blobClient = containerClient.getBlobClient(`${projectId}.json`);
    await blobClient.upload(JSON.stringify(project), JSON.stringify(project).length);

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
router.patch("/:id", async (req, res) => {
  try {
    const blobClient = containerClient.getBlobClient(`${req.params.id}.json`);
    const downloadResponse = await blobClient.download();
    const existingData = JSON.parse(await streamToString(downloadResponse.readableStreamBody));

    // Update project data while maintaining structure
    const updatedProject = {
      ...existingData,
      ...req.body,
      tasks: req.body.tasks ? req.body.tasks.map(task => ({
        ...task,
        id: task.id || uuidv4()
      })) : existingData.tasks,
      updatedAt: new Date().toISOString()
    };

    await blobClient.upload(JSON.stringify(updatedProject), JSON.stringify(updatedProject).length);

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Update project task
router.patch("/:projectId/tasks/:taskId", async (req, res) => {
  try {
    const blobClient = containerClient.getBlobClient(`${req.params.projectId}.json`);
    const downloadResponse = await blobClient.download();
    const projectData = JSON.parse(await streamToString(downloadResponse.readableStreamBody));

    const taskIndex = projectData.tasks.findIndex(t => t.id === req.params.taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    projectData.tasks[taskIndex] = {
      ...projectData.tasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Recalculate project progress based on tasks
    if (projectData.tasks.length > 0) {
      projectData.progress = Math.round(
        projectData.tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / projectData.tasks.length
      );
    }

    await blobClient.upload(JSON.stringify(projectData), JSON.stringify(projectData).length);

    res.json(projectData);
  } catch (error) {
    console.error("Error updating project task:", error);
    res.status(500).json({ error: "Failed to update project task" });
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

export default router;