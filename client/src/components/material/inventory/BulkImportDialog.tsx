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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await fetch('/api/inventory/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data }),
      });
      if (!response.ok) {
        throw new Error('Import failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material/inventory'] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${preview.length} items`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setPreview(jsonData);
      } catch (error) {
        toast({
          title: "Error Reading File",
          description: "Please ensure the file is a valid Excel spreadsheet",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (!preview.length) return;
    importMutation.mutate(preview);
  };

  const downloadTemplate = () => {
    const template = [
      {
        sku: "EXAMPLE-001",
        name: "Example Item",
        category: "Raw Materials",
        currentStock: 100,
        minimumStock: 10,
        reorderPoint: 20,
        unit: "pcs",
        binLocation: "A-01-01",
        abcClass: "A"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "inventory_import_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Inventory Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <FontAwesomeIcon icon="download" className="mr-2" />
              Download Template
            </Button>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="max-w-xs"
            />
          </div>

          {preview.length > 0 && (
            <Alert>
              <AlertDescription>
                Found {preview.length} items to import. Please review the data before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div className="border rounded-md max-h-[300px] overflow-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    {Object.keys(preview[0]).map((header) => (
                      <th key={header} className="p-2 text-left text-sm">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="p-2 text-sm">
                          {value}
                        </td>
                      ))}
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview.length || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <FontAwesomeIcon icon="spinner" className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon="file-import" className="mr-2" />
                Import {preview.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
