import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { NonConformanceReport } from "@/types/manufacturing";

export default function NCRList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NonConformanceReport | null>(null);

  const { data: ncrs = [] } = useQuery<NonConformanceReport[]>({
    queryKey: ['/api/manufacturing/quality/ncrs'],
  });

  const createNCRMutation = useMutation({
    mutationFn: async (data: Partial<NonConformanceReport>) => {
      const response = await fetch('/api/manufacturing/quality/ncrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create NCR');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "NCR created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNCRMutation = useMutation({
    mutationFn: async (data: NonConformanceReport) => {
      const response = await fetch(`/api/manufacturing/quality/ncrs/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update NCR');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/ncrs'] });
      setSelectedNCR(null);
      toast({
        title: "Success",
        description: "NCR updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeVariant = (status: NonConformanceReport['status']) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'open':
        return 'default';
      case 'under_review':
        return 'warning';
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

  // Group NCRs by status
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
          <TableRow key={ncr.id}>
            <TableCell className="font-medium">{ncr.number}</TableCell>
            <TableCell>{formatDate(ncr.createdAt)}</TableCell>
            <TableCell>{ncr.type}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(ncr.status)}>
                {ncr.status}
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
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedNCR(ncr)}>
                    <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedNCR(ncr)}>
                    <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // Create CAPA from NCR
                    }}
                  >
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
          open={showCreateDialog || !!selectedNCR}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setSelectedNCR(null);
            }
          }}
          defaultValues={selectedNCR || undefined}
        />
      )}
    </div>
  );
}