import { useState } from "react";
import { Equipment } from "@db/schema";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EquipmentPerformanceReportProps {
  selectedEquipment: Equipment[];
}

interface PerformanceReport {
  generatedAt: string;
  equipment: Equipment[];
  analysis: {
    performanceAnalysis: string[];
    maintenanceRecommendations: string[];
    usageOptimization: string[];
    riskAssessment: string[];
  };
  summary: {
    totalEquipment: number;
    averageHealth: number;
    requiresMaintenance: number;
    offline: number;
  };
}

export default function EquipmentPerformanceReport({ selectedEquipment }: EquipmentPerformanceReportProps) {
  const [report, setReport] = useState<PerformanceReport | null>(null);

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/equipment/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: selectedEquipment.map(eq => eq.id)
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: (data) => {
      setReport(data);
      downloadReport(data);
    },
  });

  const downloadReport = (reportData: PerformanceReport) => {
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
<p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>

<div class="section">
  <h2>Summary</h2>
  <div class="metric">Total Equipment: ${reportData.summary.totalEquipment}</div>
  <div class="metric">Average Health Score: ${Math.round(reportData.summary.averageHealth)}%</div>
  <div class="metric">Requires Maintenance: ${reportData.summary.requiresMaintenance}</div>
  <div class="metric">Offline: ${reportData.summary.offline}</div>
</div>

<div class="section">
  <h2>Performance Analysis</h2>
  <ul>
    ${reportData.analysis.performanceAnalysis.map(item => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Maintenance Recommendations</h2>
  <ul>
    ${reportData.analysis.maintenanceRecommendations.map(item => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Usage Optimization</h2>
  <ul>
    ${reportData.analysis.usageOptimization.map(item => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Risk Assessment</h2>
  <ul>
    ${reportData.analysis.riskAssessment.map(item => `<li>${item}</li>`).join('\n')}
  </ul>
</div>

<div class="section">
  <h2>Equipment Details</h2>
  ${reportData.equipment.map(eq => `
    <div class="equipment-item">
      <h3>${eq.name}</h3>
      <div>Type: ${eq.type?.name || 'Unknown'}</div>
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
    a.download = `equipment-report-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (selectedEquipment.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Select equipment items to generate a performance report
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance Report</CardTitle>
        <div className="flex gap-2">
          {report && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => report && downloadReport(report)}
            >
              <FontAwesomeIcon icon="download" className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="default"
            className="gap-2"
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
          >
            {generateReportMutation.isPending ? (
              <FontAwesomeIcon icon="spinner" className="h-4 w-4 animate-spin" />
            ) : (
              <FontAwesomeIcon icon="file-lines" className="h-4 w-4" />
            )}
            Generate Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generateReportMutation.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Failed to generate report. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{report.summary.totalEquipment}</div>
                  <p className="text-xs text-muted-foreground">Total Equipment</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{Math.round(report.summary.averageHealth)}%</div>
                  <p className="text-xs text-muted-foreground">Average Health</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{report.summary.requiresMaintenance}</div>
                  <p className="text-xs text-muted-foreground">Needs Maintenance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{report.summary.offline}</div>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </CardContent>
              </Card>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="analysis">
                <AccordionTrigger>Performance Analysis</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {report.analysis.performanceAnalysis.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="maintenance">
                <AccordionTrigger>Maintenance Recommendations</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {report.analysis.maintenanceRecommendations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="optimization">
                <AccordionTrigger>Usage Optimization</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {report.analysis.usageOptimization.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="risks">
                <AccordionTrigger>Risk Assessment</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {report.analysis.riskAssessment.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}