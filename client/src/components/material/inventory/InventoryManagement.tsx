import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Material, Warehouse, MaterialStats } from "@/types/material";
import { MaterialDetailsDialog } from "./MaterialDetailsDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { MaterialAllocationDialog } from "./MaterialAllocationDialog";

interface InventoryManagementProps {
  selectedWarehouse: string | null;
  onWarehouseChange: (warehouseId: string | null) => void;
}

export function InventoryManagement({
  selectedWarehouse,
  onWarehouseChange,
}: InventoryManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [filterABCClass, setFilterABCClass] = useState<'A' | 'B' | 'C' | null>(null);

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/material/inventory', selectedWarehouse],
    enabled: true,
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['/api/material/warehouses'],
    enabled: true,
  });

  const { data: stats } = useQuery<MaterialStats>({
    queryKey: ['/api/material/stats'],
    enabled: true,
  });

  const filteredMaterials = materials.filter(material =>
    (material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterABCClass || material.abcClass === filterABCClass)
  );

  const getStockStatusColor = (material: Material) => {
    const stockLevel = material.currentStock;
    if (stockLevel <= material.minimumStock) return "bg-red-500";
    if (stockLevel <= material.reorderPoint) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getABCClassBadge = (abcClass?: 'A' | 'B' | 'C') => {
    switch (abcClass) {
      case 'A': return <Badge className="bg-blue-500">Class A</Badge>;
      case 'B': return <Badge className="bg-green-500">Class B</Badge>;
      case 'C': return <Badge className="bg-yellow-500">Class C</Badge>;
      default: return <Badge className="bg-gray-500">Unclassified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6">
        <div className="container">
          <h1 className="text-3xl font-bold mb-4">Material Handling & Supply Chain</h1>
          <p className="text-muted-foreground mb-6">
            Comprehensive inventory management and supply chain optimization system
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <h3 className="text-2xl font-bold">{stats?.totalItems || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="box" className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                    <h3 className="text-2xl font-bold">{stats?.activeOrders || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="truck-fast" className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <h3 className="text-2xl font-bold">{stats?.lowStockItems || 0}</h3>
                  </div>
                  <FontAwesomeIcon icon="triangle-exclamation" className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Warehouse Usage</p>
                    <h3 className="text-2xl font-bold">{stats?.warehouseCapacity || 0}%</h3>
                  </div>
                  <FontAwesomeIcon icon="warehouse" className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FontAwesomeIcon icon="warehouse" className="mr-2" />
                  {selectedWarehouse ?
                    warehouses.find(w => w.id === selectedWarehouse)?.name :
                    "All Warehouses"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onWarehouseChange(null)}>
                  All Warehouses
                </DropdownMenuItem>
                {warehouses.map((warehouse) => (
                  <DropdownMenuItem
                    key={warehouse.id}
                    onClick={() => onWarehouseChange(warehouse.id)}
                  >
                    {warehouse.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FontAwesomeIcon icon="filter" className="mr-2" />
                  {filterABCClass ? `Class ${filterABCClass}` : "ABC Class"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterABCClass(null)}>
                  All Classes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterABCClass('A')}>Class A</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterABCClass('B')}>Class B</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterABCClass('C')}>Class C</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStockAdjustment(true)}>
              <FontAwesomeIcon icon="balance-scale" className="mr-2" />
              Stock Adjustment
            </Button>
            <Button variant="outline" onClick={() => setShowAllocation(true)}>
              <FontAwesomeIcon icon="tasks" className="mr-2" />
              Material Allocation
            </Button>
            <Button>
              <FontAwesomeIcon icon="plus" className="mr-2" />
              Add Material
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>ABC Class</TableHead>
                  <TableHead>Bin Location</TableHead>
                  <TableHead>Batch/Serial</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.sku}</TableCell>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>{getABCClassBadge(material.abcClass)}</TableCell>
                    <TableCell>{material.binLocation || "-"}</TableCell>
                    <TableCell>
                      {material.batchNumber || material.serialNumber ? (
                        <div className="flex flex-col">
                          {material.batchNumber && <span>Batch: {material.batchNumber}</span>}
                          {material.serialNumber && <span>Serial: {material.serialNumber}</span>}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {material.currentStock} {material.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {material.allocatedStock} {material.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {material.availableStock} {material.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${getStockStatusColor(
                            material
                          )}`}
                        />
                        {material.currentStock <= material.minimumStock
                          ? "Low Stock"
                          : material.currentStock <= material.reorderPoint
                          ? "Reorder Soon"
                          : "In Stock"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedMaterial(material)}
                        >
                          <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowAllocation(true)}
                        >
                          <FontAwesomeIcon icon="tasks" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="history" className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedMaterial && (
          <MaterialDetailsDialog
            material={selectedMaterial}
            open={!!selectedMaterial}
            onOpenChange={(open) => !open && setSelectedMaterial(null)}
          />
        )}

        <StockAdjustmentDialog
          open={showStockAdjustment}
          onOpenChange={setShowStockAdjustment}
          materials={materials}
          warehouses={warehouses}
        />

        <MaterialAllocationDialog
          open={showAllocation}
          onOpenChange={setShowAllocation}
          materials={materials}
          warehouses={warehouses}
        />
      </div>
    </div>
  );
}