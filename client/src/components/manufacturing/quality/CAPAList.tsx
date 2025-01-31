import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

export default function CAPAList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Corrective and Preventive Actions</h3>
          <p className="text-sm text-muted-foreground">
            Manage and track corrective actions and preventive measures
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New CAPA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent CAPAs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon: CAPA management functionality</p>
        </CardContent>
      </Card>
    </div>
  );
}
