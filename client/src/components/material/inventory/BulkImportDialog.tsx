import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [importStats, setImportStats] = useState<{
    processed: number;
    total: number;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setImporting(true);
      setImportProgress('Preparing file for upload...');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/inventory/bulk-import', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Import failed');
        }

        const result = await response.json();
        console.log('Import result:', result);
        return result;
      } catch (error) {
        console.error('Import error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/material/inventory'] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.count} items out of ${data.totalProcessed} processed records`,
      });
      onOpenChange(false);
      setFile(null);
      setPreview([]);
      setImporting(false);
      setImportProgress('');
      setImportStats(null);
    },
    onError: (error: Error) => {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setImporting(false);
      setImportProgress('');
      setImportStats(null);
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'text/tab-separated-values' // .tsv
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx, .xls) or CSV/TSV file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File Too Large",
        description: "Maximum file size is 100MB",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    setImportProgress('Reading file...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          if (workbook.SheetNames.length === 0) {
            throw new Error("The Excel file is empty");
          }

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            throw new Error("No data found in the file");
          }

          setImportProgress(`Found ${jsonData.length} records`);

          const transformedData = jsonData.slice(0, 5).map((row: any) => {
            const sku = row.PartNo || row.sku;
            const name = row.Description || row.name;

            if (!sku && !name) {
              throw new Error("Each row must have either a SKU/PartNo or Name/Description");
            }

            return {
              sku: sku?.toString().trim() || `SKU-${Date.now()}`,
              name: name?.toString().trim() || `Item ${sku}`,
              description: (row.Description || row.description)?.toString().trim() || '',
              category: row.Category?.toString().trim() || 'Uncategorized',
              quantity: parseFloat(row.QtyOnHand || row.quantity) || 0,
              unit: row.Unit?.toString().trim() || 'pcs',
              minimumStock: parseFloat(row.MinStock || row.minimumStock) || 0,
              reorderPoint: parseFloat(row.ReorderPoint || row.reorderPoint) || 0,
              binLocation: row.BinLocation?.toString().trim() || '',
              warehouse: row.Warehouse?.toString().trim() || '',
              cost: parseFloat(row.Cost || row.cost) || 0,
              supplier: (row.VendCode || row.supplier)?.toString().trim() || '',
              leadTime: parseInt(row.LeadTime || row.leadTime) || 0,
              batchNumber: row.BatchNumber?.toString().trim() || '',
              notes: row.Notes?.toString().trim() || ''
            };
          });

          setPreview(transformedData);
          setImportStats({ processed: 0, total: jsonData.length });
          setImportProgress('');
        } catch (error) {
          toast({
            title: "Error Reading File",
            description: error instanceof Error ? error.message : "Failed to read the Excel file",
            variant: "destructive",
          });
          setFile(null);
          setImportProgress('');
          setImportStats(null);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast({
        title: "Error Reading File",
        description: "Failed to process the file",
        variant: "destructive",
      });
      setFile(null);
      setImportProgress('');
      setImportStats(null);
    }
  };

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  const downloadTemplate = () => {
    const template = [{
      PartNo: "EXAMPLE-001",
      Description: "Example Part",
      Category: "Raw Material",
      QtyOnHand: 100,
      Unit: "pcs",
      MinStock: 10,
      ReorderPoint: 20,
      BinLocation: "A-01-01",
      Warehouse: "MAIN",
      Cost: 29.99,
      VendCode: "VEN001",
      LeadTime: 7,
      BatchNumber: "BATCH001",
      Notes: "Example notes"
    }];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Import Inventory Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <FontAwesomeIcon icon="download" className="mr-2" />
              Download Template
            </Button>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={handleFileChange}
              className="max-w-xs"
            />
          </div>

          {importStats && (
            <Alert>
              <AlertDescription>
                Found {importStats.total} records to import
                {importStats.processed > 0 && ` (${importStats.processed} processed)`}
              </AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div className="border rounded-md max-h-[400px] overflow-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">SKU</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Bin Location</th>
                    <th className="p-2 text-left">Warehouse</th>
                    <th className="p-2 text-left">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{row.sku}</td>
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.category}</td>
                      <td className="p-2">{row.quantity}</td>
                      <td className="p-2">{row.unit}</td>
                      <td className="p-2">{row.binLocation}</td>
                      <td className="p-2">{row.warehouse}</td>
                      <td className="p-2">${row.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  And {preview.length - 5} more items...
                </div>
              )}
            </div>
          )}

          {importing && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon="spinner" className="animate-spin" />
                  <span>{importProgress || 'Importing...'}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? (
              <>
                <FontAwesomeIcon icon="spinner" className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon="file-import" className="mr-2" />
                Import {importStats?.total || 0} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}