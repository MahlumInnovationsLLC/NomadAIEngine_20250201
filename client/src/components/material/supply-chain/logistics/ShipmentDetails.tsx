import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import type { LogisticsEvent, ShipmentStatus } from "@/types/material";

interface ShipmentDetailsProps {
  shipmentId: string;
}

export function ShipmentDetails({ shipmentId }: ShipmentDetailsProps) {
  const [realTimeLocation, setRealTimeLocation] = useState<{
    latitude: number;
    longitude: number;
    lastUpdate: string;
  } | null>(null);

  const socket = useSocket();
  const { toast } = useToast();

  const { data: shipment } = useQuery<ShipmentStatus>({
    queryKey: ['/api/logistics/shipments', shipmentId],
    enabled: !!shipmentId,
  });

  const { data: events = [] } = useQuery<LogisticsEvent[]>({
    queryKey: ['/api/logistics/events', shipmentId],
    enabled: !!shipmentId,
  });

  useEffect(() => {
    if (!socket) return;

    // Subscribe to real-time location updates
    socket.emit('subscribe-shipment', shipmentId);

    socket.on('location-update', (data) => {
      setRealTimeLocation(data);
      toast({
        title: "Location Updated",
        description: `Shipment location updated at ${new Date().toLocaleTimeString()}`,
      });
    });

    return () => {
      socket.emit('unsubscribe-shipment', shipmentId);
      socket.off('location-update');
    };
  }, [socket, shipmentId, toast]);

  if (!shipment) return null;

  const getStatusColor = (status: ShipmentStatus['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'in_transit':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const formatEventType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getEventIcon = (type: LogisticsEvent['type']) => {
    switch (type) {
      case 'location_update':
        return 'location-dot';
      case 'status_change':
        return 'arrows-rotate';
      case 'delay':
        return 'clock';
      case 'delivery_attempt':
        return 'truck';
      case 'exception':
        return 'triangle-exclamation';
      default:
        return 'circle-info';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipment Tracking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge className={`mt-1 ${getStatusColor(shipment.status)}`}>
                  <FontAwesomeIcon 
                    icon={[
                      "fas",
                      shipment.status === 'delivered' ? 'check-circle' :
                      shipment.status === 'in_transit' ? 'truck' :
                      shipment.status === 'delayed' ? 'exclamation-triangle' :
                      'clock'
                    ]} 
                    className="mr-2 h-4 w-4" 
                  />
                  {shipment.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estimated Delivery</div>
                <div className="font-medium">
                  {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                  {' '}
                  {new Date(shipment.estimatedDelivery).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Carrier</div>
                <div className="font-medium">{shipment.carrier}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tracking: {shipment.trackingNumber}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Delivery Progress</div>
              <Progress value={shipment.progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm mt-1">
                <span>{shipment.origin.name}</span>
                <span>{shipment.destination.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex justify-between items-center">
                <span>Current Location</span>
                {realTimeLocation && (
                  <span className="text-sm text-muted-foreground">
                    Last update: {new Date(realTimeLocation.lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-muted-foreground">
                  {realTimeLocation ? (
                    `Location: ${realTimeLocation.latitude}, ${realTimeLocation.longitude}`
                  ) : (
                    "Waiting for location updates..."
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-4">Tracking History</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={event.id || index}>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={["fas", getEventIcon(event.type)]} 
                            className={
                              event.severity === 'critical' ? 'text-red-500' :
                              event.severity === 'warning' ? 'text-yellow-500' :
                              'text-blue-500'
                            }
                          />
                          {formatEventType(event.type)}
                        </div>
                      </TableCell>
                      <TableCell>{event.location.name}</TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell>
                        {event.severity && (
                          <Badge variant="outline" className={
                            event.severity === 'critical' ? 'border-red-500 text-red-500' :
                            event.severity === 'warning' ? 'border-yellow-500 text-yellow-500' :
                            'border-blue-500 text-blue-500'
                          }>
                            {event.severity}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}