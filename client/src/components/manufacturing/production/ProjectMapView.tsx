import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Resizable } from "react-resizable";
import type { 
  FloorPlan, 
  FloorPlanZone, 
  ProjectLocation,
  Project 
} from "@/types/manufacturing";
import {
  getAllProjects,
  getAllFloorPlans,
  createFloorPlan,
  updateFloorPlan,
  getProjectLocations,
  updateProjectLocation
} from "@/lib/azure/project-service";

export function ProjectMapView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFloorPlanDialog, setShowFloorPlanDialog] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newFloorPlan, setNewFloorPlan] = useState({
    name: '',
    width: 1200,
    height: 800,
    scale: 50, // pixels per meter
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<FloorPlanZone | null>(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: floorPlans = [] } = useQuery<FloorPlan[]>({
    queryKey: ['/api/manufacturing/floor-plans'],
    queryFn: getAllFloorPlans,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/manufacturing/projects'],
    queryFn: getAllProjects,
  });

  const { data: projectLocations = [] } = useQuery<ProjectLocation[]>({
    queryKey: ['/api/manufacturing/project-locations', selectedFloorPlan],
    queryFn: () => getProjectLocations(selectedFloorPlan!),
    enabled: !!selectedFloorPlan,
  });

  // Mutations
  const createFloorPlanMutation = useMutation({
    mutationFn: async (data: { name: string, imageFile: File }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('image', data.imageFile);

      const response = await fetch('/api/manufacturing/floor-plans', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create floor plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/floor-plans'] });
      setShowFloorPlanDialog(false);
      toast({
        title: "Success",
        description: "Floor plan created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateProjectLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/project-locations', selectedFloorPlan] 
      });
      toast({
        title: "Success",
        description: "Project location updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination || !selectedFloorPlan) return;

    const projectId = result.draggableId;
    const zoneId = result.destination.droppableId;
    const position = {
      x: result.destination.x,
      y: result.destination.y,
    };

    updateLocationMutation.mutate({
      projectId,
      floorPlanId: selectedFloorPlan,
      zoneId,
      position,
      status: 'active',
      startDate: new Date().toISOString(),
    });
  }, [selectedFloorPlan, updateLocationMutation]);

  const handleCreateFloorPlan = async () => {
    if (!imageInputRef.current?.files?.[0]) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    createFloorPlanMutation.mutate({
      name: newFloorPlan.name,
      imageFile: imageInputRef.current.files[0],
    });
  };

  const filteredProjects = projects.filter(project => 
    project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentFloorPlan = floorPlans.find(fp => fp.id === selectedFloorPlan);

  if (!selectedFloorPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {floorPlans.map((floorPlan) => (
                <Card 
                  key={floorPlan.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedFloorPlan(floorPlan.id)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-lg mb-2">
                      {floorPlan.imageUrl ? (
                        <img 
                          src={floorPlan.imageUrl} 
                          alt={floorPlan.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon icon="image" className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold">{floorPlan.name}</h3>
                  </CardContent>
                </Card>
              ))}
              <Card 
                className="cursor-pointer hover:bg-accent"
                onClick={() => setShowFloorPlanDialog(true)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <FontAwesomeIcon icon="plus" className="h-12 w-12 text-muted-foreground mb-2" />
                  <p>Add New Floor Plan</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{currentFloorPlan?.name}</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop projects to assign them to production zones
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            <FontAwesomeIcon icon={isEditing ? "eye" : "edit"} className="mr-2" />
            {isEditing ? "View Mode" : "Edit Layout"}
          </Button>
          <Button variant="outline" onClick={() => setSelectedFloorPlan(null)}>
            <FontAwesomeIcon icon="arrow-left" className="mr-2" />
            Change Floor Plan
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Available Projects</CardTitle>
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2"
                />
              </CardHeader>
              <CardContent>
                <Droppable droppableId="projects-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {filteredProjects
                        .filter(p => !projectLocations.some(pl => pl.projectId === p.id))
                        .map((project, index) => (
                          <Draggable
                            key={project.id}
                            draggableId={project.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-4 bg-background border rounded-lg"
                              >
                                <div className="font-semibold">
                                  {project.projectNumber}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {project.name}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-3">
            <Card>
              <CardContent className="p-6">
                <div 
                  className="relative"
                  style={{
                    width: currentFloorPlan?.width,
                    height: currentFloorPlan?.height,
                  }}
                >
                  {currentFloorPlan?.imageUrl && (
                    <img
                      src={currentFloorPlan.imageUrl}
                      alt={currentFloorPlan.name}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {currentFloorPlan?.zones.map((zone) => (
                    <Droppable key={zone.id} droppableId={zone.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`absolute border-2 border-dashed rounded-lg ${isEditing ? 'cursor-move' : ''}`}
                          style={{
                            left: zone.coordinates.x,
                            top: zone.coordinates.y,
                            width: zone.coordinates.width,
                            height: zone.coordinates.height,
                          }}
                          onClick={() => {
                            if (isEditing) {
                              setSelectedZone(zone);
                              setShowZoneDialog(true);
                            }
                          }}
                        >
                          <div className="p-2 text-sm font-medium">
                            {zone.name}
                          </div>
                          {projectLocations
                            .filter(pl => pl.zoneId === zone.id)
                            .map((pl) => {
                              const project = projects.find(p => p.id === pl.projectId);
                              return (
                                <Resizable
                                  key={pl.projectId}
                                  width={200}
                                  height={100}
                                  onResize={(e, { size }) => {
                                    // Handle resize
                                  }}
                                  draggableOpts={{ grid: [10, 10] }}
                                >
                                  <div
                                    className="absolute p-2 bg-primary text-primary-foreground rounded cursor-move"
                                    style={{
                                      left: pl.position.x,
                                      top: pl.position.y,
                                    }}
                                  >
                                    <div className="font-medium">{project?.projectNumber}</div>
                                    <div className="text-sm">{project?.name}</div>
                                  </div>
                                </Resizable>
                              );
                            })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DragDropContext>

      <Dialog open={showFloorPlanDialog} onOpenChange={setShowFloorPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Floor Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input 
                placeholder="Production Floor A" 
                value={newFloorPlan.name}
                onChange={(e) => setNewFloorPlan(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Upload Floor Plan Image</label>
              <Input 
                type="file" 
                accept="image/*" 
                ref={imageInputRef}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Width (pixels)</label>
                <Input
                  type="number"
                  value={newFloorPlan.width}
                  onChange={(e) => setNewFloorPlan(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Height (pixels)</label>
                <Input
                  type="number"
                  value={newFloorPlan.height}
                  onChange={(e) => setNewFloorPlan(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFloorPlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFloorPlan}>
              Create Floor Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}