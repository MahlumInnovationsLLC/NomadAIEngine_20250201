import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

export const PlanningTab = () => {
  return (
    <TabsContent value="planning">
      {isLoadingProjects ? (
        <div className="flex justify-center items-center h-64">
          <FontAwesomeIcon icon="spinner" spin className="h-8 w-8 text-primary" />
        </div>
      ) : (
        (() => {
          // Filter to only include projects with PLANNING status
          const planningProjects = safeFilterProjects(projects, p => {
            // Only include projects with exact PLANNING status
            return p.status === 'PLANNING';
          });
          
          if (planningProjects.length > 0) {
            return planningProjects.map(project => (
              <Card 
                key={project.id} 
                className="mb-4 cursor-pointer hover:bg-accent/5"
                onClick={() => handleOpenProjectDetails(project)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {project.projectNumber}</p>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p>{formatDate(project.startDate, project.contractDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Date</p>
                      <p>{formatDate(project.targetCompletionDate, project.delivery)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Planning Progress</p>
                      <Progress 
                        value={project.metrics?.completionPercentage ?? project.progress ?? 0} 
                        className="h-2 mt-1" 
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignProject(project);
                      }}
                    >
                      <FontAwesomeIcon icon="sitemap" className="mr-2 h-3 w-3" />
                      Move to Production
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ));
          } else {
            return (
              <div className="text-center py-8">
                <FontAwesomeIcon icon="clipboard-list" className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Planning Projects</h3>
                <p className="text-muted-foreground">
                  There are no projects in the planning stage at the moment
                </p>
              </div>
            );
          }
        })()
      )}
    </TabsContent>
  );
};