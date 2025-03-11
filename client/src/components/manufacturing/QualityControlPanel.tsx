import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import SPCChartView from "./quality/SPCChartView";
import QualityMetricsOverview from "./quality/QualityMetricsOverview";
import QualityInspectionList from "./quality/QualityInspectionList";
import { ProjectInspectionView } from "./quality/ProjectInspectionView";
import SupplierQualityDashboard from "./quality/SupplierQualityDashboard";
import DefectAnalytics from "./quality/DefectAnalytics";
import { CreateInspectionDialog } from "./quality/dialogs/CreateInspectionDialog";
import TemplateManagement from "./quality/TemplateManagement";
import QualityTemplatesDialog from "./quality/dialogs/QualityTemplatesDialog";
import type { QualityInspection, QualityMetrics, QualityAudit } from "@/types/manufacturing";
import NCRList from "./quality/NCRList";
import CAPAList from "./quality/CAPAList";
import SCARList from "./quality/SCARList";
import MRBList from "./quality/MRBList";
import AuditList from "./quality/AuditList";
import { CreateAuditDialog } from "./quality/dialogs/CreateAuditDialog";
import AuditAnalytics from "./quality/AuditAnalytics";
import FindingsList from "./quality/FindingsList";

export const QualityControlPanel = () => {
  const [activeView, setActiveView] = useState("overview");
  const [qmsActiveView, setQmsActiveView] = useState("inspections");
  const [inspectionTypeView, setInspectionTypeView] = useState<'in-process' | 'final-qc' | 'executive-review' | 'pdi'>('final-qc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCreateAuditDialog, setShowCreateAuditDialog] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<'inspection' | 'ncr' | 'capa' | 'scar' | 'mrb'>('inspection');

  const queryClient = useQueryClient();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const handleInspectionCreated = (newInspection: QualityInspection) => {
      queryClient.setQueryData<QualityInspection[]>(
        ['/api/manufacturing/quality/inspections'],
        (old) => old ? [...old, newInspection] : [newInspection]
      );
      toast({
        title: "Inspection Created",
        description: "New quality inspection has been created successfully.",
      });
    };

    const handleInspectionUpdated = (updatedInspection: QualityInspection) => {
      queryClient.setQueryData<QualityInspection[]>(
        ['/api/manufacturing/quality/inspections'],
        (old) => old?.map(inspection =>
          inspection.id === updatedInspection.id ? updatedInspection : inspection
        ) || []
      );
      toast({
        title: "Inspection Updated",
        description: "Quality inspection has been updated successfully.",
      });
    };

    socket.on('quality:inspection:created', handleInspectionCreated);
    socket.on('quality:inspection:updated', handleInspectionUpdated);

    return () => {
      socket.off('quality:inspection:created', handleInspectionCreated);
      socket.off('quality:inspection:updated', handleInspectionUpdated);
    };
  }, [socket, queryClient, toast]);

  const { data: qualityMetrics } = useQuery<QualityMetrics>({
    queryKey: ['/api/manufacturing/quality/metrics'],
  });

  const { data: qualityInspections } = useQuery<QualityInspection[]>({
    queryKey: ['/api/manufacturing/quality/inspections'],
  });

  const { data: qualityAudits, refetch: refetchAudits } = useQuery<QualityAudit[]>({
    queryKey: ['/api/manufacturing/quality/audits'],
  });

  const handleCreateInspection = async (data: Partial<QualityInspection>) => {
    try {
      if (!socket) {
        throw new Error('Socket connection not available');
      }

      socket.emit('quality:inspection:create', {
        ...data,
        type: inspectionTypeView
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update template type based on active QMS view
  useEffect(() => {
    setSelectedTemplateType(qmsActiveView === 'inspections' ? 'inspection' :
      qmsActiveView === 'ncr' ? 'ncr' :
      qmsActiveView === 'capa' ? 'capa' :
      qmsActiveView === 'scar' ? 'scar' :
      qmsActiveView === 'mrb' ? 'mrb' : 'inspection');
  }, [qmsActiveView]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Quality Assurance</h2>
            <FontAwesomeIcon icon="circle-check" className="h-5 w-5 text-green-500" />
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
          <Button onClick={() => setShowCreateAuditDialog(true)} variant="secondary">
            <FontAwesomeIcon icon="clipboard-check" className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </div>
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

        <TabsContent value="nomad-qms">
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Quality Management System</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage quality processes and documentation
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateDialog(true)}
                  >
                    <FontAwesomeIcon icon="cog" className="mr-2 h-4 w-4" />
                    Manage Templates
                  </Button>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                    New Inspection
                  </Button>
                </div>
              </div>

              <Tabs value={qmsActiveView} onValueChange={setQmsActiveView} className="space-y-4">
                <TabsList className="w-full">
                  <TabsTrigger value="inspections">Inspections</TabsTrigger>
                  <TabsTrigger value="projects">Project View</TabsTrigger>
                  <TabsTrigger value="ncr">NCR</TabsTrigger>
                  <TabsTrigger value="capa">CAPA</TabsTrigger>
                  <TabsTrigger value="scar">SCAR</TabsTrigger>
                  <TabsTrigger value="mrb">MRB</TabsTrigger>
                  <TabsTrigger value="gages">Gages</TabsTrigger>
                </TabsList>

                <TabsContent value="inspections">
                  <Card>
                    <CardContent>
                      <Tabs 
                        value={inspectionTypeView} 
                        onValueChange={(value) => setInspectionTypeView(value as typeof inspectionTypeView)} 
                        className="space-y-4"
                      >
                        <TabsList className="w-full">
                          <TabsTrigger value="in-process">In-Process</TabsTrigger>
                          <TabsTrigger value="final-qc">Final QC</TabsTrigger>
                          <TabsTrigger value="executive-review">Executive Review</TabsTrigger>
                          <TabsTrigger value="pdi">PDI</TabsTrigger>
                        </TabsList>
                        <TabsContent value="in-process">
                          <QualityInspectionList 
                            inspections={qualityInspections} 
                            type="in-process" 
                          />
                        </TabsContent>
                        <TabsContent value="final-qc">
                          <QualityInspectionList 
                            inspections={qualityInspections} 
                            type="final-qc" 
                          />
                        </TabsContent>
                        <TabsContent value="executive-review">
                          <QualityInspectionList 
                            inspections={qualityInspections} 
                            type="executive-review" 
                          />
                        </TabsContent>
                        <TabsContent value="pdi">
                          <QualityInspectionList 
                            inspections={qualityInspections} 
                            type="pdi" 
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects">
                  <ProjectInspectionView />
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
                <TabsContent value="gages">
                  <GageList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <QualityMetricsOverview metrics={qualityMetrics} />
        </TabsContent>

        <TabsContent value="spc">
          <SPCChartView />
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
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <CreateInspectionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateInspection}
          type={inspectionTypeView}
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

      <QualityTemplatesDialog 
        open={showTemplateDialog} 
        onOpenChange={setShowTemplateDialog}
      />
    </div>
  );
};