import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  onOrder: number;
  location: string;
}

export default function PartsInventoryManager() {
  const [view, setView] = useState<'inventory' | 'orders' | 'suppliers'>('inventory');

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/maintenance/inventory'],
    enabled: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Parts & Inventory Management</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'plus']} className="h-4 w-4" />
              Add Item
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'cart-shopping']} className="h-4 w-4" />
              Purchase Order
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Items</div>
                <div className="text-2xl font-bold">{inventory.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Low Stock Items</div>
                <div className="text-2xl font-bold text-yellow-500">
                  {inventory.filter(item => item.quantity <= item.minQuantity).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Out of Stock</div>
                <div className="text-2xl font-bold text-red-500">
                  {inventory.filter(item => item.quantity === 0).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">On Order</div>
                <div className="text-2xl font-bold text-blue-500">
                  {inventory.filter(item => item.onOrder > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.partNumber}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.quantity} / {item.maxQuantity}</span>
                        <span className="text-muted-foreground">{Math.round((item.quantity / item.maxQuantity) * 100)}%</span>
                      </div>
                      <Progress value={(item.quantity / item.maxQuantity) * 100} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        item.quantity === 0
                          ? 'bg-red-500/10 text-red-500'
                          : item.quantity <= item.minQuantity
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-green-500/10 text-green-500'
                      }
                    >
                      {item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.minQuantity ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'edit']} className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'history']} className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'cart-plus']} className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}