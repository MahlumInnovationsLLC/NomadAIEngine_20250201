import { useState, useCallback } from "react";
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
import { EditFindingDialog } from "./dialogs/EditFindingDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  faFilter as falFilter,
  faTag as falTag,
  faDownload as falDownload,
  faPlus as falPlus,
  faArrowUp as falArrowUp,
  faArrowDown as falArrowDown,
  faPenToSquare as falPenToSquare,
  faTrashCan as falTrashCan,
} from '@fortawesome/pro-light-svg-icons';
import { differenceInDays } from 'date-fns';

interface SortConfig {
  key: keyof Finding;
  direction: 'asc' | 'desc';
}

export default function FindingsList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: findings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      console.log('Fetching findings from API...');
      const response = await fetch('/api/manufacturing/quality/audits/findings');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch findings');
      }
      const data = await response.json();
      console.log('Received findings:', data);
      return data as Finding[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3
  });

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center p-6">Loading findings...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading findings: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const handleSort = (key: keyof Finding) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getDaysUntilDue = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  const getDueDateColor = (days: number | null) => {
    if (days === null) return 'text-muted-foreground';
    if (days < 0) return 'text-red-500';
    if (days <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const filteredAndSortedFindings = findings
    .filter(finding =>
      (!departmentFilter || finding.department === departmentFilter) &&
      (!typeFilter || finding.type === typeFilter)
    )
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (!aValue || !bValue) return 0;
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

  const handleCreateFinding = async (data: any) => {
    try {
      const response = await fetch('/api/manufacturing/quality/audits/findings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create finding: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Created finding:', result);

      // Invalidate and refetch findings
      await queryClient.invalidateQueries({ queryKey: ['findings'] });
      await refetch();

      setShowCreateDialog(false);
      toast({
        title: "Finding Created",
        description: "New finding has been successfully created",
      });
    } catch (error) {
      console.error('Error creating finding:', error);
      toast({
        variant: "destructive",
        title: "Error creating finding",
        description: error instanceof Error ? error.message : "Failed to create finding"
      });
    }
  };

  const handleEditFinding = async (data: any) => {
    if (!selectedFinding) return;

    try {
      const response = await fetch(`/api/manufacturing/quality/audits/findings/${selectedFinding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update finding: ${response.statusText}`);
      }

      await refetch();
      setShowEditDialog(false);
      setSelectedFinding(null);
      toast({
        title: "Finding Updated",
        description: "Finding has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating finding:', error);
      toast({
        variant: "destructive",
        title: "Error updating finding",
        description: error instanceof Error ? error.message : "Failed to update finding"
      });
    }
  };

  const handleDeleteFinding = async () => {
    if (!selectedFinding) return;

    try {
      const response = await fetch(`/api/manufacturing/quality/audits/findings/${selectedFinding.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete finding: ${response.statusText}`);
      }

      await refetch();
      setShowDeleteDialog(false);
      setSelectedFinding(null);
      toast({
        title: "Finding Deleted",
        description: "Finding has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting finding:', error);
      toast({
        variant: "destructive",
        title: "Error deleting finding",
        description: error instanceof Error ? error.message : "Failed to delete finding"
      });
    }
  };


  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FontAwesomeIcon icon={falFilter} className="mr-2 h-4 w-4" />
                Department: {departmentFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDepartmentFilter(null)}>
                All Departments
              </DropdownMenuItem>
              {Array.from(new Set(findings.map(f => f.department))).map(dept => (
                <DropdownMenuItem key={dept} onClick={() => setDepartmentFilter(dept)}>
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FontAwesomeIcon icon={falTag} className="mr-2 h-4 w-4" />
                Type: {typeFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                All Types
              </DropdownMenuItem>
              {['observation', 'minor', 'major', 'opportunity'].map(type => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            <FontAwesomeIcon icon={falDownload} className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon={falPlus} className="mr-2 h-4 w-4" />
            New Finding
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('id')}
            >
              ID {sortConfig.key === 'id' && (
                <FontAwesomeIcon
                  icon={sortConfig.direction === 'asc' ? falArrowUp : falArrowDown}
                  className="ml-2 h-4 w-4"
                />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('type')}
            >
              Type {sortConfig.key === 'type' && (
                <FontAwesomeIcon
                  icon={sortConfig.direction === 'asc' ? falArrowUp : falArrowDown}
                  className="ml-2 h-4 w-4"
                />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('priority')}
            >
              Severity {sortConfig.key === 'priority' && (
                <FontAwesomeIcon
                  icon={sortConfig.direction === 'asc' ? falArrowUp : falArrowDown}
                  className="ml-2 h-4 w-4"
                />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('department')}
            >
              Department {sortConfig.key === 'department' && (
                <FontAwesomeIcon
                  icon={sortConfig.direction === 'asc' ? falArrowUp : falArrowDown}
                  className="ml-2 h-4 w-4"
                />
              )}
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status {sortConfig.key === 'status' && (
                <FontAwesomeIcon
                  icon={sortConfig.direction === 'asc' ? falArrowUp : falArrowDown}
                  className="ml-2 h-4 w-4"
                />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('dueDate')}
            >
              Due Date {sortConfig.key === 'dueDate' && (
                <FontAwesomeIcon
                  icon={sortConfig.direction === 'asc' ? falArrowUp : falArrowDown}
                  className="ml-2 h-4 w-4"
                />
              )}
            </TableHead>
            <TableHead>Days Left</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedFindings.map((finding) => {
            const daysUntilDue = getDaysUntilDue(finding.dueDate);
            const dueDateColor = getDueDateColor(daysUntilDue);

            return (
              <TableRow key={finding.id}>
                <TableCell>{finding.id}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    finding.type === 'major' ? 'bg-red-100 text-red-800' :
                      finding.type === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                        finding.type === 'observation' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                  }`}>
                    {finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    finding.priority === 'high' ? 'bg-red-100 text-red-800' :
                      finding.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                  }`}>
                    {finding.priority.charAt(0).toUpperCase() + finding.priority.slice(1)}
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
                    {finding.status.replace('_', ' ').charAt(0).toUpperCase() + finding.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{finding.dueDate ? new Date(finding.dueDate).toLocaleDateString() : 'Not set'}</TableCell>
                <TableCell className={dueDateColor}>
                  {daysUntilDue === null ? '-' :
                    daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                      daysUntilDue === 0 ? 'Due today' :
                        `${daysUntilDue} days left`
                  }
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFinding(finding);
                        setShowEditDialog(true);
                      }}
                    >
                      <FontAwesomeIcon icon={falPenToSquare} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFinding(finding);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <FontAwesomeIcon icon={falTrashCan} className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {filteredAndSortedFindings.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No findings found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showCreateDialog && (
        <CreateFindingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateFinding}
        />
      )}

      {showEditDialog && selectedFinding && (
        <EditFindingDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={handleEditFinding}
          finding={selectedFinding}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Finding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this finding? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFinding} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}