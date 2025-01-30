import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductionBay, ProductionOrder } from "@/types/manufacturing";

interface BaySchedulerProps {
  bays: ProductionBay[];
  orders: ProductionOrder[];
  onAssign?: (orderId: string, bayId: string) => void;
}

export function BayScheduler({ bays, orders, onAssign }: BaySchedulerProps) {
  const queryClient = useQueryClient();

  const assignOrderMutation = useMutation({
    mutationFn: async ({ orderId, bayId }: { orderId: string; bayId: string }) => {
      const response = await fetch(`/api/manufacturing/orders/${orderId}/assign-bay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bayId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign order to bay');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/bays'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/orders'] });
    },
  });

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destinationId = result.destination.droppableId;
    const orderId = result.draggableId;

    if (sourceId === 'unassigned' && destinationId.startsWith('bay-')) {
      const bayId = destinationId.replace('bay-', '');
      await assignOrderMutation.mutateAsync({ orderId, bayId });
      onAssign?.(orderId, bayId);
    }
  };

  const unassignedOrders = orders.filter(order => !order.assignedBay);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon="inbox" className="h-4 w-4" />
              Unassigned Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="unassigned">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2 min-h-[200px]"
                >
                  {unassignedOrders.map((order, index) => (
                    <Draggable
                      key={order.id}
                      draggableId={order.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            p-4 rounded-lg border bg-card
                            ${snapshot.isDragging ? 'shadow-lg' : ''}
                          `}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{order.productName}</span>
                            <Badge variant="outline" className={
                              order.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                              order.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                              order.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-green-500/10 text-green-500'
                            }>
                              {order.priority}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Order #{order.orderNumber}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{order.progress}%</span>
                            </div>
                            <Progress value={order.progress} className="h-2" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {bays.map((bay) => (
            <Card key={bay.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{bay.name}</span>
                  <Badge variant="outline" className={
                    bay.status === 'available' ? 'bg-green-500/10 text-green-500' :
                    bay.status === 'maintenance' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }>
                    {bay.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={`bay-${bay.id}`}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[100px]"
                    >
                      {bay.currentOrder && (
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{bay.currentOrder.productName}</span>
                            <Badge variant="outline" className={
                              bay.currentOrder.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                              bay.currentOrder.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                              bay.currentOrder.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-green-500/10 text-green-500'
                            }>
                              {bay.currentOrder.priority}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Order #{bay.currentOrder.orderNumber}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{bay.currentOrder.progress}%</span>
                            </div>
                            <Progress value={bay.currentOrder.progress} className="h-2" />
                          </div>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
