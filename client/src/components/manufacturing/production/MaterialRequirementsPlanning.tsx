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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Material,
  ProductionOrder,
  MaterialAllocation,
  ProductionProject
} from "@/types/manufacturing";
import { getAllProjects } from "@/lib/azure/project-service";

interface MaterialRequirementsPlanningProps {
  productionLineId: string;
}

export function MaterialRequirementsPlanning({ productionLineId }: MaterialRequirementsPlanningProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useQuery<ProductionProject[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: getAllProjects,
  });

  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: [`/api/manufacturing/orders/${productionLineId}`, selectedProject],
    enabled: !!productionLineId && !!selectedProject,
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/material/inventory'],
    enabled: true,
  });

  const { data: allocations = [] } = useQuery<MaterialAllocation[]>({
    queryKey: [`/api/manufacturing/allocations/${productionLineId}`, selectedProject],
    enabled: !!productionLineId && !!selectedProject,
  });

  if (projectsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Failed to load projects. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedProject) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Project for MRP</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a project to view its material requirements planning
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingProjects ? (
              <div>Loading projects...</div>
            ) : (
              <Select
                onValueChange={(value) => setSelectedProject(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.projectNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateRequiredMaterials = (orders: ProductionOrder[]) => {
    const requirements: Record<string, {
      materialId: string;
      required: number;
      available: number;
      shortage: number;
      leadTime: number;
      nextDelivery?: string;
      status: 'ok' | 'warning' | 'critical';
    }> = {};

    orders.forEach(order => {
      if (order.materials) {
        order.materials.forEach(material => {
          if (!requirements[material.materialId]) {
            const materialData = materials.find(m => m.id === material.materialId);
            const allocated = allocations.filter(a => a.materialId === material.materialId);

            requirements[material.materialId] = {
              materialId: material.materialId,
              required: material.requiredQuantity,
              available: materialData?.availableStock || 0,
              shortage: 0,
              leadTime: materialData?.leadTime || 0,
              status: 'ok'
            };
          } else {
            requirements[material.materialId].required += material.requiredQuantity;
          }
        });
      }
    });

    // Calculate shortages and status
    Object.values(requirements).forEach(req => {
      req.shortage = Math.max(0, req.required - req.available);

      const material = materials.find(m => m.id === req.materialId);
      if (!material) return;

      if (req.shortage > 0) {
        if (req.shortage > (material.safetyStock || 0)) {
          req.status = 'critical';
        } else {
          req.status = 'warning';
        }
      }
    });

    return Object.values(requirements);
  };

  const requirements = calculateRequiredMaterials(productionOrders);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Material Requirements Planning</h2>
          <p className="text-sm text-muted-foreground">
            Project: {projects.find(p => p.id === selectedProject)?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeframe('week')}
          >
            This Week
          </Button>
          <Button
            variant={timeframe === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeframe('month')}
          >
            This Month
          </Button>
          <Button
            variant={timeframe === 'quarter' ? 'default' : 'outline'}
            onClick={() => setTimeframe('quarter')}
          >
            This Quarter
          </Button>
          <Button variant="outline" onClick={() => setSelectedProject(null)}>
            <FontAwesomeIcon icon="arrow-left" className="mr-2" />
            Change Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Materials Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Shortages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {requirements.filter(r => r.status === 'critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Shortage</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Delivery</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((req) => {
                const material = materials.find(m => m.id === req.materialId);
                return (
                  <TableRow key={req.materialId}>
                    <TableCell>{material?.name || req.materialId}</TableCell>
                    <TableCell>{req.required}</TableCell>
                    <TableCell>{req.available}</TableCell>
                    <TableCell className="font-medium text-red-500">
                      {req.shortage > 0 ? req.shortage : '-'}
                    </TableCell>
                    <TableCell>{req.leadTime} days</TableCell>
                    <TableCell>
                      <Badge className={
                        req.status === 'critical' ? 'bg-red-500' :
                          req.status === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                      }>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{req.nextDelivery || 'No delivery scheduled'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="truck" className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FontAwesomeIcon icon="calendar" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}