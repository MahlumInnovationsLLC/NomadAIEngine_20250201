import { Container, CosmosClient } from "@azure/cosmos";

let container: Container | null = null;

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