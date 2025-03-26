import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { useWebSocket } from '@/hooks/use-websocket';

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
  isStructuredTableRow?: boolean;
  department?: string;
  location?: string;
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
  
  // Handle the "+ more issues" click to scroll to detailed findings
  const handleShowMoreIssues = () => {
    // Force a short delay to ensure the DOM is ready
    setTimeout(() => {
      const detailedTab = document.getElementById('detailed-findings-tab');
      if (detailedTab) {
        detailedTab.click();
        // Scroll the tab content into view
        detailedTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Function to add real-time results during processing
  const addRealTimeResult = (text: string, confidence: number, category?: string, severity?: string, department?: string) => {
    const detectedCategory = category || 
      (text.toLowerCase().includes('material') ? 'Material Defect' : 
       text.toLowerCase().includes('assembly') ? 'Assembly Issue' :
       text.toLowerCase().includes('process') ? 'Process Deviation' :
       'Quality Standard Violation');
       
    const detectedSeverity = severity || 
      (text.toLowerCase().includes('critical') || text.toLowerCase().includes('severe') ? 'critical' :
       text.toLowerCase().includes('major') || text.toLowerCase().includes('significant') ? 'major' :
       'minor');
       
    const detectedDepartment = department || 
      (inspectionType === 'in-process' ? 'Manufacturing' :
       inspectionType === 'final-qc' ? 'Quality Control' :
       inspectionType === 'executive-review' ? 'Management' :
       'Pre-Delivery');
    
    setRealTimeResults(prev => {
      const updated = [...prev, {
        text,
        confidence,
        boundingBox: [100, 100, 200, 100, 200, 150, 100, 150], // Default bounding box
        category: detectedCategory,
        severity: detectedSeverity as 'critical' | 'major' | 'minor',
        department: detectedDepartment
      }];
      return updated;
    });
  };
  
  // Listen for ongoing processing status to show real-time results
  useEffect(() => {
    if (isProcessing && progress > 20 && progress < 90) {
      // Show initial processing notification
      if (realTimeResults.length === 0) {
        addRealTimeResult('Starting document analysis...', 0.9);
        
        // Add appropriate stage message based on progress
        if (progress < 40) {
          addRealTimeResult('Detecting document layout and structure', 0.9);
        } else if (progress < 60) {
          addRealTimeResult('Extracting text content and tables', 0.9);
        } else {
          addRealTimeResult('Analyzing content for quality issues', 0.9);
        }
      }
    }
  }, [isProcessing, progress, inspectionType, realTimeResults.length]);

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

    // Add initial real-time result to indicate processing has started
    addRealTimeResult(`Processing document: ${selectedFile.name}`, 1.0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Add inspection type to the form data if available
    if (inspectionType) {
      formData.append('inspectionType', inspectionType);
      console.log('Added inspection type to form data:', inspectionType);
      
      // Add a real-time result for the inspection type context
      addRealTimeResult(`Using ${inspectionType} inspection context for analysis`, 0.95);
    }

    try {
      // Start progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + (Math.floor(Math.random() * 10) + 5), 95);
          
          // Add appropriate real-time messages based on progress stages
          if (prev < 20 && newProgress >= 20) {
            addRealTimeResult('Analyzing document structure...', 0.9);
          } else if (prev < 40 && newProgress >= 40) {
            addRealTimeResult('Scanning for tables and formatted content...', 0.9);
          } else if (prev < 60 && newProgress >= 60) {
            addRealTimeResult('Processing text and extracting quality issues...', 0.9);
          } else if (prev < 80 && newProgress >= 80) {
            addRealTimeResult('Categorizing findings by department and severity...', 0.9);
          }
          
          return newProgress;
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
        
        // Add error to real-time results
        addRealTimeResult(`Error: ${errorMessage}`, 0.5, 'System Error', 'critical', 'System');
        
        updateStage(processingStages.findIndex(s => s.inProgress), false, false, true);
        throw new Error(errorMessage);
      }

      // Since we don't have real OCR results during development,
      // we'll simulate findings for the UI demonstration
      let data;
      
      try {
        // Improved JSON parsing with better error handling
        console.log('Attempting to parse response body...');
        
        // First check if the response is empty
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          console.error('OCR response body is empty');
          addRealTimeResult(
            "Error: Server returned an empty response",
            0.5,
            'System Error',
            'critical',
            'System'
          );
          throw new Error('Server returned an empty response');
        }
        
        // Attempt to parse as JSON
        try {
          data = JSON.parse(responseText);
          console.log('Parsed OCR response data:', data);
        } catch (jsonError) {
          console.error('Failed to parse response as JSON:', responseText.substring(0, 200) + '...');
          addRealTimeResult(
            "Error: Server returned an invalid JSON response",
            0.5,
            'System Error',
            'critical',
            'System'
          );
          throw new Error('Failed to parse server response as JSON');
        }
        
        // Check if we have valid results
        if (!data || typeof data !== 'object') {
          console.error('OCR response is not a valid object:', data);
          addRealTimeResult(
            "Error: Server returned an invalid response format",
            0.5,
            'System Error',
            'critical',
            'System'
          );
          throw new Error('Server returned invalid response format');
        }
        
        // Check for error message in response
        if (data.error) {
          console.error('OCR service returned an error:', data.error, data.details);
          addRealTimeResult(
            `Error: ${data.details || data.error}`,
            0.5,
            'Service Error',
            'critical',
            'System'
          );
          throw new Error(data.details || data.error);
        }
        
        // Check for results array
        if (!data.results || !Array.isArray(data.results)) {
          console.error('OCR response missing results array:', data);
          // Initialize with empty results instead of failing
          data.results = [];
          addRealTimeResult(
            "No text or tables detected in document",
            0.9,
            'Analysis Result',
            'minor',
            'System'
          );
        }
        
        // Add detection results to real-time feed
        if (data.results.length > 0) {
          addRealTimeResult(
            `Successfully analyzed document with ${data.results.length} findings`, 
            0.98, 
            'Analysis Complete', 
            'minor', 
            'System'
          );
          
          // Add a few actual results from the data to real-time feed for user feedback
          const resultsToShow = Math.min(3, data.results.length);
          for (let i = 0; i < resultsToShow; i++) {
            const result = data.results[i];
            if (result && result.text) {
              // Only add to real-time if it's an actual issue (not just structural text)
              if (result.category && result.severity) {
                addRealTimeResult(
                  result.text.substring(0, 120) + (result.text.length > 120 ? '...' : ''),
                  result.confidence || 0.8,
                  result.category,
                  result.severity as 'critical' | 'major' | 'minor',
                  result.department
                );
              }
            }
          }
          
          // If we have more results than shown in real-time preview
          if (data.results.length > resultsToShow) {
            addRealTimeResult(
              `${data.results.length - resultsToShow} more items detected - see detailed findings`,
              0.95,
              'Additional Findings',
              'minor',
              'System'
            );
          }
        } else {
          addRealTimeResult(
            "Document analysis complete - no quality issues detected",
            0.9,
            'Analysis Complete',
            'minor',
            'System'
          );
        }
        
        // Validate and create analytics if missing
        if (!data.analytics) {
          console.log('OCR response missing analytics, constructing from results');
          // Build analytics from results if missing
          const issueTypes: Record<string, number> = {};
          const severityDistribution: Record<string, number> = {};
          let totalConfidence = 0;
          
          // If we have results, calculate analytics from them
          if (data.results.length > 0) {
            data.results.forEach((result: any) => {
              // Process categories
              if (result.category) {
                issueTypes[result.category] = (issueTypes[result.category] || 0) + 1;
              }
              
              // Process severities
              if (result.severity) {
                severityDistribution[result.severity] = (severityDistribution[result.severity] || 0) + 1;
              }
              
              // Sum up confidence
              if (typeof result.confidence === 'number') {
                totalConfidence += result.confidence;
              }
            });
          } else {
            // Default analytics for empty results
            issueTypes['No Issues Detected'] = 1;
            severityDistribution['minor'] = 1;
          }
          
          // Create analytics object
          data.analytics = {
            issueTypes,
            severityDistribution,
            confidence: data.results.length > 0 ? totalConfidence / data.results.length : 0.8
          };
        }
      } catch (e) {
        console.error('Failed to process OCR response:', e);
        // Add error to real-time results if not already added
        if (!realTimeResults.some(r => r.category === 'System Error' || r.category === 'Service Error')) {
          addRealTimeResult(
            `Error: ${e instanceof Error ? e.message : 'Unknown error processing document'}`,
            0.5,
            'System Error',
            'critical',
            'System'
          );
        }
        throw new Error('Failed to process document: ' + (e instanceof Error ? e.message : 'Server returned invalid data'));
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
      // Add a short delay to ensure all UI states are properly updated
      setTimeout(() => {
        // Keep processing state active if we have real-time error results to show
        const hasErrorResults = realTimeResults.some(r => 
          r.category === 'System Error' || 
          r.category === 'Service Error'
        );
        
        // Check if we have valid results
        const hasValidResults = results.length > 0;
        
        // Only stop processing if there are no errors to show or if we have valid results
        if (!hasErrorResults || hasValidResults) {
          setIsProcessing(false);
        } else {
          // If we have errors but no results, keep the processing UI but mark the stages as failed
          setProcessingStages(prev => {
            const currentStageIndex = prev.findIndex(s => s.inProgress);
            if (currentStageIndex >= 0) {
              const updated = [...prev];
              updated[currentStageIndex] = {
                ...updated[currentStageIndex],
                inProgress: false,
                error: true
              };
              return updated;
            }
            return prev;
          });
          
          // Keep the progress at current value to indicate failure
          console.log('OCR processing failed, showing error state');
        }
      }, 500);
    }
  };

  // Get socket from hook with manufacturing namespace
  const socket = useWebSocket({ namespace: 'manufacturing' });
  
  // Log socket connection status
  useEffect(() => {
    console.log('Socket connection status:', socket ? 'Connected' : 'Disconnected');
    
    // Add socket event handlers
    if (socket) {
      console.log('Setting up socket event handlers');
      
      const handleConnect = () => {
        console.log('Socket connected to manufacturing namespace');
      };
      
      const handleDisconnect = () => {
        console.log('Socket disconnected from manufacturing namespace');
      };
      
      const handleError = (err: any) => {
        console.error('Socket error:', err);
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleError);
      };
    }
  }, [socket]);
  
  const handleCreateInspection = async () => {
    setCreatingInspection(true);
    
    try {
      if (!socket) {
        throw new Error('Manufacturing socket connection not available');
      }
      
      // Create a new inspection record with the OCR results
      const inspection = {
        type: inspectionType || 'final-qc',
        status: "open",
        projectNumber: "OCR-" + new Date().toISOString().slice(0, 10),
        partNumber: "",
        inspector: "System OCR",
        inspectionDate: new Date().toISOString(),
        productionLine: "Assembly",
        defects: results.length,
        results: {
          checklistItems: [],
          defectsFound: results.map(result => ({
            description: result.text,
            location: result.location || 'Unknown',
            severity: result.severity || 'minor',
            assignedTo: result.department || 'Quality Control',
            status: 'open',
            notes: '',
            dateFound: new Date().toISOString()
          }))
        }
      };
      
      console.log('Creating inspection with manufacturing socket:', inspection);
      
      // Use the enhanced socket with promise-based one-time event handling
      try {
        // Emit the event to create the inspection using manufacturing namespace
        socket.emit('quality:inspection:create', inspection);
        
        // Wait for the response using the oncePromise method
        const response = await (socket as any).oncePromise('quality:inspection:created', 5000);
        console.log('Inspection created successfully:', response);
      } catch (socketError) {
        console.error('Socket error:', socketError);
        throw socketError;
      }
      
      toast({
        title: "Inspection record created",
        description: `${results.length} items have been added to a new inspection record`,
      });
      
      // Close dialog after successful creation
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create inspection record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingInspection(false);
    }
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
      <DialogContent className="max-w-5xl ocr-dialog-content">
        <DialogHeader>
          <DialogTitle className="text-xl">Advanced QC Document Import</DialogTitle>
          <p className="text-sm text-gray-500">
            Upload and analyze quality control documents with AI-powered OCR
          </p>
        </DialogHeader>

        <div className="ocr-dialog-scrollable">
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
                                  <button 
                                    className="text-sm text-center text-blue-600 p-1 w-full hover:bg-blue-50 rounded cursor-pointer transition-colors"
                                    onClick={handleShowMoreIssues}
                                  >
                                    + {deptResults.length - 3} more issues
                                  </button>
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
                <Tabs defaultValue="results" className="w-full" id="findings-tabs">
                  <TabsList className="mb-2">
                    <TabsTrigger value="results" data-value="results" id="detailed-findings-tab">Detailed Findings</TabsTrigger>
                    <TabsTrigger value="analytics" data-value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="tables" data-value="tables">Table Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="results">
                    <div className="space-y-2 mb-4 overflow-y-auto pr-4 h-[60vh]">
                      {/* First show structured table rows as they have more complete information */}
                      {results.filter(r => r.isStructuredTableRow).map((result, index) => (
                        <Card key={`structured-${index}`} className="p-4 border-l-4 border-blue-400">
                          <div className="flex justify-between">
                            <div className="w-full">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon="table" className="text-blue-500 mr-2" />
                                  <p className="font-medium">{result.category || 'Uncategorized'}</p>
                                </div>
                                <Badge variant={result.severity === 'critical' ? 'destructive' : 
                                               result.severity === 'major' ? 'default' : 'secondary'}>
                                  {result.severity || 'minor'}
                                </Badge>
                              </div>
                              <div className="mb-4">
                                <div className="mb-2">
                                  <p className="text-sm font-medium mb-1">Issue Description:</p>
                                  <p className="text-sm border-l-2 border-blue-300 pl-2 py-1 bg-blue-50">{result.text}</p>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 mb-2 bg-gray-50 p-3 rounded border">
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Location</p>
                                    <p className="text-sm">{result.location || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Assignment</p>
                                    <p className="text-sm">{result.department || 'Unassigned'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Category</p>
                                    <p className="text-sm">{result.category || 'Uncategorized'}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon="info-circle" className="mr-1 text-blue-500" />
                                  Structured Table Data
                                </div>
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon="check-circle" className="mr-1 text-green-500" />
                                  Confidence: {Math.round(result.confidence * 100)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {/* Then show non-table results */}
                      {results.filter(r => !r.isTable && !r.isStructuredTableRow).map((result, index) => (
                        <Card key={`text-${index}`} className="p-4">
                          <div className="flex justify-between">
                            <div className="w-full">
                              <div className="flex justify-between items-center mb-1">
                                <p className="font-medium">{result.category || 'Uncategorized'}</p>
                                <Badge variant={result.severity === 'critical' ? 'destructive' : 
                                               result.severity === 'major' ? 'default' : 'secondary'}>
                                  {result.severity || 'minor'}
                                </Badge>
                              </div>
                              <div className="mb-4">
                                <div className="mb-2 flex gap-2">
                                  <span className="font-medium text-sm">Raw OCR Text:</span>
                                  <p className="text-sm border-l-2 border-blue-300 pl-2">{result.text}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-2 bg-gray-50 p-2 rounded border">
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Problem Description</p>
                                    <p className="text-sm">{result.category || 'Uncategorized'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Assigned To</p>
                                    <p className="text-sm">{result.department || 'Unassigned'}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-500 bg-gray-100 p-1 rounded">
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon="info-circle" className="mr-1" />
                                  Extraction Confidence: {Math.round(result.confidence * 100)}%
                                </div>
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon="tag" className="mr-1" />
                                  Severity: {result.severity || 'minor'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {/* Optionally show table headers at the end */}
                      {results.filter(r => r.isTable && !r.isStructuredTableRow).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Table Content</h4>
                          {results.filter(r => r.isTable && !r.isStructuredTableRow).map((result, index) => (
                            <Card key={`table-${index}`} className="p-4 mb-2">
                              <h4 className="text-md font-medium">Table {index + 1}</h4>
                              <p className="text-sm text-gray-500 mb-2">{result.text}</p>
                              <div className="flex justify-between text-xs text-gray-500">
                                <div>Rows: {new Set(result.tableCells?.map(c => c.rowIndex)).size || 0}</div>
                                <div>Columns: {new Set(result.tableCells?.map(c => c.columnIndex)).size || 0}</div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {/* Empty state */}
                      {results.length === 0 && (
                        <div className="text-center py-12">
                          <FontAwesomeIcon icon="file-search" className="text-4xl text-gray-300 mb-3" />
                          <p className="text-gray-500">No findings detected</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics">
                    <div className="overflow-y-auto pr-4 h-[60vh]">
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
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tables">
                    <div className="space-y-4 mb-4 overflow-y-auto pr-4 h-[60vh]">
                      {/* Display structured extraction results first */}
                      {results.filter(r => r.isStructuredTableRow).length > 0 && (
                        <Card className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium">Structured Quality Issues</h3>
                            <Badge variant="outline" className="bg-green-50">
                              {results.filter(r => r.isStructuredTableRow).length} issues found
                            </Badge>
                          </div>
                          
                          <div className="overflow-x-auto border rounded">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-100 font-medium text-left">
                                  <th className="border px-3 py-2 text-sm">Issue Description</th>
                                  <th className="border px-3 py-2 text-sm">Location</th>
                                  <th className="border px-3 py-2 text-sm">Assignment</th>
                                  <th className="border px-3 py-2 text-sm">Severity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.filter(r => r.isStructuredTableRow).map((issue, index) => (
                                  <tr key={`issue-${index}`} className="even:bg-gray-50">
                                    <td className="border px-3 py-2 text-sm">{issue.text}</td>
                                    <td className="border px-3 py-2 text-sm">{issue.location || 'Not specified'}</td>
                                    <td className="border px-3 py-2 text-sm">{issue.department || 'Not specified'}</td>
                                    <td className="border px-3 py-2 text-sm">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                                        issue.severity === 'major' ? 'bg-orange-100 text-orange-800' : 
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {issue.severity ? issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1) : 'Minor'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="mt-3 bg-blue-50 p-3 rounded text-sm border border-blue-200">
                            <div className="flex items-center text-blue-700 mb-1">
                              <FontAwesomeIcon icon="info-circle" className="mr-2" />
                              <span className="font-medium">Structured Data Extraction</span>
                            </div>
                            <p className="text-blue-600 text-xs">
                              The system has successfully extracted and paired issue descriptions with their 
                              corresponding locations and department assignments from the document.
                            </p>
                          </div>
                        </Card>
                      )}
                      
                      {/* Show generic tables if any */}
                      {results.filter(r => r.isTable && !r.isStructuredTableRow).length === 0 ? (
                        results.filter(r => r.isStructuredTableRow).length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            No tables detected in this document
                          </div>
                        )
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-500 mt-6 mb-2">Additional Tables</div>
                          {results.filter(r => r.isTable && !r.isStructuredTableRow).map((result, index) => (
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
                              
                              <div className="mt-3 space-y-2">
                                <div className="text-sm text-gray-600 p-2 rounded border border-gray-200">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <span className="font-medium">Department:</span><br />
                                      {result.department || 'Not specified'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Issue Type:</span><br />
                                      {result.category || 'Uncategorized'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Severity:</span><br />
                                      {result.severity || 'minor'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  <div className="font-medium mb-1">Raw OCR Text for Table:</div>
                                  <div className="border-l-2 border-blue-300 pl-2 text-xs font-mono">
                                    {result.text}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </>
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