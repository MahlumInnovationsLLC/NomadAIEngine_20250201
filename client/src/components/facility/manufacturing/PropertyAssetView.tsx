import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { FloorPlan } from "@db/schema";

interface PropertyAssetViewProps {
  floorPlan?: FloorPlan | null;
}

export default function PropertyAssetView({ floorPlan }: PropertyAssetViewProps) {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Property & Asset Overview</span>
          <div className="flex gap-2">
            <Button 
              variant={view === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('list')}
            >
              <FontAwesomeIcon icon={['fal', 'list']} className="h-4 w-4 mr-2" />
              List View
            </Button>
            <Button 
              variant={view === 'map' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('map')}
            >
              <FontAwesomeIcon icon={['fal', 'map']} className="h-4 w-4 mr-2" />
              Map View
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {view === 'list' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Properties</div>
                  <div className="text-2xl font-bold">12</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Active Manufacturing Sites</div>
                  <div className="text-2xl font-bold">8</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Square Footage</div>
                  <div className="text-2xl font-bold">245,000</div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold">Manufacturing Facilities</h3>
              </div>
              <div className="divide-y">
                {[1, 2, 3].map((facility) => (
                  <div key={facility} className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Manufacturing Plant {facility}</h4>
                      <p className="text-sm text-muted-foreground">
                        Location {facility} • 50,000 sqft
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        Active
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon={['fal', 'chevron-right']} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {floorPlan ? (
              <div>Map View Implementation</div>
            ) : (
              <div className="text-muted-foreground">
                No floor plan available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
