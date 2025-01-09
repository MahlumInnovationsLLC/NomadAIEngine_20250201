import { Equipment } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, AlertCircle, Edit, Plus, LayoutDashboard, List, FileText, Activity, Download, Grid } from "lucide-react";
import { TroubleshootingGuide } from "./TroubleshootingGuide";
import { useState } from "react";
import { MaintenanceScheduler } from "./MaintenanceScheduler";
import { EquipmentEditDialog } from "./EquipmentEditDialog";
import { EquipmentQuickAdd } from "./EquipmentQuickAdd";
import { EquipmentHealthDashboard } from "./EquipmentHealthDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import MaintenanceScoreIndicator from "./MaintenanceScoreIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EquipmentLifecycleTimeline } from "./EquipmentLifecycleTimeline";
import { EquipmentIconLibrary } from "./EquipmentIconLibrary";

interface EquipmentListProps {
  equipment: Equipment[];
  onEquipmentSelect?: (equipmentId: number) => void;
  selectedEquipment?: Equipment[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
  error: "bg-red-500",
};

const getHealthColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const getConnectionStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'text-green-500';
    case 'disconnected':
      return 'text-red-500';
    case 'pairing':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
};

export default function EquipmentList({ equipment, onEquipmentSelect, selectedEquipment = [] }: EquipmentListProps) {
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null);
  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTroubleshoot, setSelectedTroubleshoot] = useState<Equipment | null>(null);
  const [selectedForTimeline, setSelectedForTimeline] = useState<Equipment | null>(null);
  const [view, setView] = useState<"list" | "icons" | "health">("list");

  const isSelected = (item: Equipment) => {
    return selectedEquipment.some(eq => eq.id === item.id);
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate", item: Equipment) => {
    if (onEquipmentSelect && checked !== "indeterminate") {
      onEquipmentSelect(item.id);
    }
  };

  const handleRowClick = (item: Equipment) => {
    if (onEquipmentSelect) {
      selectedEquipment.forEach(eq => {
        if (eq.id !== item.id) {
          onEquipmentSelect(eq.id);
        }
      });
      onEquipmentSelect(item.id);
    }
    setSelectedForTimeline(item);
  };

  const generateSingleReport = async (equipmentId: number) => {
    try {
      const equipment_item = equipment.find(eq => eq.id === equipmentId);
      if (!equipment_item) return;

      const response = await fetch('/api/equipment/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: [equipmentId]
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const report = await response.json();
      const reportHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Equipment Performance Report</title>
<style>
  body { font-family: Arial, sans-serif; }
  h1 { color: #333; }
  .section { margin: 20px 0; }
  .metric { margin: 10px 0; }
  .equipment-item { margin: 15px 0; padding: 10px; border: 1px solid #ccc; }
</style>
</head>
<body>
<h1>Equipment Performance Report</h1>
<p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>

<div class="section">
  <h2>Summary</h2>
  <div class="metric">Total Equipment: ${report.summary.totalEquipment}</div>
  <div class="metric">Average Health Score: ${Math.round(report.summary.averageHealth)}%</div>
  <div class="metric">Requires Maintenance: ${report.summary.requiresMaintenance}</div>
  <div class="metric">Offline: ${report.summary.offline}</div>
</div>

<div class="section">
  <h2>Performance Analysis</h2>
  <ul>
    ${report.analysis.performanceAnalysis.map((item: string) => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Maintenance Recommendations</h2>
  <ul>
    ${report.analysis.maintenanceRecommendations.map((item: string) => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Usage Optimization</h2>
  <ul>
    ${report.analysis.usageOptimization.map((item: string) => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Risk Assessment</h2>
  <ul>
    ${report.analysis.riskAssessment.map((item: string) => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Equipment Details</h2>
  ${report.equipment.map((eq: Equipment) => `
    <div class="equipment-item">
      <h3>${eq.name}</h3>
      <div>Health Score: ${eq.healthScore}%</div>
      <div>Status: ${eq.status}</div>
      <div>Last Maintenance: ${eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString() : 'Never'}</div>
      <div>Next Maintenance: ${eq.nextMaintenance ? new Date(eq.nextMaintenance).toLocaleDateString() : 'Not scheduled'}</div>
    </div>
  `).join('\n')}
</div>

</body>
</html>`;

      const blob = new Blob([reportHtml], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-report-${equipment_item.name}-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const exportEquipment = async (format: 'excel' | 'pdf') => {
    const data = equipment.map(item => ({
      Name: item.name,
      Status: item.status,
      'Health Score': `${item.healthScore}%`,
      'Maintenance Score': item.maintenanceScore ? `${item.maintenanceScore}%` : 'N/A',
      'Connection Status': item.deviceConnectionStatus || 'Not Connected',
      'Last Maintenance': item.lastMaintenance ? new Date(item.lastMaintenance).toLocaleDateString() : 'Never',
      'Next Maintenance': item.nextMaintenance ? new Date(item.nextMaintenance).toLocaleDateString() : 'Not Scheduled',
    }));

    if (format === 'excel') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const tableHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Equipment List</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Equipment List</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-list-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleDragEnd = (reorderedEquipment: Equipment[]) => {
    console.log('Equipment reordered:', reorderedEquipment);
  };

  const handleEquipmentAdded = (newEquipment: Equipment) => {
    setEditEquipment(newEquipment);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipment Management</h2>
          <p className="text-sm text-muted-foreground">
            Click row to view predictions, use checkboxes for comparison
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export List
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportEquipment('excel')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportEquipment('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowQuickAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Quick Add Equipment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="icons" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Icon View
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Health Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead>Device Connection</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer hover:bg-accent/50",
                    isSelected(item) && "bg-accent"
                  )}
                  onClick={() => {
                    handleRowClick(item);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected(item)}
                      onCheckedChange={(checked) => handleCheckboxChange(checked, item)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusColors[item.status]}`} />
                      <span className="capitalize">{item.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getHealthColor(Number(item.healthScore))}`} />
                        <span>{item.healthScore}%</span>
                      </div>
                      {item.maintenanceScore !== null && (
                        <MaintenanceScoreIndicator
                          score={Number(item.maintenanceScore)}
                          riskFactors={item.riskFactors as any[]}
                          lastUpdate={item.lastPredictionUpdate ? new Date(item.lastPredictionUpdate) : undefined}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getConnectionStatusColor(item.deviceConnectionStatus || '')}>
                      {item.deviceConnectionStatus ? (
                        <Badge variant="outline" className="capitalize">
                          {item.deviceConnectionStatus}
                        </Badge>
                      ) : (
                        "Not Connected"
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.lastMaintenance
                      ? new Date(item.lastMaintenance).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    {item.nextMaintenance
                      ? new Date(item.nextMaintenance).toLocaleDateString()
                      : "Not scheduled"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setMaintenanceEquipment(item)}
                      >
                        <Settings className="h-4 w-4" />
                        Schedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditEquipment(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTroubleshoot(item)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateSingleReport(item.id);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {selectedForTimeline && (
            <EquipmentLifecycleTimeline equipment={selectedForTimeline} />
          )}
        </TabsContent>

        <TabsContent value="icons">
          <EquipmentIconLibrary
            equipment={equipment}
            onDragEnd={handleDragEnd}
          />
        </TabsContent>

        <TabsContent value="health">
          <EquipmentHealthDashboard />
        </TabsContent>
      </Tabs>

      {selectedTroubleshoot && (
        <TroubleshootingGuide
          equipment={selectedTroubleshoot}
          open={!!selectedTroubleshoot}
          onOpenChange={(open) => !open && setSelectedTroubleshoot(null)}
        />
      )}

      {maintenanceEquipment && (
        <MaintenanceScheduler
          equipment={maintenanceEquipment}
          open={!!maintenanceEquipment}
          onOpenChange={(open) => !open && setMaintenanceEquipment(null)}
        />
      )}

      {editEquipment && (
        <EquipmentEditDialog
          equipment={editEquipment}
          open={!!editEquipment}
          onOpenChange={(open) => !open && setEditEquipment(null)}
        />
      )}

      <EquipmentQuickAdd
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onEquipmentAdded={handleEquipmentAdded}
      />
    </div>
  );
}