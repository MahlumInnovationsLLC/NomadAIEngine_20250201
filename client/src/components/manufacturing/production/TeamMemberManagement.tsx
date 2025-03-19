import { useState } from "react";
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
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, Trash2 } from "lucide-react";
import { ProductionLine, TeamMember } from "@/types/manufacturing";

// Define schema for team member form
const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  skills: z.string().optional(),
  yearsExperience: z.number().min(0, "Experience must be a positive number").optional(),
  certifications: z.string().optional(),
  availability: z.number().min(0, "Availability must be a positive number").max(100, "Availability cannot exceed 100%").optional(),
});

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

type TeamMemberManagementProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionLine: ProductionLine;
};

export function TeamMemberManagement({
  open,
  onOpenChange,
  productionLine,
}: TeamMemberManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Set up form
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: selectedMember 
      ? {
          name: selectedMember.name,
          role: selectedMember.role,
          skills: selectedMember.skills?.join(", ") || "",
          yearsExperience: selectedMember.yearsExperience || 0,
          certifications: selectedMember.certifications?.join(", ") || "",
          availability: selectedMember.availability || 100,
        }
      : {
          name: "",
          role: "Operator",
          skills: "",
          yearsExperience: 0,
          certifications: "",
          availability: 100,
        },
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (values: TeamMemberFormValues) => {
      // Convert string fields to arrays
      const skills = values.skills ? values.skills.split(",").map(s => s.trim()) : [];
      const certifications = values.certifications ? values.certifications.split(",").map(c => c.trim()) : [];
      
      // Create team member object
      const newMember: TeamMember = {
        id: crypto.randomUUID(), // Generate ID client-side for simplicity
        name: values.name,
        role: values.role,
        skills: skills.length > 0 ? skills : undefined,
        yearsExperience: values.yearsExperience,
        certifications: certifications.length > 0 ? certifications : undefined,
        availability: values.availability,
      };
      
      // Update the production line with the new team member
      const updatedTeamMembers = [...(productionLine.teamMembers || []), newMember];
      const currentManpower = updatedTeamMembers.length;
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...productionLine,
          teamMembers: updatedTeamMembers,
          currentManpower: currentManpower,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add team member");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: TeamMemberFormValues) => {
    addMemberMutation.mutate(values);
  };

  // Check if we're in a loading state
  const isLoading = addMemberMutation.isPending;

  // Function to determine if current members exceed capacity
  const isOverCapacity = (productionLine.teamMembers?.length || 0) >= (productionLine.manpowerCapacity || 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Team Members for {productionLine.name}
          </DialogTitle>
          <DialogDescription>
            {productionLine.teamName ? 
              `Manage team members for ${productionLine.teamName} under ${productionLine.electricalLead?.name || "No Electrical Lead"} and ${productionLine.assemblyLead?.name || "No Assembly Lead"}.` :
              `Manage team members for ${productionLine.name}.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Team Members List */}
          <div className="space-y-4">
            <h3 className="font-medium">Current Team Members</h3>
            
            {productionLine.teamMembers && productionLine.teamMembers.length > 0 ? (
              <div className="h-[300px] overflow-y-auto border rounded-md divide-y">
                {productionLine.teamMembers.map((member) => (
                  <div key={member.id} className="p-3 text-sm">
                    <div className="flex justify-between">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs bg-secondary text-secondary-foreground rounded-md px-2 py-1">
                        {member.role}
                      </div>
                    </div>
                    {member.skills && member.skills.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Skills: {member.skills.join(", ")}
                      </div>
                    )}
                    {member.yearsExperience !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Experience: {member.yearsExperience} years
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border rounded-md bg-secondary/20">
                <div className="text-center p-4">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No team members yet</p>
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Team Capacity: {productionLine.teamMembers?.length || 0}/{productionLine.manpowerCapacity || 10}
            </div>
          </div>

          {/* Add Team Member Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Add Team Member</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Operator">Operator</SelectItem>
                          <SelectItem value="Technician">Technician</SelectItem>
                          <SelectItem value="Engineer">Engineer</SelectItem>
                          <SelectItem value="Inspector">Inspector</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="Welding, Assembly, Testing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="ISO 9001, OSHA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isOverCapacity}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isOverCapacity ? "Team At Capacity" : "Add Team Member"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}