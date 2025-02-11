
import { useQuery } from "@tanstack/react-query";
import { ProjectMapView } from "./ProjectMapView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function CurrentProjects() {
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  const activeProjects = projects.filter(p => 
    ['IN FAB', 'IN ASSEMBLY', 'IN WRAP', 'IN NTC TESTING', 'IN QC'].includes(p.status)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Fabrication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProjects.filter(p => p.status === 'IN FAB').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Assembly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProjects.filter(p => p.status === 'IN ASSEMBLY').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProjects.filter(p => p.status === 'IN NTC TESTING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In QC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProjects.filter(p => p.status === 'IN QC').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectMapView projects={activeProjects} />
    </div>
  );
}
