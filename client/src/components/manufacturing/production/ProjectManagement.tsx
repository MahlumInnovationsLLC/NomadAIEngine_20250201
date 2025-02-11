import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { ProjectTableView } from "./ProjectTableView";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { Project } from "@/types/manufacturing";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export const projectFormSchema = z.object({
  projectNumber: z.string().min(1, "Project number is required"),
  name: z.string().min(1, "Project name is required"),
  description: z.string(),
  startDate: z.string(),
  targetCompletionDate: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  customer: z.string().optional(),
  projectManager: z.string().min(1, "Project manager is required"),
  totalBudgetedHours: z.number().min(0),
});

type ViewMode = "cards" | "table";

export function ProjectManagement() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isCreating, setIsCreating] = useState(false);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/manufacturing/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectFormSchema>) => {
      const response = await fetch("/api/manufacturing/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/projects"] });
      setIsCreating(false);
    },
  });

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      priority: "medium",
      startDate: format(new Date(), "yyyy-MM-dd"),
      targetCompletionDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    createProjectMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Production Projects</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track all production projects
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <FontAwesomeIcon icon="grid-2" className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <FontAwesomeIcon icon="table" className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            Create New Project
          </Button>
        </div>
      </div>

      {/* Projects List Section - Now at the top */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle className="text-base">Projects</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
          >
            <FontAwesomeIcon 
              icon={isProjectsExpanded ? "chevron-up" : "chevron-down"} 
              className="h-4 w-4"
            />
          </Button>
        </CardHeader>
        {isProjectsExpanded && (
          <CardContent className="pt-0">
            <ScrollArea className="h-[150px] w-full">
              <div className="grid grid-cols-1 gap-1">
                {projects?.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{project.projectNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Status: {project.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon="eye" className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FontAwesomeIcon icon="edit" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Main Project View */}
      <div className="w-full">
        {viewMode === "table" ? (
          <ProjectTableView projects={projects || []} />
        ) : (
          <div className="space-y-4">
            {isCreating && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="projectNumber">Project Number</Label>
                        <Input
                          id="projectNumber"
                          {...form.register("projectNumber")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          {...form.register("description")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select onValueChange={(value) => form.setValue("priority", value as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          {...form.register("startDate")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetCompletionDate">Target Completion Date</Label>
                        <Input
                          id="targetCompletionDate"
                          type="date"
                          {...form.register("targetCompletionDate")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="projectManager">Project Manager</Label>
                        <Input
                          id="projectManager"
                          {...form.register("projectManager")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="totalBudgetedHours">Total Budgeted Hours</Label>
                        <Input
                          id="totalBudgetedHours"
                          type="number"
                          {...form.register("totalBudgetedHours", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProjectMutation.isPending}>
                        Create Project
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map((project) => (
                <Card key={project.id} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{project.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        #{project.projectNumber}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Status: <span className="font-medium">{project.status}</span></div>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}