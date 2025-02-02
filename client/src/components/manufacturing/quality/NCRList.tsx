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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { NCRDialog } from "./dialogs/NCRDialog";
import { NCRDetailsDialog } from "./dialogs/NCRDetailsDialog";
import { NonConformanceReport } from "@/types/manufacturing";

const fetchNCRs = async (): Promise<NonConformanceReport[]> => {
  const response = await fetch('/api/manufacturing/quality/ncrs');
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch NCRs');
    }
    throw new Error(`Failed to fetch NCRs: ${response.statusText}`);
  }
  return response.json();
};

export default function NCRList() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NonConformanceReport | null>(null);

  const { data: ncrs = [], isLoading, error } = useQuery<NonConformanceReport[]>({
    queryKey: ['/api/manufacturing/quality/ncrs'],
    queryFn: fetchNCRs,
    staleTime: 5000,
    retry: 2,
    onError: (error) => {
      toast({
        title: "Error loading NCRs",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const getStatusBadgeVariant = (status: NonConformanceReport['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'under_review':
        return 'destructive';
      case 'pending_disposition':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const groupedNCRs = ncrs.reduce((acc, ncr) => {
    const status = ncr.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(ncr);
    return acc;
  }, {} as Record<string, NonConformanceReport[]>);

  const NCRTable = ({ ncrs }: { ncrs: NonConformanceReport[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>NCR #</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Project #</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Reported By</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ncrs.map((ncr) => (
          <TableRow 
            key={ncr.id || ncr.number}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => setSelectedNCR(ncr)}
          >
            <TableCell className="font-medium">{ncr.number}</TableCell>
            <TableCell>{ncr.title}</TableCell>
            <TableCell>{ncr.projectNumber || 'N/A'}</TableCell>
            <TableCell>{formatDate(ncr.createdAt)}</TableCell>
            <TableCell>{ncr.type}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(ncr.status)}>
                {ncr.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={ncr.severity === 'critical' ? 'destructive' : 'default'}>
                {ncr.severity}
              </Badge>
            </TableCell>
            <TableCell>{ncr.reportedBy}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedNCR(ncr)}>
                    <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNCR(ncr);
                  }}>
                    <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <FontAwesomeIcon icon="clipboard-list" className="mr-2 h-4 w-4" />
                    Create CAPA
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading NCRs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-lg border border-destructive/50 p-4 max-w-lg mx-auto">
          <h3 className="font-semibold text-destructive mb-2">Error Loading NCRs</h3>
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
          <h3 className="text-lg font-semibold">Non-Conformance Reports</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage product or process non-conformances
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New NCR
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All NCRs</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="pending_disposition">Pending Disposition</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All NCRs</CardTitle>
            </CardHeader>
            <CardContent>
              <NCRTable ncrs={ncrs} />
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(groupedNCRs).map(([status, statusNcrs]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>{status.replace('_', ' ').toUpperCase()} NCRs</CardTitle>
              </CardHeader>
              <CardContent>
                <NCRTable ncrs={statusNcrs} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {(showCreateDialog || selectedNCR) && (
        <NCRDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setSelectedNCR(null);
            }
          }}
          defaultValues={selectedNCR}
        />
      )}

      {selectedNCR && !showCreateDialog && (
        <NCRDetailsDialog
          open={!!selectedNCR}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedNCR(null);
            }
          }}
          ncr={selectedNCR}
        />
      )}
    </div>
  );
}