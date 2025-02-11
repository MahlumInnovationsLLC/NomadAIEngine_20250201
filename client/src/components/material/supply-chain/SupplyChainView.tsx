import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { SupplyChainMetrics, PurchaseOrder, Supplier, ForecastingData } from "@/types/material";
import { SupplierDetails } from "./SupplierDetails";

interface SupplyChainViewProps {
  metrics?: SupplyChainMetrics;
}

export function SupplyChainView({ metrics }: SupplyChainViewProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { data: orders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['/api/material/purchase-orders'],
    enabled: true,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/material/suppliers'],
    enabled: true,
  });

  const { data: forecasts = [] } = useQuery<ForecastingData[]>({
    queryKey: ['/api/material/forecasts'],
    enabled: true,
  });

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const colors: Record<PurchaseOrder['status'], string> = {
      draft: "bg-gray-500",
      submitted: "bg-blue-500",
      confirmed: "bg-purple-500",
      in_transit: "bg-yellow-500",
      received: "bg-green-500",
      cancelled: "bg-red-500"
    };
    return <Badge className={colors[status]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold">{metrics?.activeOrders || 0}</p>
                  </div>
                  <FontAwesomeIcon icon="truck-fast" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Health Score</p>
                    <p className="text-2xl font-bold">{metrics?.healthScore || 0}%</p>
                  </div>
                  <FontAwesomeIcon icon="heart-pulse" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">On-Time Delivery</p>
                    <p className="text-2xl font-bold">{metrics?.onTimeDelivery || 0}%</p>
                  </div>
                  <FontAwesomeIcon icon="clock-rotate-left" className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Index</p>
                    <p className="text-2xl font-bold">{metrics?.riskIndex || 0}</p>
                  </div>
                  <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Inventory Accuracy</span>
                      <span className="text-sm font-medium">{metrics?.inventoryAccuracy || 0}%</span>
                    </div>
                    <Progress value={metrics?.inventoryAccuracy || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Supplier Performance</span>
                      <span className="text-sm font-medium">{metrics?.supplierPerformance || 0}%</span>
                    </div>
                    <Progress value={metrics?.supplierPerformance || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Warehouse Utilization</span>
                      <span className="text-sm font-medium">{metrics?.warehouseUtilization || 0}%</span>
                    </div>
                    <Progress value={metrics?.warehouseUtilization || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transportation Costs</span>
                    <span className="text-sm font-medium">${metrics?.transportationCosts?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Inventory Value</span>
                    <span className="text-sm font-medium">${metrics?.totalInventoryValue?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inventory Turnover</span>
                    <span className="text-sm font-medium">{metrics?.inventoryTurnover || 0}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Orders</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <FontAwesomeIcon icon="plus" className="h-4 w-4" />
                New Order
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const supplier = suppliers.find(s => s.id === order.supplierId);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{supplier?.name || order.supplierId}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell className="text-right">
                          {order.currency} {order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Supplier Management</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <FontAwesomeIcon icon="plus" className="h-4 w-4" />
                Add Supplier
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Performance Score</TableHead>
                    <TableHead>On-Time Delivery</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Active Orders</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow 
                      key={supplier.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSupplierId(supplier.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <FontAwesomeIcon
                            icon="building"
                            className="h-8 w-8 text-muted-foreground"
                          />
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">{supplier.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress
                            value={supplier.performanceMetrics.qualityScore}
                            className="h-2"
                          />
                          <span className="text-sm font-medium">
                            {supplier.performanceMetrics.qualityScore}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          supplier.performanceMetrics.onTimeDelivery >= 90
                            ? "bg-green-500"
                            : supplier.performanceMetrics.onTimeDelivery >= 75
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }>
                          {supplier.performanceMetrics.onTimeDelivery}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          supplier.qualityScore >= 90
                            ? "bg-green-500/10 text-green-500"
                            : supplier.qualityScore >= 75
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                        }>
                          {supplier.qualityScore}/100
                        </Badge>
                      </TableCell>
                      <TableCell>{supplier.activeOrders}</TableCell>
                      <TableCell>
                        {supplier.performanceMetrics.responseTime}h avg.
                      </TableCell>
                      <TableCell>
                        <Badge className={supplier.preferredSupplier ? "bg-blue-500" : "bg-gray-500"}>
                          {supplier.preferredSupplier ? "Preferred" : "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FontAwesomeIcon icon="chart-line" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Supply Chain Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Inventory Turnover</span>
                        <span className="text-sm font-medium">{metrics?.inventoryTurnover || 0}x</span>
                      </div>
                      <Progress value={(metrics?.inventoryTurnover || 0) * 10} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Stockout Rate</span>
                        <span className="text-sm font-medium">{metrics?.stockoutRate || 0}%</span>
                      </div>
                      <Progress value={metrics?.stockoutRate || 0} className="bg-red-100" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Cross-docking Rate</span>
                        <span className="text-sm font-medium">{metrics?.crossDockingRate || 0}%</span>
                      </div>
                      <Progress value={metrics?.crossDockingRate || 0} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Return Rate</span>
                        <span className="text-sm font-medium">{metrics?.returnRate || 0}%</span>
                      </div>
                      <Progress value={metrics?.returnRate || 0} className="bg-yellow-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Cycle Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Order Cycle</span>
                      <span className="text-sm font-medium">{metrics?.averageOrderCycle || 0} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Backorder Rate</span>
                      <span className="text-sm font-medium">{metrics?.backorderRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">On-Time Delivery Rate</span>
                      <span className="text-sm font-medium">{metrics?.onTimeDelivery || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Perfect Order Rate</span>
                      <span className="text-sm font-medium">
                        {((metrics?.onTimeDelivery || 0) * (100 - (metrics?.returnRate || 0)) / 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Transportation</div>
                    <div className="text-2xl font-bold">
                      ${metrics?.transportationCosts?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Inventory Holding</div>
                    <div className="text-2xl font-bold">
                      ${(metrics?.totalInventoryValue || 0) * 0.2}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Order Processing</div>
                    <div className="text-2xl font-bold">
                      ${((metrics?.activeOrders || 0) * 250).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Supply Chain Cost</div>
                    <div className="text-2xl font-bold text-primary">
                      ${(
                        (metrics?.transportationCosts || 0) +
                        ((metrics?.totalInventoryValue || 0) * 0.2) +
                        ((metrics?.activeOrders || 0) * 250)
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Demand Forecasting</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Forecasted Demand</TableHead>
                        <TableHead>Actual Demand</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecasts.map((forecast) => (
                        <TableRow key={`${forecast.materialId}-${forecast.period}`}>
                          <TableCell>{forecast.materialId}</TableCell>
                          <TableCell>{forecast.period}</TableCell>
                          <TableCell>{forecast.forecastedDemand}</TableCell>
                          <TableCell>{forecast.actualDemand || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={forecast.confidence} className="h-2" />
                              <span className="text-sm font-medium">{forecast.confidence}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecasts.map((forecast) => (
                      <div key={`${forecast.materialId}-${forecast.period}-factors`} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Seasonal Factor</span>
                          <span className="text-sm font-medium">{forecast.factors.seasonal}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Trend Factor</span>
                          <span className="text-sm font-medium">{forecast.factors.trend}x</span>
                        </div>
                        {forecast.factors.special_events && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {forecast.factors.special_events.map((event) => (
                              <Badge key={event} variant="outline">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Suggested Reorder Points</p>
                          <p className="text-2xl font-bold">15</p>
                        </div>
                        <FontAwesomeIcon icon="cart-plus" className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Safety Stock Updates</p>
                          <p className="text-2xl font-bold">8</p>
                        </div>
                        <FontAwesomeIcon icon="shield-check" className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Risk Alerts</p>
                          <p className="text-2xl font-bold">3</p>
                        </div>
                        <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={!!selectedSupplierId} onOpenChange={() => setSelectedSupplierId(null)}>
        <DialogContent className="max-w-4xl">
          {selectedSupplierId && (
            <SupplierDetails
              supplierId={selectedSupplierId}
              onClose={() => setSelectedSupplierId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}