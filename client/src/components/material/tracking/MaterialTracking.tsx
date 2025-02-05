
interface MaterialTrackingProps {
  selectedWarehouse: string | null;
}

export function MaterialTracking({ selectedWarehouse }: MaterialTrackingProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Material Tracking</h2>
      <p className="text-muted-foreground">
        {selectedWarehouse 
          ? `Tracking materials for warehouse: ${selectedWarehouse}`
          : 'Select a warehouse to view tracking details'}
      </p>
    </div>
  );
}
