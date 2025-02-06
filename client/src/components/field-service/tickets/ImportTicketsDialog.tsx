import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { read, utils } from "xlsx";
import type { ServiceTicket } from "@/types/field-service";

interface ImportTicketsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (tickets: Partial<ServiceTicket>[]) => void;
}

export function ImportTicketsDialog({ open, onOpenChange, onImport }: ImportTicketsDialogProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setProgress(10);

      // Read the Excel file
      const data = await file.arrayBuffer();
      setProgress(30);
      
      const workbook = read(data);
      setProgress(50);
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);
      setProgress(70);

      // Transform Excel data to ticket format
      const tickets = jsonData.map((row: any) => ({
        title: row.Title,
        description: row.Description,
        priority: row.Priority?.toLowerCase() || "medium",
        customer: {
          name: row["Customer Name"],
          company: row["Company"],
          contact: row["Contact Email"],
        },
        productInfo: {
          serialNumber: row["Serial Number"],
          model: row["Model"],
          installationDate: row["Installation Date"],
          warrantyStatus: "pending",
        },
      }));

      setProgress(90);
      
      // Validate required fields
      const invalidTickets = tickets.filter(
        ticket => !ticket.title || !ticket.customer.name || !ticket.productInfo.serialNumber
      );

      if (invalidTickets.length > 0) {
        throw new Error(`${invalidTickets.length} tickets are missing required fields`);
      }

      setProgress(100);
      onImport(tickets);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import tickets");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Tickets from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing ticket information. 
            The file should have columns: Title, Description, Priority, Customer Name, 
            Company, Contact Email, Serial Number, Model, and Installation Date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
            />
            <Button disabled={importing}>
              {importing ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon="upload" className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <FontAwesomeIcon icon="circle-exclamation" className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          <div className="rounded-md bg-muted p-4">
            <h4 className="mb-2 text-sm font-medium">Template Format</h4>
            <div className="text-sm text-muted-foreground">
              <p>Required columns:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Title</li>
                <li>Description</li>
                <li>Priority (Low/Medium/High/Critical)</li>
                <li>Customer Name</li>
                <li>Company</li>
                <li>Contact Email</li>
                <li>Serial Number</li>
                <li>Model</li>
                <li>Installation Date (YYYY-MM-DD)</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
