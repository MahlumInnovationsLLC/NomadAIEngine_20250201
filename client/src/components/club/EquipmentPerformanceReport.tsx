import { useState } from "react";
import { Equipment } from "@db/schema";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
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
    },
  });

  const downloadReport = () => {
    if (!report) return;

    const reportText = `
Equipment Performance Report
Generated: ${new Date(report.generatedAt).toLocaleString()}

Summary:
- Total Equipment: ${report.summary.totalEquipment}
- Average Health Score: ${Math.round(report.summary.averageHealth)}%
- Requires Maintenance: ${report.summary.requiresMaintenance}
- Offline: ${report.summary.offline}

Performance Analysis:
${report.analysis.performanceAnalysis.map(item => `- ${item}`).join('\n')}

Maintenance Recommendations:
${report.analysis.maintenanceRecommendations.map(item => `- ${item}`).join('\n')}

Usage Optimization:
${report.analysis.usageOptimization.map(item => `- ${item}`).join('\n')}

Risk Assessment:
${report.analysis.riskAssessment.map(item => `- ${item}`).join('\n')}

Equipment Details:
${report.equipment.map(eq => `
${eq.name}
- Type: ${eq.type?.name || 'Unknown'}
- Health Score: ${eq.healthScore}%
- Status: ${eq.status}
- Last Maintenance: ${eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString() : 'Never'}
- Next Maintenance: ${eq.nextMaintenance ? new Date(eq.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-report-${new Date().toISOString().split('T')[0]}.txt`;
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
              onClick={downloadReport}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="default"
            className="gap-2"
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
          >
            {generateReportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
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
