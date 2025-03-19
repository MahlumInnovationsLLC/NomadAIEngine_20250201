import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, UserCog, UserMinus, Clipboard, ArrowRight } from "lucide-react";
import { ProductionLine, TeamMember } from "@/types/manufacturing";
import { TeamMemberManagement } from "./TeamMemberManagement";

interface ProductionTeamManagementProps {
  productionLines: ProductionLine[];
}

export function ProductionTeamManagement({ productionLines = [] }: ProductionTeamManagementProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
  const [teamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get only production lines with team information
  const linesWithTeams = productionLines.filter(
    line => line.electricalLead || line.assemblyLead || (line.teamMembers && line.teamMembers.length > 0)
  );

  // Get lines by status for tab filtering
  const operationalLines = productionLines.filter(line => line.status === 'operational');
  const maintenanceLines = productionLines.filter(line => line.status === 'maintenance');
  const offlineLines = productionLines.filter(line => line.status === 'offline');

  // Function to filter production lines based on active tab
  const getFilteredLines = () => {
    switch (activeTab) {
      case "operational":
        return operationalLines;
      case "maintenance":
        return maintenanceLines;
      case "offline":
        return offlineLines;
      case "withTeams":
        return linesWithTeams;
      default:
        return productionLines;
    }
  };

  // Function to get initials from a name
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get a color based on a string value (for consistent avatar colors)
  const getColorFromString = (str: string) => {
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500"
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Function to handle opening the team member management dialog
  const handleManageTeamMembers = (line: ProductionLine) => {
    setSelectedLine(line);
    setTeamMemberDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All Lines</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="withTeams">With Teams</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredLines().length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-60">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Production Lines Found</h3>
                <p className="text-muted-foreground">
                  No production lines match the selected filter
                </p>
              </div>
            </div>
          ) : (
            getFilteredLines().map(line => (
              <Card key={line.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{line.name}</CardTitle>
                      <CardDescription>
                        {line.type} line - {line.status}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={line.status === 'operational' ? 'default' : 
                              line.status === 'maintenance' ? 'warning' : 'destructive'}
                    >
                      {line.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Team name display */}
                  {line.teamName && (
                    <div className="bg-muted/40 p-3 rounded-md">
                      <div className="text-sm text-muted-foreground">Team Name</div>
                      <div className="text-lg font-medium">{line.teamName}</div>
                    </div>
                  )}

                  {/* Team leads section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Team Leads</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Electrical Lead */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex items-center space-x-3">
                          {line.electricalLead ? (
                            <>
                              <Avatar className={getColorFromString(line.electricalLead.name)}>
                                <AvatarFallback>{getInitials(line.electricalLead.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{line.electricalLead.name}</div>
                                <div className="text-xs text-muted-foreground">Electrical Lead</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <Avatar className="bg-muted">
                                <AvatarFallback>EL</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-muted-foreground">No Electrical Lead</div>
                                <div className="text-xs">Not assigned</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Assembly Lead */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex items-center space-x-3">
                          {line.assemblyLead ? (
                            <>
                              <Avatar className={getColorFromString(line.assemblyLead.name)}>
                                <AvatarFallback>{getInitials(line.assemblyLead.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{line.assemblyLead.name}</div>
                                <div className="text-xs text-muted-foreground">Assembly Lead</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <Avatar className="bg-muted">
                                <AvatarFallback>AL</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-muted-foreground">No Assembly Lead</div>
                                <div className="text-xs">Not assigned</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team members section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Team Members</h4>
                      <div className="text-sm">
                        {line.teamMembers?.length || 0}/{line.manpowerCapacity || 10}
                      </div>
                    </div>
                    
                    {line.teamMembers && line.teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {line.teamMembers.slice(0, 5).map((member, index) => (
                          <Avatar key={index} title={member.name} className={getColorFromString(member.name)}>
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {line.teamMembers.length > 5 && (
                          <Avatar className="bg-muted">
                            <AvatarFallback>+{line.teamMembers.length - 5}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2">
                        No team members have been assigned yet
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleManageTeamMembers(line)}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Manage Team Members
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>

      {/* Team Member Management Dialog */}
      {selectedLine && (
        <TeamMemberManagement
          open={teamMemberDialogOpen}
          onOpenChange={setTeamMemberDialogOpen}
          productionLine={selectedLine}
        />
      )}
    </div>
  );
}