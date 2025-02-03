import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MRB } from "@/types/manufacturing/mrb";
import { MRBDialog } from "./dialogs/MRBDialog";
import { MRBDetailsDialog } from "./dialogs/MRBDetailsDialog";

const fetchMRBItems = async (): Promise<MRB[]> => {
  try {
    const [mrbResponse, ncrResponse] = await Promise.all([
      fetch('/api/manufacturing/quality/mrb'),
      fetch('/api/manufacturing/quality/ncrs'),
    ]);

    if (!mrbResponse.ok || !ncrResponse.ok) {
      throw new Error('Failed to fetch MRB or NCR data');
    }

    const [mrbs, ncrs] = await Promise.all([
      mrbResponse.json(),
      ncrResponse.json(),
    ]);

    return mrbs;
  } catch (error) {
    console.error('Error in fetchMRBItems:', error);
    throw error;
  }
};

export default function MRBList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMRB, setSelectedMRB] = useState<MRB | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<"open" | "closed">("open");

  const { data: mrbItems = [], isLoading, error, refetch } = useQuery<MRB[]>({
    queryKey: ['/api/manufacturing/quality/mrb'],
    queryFn: fetchMRBItems,
    refetchInterval: 5000,
    retry: 2,
  });

  const filteredMRBs = mrbItems.filter(mrb => {
    if (currentTab === "open") {
      return ['pending_review', 'in_review', 'pending_disposition'].includes(mrb.status.toLowerCase());
    } else {
      return ['closed'].includes(mrb.status.toLowerCase());
    }
  });

  // Add logging to debug the filtering
  console.log('Current tab:', currentTab);
  console.log('All MRB items:', mrbItems);
  console.log('Filtered MRBs:', filteredMRBs);
  console.log('Filtered statuses:', filteredMRBs.map(mrb => mrb.status));


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
      case 'closed':
        return 'outline';
      case 'rejected':
        return 'destructive';
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

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-lg border border-destructive/50 p-4 max-w-lg mx-auto">
          <h3 className="font-semibold text-destructive mb-2">Error Loading MRBs</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

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

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "open" | "closed")}>
        <TabsList>
          <TabsTrigger value="open">Open MRBs</TabsTrigger>
          <TabsTrigger value="closed">Closed MRBs</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab}>
          <Card>
            <CardHeader>
              <CardTitle>{currentTab === "open" ? "Open MRB Records" : "Closed MRB Records"}</CardTitle>
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
                  {filteredMRBs.map((mrb) => (
                    <TableRow 
                      key={mrb.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedMRB(mrb);
                        setShowDetailsDialog(true);
                      }}
                    >
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
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMRB(mrb);
                              setShowDetailsDialog(true);
                            }}>
                              <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {currentTab === "open" && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMRB(mrb);
                                setShowCreateDialog(true);
                              }}>
                                <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedMRB && showDetailsDialog && (
        <MRBDetailsDialog
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) setSelectedMRB(null);
          }}
          mrb={selectedMRB}
          onSuccess={async () => {
            await refetch();
            setShowDetailsDialog(false);
            setSelectedMRB(null);
          }}
        />
      )}

      <MRBDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedMRB(null);
        }}
        initialData={selectedMRB ?? undefined}
        onSuccess={async (savedMRB) => {
          await refetch();
          if (savedMRB.sourceType && savedMRB.sourceId) {
            try {
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