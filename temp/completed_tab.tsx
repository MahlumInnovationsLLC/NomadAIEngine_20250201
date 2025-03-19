import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

export const CompletedTab = () => {
  return (
    <TabsContent value="completed">
      {isLoadingProjects ? (
        <div className="flex justify-center items-center h-64">
          <FontAwesomeIcon icon="spinner" spin className="h-8 w-8 text-primary" />
        </div>
      ) : (
        (() => {
          // Filter to only include completed projects
          const completedProjects = safeFilterProjects(projects, p => {
            // Only include projects with exact COMPLETED status
            return p.status === 'COMPLETED';
          });
          
          if (completedProjects.length > 0) {
            return completedProjects.map(project => (
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
                    <Badge variant="outline" className="bg-green-50">{project.status}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p>{formatDate(project.startDate, project.contractDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completion Date</p>
                      <p>{formatDate(project.completionDate, project.delivery)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Final Progress</p>
                      <Progress 
                        value={100} 
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
                        // Handle viewing project report or other completed project actions
                      }}
                    >
                      <FontAwesomeIcon icon="file-alt" className="mr-2 h-3 w-3" />
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ));
          } else {
            return (
              <div className="text-center py-8">
                <FontAwesomeIcon icon="clipboard-check" className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Projects</h3>
                <p className="text-muted-foreground">
                  There are no completed projects at the moment
                </p>
              </div>
            );
          }
        })()
      )}
    </TabsContent>
  );
};