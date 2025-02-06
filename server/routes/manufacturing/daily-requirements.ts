
import { Router } from "express";
import { getContainer } from "../../services/azure/cosmos_service";

const router = Router();

interface DailyRequirement {
  id: string;
  date: string;
  requester: string;
  projectId: string;
  issueDescription: string;
  needByDate: string;
  notes: string;
  status: 'OPEN' | 'CLOSED';
  group: 'Production' | 'Libby' | 'ME' | 'EE' | 'IT' | 'Supply Chain' | 'NTC' | 'QA';
}

// Get all daily requirements
router.get("/", async (req, res) => {
  try {
    const container = getContainer('manufacturing-projects');
    if (!container) {
      throw new Error("Container not initialized");
    }

    const { resources: requirements } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'daily-requirement' ORDER BY c.date DESC"
      })
      .fetchAll();

    res.json(requirements);
  } catch (error) {
    console.error("Failed to get daily requirements:", error);
    res.status(500).json({ error: "Failed to get daily requirements" });
  }
});

// Create new daily requirement
router.post("/", async (req, res) => {
  try {
    const container = getContainer('manufacturing-projects');
    if (!container) {
      throw new Error("Container not initialized");
    }

    const requirement: DailyRequirement = {
      id: `req_${Date.now()}`,
      ...req.body,
      type: 'daily-requirement',
      createdAt: new Date().toISOString()
    };

    const { resource } = await container.items.create(requirement);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Failed to create daily requirement:", error);
    res.status(500).json({ error: "Failed to create daily requirement" });
  }
});

// Update daily requirement
router.put("/:id", async (req, res) => {
  try {
    const container = getContainer('manufacturing-projects');
    if (!container) {
      throw new Error("Container not initialized");
    }

    const { id } = req.params;
    const updates = req.body;

    const { resource: existingReq } = await container.item(id, id).read();
    const updatedReq = {
      ...existingReq,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.item(id, id).replace(updatedReq);
    res.json(resource);
  } catch (error) {
    console.error("Failed to update daily requirement:", error);
    res.status(500).json({ error: "Failed to update daily requirement" });
  }
});

// Delete daily requirement
router.delete("/:id", async (req, res) => {
  try {
    const container = getContainer('manufacturing-projects');
    if (!container) {
      throw new Error("Container not initialized");
    }

    const { id } = req.params;
    await container.item(id, id).delete();
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete daily requirement:", error);
    res.status(500).json({ error: "Failed to delete daily requirement" });
  }
});

export default router;
