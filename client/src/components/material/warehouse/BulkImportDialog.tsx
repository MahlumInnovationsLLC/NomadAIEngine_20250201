import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { read, utils, write } from 'xlsx';

interface ImportRow {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  [key: string]: any;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});
  const { toast } = useToast();

  const validateData = (data: any[]): {[key: string]: string[]} => {
    const errors: {[key: string]: string[]} = {};

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      if (!row.sku) rowErrors.push("SKU is required");
      if (!row.name) rowErrors.push("Name is required");
      if (!row.category) rowErrors.push("Category is required");
      if (isNaN(row.quantity) || row.quantity < 0) rowErrors.push("Quantity must be a positive number");
      if (!row.location) rowErrors.push("Location is required");

      if (rowErrors.length > 0) {
        errors[index] = rowErrors;
      }
    });

    return errors;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    try {
      if (!file.name.endsWith('.xlsx')) {
        throw new Error('Please upload an Excel (.xlsx) file');
      }

      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet) as ImportRow[];

      const errors = validateData(jsonData);
      setValidationErrors(errors);
      setPreviewData(jsonData);

      if (Object.keys(errors).length > 0) {
        toast({
          title: "Validation Errors",
          description: "Please fix the errors before importing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsProcessing(true);

    const file = e.dataTransfer.files[0];
    if (!file) {
      toast({
        title: "Error",
        description: "No file was dropped",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    await processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    await processFile(file);
  };

  const downloadTemplate = () => {
    const template = [
      {
        sku: "EXAMPLE-001",
        name: "Example Item",
        category: "Raw Materials",
        quantity: 100,
        location: "ZONE-A"
      }
    ];

    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");

    // Generate the XLSX file
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });

    // Create a Blob from the array buffer
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warehouse-import-template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImport = async () => {
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Cannot Import",
        description: "Please fix validation errors before importing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/warehouse/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: previewData }),
      });

      if (!response.ok) {
        throw new Error('Failed to import data');
      }

      toast({
        title: "Success",
        description: "Data imported successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Import Warehouse Data</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Upload an Excel file (.xlsx) containing warehouse data.
              The file should include the following columns:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>SKU (required): Unique identifier for the item</li>
              <li>Name (required): Item name or description</li>
              <li>Category (required): Item category</li>
              <li>Quantity (required): Number of items (must be positive)</li>
              <li>Location (required): Storage location or zone</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="mt-2"
            >
              <FontAwesomeIcon icon="download" className="mr-2" />
              Download Template
            </Button>
          </DialogDescription>
        </DialogHeader>

        {previewData.length === 0 ? (
          <div
            className={`
              mt-4 p-8 border-2 border-dashed rounded-lg
              ${isDragging ? 'border-primary bg-primary/10' : 'border-muted'}
              transition-colors duration-200
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <FontAwesomeIcon
                icon={isProcessing ? "spinner" : "file-import"}
                className={`h-12 w-12 mb-4 text-muted-foreground ${isProcessing ? 'animate-spin' : ''}`}
              />
              <p className="mb-2 text-sm text-muted-foreground">
                {isProcessing
                  ? "Processing file..."
                  : "Drag and drop your Excel file here, or click to select"}
              </p>
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isProcessing}
                id="file-upload"
              />
              {!isProcessing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                  className="mt-4"
                >
                  Select File
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Preview Data</h3>
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewData([]);
                  setValidationErrors({});
                }}
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell>
                        {validationErrors[index] ? (
                          <Badge 
                            variant="destructive" 
                            className="cursor-pointer hover:bg-destructive/90" 
                            title={validationErrors[index].join(', ')}
                          >
                            Error
                          </Badge>
                        ) : (
                          <Badge variant="default">Valid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {previewData.length > 0 && (
          <DialogFooter>
            <div className="flex justify-between w-full">
              <p className="text-sm text-muted-foreground">
                {Object.keys(validationErrors).length > 0 
                  ? `${Object.keys(validationErrors).length} rows have errors`
                  : `${previewData.length} rows ready to import`}
              </p>
              <Button
                onClick={handleImport}
                disabled={isProcessing || Object.keys(validationErrors).length > 0}
              >
                {isProcessing && <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />}
                Import Data
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}