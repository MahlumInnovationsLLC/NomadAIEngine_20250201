import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem, InventoryStats } from "../../../client/src/types/inventory";

const client = new CosmosClient(process.env.NOMAD_AZURE_COSMOS_CONNECTION_STRING!);
const database = client.database("NomadAIEngineDB");
const inventoryContainer = database.container("inventory");
const inventoryAllocationsContainer = database.container("inventory-allocations");

export async function initializeInventoryDatabase() {
  try {
    console.log("Starting inventory database initialization...");

    // Create containers if they don't exist
    const { container: invContainer } = await database.containers.createIfNotExists({
      id: "inventory",
      partitionKey: { paths: ["/id"] }
    });
    console.log("Inventory container verified/created");

    const { container: allocContainer } = await database.containers.createIfNotExists({
      id: "inventory-allocations",
      partitionKey: { paths: ["/itemId"] }
    });
    console.log("Inventory allocations container verified/created");

    // Verify container access
    try {
      await invContainer.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll();
      console.log("Successfully verified inventory container access");
      await allocContainer.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll();
      console.log("Successfully verified allocations container access");
    } catch (error) {
      console.error("Error verifying container access:", error);
      throw new Error("Failed to verify container access");
    }

    console.log("Inventory database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize inventory database:", error);
    throw error;
  }
}

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  try {
    const { resources } = await inventoryContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    return resources;
  } catch (error) {
    console.error("Failed to get inventory items:", error);
    throw error;
  }
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
): Promise<any> {
  const item = await getInventoryItem(itemId);
  if (!item) {
    throw new Error("Inventory item not found");
  }

  if (item.qtyOnHand < quantity) {
    throw new Error("Insufficient inventory");
  }

  const allocationEvent = {
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
    qtyOnHand: item.qtyOnHand - quantity,
    lastUpdated: new Date().toISOString(),
    status: item.qtyOnHand - quantity <= 0 ? "out_of_stock" : 
           item.qtyOnHand - quantity < 10 ? "low_stock" : "in_stock"
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
    qtyOnHand: newQuantity,
    lastUpdated: new Date().toISOString(),
    status: newQuantity <= 0 ? "out_of_stock" :
            newQuantity < 10 ? "low_stock" : "in_stock"
  };

  const { resource } = await inventoryContainer.item(itemId, itemId).replace(updatedItem);
  return resource!;
}

export async function bulkImportInventory(items: Partial<InventoryItem>[]): Promise<InventoryItem[]> {
  try {
    console.log(`Starting bulk import of ${items.length} items`);
    const importedItems: InventoryItem[] = [];

    // Verify container accessibility before starting import
    try {
      await inventoryContainer.items.query("SELECT VALUE COUNT(1) FROM c").fetchAll();
      console.log("Container access verified before import");
    } catch (error) {
      console.error("Failed to verify container access:", error);
      throw new Error("Database connection issue - please try again");
    }

    for (const item of items) {
      try {
        const newItem: InventoryItem = {
          id: uuidv4(),
          partNo: item.partNo!,
          binLocation: item.binLocation!,
          warehouse: item.warehouse!,
          qtyOnHand: item.qtyOnHand || 0,
          description: item.description || '',
          glCode: item.glCode || '',
          prodCode: item.prodCode || '',
          vendCode: item.vendCode || '',
          cost: item.cost || 0,
          lastUpdated: new Date().toISOString(),
          status: item.qtyOnHand && item.qtyOnHand > 0 ? 
                 (item.qtyOnHand < 10 ? 'low_stock' : 'in_stock') : 
                 'out_of_stock'
        };

        console.log(`Attempting to create item in database: ${JSON.stringify(newItem)}`);
        const { resource } = await inventoryContainer.items.create(newItem);

        if (resource) {
          console.log(`Successfully imported item: ${resource.id}`);
          importedItems.push(resource);
        } else {
          console.error("No resource returned from create operation");
          throw new Error("Failed to create inventory item - no resource returned");
        }
      } catch (createError) {
        console.error(`Failed to import item ${item.partNo}:`, createError);
        throw new Error(`Failed to import item ${item.partNo}: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
      }
    }

    console.log(`Successfully imported ${importedItems.length} items`);
    return importedItems;
  } catch (error) {
    console.error("Failed to bulk import inventory items:", error);
    throw error;
  }
}

export async function getInventoryStats(): Promise<InventoryStats> {
  try {
    console.log("Fetching inventory statistics");
    const { resources: items } = await inventoryContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.qtyOnHand <= 10).length;
    const outOfStockItems = items.filter(item => item.qtyOnHand <= 0).length;

    // Calculate total value
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.qtyOnHand * (item.cost || 0));
    }, 0);

    // Get recent updates
    const recentUpdates = items
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5)
      .map(item => ({
        itemId: item.id,
        previousQuantity: item.qtyOnHand,
        newQuantity: item.qtyOnHand,
        reason: "Stock Update",
        timestamp: item.lastUpdated
      }));

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      recentUpdates
    };
  } catch (error) {
    console.error("Failed to get inventory stats:", error);
    throw error;
  }
}

// Initialize the database when the module loads
initializeInventoryDatabase().catch(console.error);