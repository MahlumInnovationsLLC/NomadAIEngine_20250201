import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DailyRequirements } from "./DailyRequirements";
import { CurrentProjects } from "./CurrentProjects";
import { ProductionTeamManagement } from "./ProductionTeamManagement";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types/manufacturing";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

export function ProductionHotProjectsGrid() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  const hotProjects = projects.filter(p => 
    p.status !== 'COMPLETED' && 
    new Date(p.ship) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  );

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">
          <FontAwesomeIcon icon="fire" className="mr-2" />
          Hot Projects
        </TabsTrigger>
        <TabsTrigger value="daily">
          <FontAwesomeIcon icon="calendar-day" className="mr-2" />
          Daily Requirements
        </TabsTrigger>
        <TabsTrigger value="team-management">
          <FontAwesomeIcon icon="users-gear" className="mr-2" />
          Production Team Management
        </TabsTrigger>
        <TabsTrigger value="current">
          <FontAwesomeIcon icon="industry" className="mr-2" />
          Current Projects
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4">
          {hotProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {project.projectNumber} - {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{project.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ship Date</p>
                    <p>{new Date(project.ship).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p>{project.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Team</p>
                    <p>{project.team}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {hotProjects.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <FontAwesomeIcon icon="check-circle" className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Hot Projects</h3>
                <p className="text-muted-foreground">
                  All projects are on schedule
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="daily">
        <DailyRequirements />
      </TabsContent>
      
      <TabsContent value="team-management">
        <ProductionTeamManagement />
      </TabsContent>

      <TabsContent value="current">
        <CurrentProjects />
      </TabsContent>
    </Tabs>
  );
}