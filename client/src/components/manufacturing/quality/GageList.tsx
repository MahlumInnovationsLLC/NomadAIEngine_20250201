import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEdit,
  faEllipsisVertical,
  faPlus,
  faTrash,
  faSpinner,
  faCalendarAlt,
  faRuler,
  faClipboardCheck
} from '@fortawesome/pro-light-svg-icons';
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
import { useToast } from "@/hooks/use-toast";
import { Gage } from "@/types/manufacturing/gage";
import { GageDialog } from "./dialogs/GageDialog";
import { GageDetailsDialog } from "./dialogs/GageDetailsDialog";
import { GageCalibrationDialog } from "./dialogs/GageCalibrationDialog";

const fetchGages = async (): Promise<Gage[]> => {
  try {
    const response = await fetch('/api/manufacturing/quality/gages');

    if (!response.ok) {
      throw new Error('Failed to fetch gage data');
    }

    const gages = await response.json();
    return gages;
  } catch (error) {
    console.error('Error in fetchGages:', error);
    throw error;
  }
};

function getStatusBadgeVariant(status: string): "default" | "success" | "warning" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'success';
    case 'in_calibration':
      return 'warning';
    case 'out_of_service':
    case 'lost':
    case 'scrapped':
      return 'destructive';
    case 'loaned_out':
      return 'outline';
    default:
      return 'default';
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export default function GageList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGage, setSelectedGage] = useState<Gage | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<"active" | "inactive" | "due_calibration">("active");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [gageToDelete, setGageToDelete] = useState<Gage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: gages = [], isLoading, error, refetch } = useQuery<Gage[]>({
    queryKey: ['/api/manufacturing/quality/gages'],
    queryFn: fetchGages,
    refetchInterval: 5000,
    retry: 2,
  });

  const filteredGages = gages.filter(gage => {
    const status = gage.status.toLowerCase();
    
    if (currentTab === "inactive") {
      return ['out_of_service', 'lost', 'scrapped'].includes(status);
    }
    
    if (currentTab === "due_calibration") {
      return gage.isCalibrationDue;
    }
    
    // Active tab shows active and in_calibration and loaned_out gages
    return ['active', 'in_calibration', 'loaned_out'].includes(status);
  });

  const handleDelete = async () => {
    if (!gageToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/manufacturing/quality/gages/${gageToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete gage');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
      toast({
        title: "Success",
        description: "Gage deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting gage:', error);
      toast({
        title: "Error",
        description: "Failed to delete gage",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setGageToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Gage Management</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage calibrated gages and measurement tools
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
          New Gage
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="due_calibration">Due Calibration</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8 text-destructive">
                  <p>Error loading gages</p>
                </div>
              ) : filteredGages.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-8 gap-4">
                  <p className="text-muted-foreground">No gages found</p>
                  <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                    Add Gage
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Calibration</TableHead>
                      <TableHead>Next Calibration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGages.map((gage) => (
                      <TableRow key={gage.id} onClick={() => {
                        setSelectedGage(gage);
                        setShowDetailsDialog(true);
                      }} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{gage.number}</TableCell>
                        <TableCell>{gage.name}</TableCell>
                        <TableCell>{gage.type.replace('_', ' ')}</TableCell>
                        <TableCell>{gage.manufacturer}</TableCell>
                        <TableCell>{gage.location}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(gage.status)}>
                            {gage.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(gage.lastCalibrationDate)}</TableCell>
                        <TableCell>
                          <span className={gage.isCalibrationDue ? "text-destructive font-semibold" : ""}>
                            {formatDate(gage.nextCalibrationDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGage(gage);
                                setShowDetailsDialog(true);
                              }}>
                                <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGage(gage);
                                setShowCreateDialog(true);
                              }}>
                                <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {gage.status === 'active' && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGage(gage);
                                  setShowCalibrationDialog(true);
                                }}>
                                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4" />
                                  Add Calibration
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGageToDelete(gage);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GageDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedGage(null);
        }}
        initialData={selectedGage ?? undefined}
        onSuccess={async (savedGage) => {
          await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
          setShowCreateDialog(false);
          toast({
            title: "Success",
            description: selectedGage
              ? "Gage updated successfully"
              : "Gage created successfully",
          });
        }}
      />

      {selectedGage && showDetailsDialog && (
        <GageDetailsDialog
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) setSelectedGage(null);
          }}
          gage={selectedGage}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
            setShowDetailsDialog(false);
            setSelectedGage(null);
          }}
        />
      )}
      
      {selectedGage && showCalibrationDialog && (
        <GageCalibrationDialog
          open={showCalibrationDialog}
          onOpenChange={(open) => {
            setShowCalibrationDialog(open);
            if (!open) setSelectedGage(null);
          }}
          gage={selectedGage}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
            setShowCalibrationDialog(false);
            setSelectedGage(null);
            toast({
              title: "Success",
              description: "Calibration record added successfully",
            });
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the gage{" "}
              <span className="font-semibold">{gageToDelete?.number} - {gageToDelete?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}