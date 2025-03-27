import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
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
import { Badge } from "@/components/ui/badge";
import { QualityInspection, QualityFormTemplate, Project } from "@/types/manufacturing";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";

import { CreateInspectionDialog } from "./dialogs/CreateInspectionDialog";
import { InspectionDetailsDialog } from "./dialogs/InspectionDetailsDialog";
import { NCRDialog } from "./dialogs/NCRDialog";
import { InspectionTemplateDialog } from "./dialogs/InspectionTemplateDialog";
import { ImportInspectionsDialog } from "./dialogs/ImportInspectionsDialog";
import { AdvancedImportButton } from "./AdvancedImportButton";

interface QualityInspectionListProps {
  inspections?: QualityInspection[];
  type: 'in-process' | 'final-qc' | 'executive-review' | 'pdi';
  projects?: Project[];
}


export default function QualityInspectionList({ inspections = [], type, projects = [] }: QualityInspectionListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socket = useWebSocket({ namespace: 'manufacturing' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNCRDialog, setShowNCRDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityFormTemplate | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Add a direct REST API query to ensure we always have the latest data
  // This query will run automatically in addition to the inspections prop
  const { data: inspectionsFromApi, isLoading: isLoadingInspections } = useQuery({
    queryKey: ['/api/manufacturing/quality/inspections', refreshTrigger],
    queryFn: async () => {
      try {
        console.log('[QualityInspectionList] Fetching inspections via REST API');
        const response = await fetch('/api/manufacturing/quality/inspections');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch inspections: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[QualityInspectionList] REST API returned ${data.length} inspections`);
        return data as QualityInspection[];
      } catch (error) {
        console.error('[QualityInspectionList] Error fetching inspections:', error);
        // We still want to show whatever inspections were passed as props
        return [] as QualityInspection[];
      }
    },
    // 30 second stale time (don't refetch too frequently)
    staleTime: 30 * 1000,
    // Never consider this query fresh forever
    gcTime: 5 * 60 * 1000,
  });
  
  // Function to force refresh from API - memoized to avoid dependency issues
  const refreshInspections = useCallback(() => {
    console.log('[QualityInspectionList] Manual refresh triggered');
    // Increment refresh trigger to force refetch
    setRefreshTrigger(prev => prev + 1);
    // Also invalidate the query to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/inspections'] });
  }, [queryClient]);
  
  // Set up listeners for data updates from the server to ensure consistent state
  useEffect(() => {
    if (!socket) return;
    
    console.log('[QualityInspectionList] Setting up socket.io event listeners for data updates');
    
    // Listen for new inspection notifications
    const handleNewInspection = (data: any) => {
      console.log('[QualityInspectionList] New inspection notification received:', data);
      // Use the correct query key for invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/inspections'] });
    };
    
    // Listen for inspection update notifications
    const handleUpdatedInspection = (data: any) => {
      console.log('[QualityInspectionList] Inspection update notification received:', data);
      // Use the correct query key for invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/inspections'] });
    };
    
    // Listen for global refresh signals
    const handleRefreshNeeded = (data: any) => {
      console.log('[QualityInspectionList] Refresh signal received:', data);
      // Trigger manual refresh
      refreshInspections();
    };
    
    // Register event listeners
    socket.on('quality:inspection:new', handleNewInspection);
    socket.on('quality:inspection:modified', handleUpdatedInspection);
    socket.on('quality:refresh:needed', handleRefreshNeeded);
    // We'll handle quality:inspection:updated in specific update flow only to avoid conflicts
    // socket.on('quality:inspection:updated', handleRefreshNeeded);
    
    // When component loads, request the latest inspection data
    socket.emit('quality:inspection:list');
    
    // Cleanup listeners on unmount
    return () => {
      socket.off('quality:inspection:new', handleNewInspection);
      socket.off('quality:inspection:modified', handleUpdatedInspection);
      socket.off('quality:refresh:needed', handleRefreshNeeded);
      // socket.off('quality:inspection:updated', handleRefreshNeeded);
    };
  }, [socket, queryClient, refreshInspections]);

  // Filter inspections by type
  const filteredInspections = inspections.filter(inspection => inspection.type === type);

  const createInspectionMutation = useMutation({
    mutationFn: async (data: Partial<QualityInspection>) => {
      if (!socket) throw new Error('Socket connection not available');
      return new Promise((resolve, reject) => {
        socket.emit('quality:inspection:create', { ...data, templateType: type }, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      });
    },
    onSuccess: (newInspection) => {
      setShowCreateDialog(false);
      toast({
        title: 'Success',
        description: 'New inspection has been created successfully.',
      });
    },
    onError: (error: Error) => {
      console.error('Creation error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInspectionClick = (inspection: QualityInspection) => {
    setSelectedInspection(inspection);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: QualityInspection['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {type === 'final-qc' ? 'Final Quality Control' :
              type === 'in-process' ? 'In-Process Inspection' :
              type === 'executive-review' ? 'Executive Review' :
              'Pre-Delivery Inspection'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage {type.replace('-', ' ')} inspections and quality checks
          </p>
        </div>
        <div className="flex gap-2">
          <AdvancedImportButton inspectionType={type} />
          <Button onClick={() => {
            setSelectedTemplate(null);
            setShowCreateDialog(true);
          }}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project Number</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Production Line</TableHead>
                <TableHead>Defects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.map((inspection) => (
                <TableRow
                  key={inspection.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleInspectionClick(inspection)}
                >
                  <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                  <TableCell>
                    {inspection.projectId ? (
                      <span className="font-medium">{inspection.projectNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">No Project</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {inspection.partNumber ? (
                      <span className="font-medium">{inspection.partNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium capitalize">
                    {inspection.type}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inspection.inspector}</TableCell>
                  <TableCell>{inspection.productionLineId}</TableCell>
                  <TableCell>
                    {inspection.results.defectsFound.length > 0 && (
                      <Badge variant="destructive">
                        {inspection.results.defectsFound.length} Issues Found
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleInspectionClick(inspection);
                        }}>
                          <FontAwesomeIcon icon="eye" className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {inspection.results.defectsFound.length > 0 && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInspection(inspection);
                            setShowNCRDialog(true);
                          }}>
                            <FontAwesomeIcon icon="triangle-exclamation" className="mr-2 h-4 w-4" />
                            Create NCR
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

      {showCreateDialog && (
        <CreateInspectionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={createInspectionMutation.mutate}
          type={type}
          projects={projects}
          template={selectedTemplate}
        />
      )}

      {showNCRDialog && selectedInspection && (
        <NCRDialog
          open={showNCRDialog}
          onOpenChange={setShowNCRDialog}
          inspection={selectedInspection}
        />
      )}

      {showDetailsDialog && selectedInspection && (
        <InspectionDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          inspection={selectedInspection}
          onUpdate={async (updated) => {
            // Generate a unique ID for this toast
            const toastId = `update-${Date.now()}`;
            
            // Show loading toast
            toast({
              id: toastId,
              title: "Saving changes...",
              description: "Updating inspection details",
            });
              
            try {
              // First try to update via the REST API (more reliable)
              const response = await fetch(`/api/manufacturing/quality/inspections/${updated.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updated)
              });
              
              if (!response.ok) {
                // If REST API fails but we have socket as fallback, try it
                if (socket) {
                  console.log('Trying socket fallback for update...');
                  
                  // Set up a listener for the update confirmation with better error handling
                  const handleUpdateConfirmation = (response: any) => {
                    console.log('[QualityInspectionList] Received socket update confirmation:', response);
                    
                    // Remove this listener to prevent memory leaks
                    socket.off('quality:inspection:updated', handleUpdateConfirmation);
                    
                    // Clear the timeout since we got a response
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                    }
                    
                    if (response.error) {
                      // Handle error format from server
                      toast({
                        id: toastId,
                        title: "Error",
                        description: response.details || response.message || "Failed to update inspection",
                        variant: "destructive",
                      });
                    } else {
                      // Success via socket
                      toast({
                        id: toastId,
                        title: "Success",
                        description: "Inspection details have been updated successfully (via WebSocket)",
                      });
                      
                      // Close the dialog
                      setShowDetailsDialog(false);
                      
                      // Refresh the data
                      refreshInspections();
                    }
                  };
                  
                  // Listen for update confirmation
                  socket.on('quality:inspection:updated', handleUpdateConfirmation);
                  
                  // Emit the update event
                  socket.emit('quality:inspection:update', {
                    id: updated.id,
                    updates: updated
                  });
                  
                  // Add a timeout to handle cases where we don't get a response
                  // Store the timeout ID so we can clear it if we get a response
                  const timeoutId = setTimeout(() => {
                    socket.off('quality:inspection:updated', handleUpdateConfirmation);
                    
                    // No need to throw here - just show an error toast and continue
                    toast({
                      id: toastId,
                      title: "Error",
                      description: "Update timeout: The server did not confirm the update. Please try again.",
                      variant: "destructive",
                    });
                  }, 10000);
                } else {
                  // No socket fallback available
                  throw new Error(`Failed to update inspection: ${response.status} ${response.statusText}`);
                }
              } else {
                // REST API success
                const data = await response.json();
                console.log('Inspection updated successfully via REST API:', data);
                
                // Update the toast
                toast({
                  id: toastId,
                  title: "Success",
                  description: "Inspection details have been updated successfully",
                });
                
                // Invalidate the query to refresh the list
                queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/inspections'] });
                
                // Broadcast update to other connected clients
                if (socket) {
                  socket.emit('quality:refresh:needed', { 
                    timestamp: new Date().toISOString(),
                    message: 'Inspection updated'
                  });
                }
                
                // Close the dialog
                setShowDetailsDialog(false);
              }
            } catch (error) {
              console.error('Error updating inspection:', error);
              
              // Update toast with error
              toast({
                id: toastId,
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update inspection",
                variant: "destructive",
              });
            }
          }}
        />
      )}
      {showImportDialog && (
        <ImportInspectionsDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          type={type}
          onSuccess={() => {
            if (socket) {
              socket.emit('quality:inspection:list');
            }
          }}
        />
      )}
    </div>
  );
}