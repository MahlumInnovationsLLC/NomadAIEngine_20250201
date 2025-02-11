import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { SupplierCommunication } from "./communication/SupplierCommunication";
import { SupplierScorecard } from "./performance/SupplierScorecard";
import { LogisticsTracking } from "./logistics/LogisticsTracking";
import type { Supplier, PurchaseOrder } from "@/types/material";

interface SupplierDetailsProps {
  supplierId: string;
  onClose: () => void;
}

export function SupplierDetails({ supplierId, onClose }: SupplierDetailsProps) {
  const { data: supplier } = useQuery<Supplier>({
    queryKey: ['/api/material/suppliers', supplierId],
    enabled: !!supplierId,
  });

  const { data: orders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['/api/material/purchase-orders', { supplierId }],
    enabled: !!supplierId,
  });

  if (!supplier) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{supplier.name}</h2>
          <p className="text-sm text-muted-foreground">{supplier.code}</p>
        </div>
        <div className="flex gap-2">
          {supplier.preferredSupplier && (
            <Badge variant="default" className="bg-green-500">
              <FontAwesomeIcon icon={["fas", "star"]} className="mr-1 h-4 w-4" />
              Preferred Supplier
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FontAwesomeIcon icon={["fas", "xmark"]} className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Primary Contact</div>
                    <div>{supplier.contact.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{supplier.contact.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div>{supplier.contact.phone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>{supplier.address.street}</div>
                  <div>{supplier.address.city}, {supplier.address.state}</div>
                  <div>{supplier.address.country} {supplier.address.zipCode}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Terms</div>
                    <div>{supplier.contractTerms?.paymentTerms}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Delivery Terms</div>
                    <div>{supplier.contractTerms?.deliveryTerms}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Min. Order Quantity</div>
                    <div>{supplier.contractTerms?.minimumOrderQuantity}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {supplier.certifications && supplier.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {supplier.certifications.map((cert) => (
                    <Badge key={cert} variant="outline">{cert}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scorecard" className="space-y-4">
          <SupplierScorecard supplierId={supplierId} />
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.status === 'received'
                            ? "bg-green-500"
                            : order.status === 'in_transit'
                            ? "bg-yellow-500"
                            : order.status === 'cancelled'
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell>
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {order.actualDeliveryDate
                          ? new Date(order.actualDeliveryDate).toLocaleDateString()
                          : new Date(order.expectedDeliveryDate).toLocaleDateString() + ' (Expected)'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon={["fas", "eye"]} className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics">
          <LogisticsTracking />
        </TabsContent>

        <TabsContent value="communication">
          <SupplierCommunication supplierId={supplierId} />
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Directory</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <FontAwesomeIcon icon={["fas", "plus"]} className="h-4 w-4" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <FontAwesomeIcon icon={["fas", "user-circle"]} className="h-10 w-10 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{supplier.contact.name}</div>
                    <div className="text-sm text-muted-foreground">Primary Contact</div>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm">
                        <FontAwesomeIcon icon={["fas", "envelope"]} className="h-4 w-4 mr-2" />
                        {supplier.contact.email}
                      </div>
                      <div className="text-sm">
                        <FontAwesomeIcon icon={["fas", "phone"]} className="h-4 w-4 mr-2" />
                        {supplier.contact.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <FontAwesomeIcon icon={["fas", "envelope"]} className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FontAwesomeIcon icon={["fas", "phone"]} className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FontAwesomeIcon icon={["fas", "message"]} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}