import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: number;
  currentProjects: string[];
  workload: number;
}

interface ResourceAllocation {
  projectId: string;
  memberId: string;
  allocation: number;
  startDate: string;
  endDate: string;
}

export function ResourceManagementPanel() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/manufacturing/resources/team'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/resources/team');
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    }
  });

  const { data: allocations = [] } = useQuery<ResourceAllocation[]>({
    queryKey: ['/api/manufacturing/resources/allocations'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/resources/allocations');
      if (!response.ok) throw new Error('Failed to fetch resource allocations');
      return response.json();
    }
  });

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Team Overview */}
      <Card className="col-span-8">
        <CardHeader>
          <CardTitle>Team Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teamMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center space-x-4 p-4 hover:bg-muted/50 rounded-lg cursor-pointer"
                onClick={() => setSelectedMember(member.id)}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{member.name}</h4>
                    <Badge variant={member.workload > 80 ? "destructive" : "default"}>
                      {member.workload}% Allocated
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Progress value={member.workload} className="h-2" />
                    <div className="flex gap-2">
                      {member.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Stats */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Resource Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <FontAwesomeIcon icon="users" className="h-8 w-8 text-primary/50" />
            </div>

            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Utilization</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    teamMembers.reduce((acc, member) => acc + member.workload, 0) / 
                    (teamMembers.length || 1)
                  )}%
                </p>
              </div>
              <FontAwesomeIcon icon="chart-line" className="h-8 w-8 text-primary/50" />
            </div>

            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">
                  {new Set(allocations.map(a => a.projectId)).size}
                </p>
              </div>
              <FontAwesomeIcon icon="folder-open" className="h-8 w-8 text-primary/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/manufacturing";

export function ResourceManagementPanel() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['/api/manufacturing/resources'],
    queryFn: async () => {
      const response = await fetch('/api/manufacturing/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Resource Management</h2>
          <p className="text-muted-foreground">
            Manage and allocate manufacturing resources
          </p>
        </div>
        <Button>
          <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Available Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Resource management coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
