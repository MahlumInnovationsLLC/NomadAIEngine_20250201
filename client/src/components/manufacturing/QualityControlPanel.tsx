import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import SPCChartView from "./quality/SPCChartView";
import QualityMetricsOverview from "./quality/QualityMetricsOverview";
import QualityInspectionList from "./quality/QualityInspectionList";
import SupplierQualityDashboard from "./quality/SupplierQualityDashboard";
import DefectAnalytics from "./quality/DefectAnalytics";
import type { QualityInspection, QualityMetrics } from "@/types/manufacturing";

export const QualityControlPanel = () => {
  const [activeView, setActiveView] = useState("overview");

  const { data: qualityMetrics } = useQuery<QualityMetrics>({
    queryKey: ['/api/manufacturing/quality/metrics'],
  });

  const { data: qualityInspections } = useQuery<QualityInspection[]>({
    queryKey: ['/api/manufacturing/quality/inspections'],
    refetchInterval: 30000, // Refresh every 30 seconds to ensure data is current
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quality Control</h2>
          <p className="text-muted-foreground">
            Monitor and optimize production quality metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <FontAwesomeIcon icon="chart-line" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Defects</CardTitle>
            <FontAwesomeIcon icon="exclamation-triangle" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              4 critical issues pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplier Score</CardTitle>
            <FontAwesomeIcon icon="truck" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              Based on last 100 deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeView} className="space-y-4" onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spc">SPC Charts</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Quality</TabsTrigger>
          <TabsTrigger value="defects">Defect Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <QualityMetricsOverview metrics={qualityMetrics} />
        </TabsContent>

        <TabsContent value="spc">
          <SPCChartView />
        </TabsContent>

        <TabsContent value="inspections">
          <QualityInspectionList inspections={qualityInspections || []} />
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierQualityDashboard />
        </TabsContent>

        <TabsContent value="defects">
          <DefectAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};