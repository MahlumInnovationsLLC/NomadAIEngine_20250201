import { Router } from "express";
import { database, containers, getContainer } from "../../services/azure/cosmos_service";
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

// Get all teams
router.get("/teams", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'team'"
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// Get a single team by ID
router.get("/teams/:id", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { id } = req.params;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'team' AND c.id = @id",
      parameters: [
        {
          name: "@id",
          value: id
        }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    if (resources.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    res.json(resources[0]);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Failed to fetch team" });
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

// Get resource allocations by project
router.get("/allocations/project/:projectId", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { projectId } = req.params;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.projectId = @projectId",
      parameters: [
        {
          name: "@projectId",
          value: projectId
        }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching project allocations:", error);
    res.status(500).json({ error: "Failed to fetch project allocations" });
  }
});

// Get resource allocations by team member
router.get("/allocations/member/:memberId", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { memberId } = req.params;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.memberId = @memberId",
      parameters: [
        {
          name: "@memberId",
          value: memberId
        }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching member allocations:", error);
    res.status(500).json({ error: "Failed to fetch member allocations" });
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
      workload: 0,
      availability: 100,
      currentProjects: [],
      hoursAllocated: 0,
      hoursEarned: 0,
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

// Create a new team
router.post("/teams", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const team = {
      id: uuidv4(),
      type: "team",
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.create(team);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// Update a team
router.put("/teams/:id", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { id } = req.params;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'team' AND c.id = @id",
      parameters: [
        {
          name: "@id",
          value: id
        }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    if (resources.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = resources[0];
    const updatedTeam = {
      ...team,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(updatedTeam);
    res.json(resource);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// Add member to team
router.post("/teams/:teamId/members/:memberId", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { teamId, memberId } = req.params;
    
    // Get the team
    const teamQuerySpec = {
      query: "SELECT * FROM c WHERE c.type = 'team' AND c.id = @id",
      parameters: [
        {
          name: "@id",
          value: teamId
        }
      ]
    };

    const { resources: teams } = await container.items.query(teamQuerySpec).fetchAll();
    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Get the member
    const memberQuerySpec = {
      query: "SELECT * FROM c WHERE c.type = 'team_member' AND c.id = @id",
      parameters: [
        {
          name: "@id",
          value: memberId
        }
      ]
    };

    const { resources: members } = await container.items.query(memberQuerySpec).fetchAll();
    if (members.length === 0) {
      return res.status(404).json({ error: "Team member not found" });
    }

    const team = teams[0];
    const members_array = team.members || [];
    
    // Check if member is already in the team
    if (members_array.includes(memberId)) {
      return res.status(400).json({ error: "Member already in team" });
    }

    // Add member to team
    const updatedTeam = {
      ...team,
      members: [...members_array, memberId],
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(updatedTeam);
    res.json(resource);
  } catch (error) {
    console.error("Error adding member to team:", error);
    res.status(500).json({ error: "Failed to add member to team" });
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
    
    // Update member workload and projects
    if (allocation.memberId) {
      const memberQuerySpec = {
        query: "SELECT * FROM c WHERE c.type = 'team_member' AND c.id = @id",
        parameters: [
          {
            name: "@id",
            value: allocation.memberId
          }
        ]
      };

      const { resources: members } = await container.items.query(memberQuerySpec).fetchAll();
      if (members.length > 0) {
        const member = members[0];
        // Convert to array first, then create a Set and back to array to ensure uniqueness
        const existingProjects = Array.isArray(member.currentProjects) ? member.currentProjects : [];
        const currentProjects = Array.from(new Set([...existingProjects, allocation.projectId]));
        
        // Calculate total workload from all allocations
        const allocationsQuerySpec = {
          query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.memberId = @memberId",
          parameters: [
            {
              name: "@memberId",
              value: allocation.memberId
            }
          ]
        };

        const { resources: memberAllocations } = await container.items.query(allocationsQuerySpec).fetchAll();
        const totalWorkload = memberAllocations.reduce((sum, alloc) => sum + alloc.allocation, 0);
        
        // Calculate total allocated hours
        const totalHoursAllocated = memberAllocations.reduce((sum, alloc) => sum + alloc.hoursAllocated, 0);

        const updatedMember = {
          ...member,
          currentProjects,
          workload: totalWorkload,
          availability: Math.max(0, 100 - totalWorkload),
          hoursAllocated: totalHoursAllocated,
          updatedAt: new Date().toISOString()
        };

        await container.items.upsert(updatedMember);
      }
    }

    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating resource allocation:", error);
    res.status(500).json({ error: "Failed to create resource allocation" });
  }
});

// Update earned hours for an allocation (PUT version)
router.put("/allocations/:id/hours", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { id } = req.params;
    const { hoursEarned } = req.body;

    if (typeof hoursEarned !== 'number' || hoursEarned < 0) {
      return res.status(400).json({ error: "Invalid hours value" });
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.id = @id",
      parameters: [
        {
          name: "@id",
          value: id
        }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    if (resources.length === 0) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    const allocation = resources[0];
    const updatedAllocation = {
      ...allocation,
      hoursEarned,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(updatedAllocation);

    // Update member earned hours
    if (allocation.memberId) {
      const memberQuerySpec = {
        query: "SELECT * FROM c WHERE c.type = 'team_member' AND c.id = @id",
        parameters: [
          {
            name: "@id",
            value: allocation.memberId
          }
        ]
      };

      const { resources: members } = await container.items.query(memberQuerySpec).fetchAll();
      if (members.length > 0) {
        const member = members[0];
        
        // Calculate total earned hours from all allocations
        const allocationsQuerySpec = {
          query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.memberId = @memberId",
          parameters: [
            {
              name: "@memberId",
              value: allocation.memberId
            }
          ]
        };

        const { resources: memberAllocations } = await container.items.query(allocationsQuerySpec).fetchAll();
        const totalHoursEarned = memberAllocations.reduce((sum, alloc) => sum + alloc.hoursEarned, 0);

        const updatedMember = {
          ...member,
          hoursEarned: totalHoursEarned,
          updatedAt: new Date().toISOString()
        };

        await container.items.upsert(updatedMember);
      }
    }

    res.json(resource);
  } catch (error) {
    console.error("Error updating allocation hours:", error);
    res.status(500).json({ error: "Failed to update allocation hours" });
  }
});

// Log hours earned (POST version - for frontend use)
router.post("/allocations/:id/hours", async (req, res) => {
  try {
    const container = getContainer('resources');
    if (!container) {
      throw new Error('Resources container not initialized');
    }

    const { id } = req.params;
    const { hoursEarned } = req.body;

    if (typeof hoursEarned !== 'number' || hoursEarned < 0) {
      return res.status(400).json({ error: "Invalid hours value" });
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.id = @id",
      parameters: [
        {
          name: "@id",
          value: id
        }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    if (resources.length === 0) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    const allocation = resources[0];
    const updatedAllocation = {
      ...allocation,
      hoursEarned,
      updatedAt: new Date().toISOString()
    };

    const { resource } = await container.items.upsert(updatedAllocation);

    // Update member earned hours
    if (allocation.memberId) {
      const memberQuerySpec = {
        query: "SELECT * FROM c WHERE c.type = 'team_member' AND c.id = @id",
        parameters: [
          {
            name: "@id",
            value: allocation.memberId
          }
        ]
      };

      const { resources: members } = await container.items.query(memberQuerySpec).fetchAll();
      if (members.length > 0) {
        const member = members[0];
        
        // Calculate total earned hours from all allocations
        const allocationsQuerySpec = {
          query: "SELECT * FROM c WHERE c.type = 'resource_allocation' AND c.memberId = @memberId",
          parameters: [
            {
              name: "@memberId",
              value: allocation.memberId
            }
          ]
        };

        const { resources: memberAllocations } = await container.items.query(allocationsQuerySpec).fetchAll();
        const totalHoursEarned = memberAllocations.reduce((sum, alloc) => sum + alloc.hoursEarned, 0);

        const updatedMember = {
          ...member,
          hoursEarned: totalHoursEarned,
          updatedAt: new Date().toISOString()
        };

        await container.items.upsert(updatedMember);
      }
    }

    res.json(resource);
  } catch (error) {
    console.error("Error updating allocation hours:", error);
    res.status(500).json({ error: "Failed to update allocation hours" });
  }
});

export default router;