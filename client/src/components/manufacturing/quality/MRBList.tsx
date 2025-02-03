import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { MRB } from "@/types/manufacturing/mrb";
import { MRBDialog } from "./dialogs/MRBDialog";

const fetchMRBItems = async (): Promise<MRB[]> => {
  // Fetch existing MRBs and NCRs
  const [mrbResponse, ncrResponse] = await Promise.all([
    fetch('/api/manufacturing/quality/mrb'),
    fetch('/api/manufacturing/quality/ncr'),
  ]);

  if (!mrbResponse.ok || !ncrResponse.ok) {
    throw new Error('Failed to fetch MRB items');
  }

  const [mrbs, ncrs] = await Promise.all([
    mrbResponse.json(),
    ncrResponse.json(),
  ]);

  console.log('Fetched NCRs:', ncrs);

  // Convert NCRs with pending_disposition status to MRB format
  const ncrMrbs = ncrs
    .filter(ncr => {
      const status = (ncr.status || '').toLowerCase();
      console.log(`NCR ${ncr.number} status: ${status}`);
      return status === 'pending_disposition';
    })
    .map(ncr => {
      console.log(`Converting NCR to MRB:`, ncr);
      const mrbItem: MRB = {
        id: `ncr-${ncr.id}`,
        number: ncr.number,
        title: `NCR: ${ncr.title}`,
        description: ncr.description,
        type: ncr.type || "material",
        severity: ncr.severity || "minor",
        status: "pending_disposition",
        partNumber: ncr.partNumber || "N/A",
        lotNumber: ncr.lotNumber,
        quantity: ncr.quantityAffected || 0,
        unit: ncr.unit || "pcs",
        location: ncr.area || "N/A",
        sourceType: "NCR",
        sourceId: ncr.id,
        ncrNumber: ncr.number,
        costImpact: {
          materialCost: 0,
          laborCost: 0,
          reworkCost: 0,
          totalCost: 0,
          currency: "USD"
        },
        nonconformance: {
          description: ncr.description,
          detectedBy: ncr.reportedBy,
          detectedDate: ncr.createdAt,
          defectType: ncr.type || "unknown",
          rootCause: ncr.rootCause,
        },
        disposition: {
          decision: "use_as_is",
          justification: "",
          approvedBy: [],
        },
        createdBy: ncr.reportedBy,
        createdAt: ncr.createdAt,
        updatedAt: ncr.updatedAt,
        attachments: ncr.attachments || [],
        history: [],
      };
      console.log('Created MRB item from NCR:', mrbItem);
      return mrbItem;
    });

  console.log('Converted NCR MRBs:', ncrMrbs);
  console.log('Original MRBs:', mrbs);

  // Combine MRBs and converted NCRs
  return [...mrbs, ...ncrMrbs];
};

export default function MRBList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMRB, setSelectedMRB] = useState<MRB | null>(null);

  const { data: mrbItems = [], isLoading } = useQuery<MRB[]>({
    queryKey: ['/api/manufacturing/quality/mrb'],
    queryFn: fetchMRBItems,
  });

  const updateSourceItemDisposition = async (mrb: MRB) => {
    if (!mrb.sourceType || !mrb.sourceId) return;

    const endpoint = `/api/manufacturing/quality/${mrb.sourceType.toLowerCase()}/${mrb.sourceId}`;
    console.log('Updating source item:', endpoint, mrb);

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disposition: mrb.disposition.decision,
        dispositionJustification: mrb.disposition.justification,
        status: 'disposition_complete',
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${mrb.sourceType} disposition`);
    }

    // Invalidate both MRB and source type queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/mrb'] });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/manufacturing/quality/${mrb.sourceType.toLowerCase()}`] 
    });
  };

  const getSourceBadgeVariant = (sourceType?: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (sourceType) {
      case 'NCR':
        return 'destructive';
      case 'CAPA':
        return 'default';
      case 'SCAR':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status.toLowerCase()) {
      case 'pending_review':
      case 'in_review':
        return 'secondary';
      case 'disposition_pending':
      case 'pending_disposition':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
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
        return 'default';
      case 'minor':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading MRBs...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering MRB items:', mrbItems);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Material Review Board</h3>
          <p className="text-sm text-muted-foreground">
            Review and disposition non-conforming materials
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New MRB
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MRB Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Reference #</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost Impact</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mrbItems.map((mrb) => {
                console.log('Rendering MRB row:', mrb);
                return (
                  <TableRow key={mrb.id}>
                    <TableCell>
                      <Badge variant={getSourceBadgeVariant(mrb.sourceType)}>
                        {mrb.sourceType || 'MRB'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mrb.number}</TableCell>
                    <TableCell>{mrb.partNumber}</TableCell>
                    <TableCell className="capitalize">{mrb.type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(mrb.severity)}>
                        {mrb.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(mrb.status)}>
                        {mrb.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mrb.costImpact ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: mrb.costImpact.currency,
                      }).format(mrb.costImpact.totalCost) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(mrb.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMRB(mrb)}>
                            <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedMRB(mrb)}>
                            <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MRBDialog
        open={showCreateDialog || !!selectedMRB}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedMRB(null);
        }}
        initialData={selectedMRB ?? undefined}
        onSuccess={async (savedMRB) => {
          if (savedMRB.sourceType && savedMRB.sourceId) {
            try {
              await updateSourceItemDisposition(savedMRB);
              toast({
                title: "Success",
                description: `MRB and ${savedMRB.sourceType} updated successfully`,
              });
            } catch (error) {
              console.error('Error updating source item:', error);
              toast({
                title: "Warning",
                description: `MRB saved but failed to update ${savedMRB.sourceType} status`,
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Success", 
              description: selectedMRB
                ? "MRB updated successfully"
                : "MRB created successfully",
            });
          }
        }}
      />
    </div>
  );
}