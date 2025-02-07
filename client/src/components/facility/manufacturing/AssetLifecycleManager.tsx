import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Equipment } from "@db/schema";

interface AssetLifecycleManagerProps {
  equipment?: Equipment[];
  showFullDashboard?: boolean;
}

export default function AssetLifecycleManager({ equipment = [], showFullDashboard = false }: AssetLifecycleManagerProps) {
  const [activeView, setActiveView] = useState<'overview' | 'depreciation' | 'roi'>('overview');

  const { data: assetMetrics } = useQuery({
    queryKey: ['/api/assets/metrics'],
    enabled: showFullDashboard,
  });

  const getAssetHealth = (eq: Equipment) => {
    // Calculate asset health based on age, maintenance history, and performance
    const age = new Date().getFullYear() - (eq.modelYear || new Date().getFullYear());
    const lastMaintenance = eq.lastMaintenance 
      ? Math.floor((new Date().getTime() - new Date(eq.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    if (age > 10 || lastMaintenance > 180) return 'critical';
    if (age > 7 || lastMaintenance > 90) return 'warning';
    return 'good';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Asset Lifecycle Management</span>
          <div className="flex gap-2">
            <Button 
              variant={activeView === 'overview' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('overview')}
            >
              Overview
            </Button>
            <Button 
              variant={activeView === 'depreciation' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('depreciation')}
            >
              Depreciation
            </Button>
            <Button 
              variant={activeView === 'roi' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('roi')}
            >
              ROI Analysis
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Assets</div>
                  <div className="text-2xl font-bold">{equipment.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Asset Value</div>
                  <div className="text-2xl font-bold">$2.4M</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Critical Assets</div>
                  <div className="text-2xl font-bold text-yellow-500">4</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">End-of-Life</div>
                  <div className="text-2xl font-bold text-red-500">2</div>
                </CardContent>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq) => {
                  const health = getAssetHealth(eq);
                  const age = eq.modelYear 
                    ? `${new Date().getFullYear() - eq.modelYear} years`
                    : 'Unknown';

                  return (
                    <TableRow key={eq.id}>
                      <TableCell className="font-medium">{eq.name}</TableCell>
                      <TableCell>{eq.equipmentTypeId}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            health === 'good'
                              ? 'bg-green-500/10 text-green-500'
                              : health === 'warning'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }
                        >
                          {health}
                        </Badge>
                      </TableCell>
                      <TableCell>{age}</TableCell>
                      <TableCell>
                        {eq.purchasePrice 
                          ? new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: 'USD' 
                            }).format(eq.purchasePrice)
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FontAwesomeIcon icon={['fal', 'chart-line']} className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {activeView === 'depreciation' && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Asset Depreciation Analysis</h3>
            {/* Add depreciation charts and analysis here */}
          </div>
        )}

        {activeView === 'roi' && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Return on Investment Analysis</h3>
            {/* Add ROI analysis dashboard here */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
