import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionLineOverview } from "@/components/manufacturing/production/ProductionLineOverview";

export default function ManufacturingPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Manufacturing Operations Management</h1>
      
      <Tabs defaultValue="production" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="production">Production Lines</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="production" className="mt-4">
          <ProductionLineOverview />
        </TabsContent>
        
        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p>Project management functionality will be added soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Control</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p>Quality control functionality will be added soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p>Manufacturing performance metrics will be added soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}