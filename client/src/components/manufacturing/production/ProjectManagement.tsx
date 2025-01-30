import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { ProductionProject, ProjectCreationForm } from "@/types/manufacturing";
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

export function ProjectManagement() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: projects, isLoading } = useQuery<ProductionProject[]>({
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
    return <div>Loading projects...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Production Projects</h2>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          Create New Project
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectNumber">Project Number</Label>
                  <Input
                    id="projectNumber"
                    {...form.register("projectNumber")}
                    error={form.formState.errors.projectNumber?.message}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    error={form.formState.errors.name?.message}
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
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <Input
                    id="customer"
                    {...form.register("customer")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectManager">Project Manager</Label>
                  <Input
                    id="projectManager"
                    {...form.register("projectManager")}
                    error={form.formState.errors.projectManager?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalBudgetedHours">Total Budgeted Hours</Label>
                  <Input
                    id="totalBudgetedHours"
                    type="number"
                    {...form.register("totalBudgetedHours", { valueAsNumber: true })}
                    error={form.formState.errors.totalBudgetedHours?.message}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={createProjectMutation.isPending}>
                  Create Project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <Card key={project.id}>
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
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Status: <span className="font-medium">{project.status}</span></div>
                  <div>Priority: <span className="font-medium">{project.priority}</span></div>
                  <div>Progress: <span className="font-medium">{project.metrics.completionPercentage}%</span></div>
                  <div>Hours: <span className="font-medium">{project.totalActualHours}/{project.totalBudgetedHours}</span></div>
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
  );
}
