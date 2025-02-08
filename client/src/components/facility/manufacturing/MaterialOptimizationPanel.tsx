import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import NestingPreview from "./NestingPreview";

interface MaterialPart {
  id: string;
  name: string;
  width: number;
  height: number;
  quantity: number;
  priority: number;
  material: string;
  thickness: number;
}

interface NestingResult {
  id: string;
  efficiency: number;
  wastePercentage: number;
  materialUsed: number;
  partsNested: MaterialPart[];
  nestingPattern: {
    width: number;
    height: number;
    placements: Array<{
      x: number;
      y: number;
      partId: string;
      rotation: number;
    }>;
  };
}

interface OptimizationMetrics {
  averageEfficiency: number;
  totalMaterialSaved: number;
  currentWastePercentage: number;
  materialCostSavings: number;
  weeklyTrends: {
    date: string;
    efficiency: number;
    waste: number;
  }[];
}

interface OptimizationSettings {
  allowRotation: boolean;
  spacing: number;
  algorithm: 'guillotine' | 'maxrects' | 'skyline';
  materialGrade: string;
  sheetSize: {
    width: number;
    height: number;
  };
}

export default function MaterialOptimizationPanel() {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedNesting, setSelectedNesting] = useState<NestingResult | null>(null);
  const [settings, setSettings] = useState<OptimizationSettings>({
    allowRotation: true,
    spacing: 2,
    algorithm: 'maxrects',
    materialGrade: 'standard',
    sheetSize: { width: 1000, height: 2000 }
  });

  const { toast } = useToast();

  const { data: parts = [] } = useQuery<MaterialPart[]>({
    queryKey: ['/api/fabrication/parts'],
  });

  const { data: nestingResults = [] } = useQuery<NestingResult[]>({
    queryKey: ['/api/fabrication/nesting', selectedMaterial],
    enabled: !!selectedMaterial,
  });

  const { data: metrics } = useQuery<OptimizationMetrics>({
    queryKey: ['/api/fabrication/optimization-metrics'],
    refetchInterval: 30000,
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/fabrication/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: selectedMaterial,
          settings
        }),
      });
      if (!response.ok) throw new Error('Optimization failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Optimization Complete",
        description: "New nesting patterns have been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "There was an error running the optimization.",
        variant: "destructive",
      });
    },
  });

  const handleOptimize = () => {
    if (!selectedMaterial) {
      toast({
        title: "No Material Selected",
        description: "Please select a material to optimize.",
        variant: "destructive",
      });
      return;
    }
    optimizeMutation.mutate();
  };

  const uniqueMaterials = Array.from(new Set(parts.map(part => part.material)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Material Optimization</h2>
        <div className="flex gap-2">
          <Select
            value={selectedMaterial || ''}
            onValueChange={(value) => setSelectedMaterial(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {uniqueMaterials.map((material) => (
                <SelectItem key={material} value={material}>
                  {material}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleOptimize} disabled={!selectedMaterial || optimizeMutation.isPending}>
            <FontAwesomeIcon icon="calculator" className="mr-2 h-4 w-4" />
            {optimizeMutation.isPending ? "Optimizing..." : "Run Optimization"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FontAwesomeIcon icon="cog" className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Optimization Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-rotation">Allow Part Rotation</Label>
                  <Switch
                    id="allow-rotation"
                    checked={settings.allowRotation}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, allowRotation: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spacing">Part Spacing (mm)</Label>
                  <Input
                    id="spacing"
                    type="number"
                    value={settings.spacing}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, spacing: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="algorithm">Nesting Algorithm</Label>
                  <Select
                    value={settings.algorithm}
                    onValueChange={(value: 'guillotine' | 'maxrects' | 'skyline') => 
                      setSettings(prev => ({ ...prev, algorithm: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guillotine">Guillotine</SelectItem>
                      <SelectItem value="maxrects">MaxRects</SelectItem>
                      <SelectItem value="skyline">Skyline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sheet Size</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Width"
                      value={settings.sheetSize.width}
                      onChange={(e) => 
                        setSettings(prev => ({
                          ...prev,
                          sheetSize: { ...prev.sheetSize, width: Number(e.target.value) }
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Height"
                      value={settings.sheetSize.height}
                      onChange={(e) => 
                        setSettings(prev => ({
                          ...prev,
                          sheetSize: { ...prev.sheetSize, height: Number(e.target.value) }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Efficiency</CardTitle>
            <FontAwesomeIcon icon="chart-line" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageEfficiency || 0}%</div>
            <p className="text-xs text-muted-foreground">Average nesting efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Saved</CardTitle>
            <FontAwesomeIcon icon="leaf" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMaterialSaved || 0}m²</div>
            <p className="text-xs text-muted-foreground">Total material saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Waste</CardTitle>
            <FontAwesomeIcon icon="trash" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.currentWastePercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">Current waste percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <FontAwesomeIcon icon="dollar-sign" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.materialCostSavings || 0}</div>
            <p className="text-xs text-muted-foreground">Material cost savings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parts for Nesting</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.width}mm × {part.height}mm</TableCell>
                    <TableCell>
                      {part.material} ({part.thickness}mm)
                    </TableCell>
                    <TableCell>{part.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{part.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedMaterial(part.material)}
                      >
                        <FontAwesomeIcon icon="puzzle-piece" className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedNesting && (
          <Card>
            <CardHeader>
              <CardTitle>Nesting Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <NestingPreview 
                nestingPattern={selectedNesting.nestingPattern}
                scale={0.5}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {selectedMaterial && nestingResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nesting Results - {selectedMaterial}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {nestingResults.map((result) => (
                <div 
                  key={result.id} 
                  className="space-y-2 cursor-pointer hover:bg-muted p-4 rounded-lg transition-colors"
                  onClick={() => setSelectedNesting(result)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Nesting Pattern #{result.id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.partsNested.length} parts nested
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Efficiency</p>
                        <p className="font-medium">{result.efficiency}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Waste</p>
                        <p className="font-medium">{result.wastePercentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Material Used</p>
                        <p className="font-medium">{result.materialUsed}m²</p>
                      </div>
                    </div>
                  </div>
                  <Progress value={result.efficiency} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}