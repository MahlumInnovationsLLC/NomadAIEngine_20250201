import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Resizable } from "react-resizable";
import type { FloorPlan, Project, ProjectLocation } from "@/types/manufacturing";

export function ProjectMapView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFloorPlanDialog, setShowFloorPlanDialog] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [projectLocation, setProjectLocation] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 200,
    height: 150
  });

  // Query floor plans
  const { data: floorPlans = [] } = useQuery<FloorPlan[]>({
    queryKey: ['/api/floor-plans'],
  });

  // Query projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Create floor plan mutation
  const createFloorPlanMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/floor-plans', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create floor plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      setShowFloorPlanDialog(false);
      toast({
        title: "Success",
        description: "Floor plan created successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to create floor plan:', error);
      toast({
        title: "Error",
        description: "Failed to create floor plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFloorPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Add default values
    formData.append('dimensions', JSON.stringify({
      width: 800,
      height: 600
    }));
    formData.append('gridSize', '20');
    formData.append('zones', JSON.stringify([]));
    formData.append('isActive', 'true');

    try {
      await createFloorPlanMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error creating floor plan:', error);
    }
  };

  // Basic initial implementation with UI elements
  if (!selectedFloorPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Floor Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {floorPlans.map((floorPlan) => (
                <Card
                  key={floorPlan.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedFloorPlan(floorPlan)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{floorPlan.name}</h3>
                    <p className="text-sm text-muted-foreground">{floorPlan.description}</p>
                  </CardContent>
                </Card>
              ))}

              <Dialog open={showFloorPlanDialog} onOpenChange={setShowFloorPlanDialog}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-accent">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                      <FontAwesomeIcon icon="plus" className="h-12 w-12 text-muted-foreground mb-2" />
                      <p>Add New Floor Plan</p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Floor Plan</DialogTitle>
                    <DialogDescription>
                      Create a new floor plan for your production space.
                    </DialogDescription>
                  </DialogHeader>
                  <form id="floor-plan-form" onSubmit={handleCreateFloorPlan} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium">
                          Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Production Floor A"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="text-sm font-medium">
                          Description
                        </label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Main production area"
                        />
                      </div>
                      <div>
                        <label htmlFor="image" className="text-sm font-medium">
                          Upload Floor Plan Image
                        </label>
                        <Input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                          ref={imageInputRef}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFloorPlanDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createFloorPlanMutation.isPending}
                      >
                        {createFloorPlanMutation.isPending ? (
                          <>
                            <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Floor Plan'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Update project location mutation
  const updateProjectLocationMutation = useMutation({
    mutationFn: async (location: ProjectLocation) => {
      const response = await fetch('/api/project-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });
      if (!response.ok) throw new Error('Failed to update project location');
      return response.json();
    },
  });

  const handleDragEnd = async (_: any, info: any) => {
    if (!selectedProject || !selectedFloorPlan) return;

    const newLocation: ProjectLocation = {
      projectId: selectedProject.id,
      floorPlanId: selectedFloorPlan.id,
      zoneId: "default", // Add a default zone ID
      position: {
        x: info.point.x,
        y: info.point.y
      },
      status: 'active',
      startDate: new Date().toISOString(),
    };

    try {
      await updateProjectLocationMutation.mutateAsync(newLocation);
      toast({
        title: "Success",
        description: "Project location updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project location",
        variant: "destructive",
      });
    }
  };

  const handleResize = (_: any, { size }: any) => {
    setProjectLocation(prev => ({
      ...prev,
      width: size.width,
      height: size.height
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Floor Plan View</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage production floor plans
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedFloorPlan(null)}>
            <FontAwesomeIcon icon="arrow-left" className="mr-2 h-4 w-4" />
            Back to Floor Plans
          </Button>
          <Command className="rounded-lg border shadow-md w-[200px]">
            <CommandInput
              placeholder="Search projects..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No projects found.</CommandEmpty>
              <CommandGroup heading="Projects">
                {projects
                  .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(project => (
                    <CommandItem
                      key={project.id}
                      onSelect={() => setSelectedProject(project)}
                    >
                      {project.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </div>

      <div className="relative border rounded-lg bg-background h-[600px] overflow-hidden">
        {selectedProject && (
          <motion.div
            drag
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="absolute"
            style={{
              x: projectLocation.x,
              y: projectLocation.y,
            }}
          >
            <Resizable
              width={projectLocation.width}
              height={projectLocation.height}
              onResize={handleResize}
              draggableOpts={{ grid: [20, 20] }}
            >
              <div
                className="border-2 border-primary rounded-lg bg-primary/10 p-4"
                style={{
                  width: projectLocation.width,
                  height: projectLocation.height,
                }}
              >
                <h3 className="font-medium">{selectedProject.name}</h3>
                <p className="text-sm text-muted-foreground">
                  #{selectedProject.projectNumber}
                </p>
              </div>
            </Resizable>
          </motion.div>
        )}
      </div>
    </div>
  );
}