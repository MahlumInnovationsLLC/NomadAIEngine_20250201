// Active tab implementation
const activeTab = (
  <TabsContent value="active" className="space-y-4 pt-4">
    {isLoadingProjects ? (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span>Loading projects...</span>
      </div>
    ) : (
      (() => {
        // Filter active projects only once to prevent duplication
        const activeProjects = safeFilterProjects(projects, p => {
          // Check for active projects - preserve exact status formatting
          if (!p.status) return false;
          
          const originalStatus = p.status;
          const statusLower = typeof originalStatus === 'string' ? originalStatus.toLowerCase() : '';
          
          // Status value preservation approach:
          // 1. Check exact original status values first with direct comparison
          // 2. Fall back to lowercase matching only when needed for flexibility 
          return (
            // Exact original status values - preserves case integrity
            originalStatus === 'NOT_STARTED' ||
            originalStatus === 'IN FAB' ||
            originalStatus === 'IN ASSEMBLY' ||
            originalStatus === 'IN WRAP' ||
            originalStatus === 'IN NTC TESTING' ||
            originalStatus === 'IN QC' ||
            
            // Fallback lowercase pattern matching for flexibility
            statusLower === 'in_progress' || 
            statusLower === 'active' || 
            statusLower === 'not started' || 
            statusLower === 'not_started' ||
            statusLower === 'in fab' || 
            statusLower === 'in_fab' ||
            statusLower === 'in assembly' || 
            statusLower === 'in_assembly' ||
            statusLower === 'in wrap' || 
            statusLower === 'in_wrap' ||
            statusLower === 'in ntc testing' || 
            statusLower === 'in_ntc_testing' ||
            statusLower === 'in qc' ||
            statusLower === 'in_qc'
          );
        });
        
        if (activeProjects.length > 0) {
          return activeProjects.map(project => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:bg-accent/5"
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
                    <p className="text-muted-foreground">Progress</p>
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
                    Assign to Line
                  </Button>
                </div>
              </CardContent>
            </Card>
          ));
        } else {
          return (
            <div className="text-center py-8">
              <FontAwesomeIcon icon="clipboard-check" className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
              <p className="text-muted-foreground">
                There are no active projects at the moment
              </p>
            </div>
          );
        }
      })()
    )}
  </TabsContent>
);