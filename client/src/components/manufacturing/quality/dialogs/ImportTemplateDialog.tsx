import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InfoCircledIcon, UploadIcon, FileIcon, CrossCircledIcon, CheckCircledIcon, ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

export interface ImportTemplateDialogProps {
  onImportSuccess: () => void;
}

export function ImportTemplateDialog({ onImportSuccess }: ImportTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{
    importedCount: number;
    templates: Array<{id: string; name: string; category: string}>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setError(null);
      setImportStatus('idle');
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setImportStatus('uploading');
    setUploadProgress(0);
    setError(null);

    // Simulate progress updates (in real implementation, this would come from the upload progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Update status to processing once upload is complete
      setTimeout(() => {
        setImportStatus('processing');
        setUploadProgress(100);
      }, 2000);

      const response = await fetch('/api/manufacturing/quality/templates/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import templates');
      }

      const data = await response.json();
      setImportResults(data);
      setImportStatus('success');
      
      toast({
        title: "Templates imported successfully",
        description: `${data.importedCount} templates have been imported.`,
        variant: "default",
      });
      
      // Call the onImportSuccess callback to refresh template list
      onImportSuccess();
    } catch (err) {
      clearInterval(progressInterval);
      setImportStatus('error');
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBlankTemplate = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the blank template from the server
      const response = await fetch('/api/manufacturing/quality/templates/blank', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download blank template');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qms-inspection-template.xlsx';
      
      // Append the link to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the URL to free up memory
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Blank template downloaded',
        description: 'You can now fill it out and import it back into the system.',
      });
    } catch (error) {
      console.error('Error downloading blank template:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download blank template',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetImport = () => {
    setFile(null);
    setImportStatus('idle');
    setUploadProgress(0);
    setError(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onOpenChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      // Reset state when dialog is closed
      resetImport();
    }
    setOpen(newOpenState);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <UploadIcon className="h-4 w-4" />
        Import Templates
      </Button>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Inspection Templates</DialogTitle>
          <DialogDescription>
            Import inspection templates from Excel files. Each sheet in the Excel file will be converted to a separate template.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-6">
          {importStatus === 'idle' && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {!file ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <UploadIcon className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Drag and drop your Excel file here, or</p>
                    <Button 
                      variant="link" 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1"
                    >
                      click to browse
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supports .xlsx and .xls files
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-8 w-8 text-blue-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetImport}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <CrossCircledIcon className="h-5 w-5" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {(importStatus === 'uploading' || importStatus === 'processing') && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ReloadIcon className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">
                      {importStatus === 'uploading' ? 'Uploading file...' : 'Processing templates...'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500">
                  {importStatus === 'uploading' 
                    ? 'Uploading your Excel file to the server...' 
                    : 'Converting Excel sheets to inspection templates...'}
                </p>
              </div>
            </Card>
          )}

          {importStatus === 'success' && importResults && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircledIcon className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Import Successful</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {importResults.importedCount} templates were successfully imported
                    </p>
                  </div>
                </div>

                {importResults.templates.length > 0 && (
                  <div className="mt-4 border rounded-md overflow-hidden">
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                      Imported Templates
                    </div>
                    <div className="max-h-[200px] overflow-auto">
                      <ul className="divide-y">
                        {importResults.templates.map(template => (
                          <li key={template.id} className="px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{template.name}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                {template.category}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {importStatus === 'error' && (
            <Card className="p-6">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Import Failed</h4>
                  <p className="text-xs text-gray-500 mt-1">{error}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetImport}
                    className="mt-2 text-xs"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex items-start space-x-2 text-xs text-gray-500">
            <InfoCircledIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                Each sheet in your Excel file will be imported as a separate template.
                The first row of each sheet will be used as field labels.
              </p>
              <p className="mt-1">
                For best results, ensure your Excel file is formatted properly with clear headers and consistent data types.
              </p>
              <div className="mt-3 flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBlankTemplate}
                  className="text-xs flex items-center gap-1.5"
                >
                  <FileIcon className="h-3.5 w-3.5" />
                  Download Blank Template
                </Button>
                <span className="ml-2 text-xs text-muted-foreground">
                  Not sure where to start? Download our blank template.
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {importStatus === 'success' ? 'Close' : 'Cancel'}
          </Button>

          {importStatus === 'idle' && (
            <Button 
              onClick={handleImport} 
              disabled={!file || isLoading}
            >
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          )}

          {importStatus === 'success' && (
            <Button onClick={resetImport}>Import Another File</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}