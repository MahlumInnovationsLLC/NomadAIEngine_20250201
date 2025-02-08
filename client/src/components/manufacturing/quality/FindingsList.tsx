import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateFindingDialog } from "./dialogs/CreateFindingDialog";
import { EditFindingDialog } from "./dialogs/EditFindingDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faPenToSquare,
  faTrash,
  faRotate,
  faPlus,
  faComment,
  faFileSignature,
  faHistory,
  faUserGroup,
  faExclamationTriangle,
  faCheckCircle,
} from "@fortawesome/pro-light-svg-icons";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Finding } from "@/types/manufacturing";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { FindingDetailsDialog } from "./dialogs/FindingDetailsDialog";

export default function FindingsList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageIdsDialog, setShowManageIdsDialog] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [newFindingId, setNewFindingId] = useState("");
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showRiskAcceptanceDialog, setShowRiskAcceptanceDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
    refetchInterval: 5000,
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

  const updateFindingId = async (findingId: string, newId: string) => {
    try {
      const response = await fetch(`/api/manufacturing/quality/audits/findings/${findingId}/update-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update finding ID');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/audits/findings'] });
      setShowManageIdsDialog(false);
      setSelectedFinding(null);
      toast({
        title: "Success",
        description: "Finding ID updated successfully",
      });
    } catch (error) {
      console.error('Error updating finding ID:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update finding ID",
      });
    }
  };

  const clearAllFindings = async () => {
    try {
      const response = await fetch('/api/manufacturing/quality/audits/findings/clear-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear findings');
      }

      await queryClient.invalidateQueries({queryKey: ['/api/manufacturing/quality/audits/findings']});
      toast({
        title: "Success",
        description: "All findings cleared successfully",
      });
    } catch (error) {
      console.error('Error clearing findings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear findings",
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
            <FontAwesomeIcon icon={faRotate} className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const ResponsiveDialog = ({ finding, open, onOpenChange }: { 
    finding: Finding;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    const [response, setResponse] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const handleSubmitResponse = async () => {
      try {
        const responseData = {
          findingId: finding.id,
          content: response,
          respondedBy: "Current User", // Replace with actual user
          responseDate: new Date().toISOString(),
          status: 'submitted'
        };

        const res = await fetch(`/api/manufacturing/quality/audits/findings/${finding.id}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responseData),
        });

        if (!res.ok) throw new Error('Failed to submit response');

        await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/audits/findings'] });
        onOpenChange(false);
        toast({
          title: "Success",
          description: "Response submitted successfully",
        });
      } catch (error) {
        console.error('Error submitting response:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to submit response",
        });
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Finding</DialogTitle>
            <DialogDescription>
              Provide your response to the finding "{finding.description}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                placeholder="Enter your response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse}>Submit Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const RiskAcceptanceDialog = ({ finding, open, onOpenChange }: {
    finding: Finding;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    const [justification, setJustification] = useState("");
    const [mitigatingControls, setMitigatingControls] = useState<string[]>([]);
    const [reviewCycle, setReviewCycle] = useState<'quarterly' | 'semi-annual' | 'annual'>('quarterly');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const handleAcceptRisk = async () => {
      try {
        const acceptanceData = {
          findingId: finding.id,
          justification,
          mitigatingControls,
          reviewCycle,
          acceptedBy: "Current User", // Replace with actual user
          acceptanceDate: new Date().toISOString(),
        };

        const res = await fetch(`/api/manufacturing/quality/audits/findings/${finding.id}/risk-acceptance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(acceptanceData),
        });

        if (!res.ok) throw new Error('Failed to submit risk acceptance');

        await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/audits/findings'] });
        onOpenChange(false);
        toast({
          title: "Success",
          description: "Risk acceptance submitted successfully",
        });
      } catch (error) {
        console.error('Error submitting risk acceptance:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to submit risk acceptance",
        });
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Risk Acceptance</DialogTitle>
            <DialogDescription>
              Document your acceptance of risk for finding "{finding.description}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea
                placeholder="Explain why this risk is acceptable..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Review Cycle</Label>
              <Select value={reviewCycle} onValueChange={(value: any) => setReviewCycle(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select review cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptRisk} className="bg-yellow-500 hover:bg-yellow-600">
              Accept Risk & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <FontAwesomeIcon icon={faRotate} className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={clearAllFindings}
            className="bg-red-100 hover:bg-red-200 text-red-700"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
            Clear All Findings
          </Button>
          <Button variant="outline" onClick={() => setShowManageIdsDialog(true)}>
            <FontAwesomeIcon icon={faGear} className="mr-2 h-4 w-4" />
            Manage IDs
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
            New Finding
          </Button>
        </div>
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="space-y-4">
                  <div className="text-muted-foreground">No findings found</div>
                  <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                    Create New Finding
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            findings.map((finding) => (
              <TableRow 
                key={finding.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSelectedFinding(finding);
                  setShowDetailsDialog(true);
                }}
              >
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
                <TableCell className="max-w-md">
                  <div className="space-y-1">
                    <p className="truncate">{finding.description}</p>
                    {finding.responseStatus !== 'pending' && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        finding.responseStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        finding.responseStatus === 'responded' ? 'bg-blue-100 text-blue-800' :
                        finding.responseStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        <FontAwesomeIcon icon={faComment} className="mr-1 h-3 w-3" />
                        {finding.responseStatus}
                      </span>
                    )}
                    {finding.riskAcceptance && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 ml-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 h-3 w-3" />
                        Risk Accepted
                      </span>
                    )}
                  </div>
                </TableCell>
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
                  <div className="space-y-1">
                    <p>{finding.dueDate ? format(new Date(finding.dueDate), 'MMM d, yyyy') : 'Not set'}</p>
                    {finding.responseDueDate && (
                      <p className="text-xs text-muted-foreground">
                        Response due: {format(new Date(finding.responseDueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFinding(finding);
                        setShowResponseDialog(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faComment} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFinding(finding);
                        setShowRiskAcceptanceDialog(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faFileSignature} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFinding(finding);
                        setShowEditDialog(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFinding(finding);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
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

      {showEditDialog && selectedFinding && (
        <EditFindingDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          finding={selectedFinding}
          onSubmit={async (data) => {
            try {
              const response = await fetch(`/api/manufacturing/quality/audits/findings/${selectedFinding.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to update finding');
              }

              await queryClient.invalidateQueries({queryKey: ['/api/manufacturing/quality/audits/findings']});
              setShowEditDialog(false);
              setSelectedFinding(null);
              toast({
                title: "Success",
                description: "Finding updated successfully",
              });
            } catch (error) {
              console.error('Error updating finding:', error);
              toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update finding",
              });
            }
          }}
        />
      )}

      <Dialog open={showManageIdsDialog} onOpenChange={setShowManageIdsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Finding IDs</DialogTitle>
            <DialogDescription>
              Select a finding and enter a new ID to update it. Follow the format FND-XXX-DD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <span className="font-medium">{finding.id}</span>
                </div>
                <Input
                  placeholder="New ID (e.g., FND-001-QA)"
                  className="w-48"
                  onFocus={() => setSelectedFinding(finding)}
                  onChange={(e) => setNewFindingId(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (selectedFinding && newFindingId) {
                      updateFindingId(selectedFinding.id, newFindingId);
                    }
                  }}
                  disabled={!selectedFinding || !newFindingId}
                >
                  Update
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageIdsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction
              onClick={async () => {
                if (!selectedFinding) return;

                try {
                  const response = await fetch(`/api/manufacturing/quality/audits/findings/${selectedFinding.id}`, {
                    method: 'DELETE',
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || errorData.error || 'Failed to delete finding');
                  }

                  await queryClient.invalidateQueries({queryKey: ['/api/manufacturing/quality/audits/findings']});
                  setShowDeleteDialog(false);
                  setSelectedFinding(null);
                  toast({
                    title: "Success",
                    description: "Finding deleted successfully",
                  });
                } catch (error) {
                  console.error('Error deleting finding:', error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to delete finding",
                  });
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showResponseDialog && selectedFinding && (
        <ResponsiveDialog
          finding={selectedFinding}
          open={showResponseDialog}
          onOpenChange={setShowResponseDialog}
        />
      )}

      {showRiskAcceptanceDialog && selectedFinding && (
        <RiskAcceptanceDialog
          finding={selectedFinding}
          open={showRiskAcceptanceDialog}
          onOpenChange={setShowRiskAcceptanceDialog}
        />
      )}
      {showDetailsDialog && selectedFinding && (
        <FindingDetailsDialog
          finding={selectedFinding}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </Card>
  );
}