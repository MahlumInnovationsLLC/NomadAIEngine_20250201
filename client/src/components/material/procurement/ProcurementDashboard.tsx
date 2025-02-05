import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { DataTable } from "@/components/ui/data-table";
import type { PurchaseOrder, Supplier, Material } from "@/types/material";
import { PurchaseOrderDialog } from "./PurchaseOrderDialog";
import { SupplierManagementDialog } from "./SupplierManagementDialog";

export function ProcurementDashboard() {
  const [purchaseOrderDialogOpen, setPurchaseOrderDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>();

  const { data: purchaseOrders } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/material/purchase-orders"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/material/suppliers"],
  });

  const { data: materials } = useQuery<Material[]>({
    queryKey: ["/api/material/inventory"],
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Procurement Dashboard</h2>
          <p className="text-muted-foreground">
            Manage purchase orders and supplier relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSupplier(undefined);
              setSupplierDialogOpen(true);
            }}
          >
            <FontAwesomeIcon icon="building" className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
          <Button onClick={() => setPurchaseOrderDialogOpen(true)}>
            <FontAwesomeIcon icon="file-invoice" className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders?.filter(po => 
                ['submitted', 'confirmed', 'in_transit'].includes(po.status)
              ).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders?.filter(po => po.status === 'in_transit').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<PurchaseOrder>
            columns={[
              {
                accessorKey: 'orderNumber',
                header: 'Order Number',
              },
              {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <span className={`capitalize ${
                    row.original.status === 'confirmed' ? 'text-green-600' :
                    row.original.status === 'in_transit' ? 'text-blue-600' :
                    'text-muted-foreground'
                  }`}>
                    {row.original.status.replace('_', ' ')}
                  </span>
                ),
              },
              {
                accessorKey: 'totalAmount',
                header: 'Total Amount',
                cell: ({ row }) => (
                  <span>${row.original.totalAmount.toFixed(2)}</span>
                ),
              },
              {
                accessorKey: 'expectedDeliveryDate',
                header: 'Expected Delivery',
                cell: ({ row }) => (
                  <span>
                    {new Date(row.original.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            data={purchaseOrders || []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Supplier>
            columns={[
              {
                accessorKey: 'name',
                header: 'Supplier Name',
              },
              {
                accessorKey: 'code',
                header: 'Code',
              },
              {
                accessorKey: 'contact.email',
                header: 'Contact Email',
              },
              {
                accessorKey: 'rating',
                header: 'Rating',
                cell: ({ row }) => (
                  <span className={`${
                    row.original.rating >= 4 ? 'text-green-600' :
                    row.original.rating >= 3 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {row.original.rating} / 5
                  </span>
                ),
              },
              {
                id: 'actions',
                cell: ({ row }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSupplier(row.original);
                      setSupplierDialogOpen(true);
                    }}
                  >
                    <FontAwesomeIcon icon="pencil" className="h-4 w-4" />
                  </Button>
                ),
              },
            ]}
            data={suppliers || []}
          />
        </CardContent>
      </Card>

      {suppliers && materials && (
        <PurchaseOrderDialog
          open={purchaseOrderDialogOpen}
          onOpenChange={setPurchaseOrderDialogOpen}
          suppliers={suppliers}
          materials={materials}
        />
      )}

      <SupplierManagementDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={selectedSupplier}
      />
    </div>
  );
}