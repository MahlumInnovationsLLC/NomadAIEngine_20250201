import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faFile, 
  faCalendarAlt, 
  faTools, 
  faClipboardCheck,
  faUserAlt,
  faBuilding,
  faRuler,
  faCheck,
  faTimes,
  faSignOut,
  faSpinner
} from '@fortawesome/pro-light-svg-icons';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Gage, CalibrationRecord } from "@/types/manufacturing/gage";
import { GageDialog } from "./GageDialog";
import { GageCalibrationDialog } from "./GageCalibrationDialog";
import { format } from "date-fns";

interface GageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gage: Gage;
  onSuccess: () => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
}

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

function getCalibrationResultBadgeVariant(result: string): "default" | "success" | "warning" | "destructive" {
  switch (result) {
    case 'pass':
      return 'success';
    case 'conditional':
      return 'warning';
    case 'fail':
      return 'destructive';
    default:
      return 'default';
  }
}

export function GageDetailsDialog({ open, onOpenChange, gage, onSuccess }: GageDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckOut = async (userId: string) => {
    setIsCheckingOut(true);
    try {
      const response = await fetch(`/api/manufacturing/quality/gages/${gage.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to check out gage');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
      toast({
        title: "Success",
        description: "Gage checked out successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error checking out gage:', error);
      toast({
        title: "Error",
        description: "Failed to check out gage",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const response = await fetch(`/api/manufacturing/quality/gages/${gage.id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check in gage');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
      toast({
        title: "Success",
        description: "Gage checked in successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error checking in gage:', error);
      toast({
        title: "Error",
        description: "Failed to check in gage",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold">{gage.name || `Gage #${gage.number}`}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Gage #{gage.number}</span>
                  <span>•</span>
                  <span>SN: {gage.serialNumber}</span>
                  <span>•</span>
                  <Badge variant={getStatusBadgeVariant(gage.status)}>{gage.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
                  Edit Gage
                </Button>
                {gage.status === 'active' && (
                  gage.checkedOutTo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                    >
                      {isCheckingIn ? (
                        <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faSignOut} className="mr-2 h-4 w-4" />
                      )}
                      Check In
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckOut('current-user')}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faUserAlt} className="mr-2 h-4 w-4" />
                      )}
                      Check Out
                    </Button>
                  )
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="general">
                <FontAwesomeIcon icon={faFile} className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="calibration">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4" />
                Calibration
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <FontAwesomeIcon icon={faTools} className="mr-2 h-4 w-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="checkout">
                <FontAwesomeIcon icon={faUserAlt} className="mr-2 h-4 w-4" />
                Checkout History
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 p-4">
              <TabsContent value="general" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Gage Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="col-span-2 font-medium">{gage.type.replace('_', ' ')}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Manufacturer:</span>
                          <span className="col-span-2 font-medium">{gage.manufacturer}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="col-span-2 font-medium">{gage.model || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Serial Number:</span>
                          <span className="col-span-2 font-medium">{gage.serialNumber}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="col-span-2 font-medium">{gage.location}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Department:</span>
                          <span className="col-span-2 font-medium">{gage.department || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Technical Specifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Range:</span>
                          <span className="col-span-2 font-medium">{gage.range || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Resolution:</span>
                          <span className="col-span-2 font-medium">{gage.resolution || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Accuracy:</span>
                          <span className="col-span-2 font-medium">{gage.accuracy || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">Traceability:</span>
                          <span className="col-span-2 font-medium">{gage.traceabilityNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{gage.description || 'No description provided'}</p>
                  </CardContent>
                </Card>

                {gage.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{gage.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="calibration" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Calibration Records</h3>
                    <p className="text-sm text-muted-foreground">
                      Calibration frequency: {gage.calibrationFrequency} days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCalibrationDialog(true)}
                      disabled={!['active', 'in_calibration'].includes(gage.status)}
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4" />
                      Add Calibration Record
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">Calibration Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Last Calibration:</span>
                          <span className="font-medium">{formatDate(gage.lastCalibrationDate)}</span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Next Calibration:</span>
                          <span className={`font-medium ${gage.isCalibrationDue ? 'text-destructive' : ''}`}>
                            {formatDate(gage.nextCalibrationDate)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Calibration Due:</span>
                          <span>
                            {gage.isCalibrationDue ? (
                              <Badge variant="destructive">Due</Badge>
                            ) : (
                              <Badge variant="success">Current</Badge>
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Provider:</span>
                          <span className="font-medium">{gage.calibrationProvider || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {gage.calibrationRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Certification</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gage.calibrationRecords
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record: CalibrationRecord) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{record.performedBy}</TableCell>
                            <TableCell>
                              <Badge variant={getCalibrationResultBadgeVariant(record.result)}>
                                {record.result}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(record.nextCalibrationDate)}</TableCell>
                            <TableCell>{record.certificationNumber || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {record.notes || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      <p>No calibration records found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="maintenance" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Maintenance Records</h3>
                    <p className="text-sm text-muted-foreground">
                      History of maintenance activities
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      disabled={!['active', 'in_calibration'].includes(gage.status)}
                    >
                      <FontAwesomeIcon icon={faTools} className="mr-2 h-4 w-4" />
                      Add Maintenance Record
                    </Button>
                  </div>
                </div>

                {gage.maintenanceRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gage.maintenanceRecords
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{record.type.replace('_', ' ')}</TableCell>
                            <TableCell>{record.performedBy}</TableCell>
                            <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                            <TableCell>
                              <Badge variant={record.result === 'completed' ? 'success' : 'warning'}>
                                {record.result.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      <p>No maintenance records found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="checkout" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Checkout History</h3>
                    <p className="text-sm text-muted-foreground">
                      Record of gage checkouts and returns
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Current Status:</span>
                          <span>
                            <Badge variant={gage.checkedOutTo ? 'warning' : 'success'}>
                              {gage.checkedOutTo ? 'Checked Out' : 'Available'}
                            </Badge>
                          </span>
                        </div>
                        {gage.checkedOutTo && (
                          <>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-muted-foreground">Checked Out To:</span>
                              <span className="font-medium">{gage.checkedOutTo}</span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-muted-foreground">Checked Out Date:</span>
                              <span className="font-medium">{formatDate(gage.checkedOutDate)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {gage.checkoutHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Checkout Date</TableHead>
                        <TableHead>Return Date</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gage.checkoutHistory
                        .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime())
                        .map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{record.user}</TableCell>
                            <TableCell>{formatDate(record.checkoutDate)}</TableCell>
                            <TableCell>{record.returnDate ? formatDate(record.returnDate) : 'N/A'}</TableCell>
                            <TableCell>{record.condition || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {record.notes || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      <p>No checkout history found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <GageDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          initialData={gage}
          onSuccess={async (savedGage) => {
            await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
            setShowEditDialog(false);
            onSuccess();
          }}
        />
      )}

      {showCalibrationDialog && (
        <GageCalibrationDialog
          open={showCalibrationDialog}
          onOpenChange={setShowCalibrationDialog}
          gageId={gage.id}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/quality/gages'] });
            setShowCalibrationDialog(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
}