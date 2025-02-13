import { useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InspectionTemplateType } from "@/types/manufacturing";

interface ImportInspectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: InspectionTemplateType;
  onSuccess?: () => void;
}

type ImportRowData = {
  projectNumber?: string;
  partNumber?: string;
  productionLineId: string;
  inspector: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
};

const importRowSchema = z.object({
  projectNumber: z.string().optional(),
  partNumber: z.string().optional(),
  productionLineId: z.string().min(1, "Production line is required"),
  inspector: z.string().min(1, "Inspector name is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().optional(),
});

export function ImportInspectionsDialog({ 
  open, 
  onOpenChange, 
  type,
  onSuccess 
}: ImportInspectionsDialogProps) {
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
          selectedFile.type !== "text/csv") {
        setError("Please upload an Excel (.xlsx) or CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const parseFile = async (file: File): Promise<ImportRowData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportRowData[];
          resolve(jsonData);
        } catch (error) {
          reject(new Error("Failed to parse file. Please ensure the file format is correct and try again."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file. Please try again."));
      reader.readAsBinaryString(file);
    });
  };

  const validateData = (data: any[]): ImportRowData[] => {
    const validRows: ImportRowData[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      try {
        // Additional validation for Final QC inspections
        const schema = type === 'final-qc' 
          ? importRowSchema.extend({
              projectNumber: z.string().min(1, "Project number is required for Final QC inspections")
            })
          : importRowSchema;

        // Pre-process date format
        if (row.dueDate) {
          // Try to parse and format the date consistently
          try {
            const date = new Date(row.dueDate);
            if (!isNaN(date.getTime())) {
              row.dueDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            throw new Error("Invalid date format. Please use YYYY-MM-DD format.");
          }
        }

        const validatedRow = schema.parse(row);
        validRows.push(validatedRow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`Row ${index + 1}: ${error.errors.map(e => e.message).join(", ")}`);
        } else if (error instanceof Error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join("\n")}`);
    }

    return validRows;
  };

  const handleImport = async () => {
    if (!file || !socket) return;

    try {
      setImporting(true);
      setProgress(0);
      setError(null);
      setImportedCount(0);

      const data = await parseFile(file);
      const validatedData = validateData(data);
      setTotalRows(validatedData.length);

      for (let i = 0; i < validatedData.length; i++) {
        const row = validatedData[i];

        try {
          await new Promise((resolve, reject) => {
            socket.emit('quality:inspection:create', {
              ...row,
              type,
              status: "pending",
              inspectionDate: new Date().toISOString(),
              results: {
                checklistItems: [],
                defectsFound: [],
              }
            }, (response: any) => {
              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
            });

            // Add timeout for socket response
            setTimeout(() => reject(new Error('Socket timeout')), 5000);
          });

          setImportedCount(prev => prev + 1);
          setProgress(((i + 1) / validatedData.length) * 100);
        } catch (error) {
          throw new Error(`Failed to import row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      toast({
        title: "Success",
        description: `Successfully imported ${validatedData.length} inspections`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : "Failed to import inspections");
      toast({
        title: "Error",
        description: "Failed to import inspections. Please check the error details.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const getTypeDisplayName = () => {
    switch (type) {
      case 'in-process':
        return 'In-Process Inspection';
      case 'final-qc':
        return 'Final Quality Control';
      case 'executive-review':
        return 'Executive Review';
      case 'pdi':
        return 'Pre-Delivery Inspection';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import {getTypeDisplayName()}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with inspection details. The file should contain columns for {type === 'final-qc' ? 'Project Number, ' : ''}Part Number (optional), Production Line ID, Inspector, Due Date, Priority, and Notes (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Imported {importedCount} of {totalRows} inspections
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h4 className="font-medium">Required Columns:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {type === 'final-qc' && <li>Project Number</li>}
              <li>Production Line ID</li>
              <li>Inspector</li>
              <li>Due Date (YYYY-MM-DD format)</li>
              <li>Priority (low/medium/high/urgent)</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="file-import" className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}