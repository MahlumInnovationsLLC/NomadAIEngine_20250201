import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Users, HardHat, Brain, Wrench } from "lucide-react";
import { ProductionLine, TeamMember } from "@/types/manufacturing";

// Define schema for team lead assignment form
const teamLeadSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  electricalLeadId: z.string(),
  assemblyLeadId: z.string(),
});

type TeamLeadFormValues = z.infer<typeof teamLeadSchema>;

type TeamLeadAssignmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLine: ProductionLine;
  teamMembers: TeamMember[];
  availableMembers?: TeamMember[];
};

export function TeamLeadAssignmentDialog({
  open,
  onOpenChange,
  productionLine,
  teamMembers,
  availableMembers = [],
}: TeamLeadAssignmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Combine team members with available members, removing duplicates
  const allAvailableMembers = [
    ...teamMembers,
    ...availableMembers.filter(
      availableMember => !teamMembers.some(
        teamMember => teamMember.id === availableMember.id
      )
    )
  ];

  // Get current leads
  const electricalLead = productionLine.electricalLead;
  const assemblyLead = productionLine.assemblyLead;
  
  // Generate team name from leads
  const generateTeamName = (
    electricalLeadId: string, 
    assemblyLeadId: string
  ): string => {
    // Handle "none" values
    if (electricalLeadId === "none") electricalLeadId = "";
    if (assemblyLeadId === "none") assemblyLeadId = "";
    
    const electricalMember = electricalLeadId ? allAvailableMembers.find(m => m.id === electricalLeadId) : null;
    const assemblyMember = assemblyLeadId ? allAvailableMembers.find(m => m.id === assemblyLeadId) : null;
    
    if (!electricalMember && !assemblyMember) {
      return productionLine.name || "Production Team";
    }
    
    let teamName = "";
    
    if (electricalMember) {
      const lastName = electricalMember.name.split(' ').slice(-1)[0];
      teamName += lastName;
    }
    
    if (assemblyMember) {
      const lastName = assemblyMember.name.split(' ').slice(-1)[0];
      if (teamName) {
        teamName += " / ";
      }
      teamName += lastName;
    }
    
    return teamName;
  };
  
  // Set up form with defaults
  const form = useForm<TeamLeadFormValues>({
    resolver: zodResolver(teamLeadSchema),
    defaultValues: {
      teamName: productionLine.teamName || "",
      electricalLeadId: electricalLead?.id || "none",
      assemblyLeadId: assemblyLead?.id || "none",
    },
  });
  
  // Update team name when leads change
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Only auto-generate if both lead fields change
      if (name === 'electricalLeadId' || name === 'assemblyLeadId') {
        const electricalLeadId = form.getValues('electricalLeadId');
        const assemblyLeadId = form.getValues('assemblyLeadId');
        
        if (electricalLeadId || assemblyLeadId) {
          const newTeamName = generateTeamName(electricalLeadId, assemblyLeadId);
          form.setValue('teamName', newTeamName);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Update team leads mutation
  const updateTeamLeadsMutation = useMutation({
    mutationFn: async (values: TeamLeadFormValues) => {
      setIsLoading(true);
      
      // Handle "none" value
      const electricalLeadId = values.electricalLeadId === "none" ? null : values.electricalLeadId;
      const assemblyLeadId = values.assemblyLeadId === "none" ? null : values.assemblyLeadId;
      
      const electricalLeadMember = electricalLeadId ? allAvailableMembers.find(m => m.id === electricalLeadId) : null;
      const assemblyLeadMember = assemblyLeadId ? allAvailableMembers.find(m => m.id === assemblyLeadId) : null;
      
      // Create lead objects with essential properties
      const electricalLead = electricalLeadMember ? {
        id: electricalLeadMember.id,
        name: electricalLeadMember.name,
        role: electricalLeadMember.role,
        email: electricalLeadMember.email,
      } : null;
      
      const assemblyLead = assemblyLeadMember ? {
        id: assemblyLeadMember.id,
        name: assemblyLeadMember.name,
        role: assemblyLeadMember.role,
        email: assemblyLeadMember.email,
      } : null;
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: values.teamName,
          electricalLead,
          assemblyLead,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update team leads");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: "Team leads assigned successfully",
      });
      onOpenChange(false);
      setIsLoading(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign team leads",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  // Handle form submission
  const onSubmit = (values: TeamLeadFormValues) => {
    updateTeamLeadsMutation.mutate(values);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            Assign Team Leads
          </DialogTitle>
          <DialogDescription>
            Assign Electrical and Assembly leads for {productionLine.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Team Name" />
                  </FormControl>
                  <FormDescription>
                    Team name is auto-generated from lead last names, but can be customized
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Electrical Lead selection */}
              <FormField
                control={form.control}
                name="electricalLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Electrical Lead
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Electrical Lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {allAvailableMembers
                          .filter(member => 
                            ["Engineer", "Electrical Engineer", "Lead Engineer", "Technician"]
                            .includes(member.role)
                          )
                          .map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assembly Lead selection */}
              <FormField
                control={form.control}
                name="assemblyLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Assembly Lead
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Assembly Lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {allAvailableMembers
                          .filter(member => 
                            ["Operator", "Technician", "Supervisor", "Assembly Technician"]
                            .includes(member.role)
                          )
                          .map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Current team structure display */}
            <div className="border rounded-md p-4 bg-secondary/10">
              <h3 className="text-sm font-medium mb-3">Current Team Structure</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-background/60 p-3 rounded-md shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Electrical Lead</div>
                  {electricalLead ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(electricalLead.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{electricalLead.name}</div>
                        <Badge variant="outline" className="text-xs">{electricalLead.role || "Engineer"}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Not assigned</div>
                  )}
                </div>
                
                <div className="bg-background/60 p-3 rounded-md shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Assembly Lead</div>
                  {assemblyLead ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(assemblyLead.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{assemblyLead.name}</div>
                        <Badge variant="outline" className="text-xs">{assemblyLead.role || "Technician"}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Not assigned</div>
                  )}
                </div>
              </div>
              
              <div className="text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-muted-foreground text-xs">
                  <p>Each production team requires an Electrical Lead and an Assembly Lead. The team name is automatically derived from the leads' last names.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning Leads...</>
                ) : (
                  'Assign Team Leads'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}