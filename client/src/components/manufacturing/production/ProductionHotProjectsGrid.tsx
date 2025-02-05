import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import type { ProductionProject } from "@/types/manufacturing";
import { getAllProjects } from "@/lib/azure/project-service";

export function ProductionHotProjectsGrid() {
  const { data: projects = [], isLoading } = useQuery<ProductionProject[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: getAllProjects,
  });

  // Filter only hot projects that are allocated to production
  const hotProjects = projects.filter(project => 
    project.status === 'active' && project.productionOrders?.length > 0
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Hot Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            Loading production projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hotProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Production Projects</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <FontAwesomeIcon icon="industry" className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No projects are currently allocated to production.
            Use the Project Management Map View to allocate projects.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {hotProjects.map(project => (
        <Card key={project.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {project.projectNumber}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {project.name}
                </p>
              </div>
              <Badge className={
                project.priority === 'critical' ? 'bg-red-500' :
                project.priority === 'high' ? 'bg-orange-500' :
                project.priority === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              }>
                {project.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{project.metrics.completionPercentage}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${project.metrics.completionPercentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Start Date</span>
                  <p>{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target Date</span>
                  <p>{new Date(project.targetCompletionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Production Orders</span>
                  <p>{project.productionOrders.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Delayed Tasks</span>
                  <p className={project.metrics.delayedTasks > 0 ? 'text-red-500' : ''}>
                    {project.metrics.delayedTasks}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
