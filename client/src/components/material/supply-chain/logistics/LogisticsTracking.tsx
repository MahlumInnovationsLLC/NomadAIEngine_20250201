import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";
import { ShipmentDetails } from "./ShipmentDetails";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import type { ShipmentStatus } from "@/types/material";

export function LogisticsTracking() {
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [alertCount, setAlertCount] = useState(0);

  const { toast } = useToast();
  const socket = useSocket();

  const { data: shipments = [], isError, refetch } = useQuery<ShipmentStatus[]>({
    queryKey: ['/api/logistics/active-shipments', statusFilter, dateRange],
    enabled: true,
  });

  useEffect(() => {
    if (!socket) return;

    // Subscribe to various shipment events
    socket.on('shipment-update', (data: ShipmentStatus) => {
      toast({
        title: `Shipment ${data.orderNumber} Updated`,
        description: `Status: ${data.status.replace('_', ' ')}`,
      });
      refetch();
    });

    socket.on('shipment-delay', (data: { shipment: ShipmentStatus; reason: string }) => {
      setAlertCount(prev => prev + 1);
      toast({
        title: "Shipment Delayed",
        description: `${data.shipment.orderNumber}: ${data.reason}`,
        variant: "destructive",
      });
      refetch();
    });

    socket.on('delivery-attempt', (data: { shipment: ShipmentStatus; status: string }) => {
      toast({
        title: "Delivery Attempt",
        description: `${data.shipment.orderNumber}: ${data.status}`,
      });
      refetch();
    });

    socket.on('weather-alert', (data: { region: string; alert: string }) => {
      setAlertCount(prev => prev + 1);
      toast({
        title: "Weather Alert",
        description: `${data.region}: ${data.alert}`,
        variant: "destructive",
      });
    });

    return () => {
      socket.off('shipment-update');
      socket.off('shipment-delay');
      socket.off('delivery-attempt');
      socket.off('weather-alert');
    };
  }, [socket, toast, refetch]);

  const filteredShipments = shipments.filter(shipment => {
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesSearch =
      shipment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.origin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const metrics = {
    totalShipments: shipments.length,
    onTimeDelivery: Math.round((shipments.filter(s => s.status !== 'delayed').length / shipments.length) * 100) || 0,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    alerts: alertCount,
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Started",
      description: "Generating shipment report...",
    });
  };

  const handleClearAlerts = () => {
    setAlertCount(0);
    toast({
      title: "Alerts Cleared",
      description: "All logistics alerts have been acknowledged.",
    });
  };

  if (isError) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-4">
          <FontAwesomeIcon icon={["fas", "triangle-exclamation"]} className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error Loading Shipments</h3>
        <p className="text-muted-foreground">
          Unable to load shipment data. Please try again later.
        </p>
        <Button onClick={() => refetch()} className="mt-4">
          <FontAwesomeIcon icon={["fas", "rotate"]} className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Logistics Dashboard</h2>
        <div className="flex gap-2">
          {alertCount > 0 && (
            <Button onClick={handleClearAlerts} variant="outline" className="gap-2">
              <FontAwesomeIcon icon={["fas", "bell"]} className="h-4 w-4" />
              Clear Alerts ({alertCount})
            </Button>
          )}
          <Button onClick={handleExport} className="gap-2">
            <FontAwesomeIcon icon={["fas", "file-export"]} className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Shipments
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  {metrics.totalShipments}
                </h3>
              </div>
              <FontAwesomeIcon icon={["fas", "boxes-stacked"]} className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  On-Time Delivery
                </p>
                <h3 className="text-2xl font-bold mt-2 text-green-500">
                  {metrics.onTimeDelivery}%
                </h3>
              </div>
              <FontAwesomeIcon icon={["fas", "clock"]} className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Transit
                </p>
                <h3 className="text-2xl font-bold mt-2 text-blue-500">
                  {metrics.inTransit}
                </h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Delayed
                </p>
                <h3 className="text-2xl font-bold mt-2 text-red-500">
                  {metrics.delayed}
                </h3>
              </div>
              <FontAwesomeIcon icon={["fas", "triangle-exclamation"]} className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Delivered
                </p>
                <h3 className="text-2xl font-bold mt-2 text-green-500">
                  {metrics.delivered}
                </h3>
              </div>
              <FontAwesomeIcon icon={["fas", "check-circle"]} className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Alerts
                </p>
                <h3 className="text-2xl font-bold mt-2 text-yellow-500">
                  {metrics.alerts}
                </h3>
              </div>
              <FontAwesomeIcon icon={["fas", "bell"]} className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Shipments</CardTitle>
            <div className="flex gap-4">
              <Input
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[250px]"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedShipment(shipment.id)}
                >
                  <TableCell>
                    <div className="font-medium">{shipment.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">{shipment.trackingNumber}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      shipment.status === 'delivered' ? 'bg-green-500' :
                        shipment.status === 'in_transit' ? 'bg-blue-500' :
                          shipment.status === 'delayed' ? 'bg-red-500' :
                            'bg-yellow-500'
                    }>
                      <FontAwesomeIcon
                        icon={[
                          "fas",
                          shipment.status === 'delivered' ? 'check-circle' :
                            shipment.status === 'in_transit' ? 'truck' :
                              shipment.status === 'delayed' ? 'exclamation-triangle' :
                                'clock'
                        ]}
                        className="mr-1 h-3 w-3"
                      />
                      {shipment.status.replace('_', ' ')}
                      {shipment.delayReason && (
                        <span className="ml-2 text-xs">({shipment.delayReason})</span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{shipment.origin.name}</TableCell>
                  <TableCell>{shipment.destination.name}</TableCell>
                  <TableCell>{shipment.carrier}</TableCell>
                  <TableCell>
                    <div>{new Date(shipment.estimatedDelivery).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(shipment.estimatedDelivery).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[100px]">
                      <Progress value={shipment.progressPercentage} className="h-2" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedShipment && (
        <ShipmentDetails shipmentId={selectedShipment} />
      )}
    </div>
  );
}