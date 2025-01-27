import { useQuery } from "@tanstack/react-query";
import PoolMaintenancePanel from "./PoolMaintenancePanel";
import BuildingSystemsPanel from "./BuildingSystemsPanel";
import InspectionPanel from "./InspectionPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { PoolMaintenance, BuildingSystem, Inspection } from "@/types/facility";

export default function FacilityDashboard() {
  const poolQuery = useQuery<PoolMaintenance>({
    queryKey: ["/api/facility/pool/latest"],
  });

  const buildingSystemsQuery = useQuery<BuildingSystem[]>({
    queryKey: ["/api/facility/building-systems"],
  });

  const inspectionsQuery = useQuery<Inspection[]>({
    queryKey: ["/api/facility/inspections"],
  });

  if (poolQuery.isLoading || buildingSystemsQuery.isLoading || inspectionsQuery.isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Facility Management</h2>

      <div className="space-y-6">
        <PoolMaintenancePanel maintenance={poolQuery.data} />

        <BuildingSystemsPanel systems={buildingSystemsQuery.data || []} />

        <InspectionPanel inspections={inspectionsQuery.data || []} />
      </div>
    </div>
  );
}