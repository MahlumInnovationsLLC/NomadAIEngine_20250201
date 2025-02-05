import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function ProjectMapView() {
  const { toast } = useToast();
  const [showFloorPlanDialog, setShowFloorPlanDialog] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  // Basic initial implementation with UI elements
  if (!selectedFloorPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select or Create Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:bg-accent"
                onClick={() => setShowFloorPlanDialog(true)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <FontAwesomeIcon icon="plus" className="h-12 w-12 text-muted-foreground mb-2" />
                  <p>Add New Floor Plan</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Floor Plan View</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage production floor plans
          </p>
        </div>
      </div>

      <Dialog open={showFloorPlanDialog} onOpenChange={setShowFloorPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Floor Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="Production Floor A" />
            </div>
            <div>
              <label className="text-sm font-medium">Upload Floor Plan Image</label>
              <Input type="file" accept="image/*" ref={imageInputRef} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFloorPlanDialog(false)}>
              Cancel
            </Button>
            <Button>
              Create Floor Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}