import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import ProductionLinesGrid from "./production/ProductionLinesGrid";

export default function ProductionLinePanel() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <FontAwesomeIcon icon="industry" className="mr-2" />
            Production Overview
          </TabsTrigger>
          <TabsTrigger value="scheduling">
            <FontAwesomeIcon icon="calendar" className="mr-2" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <FontAwesomeIcon icon="boxes-stacked" className="mr-2" />
            Inventory Allocation
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <FontAwesomeIcon icon="chart-line" className="mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProductionLinesGrid />
        </TabsContent>

        <TabsContent value="scheduling">
          {/* We'll implement these components in subsequent iterations */}
          <Card>
            <CardHeader>
              <CardTitle>Production Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Production scheduling features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Inventory allocation features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Production Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Production analytics features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}