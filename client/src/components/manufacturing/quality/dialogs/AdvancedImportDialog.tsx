import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FontAwesomeIcon } from '@/components/ui/font-awesome-icon';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface AdvancedImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionType?: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
}

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: number[];
  category?: string;
  severity?: 'critical' | 'major' | 'minor';
  tableCells?: {
    rowIndex: number;
    columnIndex: number;
    text: string;
    confidence: number;
  }[];
  isTable?: boolean;
  department?: string;
}

interface Analytics {
  issueTypes: { [key: string]: number };
  severityDistribution: { [key: string]: number };
  confidence: number;
}

export function AdvancedImportDialog({ open, onOpenChange, inspectionType }: AdvancedImportDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [failureAnalysis, setFailureAnalysis] = useState<{
    category: string;
    sentiment: 'critical' | 'major' | 'minor';
    confidence: number;
  }[]>([]);
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const SENTIMENT_COLORS = {
    critical: 'text-red-500',
    major: 'text-orange-500',
    minor: 'text-yellow-500'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    // Preview image if it's an image file
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Add inspection type to the form data if available
    if (inspectionType) {
      formData.append('inspectionType', inspectionType);
    }

    try {
      // Simulate progress while processing
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to process document');
      }

      const data = await response.json();
      setResults(data.results);
      setAnalytics(data.analytics);
      setFailureAnalysis(data.results.map((result: OCRResult) => ({
        category: result.category || 'Uncategorized',
        sentiment: result.severity || 'minor',
        confidence: result.confidence
      })));

      toast({
        title: "Document processed successfully",
        description: `Detected ${data.results.length} items with ${Math.round(data.analytics.confidence * 100)}% confidence`,
      });
    } catch (error) {
      toast({
        title: "Error processing document",
        description: "Failed to analyze the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const prepareChartData = (data: { [key: string]: number }) => {
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Advanced QC Document Import</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {previewImage && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Document Preview</h3>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <img
                    src={previewImage}
                    alt="Document preview"
                    className="max-h-[300px] object-contain border rounded"
                  />
                </div>
                <div className="w-1/2">
                  <h4 className="font-medium mb-2">Detected Issues</h4>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between border rounded p-2">
                        <div>
                          <span className={`font-medium ${SENTIMENT_COLORS[result.severity as keyof typeof SENTIMENT_COLORS]}`}>
                            {result.category || 'Uncategorized'}
                          </span>
                          <p className="text-sm text-gray-600">{result.text}</p>
                        </div>
                        <Badge variant={result.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {Math.round(result.confidence * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isProcessing && !results.length && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-500 flex items-center gap-2"
              >
                <FontAwesomeIcon icon="file-import" className="w-4 h-4" />
                Select Document
              </label>
              <p className="mt-2 text-sm text-gray-500">
                Upload a scanned QC document for AI-powered analysis
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-gray-500">
                Processing document... {progress}%
              </p>
            </div>
          )}

          {results.length > 0 && analytics && (
            <Tabs defaultValue="results">
              <TabsList>
                <TabsTrigger value="results">Detected Issues</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {results.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between">
                        <div className="w-full">
                          {result.isTable ? (
                            <div>
                              <div className="flex justify-between mb-2">
                                <p className="font-medium">Table Data</p>
                                <div className="text-sm text-gray-500">
                                  Confidence: {Math.round(result.confidence * 100)}%
                                </div>
                              </div>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-200">
                                  <tbody>
                                    {Array.from(new Set(result.tableCells?.map(cell => cell.rowIndex) || [])).sort().map(rowIndex => (
                                      <tr key={`row-${rowIndex}`} className="border-b border-gray-200">
                                        {Array.from(new Set(result.tableCells?.filter(cell => cell.rowIndex === rowIndex).map(cell => cell.columnIndex) || [])).sort().map(colIndex => {
                                          const cell = result.tableCells?.find(c => c.rowIndex === rowIndex && c.columnIndex === colIndex);
                                          return (
                                            <td key={`cell-${rowIndex}-${colIndex}`} className="border px-2 py-1">
                                              {cell?.text || ''}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              <div className="mt-2">
                                <span className="text-sm text-gray-500">
                                  Department: {result.department || 'Not specified'} | Issue Type: {result.category || 'Uncategorized'} | Severity: {result.severity || 'minor'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium">{result.text}</p>
                              <div className="flex justify-between">
                                <p className="text-sm text-gray-500">
                                  Category: {result.category || 'Uncategorized'} | Severity: {result.severity || 'minor'}
                                  {result.department && ` | Department: ${result.department}`}
                                </p>
                                <div className="text-sm text-gray-500">
                                  Confidence: {Math.round(result.confidence * 100)}%
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="mb-4 text-lg font-medium">Issue Types Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={prepareChartData(analytics.issueTypes)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {prepareChartData(analytics.issueTypes).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-4">
                    <h3 className="mb-4 text-lg font-medium">Severity Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prepareChartData(analytics.severityDistribution)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}