import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, MapPin, Activity } from "lucide-react";
import EquipmentList from "@/components/club/EquipmentList";
import FloorPlanView from "@/components/club/FloorPlanView";

export default function ClubControlPage() {
  const [view, setView] = useState<"list" | "map">("list");

  const { data: equipment } = useQuery({
    queryKey: ['/api/equipment'],
  });

  const { data: floorPlan } = useQuery({
    queryKey: ['/api/floor-plans/active'],
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Club Control</h1>
          <p className="text-muted-foreground">
            Monitor and manage your fitness equipment
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            List View
          </Button>
          <Button
            variant={view === "map" ? "default" : "outline"}
            onClick={() => setView("map")}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            Map View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Equipment
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  {equipment?.length || 0}
                </h3>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Devices
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  {equipment?.filter(eq => eq.status === 'active').length || 0}
                </h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Maintenance Required
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  {equipment?.filter(eq => eq.status === 'maintenance').length || 0}
                </h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Offline Devices
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  {equipment?.filter(eq => eq.status === 'offline').length || 0}
                </h3>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border">
        {view === "list" ? (
          <EquipmentList equipment={equipment || []} />
        ) : (
          <FloorPlanView 
            floorPlan={floorPlan} 
            equipment={equipment || []} 
          />
        )}
      </div>
    </div>
  );
}
