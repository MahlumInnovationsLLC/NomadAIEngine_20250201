import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { SCAR } from "@/types/manufacturing/scar";
import { SCARDialog } from "./dialogs/SCARDialog";

const fetchSCARs = async (): Promise<SCAR[]> => {
  const response = await fetch('/api/manufacturing/quality/scars');
  if (!response.ok) {
    throw new Error('Failed to fetch SCARs');
  }
  return response.json();
};

export default function SCARList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSCAR, setSelectedSCAR] = useState<SCAR | null>(null);

  const { data: scars = [], isLoading } = useQuery<SCAR[]>({
    queryKey: ['/api/manufacturing/quality/scars'],
    queryFn: fetchSCARs,
  });

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'issued':
        return 'default';
      case 'supplier_response':
        return 'default';
      case 'review':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'major':
        return 'destructive';
      case 'minor':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading SCARs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Supplier Corrective Action Reports</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage supplier quality issues and corrective actions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New SCAR
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SCAR List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SCAR #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Response Required</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scars.map((scar) => (
                <TableRow key={scar.id}>
                  <TableCell className="font-medium">{scar.number}</TableCell>
                  <TableCell>{scar.supplierName}</TableCell>
                  <TableCell className="capitalize">{scar.issue.category}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityBadgeVariant(scar.issue.severity)}>
                      {scar.issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(scar.status)}>
                      {scar.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(scar.issueDate)}</TableCell>
                  <TableCell>{formatDate(scar.responseRequired)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedSCAR(scar)}>
                          <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="check-square" className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="paper-plane" className="mr-2 h-4 w-4" />
                          Send to Supplier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SCARDialog
        open={showCreateDialog || !!selectedSCAR}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedSCAR(null);
        }}
        initialData={selectedSCAR ?? undefined}
        onSuccess={() => {
          toast({
            title: "Success",
            description: selectedSCAR 
              ? "SCAR updated successfully"
              : "SCAR created successfully",
          });
        }}
      />
    </div>
  );
}