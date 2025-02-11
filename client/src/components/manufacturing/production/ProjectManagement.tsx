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
import type { Project, ProjectCreationForm } from "@/types/manufacturing";
import { format } from "date-fns";

const projectFormSchema = z.object({
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

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/manufacturing/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectCreationForm) => {
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

  const form = useForm<ProjectCreationForm>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      priority: "medium",
      startDate: format(new Date(), "yyyy-MM-dd"),
      targetCompletionDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: ProjectCreationForm) => {
    createProjectMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Production Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all production projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="flex items-center justify-center px-3"
            >
              <FontAwesomeIcon icon="grip" className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center justify-center px-3"
            >
              <FontAwesomeIcon icon="table" className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
        </div>
      </div>

      {/* Project List */}
      <Card className="w-full">
        <CardHeader className="border-b">
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            {viewMode === "table" ? (
              <ProjectTableView projects={projects || []} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project) => (
                  <Card key={project.id} className="flex flex-col h-full">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center text-lg">
                        <span className="truncate">{project.name}</span>
                        <span className="text-sm font-normal text-muted-foreground shrink-0 ml-2">
                          #{project.projectNumber}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>Status: <span className="font-medium">{project.status}</span></div>
                          <div>Progress: <span className="font-medium">{project.metrics.completionPercentage}%</span></div>
                          <div>Hours: <span className="font-medium">{project.totalActualHours}/{project.totalBudgetedHours}</span></div>
                        </div>
                        <div>
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Project Form */}
      {isCreating && (
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectNumber">Project Number</Label>
                  <div>
                    <Input
                      id="projectNumber"
                      {...form.register("projectNumber")}
                    />
                    {form.formState.errors.projectNumber && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.projectNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <div>
                    <Input
                      id="name"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
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
                  <Select 
                    onValueChange={(value) => form.setValue("priority", value as "low" | "medium" | "high" | "critical")}
                  >
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
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <Input
                    id="customer"
                    {...form.register("customer")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectManager">Project Manager</Label>
                  <div>
                    <Input
                      id="projectManager"
                      {...form.register("projectManager")}
                    />
                    {form.formState.errors.projectManager && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.projectManager.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudgetedHours">Total Budgeted Hours</Label>
                  <div>
                    <Input
                      id="totalBudgetedHours"
                      type="number"
                      {...form.register("totalBudgetedHours", { valueAsNumber: true })}
                    />
                    {form.formState.errors.totalBudgetedHours && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.totalBudgetedHours.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}