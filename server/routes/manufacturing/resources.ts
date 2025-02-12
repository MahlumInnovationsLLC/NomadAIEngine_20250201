import { Router } from "express";
import { database, containers, getContainer } from "../services/azure/cosmos_service";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all team members
router.get("/team", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'team_member'"
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Get resource allocations
router.get("/allocations", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'resource_allocation'"
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resource allocations:", error);
    res.status(500).json({ error: "Failed to fetch resource allocations" });
  }
});

// Add new team member
router.post("/team", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const teamMember = {
      id: uuidv4(),
      type: "team_member",
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.create(teamMember);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating team member:", error);
    res.status(500).json({ error: "Failed to create team member" });
  }
});

// Update resource allocation
router.post("/allocations", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const allocation = {
      id: uuidv4(),
      type: "resource_allocation",
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.create(allocation);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating resource allocation:", error);
    res.status(500).json({ error: "Failed to create resource allocation" });
  }
});

export default router;