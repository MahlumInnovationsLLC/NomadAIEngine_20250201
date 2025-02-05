```typescript
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { BillOfMaterials, BOMComponent, Material } from "@/types/manufacturing";

interface BOMManagementProps {
  productId: string;
}

export function BOMManagement({ productId }: BOMManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterials | null>(null);

  const { data: bom, isLoading } = useQuery<BillOfMaterials>({
    queryKey: [`/api/manufacturing/bom/${productId}`],
    enabled: !!productId,
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/material/inventory'],
    enabled: true,
  });

  const updateBOMMutation = useMutation({
    mutationFn: async (updates: Partial<BillOfMaterials>) => {
      const response = await fetch(`/api/manufacturing/bom/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update BOM');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manufacturing/bom/${productId}`] });
      toast({
        title: "Success",
        description: "Bill of Materials updated successfully.",
      });
    },
  });

  if (isLoading) {
    return <div>Loading BOM data...</div>;
  }

  const getTotalCost = (components: BOMComponent[]) => {
    return components.reduce((acc, component) => acc + component.totalCost, 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Bill of Materials</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowVersionHistory(true)}
          >
            <FontAwesomeIcon icon="history" className="mr-2" />
            Version History
          </Button>
          <Button onClick={() => setShowAddComponent(true)}>
            <FontAwesomeIcon icon="plus" className="mr-2" />
            Add Component
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Version: {bom?.version}</p>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(bom?.lastUpdated || '').toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className={
              bom?.status === 'active' ? 'bg-green-500/10 text-green-500' :
              bom?.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-red-500/10 text-red-500'
            }>
              {bom?.status}
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Critical</TableHead>
                <TableHead>Substitutes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bom?.components.map((component) => {
                const material = materials.find(m => m.id === component.materialId);
                return (
                  <TableRow key={component.materialId}>
                    <TableCell>{material?.name || component.materialId}</TableCell>
                    <TableCell>{component.quantity}</TableCell>
                    <TableCell>${component.unitCost.toFixed(2)}</TableCell>
                    <TableCell>${component.totalCost.toFixed(2)}</TableCell>
                    <TableCell>{component.leadTime} days</TableCell>
                    <TableCell>
                      {component.critical ? (
                        <Badge className="bg-red-500">Critical</Badge>
                      ) : (
                        <Badge className="bg-gray-500">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {component.substitutes?.map((subId) => {
                        const sub = materials.find(m => m.id === subId);
                        return (
                          <Badge key={subId} variant="outline" className="mr-1">
                            {sub?.name || subId}
                          </Badge>
                        );
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="trash" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Total Components: {bom?.components.length || 0}
            </div>
            <div className="text-lg font-semibold">
              Total Cost: ${getTotalCost(bom?.components || []).toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```
