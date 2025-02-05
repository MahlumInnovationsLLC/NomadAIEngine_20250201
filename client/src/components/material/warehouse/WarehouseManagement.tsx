
interface WarehouseManagementProps {
  selectedWarehouse: string | null;
  onWarehouseSelect: (warehouseId: string) => void;
}

export function WarehouseManagement({ selectedWarehouse, onWarehouseSelect }: WarehouseManagementProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Warehouse Management</h2>
      <p className="text-muted-foreground">
        {selectedWarehouse 
          ? `Managing warehouse: ${selectedWarehouse}`
          : 'Select a warehouse to manage'}
      </p>
    </div>
  );
}
