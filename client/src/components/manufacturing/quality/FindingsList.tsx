import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateFindingDialog } from "./dialogs/CreateFindingDialog";
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
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Finding } from "@/types/manufacturing";

export default function FindingsList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: findings = [], isLoading, error, refetch } = useQuery<Finding[]>({
    queryKey: ['/api/manufacturing/quality/audits/findings'],
    queryFn: async () => {
      console.log('Fetching findings...');
      try {
        const response = await fetch('/api/manufacturing/quality/audits/findings');
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.details || errorData.error || 'Failed to fetch findings');
        }

        const data = await response.json();
        console.log('Fetched findings:', data);
        return data;
      } catch (error) {
        console.error('Error fetching findings:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const createFinding = async (data: any) => {
    try {
      console.log('Creating finding with data:', data);
      const response = await fetch('/api/manufacturing/quality/audits/findings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to create finding');
      }

      const result = await response.json();
      console.log('Created finding:', result);

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/audits/findings'] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Finding created successfully",
      });
    } catch (error) {
      console.error('Error creating finding:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create finding",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span>Loading findings...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="text-red-500">
            Error loading findings: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
          <Button onClick={() => refetch()}>
            <FontAwesomeIcon icon="sync" className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <FontAwesomeIcon icon="sync" className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New Finding
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="space-y-4">
                  <div className="text-muted-foreground">No findings found</div>
                  <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                    <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
                    Create New Finding
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            findings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell>{finding.id}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    finding.type === 'major' ? 'bg-red-100 text-red-800' :
                    finding.type === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                    finding.type === 'observation' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {finding.type}
                  </span>
                </TableCell>
                <TableCell>{finding.department}</TableCell>
                <TableCell className="max-w-md truncate">{finding.description}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    finding.status === 'open' ? 'bg-red-100 text-red-800' :
                    finding.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {finding.status}
                  </span>
                </TableCell>
                <TableCell>
                  {finding.dueDate ? new Date(finding.dueDate).toLocaleDateString() : 'Not set'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showCreateDialog && (
        <CreateFindingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={createFinding}
        />
      )}
    </Card>
  );
}