import { Container, CosmosClient } from "@azure/cosmos";
import type { FloorPlan, ProjectLocation } from "@/types/manufacturing";

let container: Container | null = null;
let floorPlansContainer: Container | null = null;
let projectLocationsContainer: Container | null = null;

async function getProjectContainer() {
  if (!container) {
    const client = new CosmosClient({
      endpoint: import.meta.env.NOMAD_COSMOS_ENDPOINT,
      key: import.meta.env.NOMAD_COSMOS_KEY,
    });
    const database = client.database("manufacturing");
    container = database.container("projects");
  }
  return container;
}

async function getFloorPlansContainer() {
  if (!floorPlansContainer) {
    const client = new CosmosClient({
      endpoint: import.meta.env.NOMAD_COSMOS_ENDPOINT,
      key: import.meta.env.NOMAD_COSMOS_KEY,
    });
    const database = client.database("manufacturing");
    floorPlansContainer = database.container("floor-plans");
  }
  return floorPlansContainer;
}

async function getProjectLocationsContainer() {
  if (!projectLocationsContainer) {
    const client = new CosmosClient({
      endpoint: import.meta.env.NOMAD_COSMOS_ENDPOINT,
      key: import.meta.env.NOMAD_COSMOS_KEY,
    });
    const database = client.database("manufacturing");
    projectLocationsContainer = database.container("project-locations");
  }
  return projectLocationsContainer;
}

export async function getAllProjects() {
  const container = await getProjectContainer();
  const { resources } = await container.items
    .query("SELECT * FROM c WHERE c.type = 'project'")
    .fetchAll();
  return resources;
}

export async function getProjectById(id: string) {
  const container = await getProjectContainer();
  const { resource } = await container.item(id, id).read();
  return resource;
}

export async function createProject(project: any) {
  const container = await getProjectContainer();
  const { resource } = await container.items.create({
    ...project,
    type: 'project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return resource;
}

export async function updateProject(id: string, updates: any) {
  const container = await getProjectContainer();
  const { resource } = await container.item(id, id).replace({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return resource;
}

// Floor plan operations
export async function getAllFloorPlans() {
  const container = await getFloorPlansContainer();
  const { resources } = await container.items
    .query("SELECT * FROM c")
    .fetchAll();
  return resources;
}

export async function getFloorPlanById(id: string) {
  const container = await getFloorPlansContainer();
  const { resource } = await container.item(id, id).read();
  return resource;
}

export async function createFloorPlan(floorPlan: Partial<FloorPlan>) {
  const container = await getFloorPlansContainer();
  const { resource } = await container.items.create({
    ...floorPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return resource;
}

export async function updateFloorPlan(id: string, updates: Partial<FloorPlan>) {
  const container = await getFloorPlansContainer();
  const { resource } = await container.item(id, id).replace({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return resource;
}

// Project location operations
export async function getProjectLocations(floorPlanId: string) {
  const container = await getProjectLocationsContainer();
  const { resources } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.floorPlanId = @floorPlanId",
      parameters: [{ name: "@floorPlanId", value: floorPlanId }]
    })
    .fetchAll();
  return resources;
}

export async function updateProjectLocation(projectLocation: ProjectLocation) {
  const container = await getProjectLocationsContainer();
  const { resource } = await container.items.upsert(projectLocation);
  return resource;
}