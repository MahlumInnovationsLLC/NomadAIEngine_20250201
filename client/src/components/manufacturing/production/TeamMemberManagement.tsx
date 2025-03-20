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
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, Trash2, Edit, Info, Pencil, ChevronRight } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberDetailsDialogOpen, setMemberDetailsDialogOpen] = useState(false);
  
  // Reset form when selected member changes
  useEffect(() => {
    if (selectedMember && isEditing) {
      form.reset({
        name: selectedMember.name,
        role: selectedMember.role,
        skills: selectedMember.skills?.join(", ") || "",
        yearsExperience: selectedMember.yearsExperience || 0,
        certifications: selectedMember.certifications?.join(", ") || "",
        availability: selectedMember.availability || 100,
      });
    } else if (!isEditing) {
      form.reset({
        name: "",
        role: "Operator",
        skills: "",
        yearsExperience: 0,
        certifications: "",
        availability: 100,
      });
    }
  }, [selectedMember, isEditing]);
  
  // Set up form
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
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
      const skills = values.skills ? values.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
      const certifications = values.certifications ? values.certifications.split(",").map(c => c.trim()).filter(Boolean) : [];
      
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
    onSuccess: (data) => {
      // Invalidate the entire production-lines query first
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      
      // Also specifically invalidate this exact production line to ensure it refreshes
      queryClient.invalidateQueries({ 
        queryKey: [`/api/manufacturing/production-lines/${productionLine.id}`] 
      });
      
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      
      // Reset the form
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

  // Update team member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (values: TeamMemberFormValues & { id: string }) => {
      if (!selectedMember) throw new Error("No member selected for update");
      
      // Convert string fields to arrays
      const skills = values.skills ? values.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
      const certifications = values.certifications ? values.certifications.split(",").map(c => c.trim()).filter(Boolean) : [];
      
      // Create updated team member object
      const updatedMember: TeamMember = {
        id: values.id,
        name: values.name,
        role: values.role,
        skills: skills.length > 0 ? skills : undefined,
        yearsExperience: values.yearsExperience,
        certifications: certifications.length > 0 ? certifications : undefined,
        availability: values.availability,
      };
      
      // Update the team members array with the modified member
      const updatedTeamMembers = productionLine.teamMembers?.map(member => 
        member.id === updatedMember.id ? updatedMember : member
      ) || [];
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamMembers: updatedTeamMembers,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update team member");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the entire production-lines query first
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/production-lines'] });
      
      // Also specifically invalidate this exact production line to ensure it refreshes
      queryClient.invalidateQueries({ 
        queryKey: [`/api/manufacturing/production-lines/${productionLine.id}`] 
      });
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
      setIsEditing(false);
      setSelectedMember(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team member",
        variant: "destructive",
      });
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!productionLine.teamMembers) throw new Error("No team members to delete from");
      
      // Filter out the member to delete
      const updatedTeamMembers = productionLine.teamMembers.filter(member => member.id !== memberId);
      const currentManpower = updatedTeamMembers.length;
      
      console.log("Deleting member with ID:", memberId);
      console.log("Updated team members:", updatedTeamMembers);
      
      const response = await fetch(`/api/manufacturing/production-lines/${productionLine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamMembers: updatedTeamMembers,
          currentManpower: currentManpower,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete team member");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Delete successful, invalidating queries");
      
      // Force a refetch of all production line data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/production-lines'],
        refetchType: 'all'
      });
      
      // Force a refetch of this specific production line
      queryClient.invalidateQueries({ 
        queryKey: [`/api/manufacturing/production-lines/${productionLine.id}`],
        refetchType: 'all'
      });
      
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
      
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting team member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for add/update
  const onSubmit = (values: TeamMemberFormValues) => {
    if (isEditing && selectedMember) {
      updateMemberMutation.mutate({ ...values, id: selectedMember.id });
    } else {
      addMemberMutation.mutate(values);
    }
  };

  // Handle starting the edit process
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditing(true);
  };

  // Handle canceling the edit
  const handleCancelEdit = () => {
    setSelectedMember(null);
    setIsEditing(false);
    form.reset();
  };

  // Handle deletion confirmation
  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      console.log("Confirming deletion of member:", memberToDelete);
      deleteMemberMutation.mutate(memberToDelete.id);
      // Immediately close the dialog to improve UX
      setDeleteDialogOpen(false);
    }
  };

  // Prepare for deleting a member
  const handleDeleteMember = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };
  
  // Handle viewing member details
  const handleViewMemberDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setMemberDetailsDialogOpen(true);
  };

  // Check if we're in a loading state
  const isLoading = addMemberMutation.isPending || updateMemberMutation.isPending || deleteMemberMutation.isPending;

  // Function to determine if current members exceed capacity
  const isOverCapacity = (productionLine.teamMembers?.length || 0) >= (productionLine.manpowerCapacity || 10);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {productionLine.teamName ? `${productionLine.teamName} Team Members` : `Team Members for ${productionLine.name}`}
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
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Current Team Members</h3>
                <Badge variant="outline" className="text-xs">
                  {productionLine.teamMembers?.length || 0}/{productionLine.manpowerCapacity || 10}
                </Badge>
              </div>
              
              {productionLine.teamMembers && productionLine.teamMembers.length > 0 ? (
                <div className="h-[350px] overflow-y-auto border rounded-md divide-y">
                  {productionLine.teamMembers.map((member) => (
                    <div key={member.id} className="p-3 text-sm hover:bg-secondary/10 cursor-pointer" onClick={() => handleViewMemberDetails(member)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {member.role}
                            </Badge>
                            {member.yearsExperience !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {member.yearsExperience} yr{member.yearsExperience !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {member.skills && member.skills.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                              {member.skills.slice(0, 2).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-1">
                                  {skill}
                                </Badge>
                              ))}
                              {member.skills.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1">
                                  +{member.skills.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            <span>Click to view details</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMember(member);
                                }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit member</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMember(member);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove member</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center border rounded-md bg-secondary/20">
                  <div className="text-center p-4">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No team members yet</p>
                    <p className="text-xs text-muted-foreground mt-2">Add team members using the form</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add/Edit Team Member Form */}
            <div className="space-y-4">
              <h3 className="font-medium">
                {isEditing ? `Edit Team Member: ${selectedMember?.name}` : "Add Team Member"}
              </h3>
              
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
                          value={field.value}
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
                            <SelectItem value="Quality Control">Quality Control</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
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

                  <div className="flex gap-2 pt-2">
                    {isEditing ? (
                      <>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1" 
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1" 
                          disabled={isLoading}
                        >
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Member
                        </Button>
                      </>
                    ) : (
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading || isOverCapacity}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isOverCapacity ? "Team At Capacity" : "Add Team Member"}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              {/* Key team roles info */}
              <div className="mt-4 border rounded-md p-3 bg-secondary/20">
                <h4 className="text-sm font-medium mb-2">Team Leadership</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Electrical Lead:</span>
                    <span className="font-medium">
                      {productionLine.electricalLead?.name || "Not assigned"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Assembly Lead:</span>
                    <span className="font-medium">
                      {productionLine.assemblyLead?.name || "Not assigned"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>Note: Team leads are managed through the team settings</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Member Details Dialog */}
      <Dialog open={memberDetailsDialogOpen} onOpenChange={setMemberDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              Team Member Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-5">
              {/* Basic Info */}
              <div className="bg-secondary/10 p-4 rounded-md space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold">
                    {selectedMember.name
                      .split(" ")
                      .map(n => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className="mt-1">{selectedMember.role}</Badge>
                      {selectedMember.yearsExperience !== undefined && (
                        <Badge variant="outline" className="mt-1">
                          {selectedMember.yearsExperience} {selectedMember.yearsExperience === 1 ? 'year' : 'years'} experience
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {selectedMember.availability !== undefined && (
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-1 block">Availability</div>
                    <div className="h-2.5 w-full bg-secondary/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${selectedMember.availability}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">0%</span>
                      <span className="text-xs font-medium">{selectedMember.availability}%</span>
                      <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                {selectedMember.skills && selectedMember.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No skills listed</div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h4 className="text-sm font-medium mb-2">Certifications</h4>
                {selectedMember.certifications && selectedMember.certifications.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedMember.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2 bg-secondary/10 p-2 rounded-md">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No certifications listed</div>
                )}
              </div>

              {/* Team Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Team Assignment</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Team Name:</div>
                  <div className="font-medium">{productionLine.teamName || productionLine.name}</div>
                  
                  <div className="text-muted-foreground">Electrical Lead:</div>
                  <div className="font-medium">{productionLine.electricalLead?.name || "Not assigned"}</div>
                  
                  <div className="text-muted-foreground">Assembly Lead:</div>
                  <div className="font-medium">{productionLine.assemblyLead?.name || "Not assigned"}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMemberDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedMember && (
              <>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setMemberDetailsDialogOpen(false);
                    setTimeout(() => handleEditMember(selectedMember), 100);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Member
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setMemberDetailsDialogOpen(false);
                    setTimeout(() => handleDeleteMember(selectedMember), 100);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.name} from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteMemberMutation.isPending}
              onClick={() => {
                console.log("Canceling delete operation");
                setDeleteDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                console.log("Delete confirmation button clicked");
                handleDeleteConfirm();
              }}
              disabled={deleteMemberMutation.isPending}
              variant="destructive"
            >
              {deleteMemberMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...</>
              ) : (
                "Remove"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}