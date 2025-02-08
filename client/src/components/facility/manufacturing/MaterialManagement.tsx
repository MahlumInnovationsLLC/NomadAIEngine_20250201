import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Material } from "@/types/material";

const standardMaterials = [
  {
    name: "Aluminum 5052",
    description: "General purpose aluminum alloy with good corrosion resistance",
    category: "aluminum",
    subcategory: "5052",
    thicknesses: [0.8, 1.0, 1.2, 1.5, 2.0, 3.0],
    standardSizes: ["1220x2440", "1500x3000"],
    surfaceFinish: "Mill",
    unitPrice: 45.0,
  },
  {
    name: "Aluminum 6061",
    description: "Structural aluminum alloy with excellent machinability",
    category: "aluminum",
    subcategory: "6061",
    thicknesses: [1.0, 1.5, 2.0, 3.0, 4.0, 6.0],
    standardSizes: ["1220x2440", "1500x3000"],
    surfaceFinish: "Mill",
    unitPrice: 52.0,
  },
  {
    name: "Mild Steel",
    description: "Low carbon steel suitable for general fabrication",
    category: "steel",
    subcategory: "mild",
    thicknesses: [1.0, 1.2, 1.5, 2.0, 3.0, 4.0],
    standardSizes: ["1220x2440", "1500x3000"],
    surfaceFinish: "Cold Rolled",
    unitPrice: 35.0,
  },
  {
    name: "Stainless Steel 304",
    description: "Austenitic stainless steel with excellent corrosion resistance",
    category: "steel",
    subcategory: "304",
    thicknesses: [0.9, 1.0, 1.2, 1.5, 2.0, 3.0],
    standardSizes: ["1220x2440", "1500x3000"],
    surfaceFinish: "2B",
    unitPrice: 75.0,
  },
];

export default function MaterialManagement() {
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({});
  
  const { toast } = useToast();

  const { data: materials = [], refetch } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  const addMaterialMutation = useMutation({
    mutationFn: async (material: Partial<Material>) => {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (!response.ok) throw new Error('Failed to add material');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material Added",
        description: "New material has been added to the database.",
      });
      refetch();
      setIsAddingMaterial(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add material.",
        variant: "destructive",
      });
    },
  });

  const addStandardMaterialMutation = useMutation({
    mutationFn: async (material: typeof standardMaterials[0]) => {
      const response = await fetch('/api/materials/standard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (!response.ok) throw new Error('Failed to add standard material');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Standard Materials Added",
        description: "Standard materials have been added to the database.",
      });
      refetch();
    },
  });

  const handleAddStandardMaterials = () => {
    Promise.all(standardMaterials.map(material => addStandardMaterialMutation.mutate(material)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Material Management</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddStandardMaterials}>
            Add Standard Materials
          </Button>
          <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
            <DialogTrigger asChild>
              <Button>Add Custom Material</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Material Name</Label>
                  <Input
                    value={newMaterial.name || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newMaterial.category || ''}
                    onValueChange={(value) => setNewMaterial(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aluminum">Aluminum</SelectItem>
                      <SelectItem value="steel">Steel</SelectItem>
                      <SelectItem value="stainless">Stainless Steel</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newMaterial.description || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={newMaterial.unitPrice || ''}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  />
                </div>
                <Button 
                  onClick={() => addMaterialMutation.mutate(newMaterial)}
                  disabled={addMaterialMutation.isPending}
                >
                  {addMaterialMutation.isPending ? "Adding..." : "Add Material"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>{material.description}</TableCell>
                  <TableCell>${material.unitPrice}</TableCell>
                  <TableCell>
                    <Badge variant={material.currentStock > material.minimumStock ? "default" : "destructive"}>
                      {material.currentStock > material.minimumStock ? "In Stock" : "Low Stock"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
