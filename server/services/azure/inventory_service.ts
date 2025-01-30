import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem, InventoryAllocationEvent } from "../../../client/src/types/inventory";

const client = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING!);
const database = client.database("NomadAIEngineDB");
const inventoryContainer = database.container("inventory");
const inventoryAllocationsContainer = database.container("inventory-allocations");

export async function initializeInventoryDatabase() {
  try {
    // Create containers if they don't exist
    await database.containers.createIfNotExists({
      id: "inventory",
      partitionKey: { paths: ["/id"] }
    });

    await database.containers.createIfNotExists({
      id: "inventory-allocations",
      partitionKey: { paths: ["/itemId"] }
    });

    // Add some sample inventory items if none exist
    const { resources } = await inventoryContainer.items.query("SELECT TOP 1 * FROM c").fetchAll();
    if (resources.length === 0) {
      const sampleItems: Partial<InventoryItem>[] = [
        {
          id: uuidv4(),
          name: "Raw Material A",
          sku: "RM-001",
          category: "raw_materials",
          quantity: 1000,
          unit: "kg",
          reorderPoint: 200,
          location: "Warehouse A",
          status: "in_stock",
          lastUpdated: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: "Component B",
          sku: "COMP-002",
          category: "components",
          quantity: 500,
          unit: "pieces",
          reorderPoint: 100,
          location: "Warehouse B",
          status: "in_stock",
          lastUpdated: new Date().toISOString()
        }
      ];

      for (const item of sampleItems) {
        await inventoryContainer.items.create(item);
      }
    }

    console.log("Inventory database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize inventory database:", error);
    throw error;
  }
}

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  const { resources } = await inventoryContainer.items
    .query("SELECT * FROM c")
    .fetchAll();
  return resources;
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  try {
    const { resource } = await inventoryContainer.item(id, id).read();
    return resource || null;
  } catch (error) {
    console.error("Failed to get inventory item:", error);
    return null;
  }
}

export async function allocateInventory(
  itemId: string,
  quantity: number,
  productionLineId: string
): Promise<InventoryAllocationEvent> {
  const item = await getInventoryItem(itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }

  if (item.quantity < quantity) {
    throw new Error("Insufficient inventory");
  }

  const allocationEvent: InventoryAllocationEvent = {
    itemId,
    quantity,
    allocatedTo: productionLineId,
    timestamp: new Date().toISOString(),
    type: 'allocation',
    status: 'completed'
  };

  // Update inventory quantity
  await inventoryContainer.item(itemId, itemId).replace({
    ...item,
    quantity: item.quantity - quantity,
    lastUpdated: new Date().toISOString(),
    status: item.quantity - quantity <= item.reorderPoint ? "low_stock" : "in_stock"
  });

  // Record allocation
  await inventoryAllocationsContainer.items.create(allocationEvent);

  return allocationEvent;
}

export async function updateInventoryQuantity(
  itemId: string,
  newQuantity: number,
  reason: string
): Promise<InventoryItem> {
  const item = await getInventoryItem(itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }

  const updatedItem: InventoryItem = {
    ...item,
    quantity: newQuantity,
    lastUpdated: new Date().toISOString(),
    status: newQuantity <= 0 ? "out_of_stock" : 
            newQuantity <= item.reorderPoint ? "low_stock" : "in_stock"
  };

  const { resource } = await inventoryContainer.item(itemId, itemId).replace(updatedItem);
  return resource!;
}

// Initialize the database when the module loads
initializeInventoryDatabase().catch(console.error);
