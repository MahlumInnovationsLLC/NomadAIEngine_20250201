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
import { CreateInspectionDialog } from "./quality/dialogs/CreateInspectionDialog";
import type { QualityInspection, QualityMetrics, QualityAudit } from "@/types/manufacturing";
import NCRList from "./quality/NCRList";
import CAPAList from "./quality/CAPAList";
import SCARList from "./quality/SCARList";
import MRBList from "./quality/MRBList";
import AuditList from "./quality/AuditList";
import { CreateAuditDialog } from "./quality/dialogs/CreateAuditDialog";
import { auditTemplates } from "@/templates/qualityTemplates";
import AuditAnalytics from "./quality/AuditAnalytics";
import FindingsList from "./quality/FindingsList";

export const QualityControlPanel = () => {
  const [activeView, setActiveView] = useState("overview");
  const [qmsActiveView, setQmsActiveView] = useState("inspections");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateAuditDialog, setShowCreateAuditDialog] = useState(false);

  const { data: qualityMetrics } = useQuery<QualityMetrics>({
    queryKey: ['/api/manufacturing/quality/metrics'],
  });

  const { data: qualityInspections, refetch: refetchInspections } = useQuery<QualityInspection[]>({
    queryKey: ['/api/manufacturing/quality/inspections'],
    refetchInterval: 30000,
  });

  const { data: qualityAudits, refetch: refetchAudits } = useQuery<QualityAudit[]>({
    queryKey: ['/api/manufacturing/quality/audits'],
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Quality Assurance</h2>
            <FontAwesomeIcon icon={['fal', 'circle-check']} className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-muted-foreground">
            Monitor and optimize production quality metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FontAwesomeIcon icon="download" className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
          <Button onClick={() => setShowCreateAuditDialog(true)} variant="secondary">
            <FontAwesomeIcon icon="clipboard-check" className="mr-2 h-4 w-4" />
            New Audit
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
          <TabsTrigger value="nomad-qms">Nomad QMS</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Quality</TabsTrigger>
          <TabsTrigger value="defects">Defect Analysis</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <QualityMetricsOverview metrics={qualityMetrics} />
        </TabsContent>

        <TabsContent value="spc">
          <SPCChartView />
        </TabsContent>

        <TabsContent value="nomad-qms">
          <Card>
            <CardHeader>
              <CardTitle>Quality Management System</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={qmsActiveView} onValueChange={setQmsActiveView} className="space-y-4">
                <TabsList className="w-full">
                  <TabsTrigger value="inspections">Inspections</TabsTrigger>
                  <TabsTrigger value="ncr">NCR</TabsTrigger>
                  <TabsTrigger value="capa">CAPA</TabsTrigger>
                  <TabsTrigger value="scar">SCAR</TabsTrigger>
                  <TabsTrigger value="mrb">MRB</TabsTrigger>
                </TabsList>

                <TabsContent value="inspections">
                  <QualityInspectionList inspections={qualityInspections || []} />
                </TabsContent>

                <TabsContent value="ncr">
                  <NCRList />
                </TabsContent>

                <TabsContent value="capa">
                  <CAPAList />
                </TabsContent>

                <TabsContent value="scar">
                  <SCARList />
                </TabsContent>

                <TabsContent value="mrb">
                  <MRBList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierQualityDashboard />
        </TabsContent>

        <TabsContent value="defects">
          <DefectAnalytics />
        </TabsContent>

        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <CardTitle>Quality Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="findings">Findings</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                  <AuditList 
                    audits={qualityAudits?.filter(a => a.status === 'planned') || []} 
                    type="upcoming"
                  />
                </TabsContent>
                <TabsContent value="in-progress">
                  <AuditList 
                    audits={qualityAudits?.filter(a => a.status === 'in_progress') || []} 
                    type="in-progress"
                  />
                </TabsContent>
                <TabsContent value="completed">
                  <AuditList 
                    audits={qualityAudits?.filter(a => a.status === 'completed') || []} 
                    type="completed"
                  />
                </TabsContent>
                <TabsContent value="findings">
                  <FindingsList />
                </TabsContent>
                <TabsContent value="analytics">
                  <AuditAnalytics />
                </TabsContent>
                <TabsContent value="templates">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auditTemplates.map((template) => (
                        <Card key={template.id}>
                          <CardHeader>
                            <CardTitle>{template.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                              {template.standard} - Version {template.version}
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                setShowCreateAuditDialog(true);
                                // We'll implement template selection later
                              }}
                            >
                              Use Template
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <CreateInspectionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={async (data) => {
            try {
              const response = await fetch('/api/manufacturing/quality/inspections', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                throw new Error(`Failed to create inspection: ${response.statusText}`);
              }

              await refetchInspections();
              setShowCreateDialog(false);
            } catch (error) {
              console.error('Error creating inspection:', error);
              throw error;
            }
          }}
        />
      )}

      {showCreateAuditDialog && (
        <CreateAuditDialog
          open={showCreateAuditDialog}
          onOpenChange={setShowCreateAuditDialog}
          onSubmit={async (data) => {
            try {
              const response = await fetch('/api/manufacturing/quality/audits', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                throw new Error(`Failed to create audit: ${response.statusText}`);
              }

              await refetchAudits();
              setShowCreateAuditDialog(false);
            } catch (error) {
              console.error('Error creating audit:', error);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
};