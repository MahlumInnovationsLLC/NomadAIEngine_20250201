import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

export default function NCRList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Non-Conformance Reports</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage product or process non-conformances
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          New NCR
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent NCRs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon: NCR management functionality</p>
        </CardContent>
      </Card>
    </div>
  );
}
