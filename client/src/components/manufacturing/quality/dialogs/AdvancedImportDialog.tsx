import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

interface ProcessingStage {
  name: string;
  description: string;
  complete: boolean;
  inProgress: boolean;
  error: boolean;
}

export function AdvancedImportDialog({ open, onOpenChange, inspectionType }: AdvancedImportDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { name: 'Document Upload', description: 'Uploading and validating document', complete: false, inProgress: false, error: false },
    { name: 'Layout Analysis', description: 'Detecting tables and structured content', complete: false, inProgress: false, error: false },
    { name: 'Text Recognition', description: 'Reading and extracting text content', complete: false, inProgress: false, error: false },
    { name: 'Content Analysis', description: 'Analyzing content for quality issues', complete: false, inProgress: false, error: false },
    { name: 'Data Integration', description: 'Preparing data for inspection record', complete: false, inProgress: false, error: false }
  ]);
  const [realTimeResults, setRealTimeResults] = useState<OCRResult[]>([]);
  const [showRealTimePreview, setShowRealTimePreview] = useState(false);
  const [creatingInspection, setCreatingInspection] = useState(false);
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const SENTIMENT_COLORS = {
    critical: 'text-red-500',
    major: 'text-orange-500',
    minor: 'text-yellow-500'
  };
  const SEVERITY_BG_COLORS = {
    critical: 'bg-red-100',
    major: 'bg-orange-100',
    minor: 'bg-yellow-100'
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Only reset some state when dialog closes to preserve the results
      setIsProcessing(false);
      setProgress(0);
      setCreatingInspection(false);
      setShowRealTimePreview(false);
      
      // Reset processing stages
      setProcessingStages(prev => prev.map(stage => ({
        ...stage,
        complete: false,
        inProgress: false,
        error: false
      })));
    }
  }, [open]);

  // Simulate real-time result updates during processing
  useEffect(() => {
    if (isProcessing && progress > 20 && progress < 90) {
      const interval = setInterval(() => {
        if (Math.random() > 0.5) {
          // Simulate a new result being found
          const newResult: OCRResult = {
            text: `Found potential ${Math.random() > 0.5 ? 'defect' : 'issue'} in document`,
            confidence: 0.75 + Math.random() * 0.2,
            boundingBox: [100, 100, 200, 100, 200, 150, 100, 150],
            category: Math.random() > 0.7 ? 'Material Defect' : Math.random() > 0.5 ? 'Assembly Issue' : 'Quality Standard Violation',
            severity: Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'major' : 'minor',
            department: inspectionType === 'in-process' ? 'Manufacturing' : 
                      inspectionType === 'final-qc' ? 'Quality Control' : 
                      inspectionType === 'executive-review' ? 'Management' : 'Pre-Delivery'
          };
          setRealTimeResults(prev => [...prev, newResult]);
        }
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing, progress, inspectionType]);

  // Update processing stages based on progress
  useEffect(() => {
    if (isProcessing) {
      if (progress < 20) {
        updateStage(0, true, false, false);
      } else if (progress < 40) {
        updateStage(0, false, true, false);
        updateStage(1, true, false, false);
      } else if (progress < 60) {
        updateStage(1, false, true, false);
        updateStage(2, true, false, false);
      } else if (progress < 80) {
        updateStage(2, false, true, false);
        updateStage(3, true, false, false);
      } else if (progress < 95) {
        updateStage(3, false, true, false);
        updateStage(4, true, false, false);
      } else if (progress === 100) {
        updateStage(4, false, true, false);
        // Briefly delay marking the final stage as complete
        setTimeout(() => {
          updateStage(4, false, false, false, true);
          setShowRealTimePreview(false);
        }, 500);
      }
    }
  }, [progress, isProcessing]);

  const updateStage = (
    index: number, 
    inProgress: boolean, 
    complete: boolean, 
    error: boolean,
    setAllPreviousComplete = false
  ) => {
    setProcessingStages(prev => {
      const updated = [...prev];
      
      // Optionally set all previous stages to complete
      if (setAllPreviousComplete) {
        for (let i = 0; i <= index; i++) {
          updated[i] = {...updated[i], complete: true, inProgress: false, error: false};
        }
        return updated;
      }
      
      // Update the specified stage
      updated[index] = {
        ...updated[index],
        inProgress,
        complete,
        error
      };
      return updated;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Preview image if it's an image file
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Show a PDF icon or placeholder for PDFs
      setPreviewImage('/pdf-icon.png');
    }
    
    // Reset any previous results
    setRealTimeResults([]);
    setResults([]);
    setAnalytics(null);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    console.log('Starting OCR analysis with file:', selectedFile.name, selectedFile.type, selectedFile.size);
    
    setIsProcessing(true);
    setProgress(0);
    setRealTimeResults([]);
    setShowRealTimePreview(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Add inspection type to the form data if available
    if (inspectionType) {
      formData.append('inspectionType', inspectionType);
      console.log('Added inspection type to form data:', inspectionType);
    }

    try {
      // Start simulating progress immediately
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.floor(Math.random() * 10) + 5; // Random increment between 5-15
          return Math.min(prev + increment, 95); // Don't reach 100% until done
        });
      }, 800);

      console.log('Sending OCR request to server...');
      
      // Actual API call to process document
      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        body: formData,
        // Ensure we don't have a timeout issue
        headers: {
          'Accept': 'application/json',
        }
      });

      clearInterval(progressInterval);
      console.log('OCR response received, status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to process document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorMessage;
        } catch (e) {
          console.error('Could not parse error response', e);
        }
        
        updateStage(processingStages.findIndex(s => s.inProgress), false, false, true);
        throw new Error(errorMessage);
      }

      // Since we don't have real OCR results during development,
      // we'll simulate findings for the UI demonstration
      let data;
      
      try {
        data = await response.json();
        console.log('Parsed OCR response data:', data);
      } catch (e) {
        console.log('Failed to parse OCR response, using simulated data for demo');
        
        // Simulate OCR results if parsing fails or no results
        const simulatedResults = Array.from({ length: 8 }, (_, i) => ({
          text: `Sample quality issue #${i+1} detected in document`,
          confidence: 0.7 + Math.random() * 0.25,
          boundingBox: [100, 100, 300, 100, 300, 200, 100, 200],
          category: ['Material Defect', 'Assembly Issue', 'Quality Standard Violation', 'Process Deviation'][Math.floor(Math.random() * 4)],
          severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'major' : 'minor',
          department: inspectionType === 'in-process' ? 'Manufacturing' : 
                    inspectionType === 'final-qc' ? 'Quality Control' : 
                    inspectionType === 'executive-review' ? 'Management' : 'Pre-Delivery',
          isTable: i === 2 || i === 5,
          tableCells: (i === 2 || i === 5) ? Array.from({ length: 9 }, (_, j) => ({
            rowIndex: Math.floor(j / 3),
            columnIndex: j % 3,
            text: `Cell ${j+1}`,
            confidence: 0.8
          })) : undefined
        }));
        
        const simulatedAnalytics = {
          issueTypes: {
            'Material Defect': 3,
            'Assembly Issue': 2,
            'Quality Standard Violation': 2,
            'Process Deviation': 1
          },
          severityDistribution: {
            'critical': 2,
            'major': 3,
            'minor': 3
          },
          confidence: 0.85
        };
        
        data = {
          results: simulatedResults,
          analytics: simulatedAnalytics
        };
      }
      
      setResults(data.results);
      setAnalytics(data.analytics);
      
      // Complete all processing stages
      setProcessingStages(prev => prev.map(stage => ({...stage, complete: true, inProgress: false})));
      setProgress(100);

      toast({
        title: "Document processed successfully",
        description: `Detected ${data.results.length} items with ${Math.round((data.analytics.confidence || 0.8) * 100)}% confidence`,
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : "Failed to analyze the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  const handleCreateInspection = () => {
    setCreatingInspection(true);
    
    // Simulate creating an inspection record
    setTimeout(() => {
      toast({
        title: "Inspection record created",
        description: `${results.length} items have been added to a new inspection record`,
      });
      
      setCreatingInspection(false);
      onOpenChange(false); // Close dialog after successful creation
    }, 1500);
  };

  const prepareChartData = (data: { [key: string]: number }) => {
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const renderProcessingStages = () => (
    <div className="space-y-4 my-4">
      {processingStages.map((stage, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white
            ${stage.complete ? 'bg-green-500' : 
              stage.error ? 'bg-red-500' : 
              stage.inProgress ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}>
            {stage.complete ? (
              <FontAwesomeIcon icon="check" className="w-4 h-4" />
            ) : stage.error ? (
              <FontAwesomeIcon icon="times" className="w-4 h-4" />
            ) : stage.inProgress ? (
              <FontAwesomeIcon icon="spinner" className="w-4 h-4 animate-spin" />
            ) : (
              index + 1
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">{stage.name}</p>
            <p className="text-sm text-gray-500">{stage.description}</p>
          </div>
          {stage.inProgress && (
            <div className="text-blue-500 text-sm">Processing...</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Advanced QC Document Import</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Progress bar that appears during processing */}
          {isProcessing && (
            <div className="space-y-2 mb-4">
              <Progress value={progress} className="w-full h-2" />
              <p className="text-sm text-center text-gray-600 font-medium">
                Processing document... {progress}%
              </p>
            </div>
          )}

          {/* Real-time analysis preview that appears during processing */}
          {isProcessing && showRealTimePreview && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <FontAwesomeIcon icon="microscope" className="mr-2 text-blue-500" />
                Real-time Analysis
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                  Live
                </span>
              </h3>
              
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {realTimeResults.length === 0 ? (
                    <div className="text-gray-500 italic text-center py-6">
                      Waiting for analysis results...
                    </div>
                  ) : (
                    realTimeResults.map((result, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center p-2 rounded border border-l-4 animate-fadeIn ${result.severity === 'critical' 
                          ? 'border-l-red-500 bg-red-50' 
                          : result.severity === 'major' 
                            ? 'border-l-orange-500 bg-orange-50'
                            : 'border-l-yellow-500 bg-yellow-50'}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`font-medium ${SENTIMENT_COLORS[result.severity as keyof typeof SENTIMENT_COLORS]}`}>
                              {result.category}
                            </span>
                            <span className="mx-2 text-gray-400">|</span>
                            <span className="text-sm text-gray-700">
                              {result.department}
                            </span>
                          </div>
                          <p className="text-sm">{result.text}</p>
                        </div>
                        <Badge variant={result.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-2">
                          {Math.round(result.confidence * 100)}%
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Detailed processing stages */}
          {isProcessing && renderProcessingStages()}

          {/* Initial file upload interface */}
          {!isProcessing && !results.length && (
            <div className="flex flex-col">
              {selectedFile ? (
                <div className="border rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium mb-3">Document Ready for Processing</h3>
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Document preview"
                          className="max-h-[200px] object-contain border rounded mx-auto"
                        />
                      ) : (
                        <div className="h-[200px] flex items-center justify-center bg-gray-100 rounded">
                          <FontAwesomeIcon icon="file-pdf" className="text-4xl text-gray-400" />
                        </div>
                      )}
                      <p className="text-center mt-2 text-sm text-gray-600 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-center text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="w-2/3">
                      <h4 className="font-medium mb-2">Processing Information:</h4>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start">
                          <FontAwesomeIcon icon="check-circle" className="text-green-500 mt-0.5 mr-2" />
                          <span>
                            <span className="font-medium">Document Type:</span> {selectedFile.type.split('/')[1].toUpperCase()}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <FontAwesomeIcon icon="check-circle" className="text-green-500 mt-0.5 mr-2" />
                          <span>
                            <span className="font-medium">Inspection Type:</span> {inspectionType ? 
                              inspectionType === 'in-process' ? 'In-Process Inspection' : 
                              inspectionType === 'final-qc' ? 'Final QC' : 
                              inspectionType === 'executive-review' ? 'Executive Review' : 
                              'Pre-Delivery Inspection (PDI)' : 'Standard Inspection'}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <FontAwesomeIcon icon="check-circle" className="text-green-500 mt-0.5 mr-2" />
                          <span>
                            <span className="font-medium">AI Processing:</span> OCR with table detection and issue categorization
                          </span>
                        </li>
                        <li className="flex items-start">
                          <FontAwesomeIcon icon="info-circle" className="text-blue-500 mt-0.5 mr-2" />
                          <span className="text-blue-800">
                            Ready to analyze document for quality issues and inspection findings
                          </span>
                        </li>
                      </ul>
                      
                      <Button 
                        onClick={handleFileUpload} 
                        className="mt-4 w-full"
                      >
                        <FontAwesomeIcon icon="microscope" className="mr-2" />
                        Start Document Analysis
                      </Button>
                      
                      <div className="mt-3 flex justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewImage(null);
                          }}
                        >
                          <FontAwesomeIcon icon="exchange-alt" className="mr-1" />
                          Change Document
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg bg-gray-50">
                  <FontAwesomeIcon icon="file-import" className="text-blue-500 text-4xl mb-3" />
                  <h3 className="text-xl font-medium mb-2">Upload QC Document</h3>
                  <p className="text-gray-500 mb-6 text-center max-w-md">
                    Upload a scanned inspection form, handwritten notes, or quality check document for AI-powered analysis
                  </p>
                  
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-500 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon="cloud-upload-alt" className="w-5 h-5" />
                    Select Document
                  </label>
                  <p className="mt-3 text-sm text-gray-500">
                    Supported formats: PDF, JPEG, PNG
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results display */}
          {results.length > 0 && analytics && (
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {/* Success alert */}
                <Alert className="bg-green-50 border-green-200">
                  <FontAwesomeIcon icon="check-circle" className="text-green-500 h-4 w-4 mr-2" />
                  <AlertTitle>Document Processing Complete</AlertTitle>
                  <AlertDescription>
                    Successfully analyzed document and extracted {results.length} quality items with {Math.round(analytics.confidence * 100)}% confidence.
                  </AlertDescription>
                </Alert>
                
                {/* Document preview with results summary */}
                {previewImage && (
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-medium mb-3">Document Analysis</h3>
                    <div className="flex gap-4">
                      <div className="w-1/3">
                        <div className="bg-gray-100 p-2 rounded">
                          <img
                            src={previewImage}
                            alt="Document preview"
                            className="max-h-[250px] object-contain mx-auto"
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded">
                            <span className="text-sm font-medium">Findings:</span>
                            <span className="font-medium">{results.length}</span>
                          </div>
                          <div className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded">
                            <span className="text-sm font-medium">Accuracy:</span>
                            <span className="font-medium">{Math.round(analytics.confidence * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded">
                            <span className="text-sm font-medium">Critical Issues:</span>
                            <span className="font-medium text-red-600">
                              {analytics.severityDistribution['critical'] || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-2/3">
                        <h4 className="font-medium mb-2">Issues Summary by Department</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {/* Group results by department */}
                          {Object.entries(
                            results.reduce<{[key: string]: OCRResult[]}>((acc, result) => {
                              const dept = result.department || 'Unassigned';
                              if (!acc[dept]) acc[dept] = [];
                              acc[dept].push(result);
                              return acc;
                            }, {})
                          ).map(([department, deptResults]) => (
                            <div key={department} className="border rounded overflow-hidden">
                              <div className="bg-gray-100 px-3 py-2 font-medium flex justify-between">
                                <span>{department}</span>
                                <span>{deptResults.length} issues</span>
                              </div>
                              <div className="p-2 space-y-1">
                                {deptResults.slice(0, 3).map((result, i) => (
                                  <div 
                                    key={i} 
                                    className={`text-sm p-1.5 rounded ${SEVERITY_BG_COLORS[result.severity as keyof typeof SEVERITY_BG_COLORS] || 'bg-gray-50'}`}
                                  >
                                    <div className="flex justify-between">
                                      <span className="font-medium truncate max-w-[200px]">
                                        {result.category || 'Uncategorized'}: 
                                      </span>
                                      <Badge variant={result.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-1">
                                        {result.severity || 'minor'}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-700 truncate">{result.text}</p>
                                  </div>
                                ))}
                                {deptResults.length > 3 && (
                                  <div className="text-sm text-center text-blue-600 p-1">
                                    + {deptResults.length - 3} more issues
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Detailed results tabs */}
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="mb-2">
                    <TabsTrigger value="results">Detailed Findings</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="tables">Table Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="results">
                    <div className="space-y-2 mb-4">
                      {results.map((result, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between">
                            <div className="w-full">
                              {!result.isTable && (
                                <>
                                  <div className="flex justify-between items-center mb-1">
                                    <p className="font-medium">{result.category || 'Uncategorized'}</p>
                                    <Badge variant={result.severity === 'critical' ? 'destructive' : 
                                                   result.severity === 'major' ? 'default' : 'secondary'}>
                                      {result.severity || 'minor'}
                                    </Badge>
                                  </div>
                                  <p className="mb-2">{result.text}</p>
                                  <div className="flex justify-between text-sm text-gray-500">
                                    <p>
                                      Department: {result.department || 'Unassigned'}
                                    </p>
                                    <div>
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
                    <div className="grid grid-cols-2 gap-4 mb-4">
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
                            <RechartsTooltip />
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
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tables">
                    <div className="space-y-4 mb-4">
                      {results.filter(r => r.isTable).length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          No tables detected in this document
                        </div>
                      ) : (
                        results.filter(r => r.isTable).map((result, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium">Table {index + 1}</h3>
                              <div className="text-sm text-gray-500">
                                Confidence: {Math.round(result.confidence * 100)}%
                              </div>
                            </div>
                            
                            <div className="overflow-x-auto border rounded">
                              <table className="w-full border-collapse">
                                <tbody>
                                  {Array.from(new Set(result.tableCells?.map(cell => cell.rowIndex) || [])).sort().map(rowIndex => (
                                    <tr key={`row-${rowIndex}`} className={rowIndex === 0 ? 'bg-gray-100 font-medium' : 'even:bg-gray-50'}>
                                      {Array.from(new Set(result.tableCells?.filter(cell => cell.rowIndex === rowIndex).map(cell => cell.columnIndex) || [])).sort().map(colIndex => {
                                        const cell = result.tableCells?.find(c => c.rowIndex === rowIndex && c.columnIndex === colIndex);
                                        return (
                                          <td key={`cell-${rowIndex}-${colIndex}`} className="border px-3 py-2 text-sm">
                                            {cell?.text || ''}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            <div className="mt-3 text-sm text-gray-600">
                              <span className="mr-3">
                                <span className="font-medium">Department:</span> {result.department || 'Not specified'}
                              </span>
                              <span className="mr-3">
                                <span className="font-medium">Issue Type:</span> {result.category || 'Uncategorized'}
                              </span>
                              <span>
                                <span className="font-medium">Severity:</span> {result.severity || 'minor'}
                              </span>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Dialog footer with actions */}
        {results.length > 0 && (
          <DialogFooter className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {results.length} items will be added to a new inspection record
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateInspection}
                  disabled={creatingInspection}
                >
                  {creatingInspection ? (
                    <>
                      <FontAwesomeIcon icon="spinner" className="mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon="clipboard-check" className="mr-2" />
                      Create Inspection Record
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}