import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  BuildingSystem,
  Inspection,
  PoolMaintenance
} from "@/types/facility";

import PoolMaintenancePanel from "./facility/PoolMaintenancePanel";
import BuildingSystemsPanel from "./facility/BuildingSystemsPanel";
import InspectionPanel from "./facility/InspectionPanel";

export default function FacilityMaintenanceDashboard() {
  const [activeView, setActiveView] = useState("overview");

  const { data: poolData } = useQuery<PoolMaintenance>({
    queryKey: ["/api/facility/pool/latest"],
  });

  const { data: buildingSystems } = useQuery<BuildingSystem[]>({
    queryKey: ["/api/facility/building-systems"],
  });

  const { data: inspections } = useQuery<Inspection[]>({
    queryKey: ["/api/facility/inspections"],
  });

  const pendingInspections = inspections?.filter(i => i.status === "pending") || [];
  const criticalSystems = buildingSystems?.filter(s => s.status !== "operational") || [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facility Maintenance</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage facility maintenance tasks
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pool Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pool Status</CardTitle>
            <FontAwesomeIcon icon="swimming-pool" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {poolData?.chemicalLevels ? "Balanced" : "Check Required"}
            </div>
            <p className="text-xs text-muted-foreground">
              Last reading: {poolData?.readings[poolData.readings.length - 1]?.timestamp
                ? new Date(poolData.readings[poolData.readings.length - 1].timestamp).toLocaleDateString()
                : "No readings"}
            </p>
          </CardContent>
        </Card>

        {/* Pending Inspections Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            <FontAwesomeIcon icon="clipboard-check" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInspections.length}</div>
            <p className="text-xs text-muted-foreground">
              Next due: {pendingInspections[0]?.dueDate
                ? new Date(pendingInspections[0].dueDate).toLocaleDateString()
                : "None pending"}
            </p>
          </CardContent>
        </Card>

        {/* System Alerts Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            <FontAwesomeIcon icon="exclamation-triangle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalSystems.length}</div>
            <p className="text-xs text-muted-foreground">
              Systems requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" onClick={() => setActiveView("overview")}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="pool" onClick={() => setActiveView("pool")}>
            Pool Maintenance
          </TabsTrigger>
          <TabsTrigger value="systems" onClick={() => setActiveView("systems")}>
            Building Systems
          </TabsTrigger>
          <TabsTrigger value="inspections" onClick={() => setActiveView("inspections")}>
            Inspections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Record Pool Chemical Readings
                </Button>
                <Button variant="outline" className="justify-start">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Schedule New Inspection
                </Button>
                <Button variant="outline" className="justify-start">
                  <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                  Report Building Issue
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest maintenance events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* We'll populate this with actual data later */}
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pool">
          <PoolMaintenancePanel maintenance={poolData} />
        </TabsContent>

        <TabsContent value="systems">
          <BuildingSystemsPanel systems={buildingSystems || []} />
        </TabsContent>

        <TabsContent value="inspections">
          <InspectionPanel inspections={inspections || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
