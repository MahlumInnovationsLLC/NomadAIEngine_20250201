import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Equipment, BuildingSystem, Inspection } from "@db/schema";

export default function FacilityDashboard() {
  const buildingSystemsQuery = useQuery<BuildingSystem[]>({
    queryKey: ["/api/facility/building-systems"],
  });

  const inspectionsQuery = useQuery<Inspection[]>({
    queryKey: ["/api/facility/inspections"],
  });

  const equipmentQuery = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  if (buildingSystemsQuery.isLoading || inspectionsQuery.isLoading || equipmentQuery.isLoading) {
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

  const criticalIssues = equipmentQuery.data?.reduce((count, equipment) => {
    return count + (equipment.healthScore < 50 ? 1 : 0);
  }, 0) || 0;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Facility Management</h2>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Status</CardTitle>
            <FontAwesomeIcon icon="server" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipmentQuery.data?.filter(e => e.status === 'operational').length || 0}/{equipmentQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Equipment Operational
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
              Equipment requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <FontAwesomeIcon icon="heartbeat" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemsStatus.operational || 0}/{buildingSystemsQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Building systems operational
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
