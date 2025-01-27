import { useQuery } from "@tanstack/react-query";
import PoolMaintenancePanel from "./PoolMaintenancePanel";
import BuildingSystemsPanel from "./BuildingSystemsPanel";
import InspectionPanel from "./InspectionPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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

  const systemsStatus = buildingSystemsQuery.data?.reduce((acc, system) => {
    acc[system.status] = (acc[system.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const inspectionStatus = inspectionsQuery.data?.reduce((acc, inspection) => {
    acc[inspection.status] = (acc[inspection.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const criticalIssues = inspectionsQuery.data?.reduce((count, inspection) => {
    return count + (inspection.issues?.filter(issue => issue.severity === 'high').length || 0);
  }, 0) || 0;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Facility Management</h2>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Systems Status</CardTitle>
            <FontAwesomeIcon icon="server" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemsStatus.operational || 0}/{buildingSystemsQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Systems Operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            <FontAwesomeIcon icon="clipboard-list" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inspectionStatus.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled inspections awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <FontAwesomeIcon icon="triangle-exclamation" className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              High severity issues requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pool Status</CardTitle>
            <FontAwesomeIcon icon="water" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {poolQuery.data?.filterStatus || "Unknown"}
            </div>
            <p className="text-xs text-muted-foreground">
              Current pool maintenance status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <PoolMaintenancePanel maintenance={poolQuery.data} />

        <BuildingSystemsPanel systems={buildingSystemsQuery.data || []} />

        <InspectionPanel inspections={inspectionsQuery.data || []} />
      </div>
    </div>
  );
}