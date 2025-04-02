import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Define the schema for engineer form
const engineerFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  department: z.string({
    required_error: "Please select a department.",
  }),
  role: z.string().min(2, {
    message: "Role must be at least 2 characters.",
  }),
  isTeamLead: z.boolean().default(false),
  notificationPreferences: z.object({
    emailNotifications: z.boolean().default(true),
    redlineAssignments: z.boolean().default(true),
    projectUpdates: z.boolean().default(true),
  }),
});

// Mock data for engineers (would be replaced with actual API data)
const mockEngineers = [
  {
    id: "ENG-001",
    firstName: "Elizabeth",
    lastName: "Parker",
    email: "e.parker@example.com",
    department: "Electrical",
    role: "Senior Electrical Engineer",
    isTeamLead: true,
    status: "Active",
    notificationPreferences: {
      emailNotifications: true,
      redlineAssignments: true,
      projectUpdates: true,
    }
  },
  {
    id: "ENG-002",
    firstName: "Robert",
    lastName: "Chen",
    email: "r.chen@example.com",
    department: "Mechanical",
    role: "Lead Mechanical Engineer",
    isTeamLead: true,
    status: "Active",
    notificationPreferences: {
      emailNotifications: true,
      redlineAssignments: true,
      projectUpdates: false,
    }
  },
  {
    id: "ENG-003",
    firstName: "David",
    lastName: "Garcia",
    email: "d.garcia@example.com",
    department: "IT",
    role: "Network Infrastructure Lead",
    isTeamLead: true,
    status: "Active",
    notificationPreferences: {
      emailNotifications: true,
      redlineAssignments: false,
      projectUpdates: true,
    }
  },
  {
    id: "ENG-004",
    firstName: "Alex",
    lastName: "Chen",
    email: "a.chen@example.com",
    department: "NTC",
    role: "Software Development Manager",
    isTeamLead: true,
    status: "Active",
    notificationPreferences: {
      emailNotifications: true,
      redlineAssignments: true,
      projectUpdates: true,
    }
  },
  {
    id: "ENG-005",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "s.johnson@example.com",
    department: "Electrical",
    role: "Electrical Engineer",
    isTeamLead: false,
    status: "Active",
    notificationPreferences: {
      emailNotifications: true,
      redlineAssignments: true,
      projectUpdates: true,
    }
  },
  {
    id: "ENG-006",
    firstName: "Mark",
    lastName: "Williams",
    email: "m.williams@example.com",
    department: "Mechanical",
    role: "CAD Specialist",
    isTeamLead: false,
    status: "On Leave",
    notificationPreferences: {
      emailNotifications: false,
      redlineAssignments: false,
      projectUpdates: false,
    }
  },
];

export default function EngineerUserListPanel() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<any>(null);
  const [engineers, setEngineers] = useState(mockEngineers);

  // Setup form with validation
  const form = useForm<z.infer<typeof engineerFormSchema>>({
    resolver: zodResolver(engineerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      role: "",
      isTeamLead: false,
      notificationPreferences: {
        emailNotifications: true,
        redlineAssignments: true,
        projectUpdates: true,
      },
    },
  });

  // Handle form submission for new engineer
  const onSubmit = (values: z.infer<typeof engineerFormSchema>) => {
    // Here you would normally send the data to your API
    console.log("Form submitted:", values);

    // For demo purposes, we'll add to our local state
    const newEngineer = {
      id: `ENG-${(engineers.length + 1).toString().padStart(3, '0')}`,
      ...values,
      status: "Active"
    };

    setEngineers([...engineers, newEngineer]);

    // Show success toast and close dialog
    toast({
      title: "Engineer added successfully",
      description: `${values.firstName} ${values.lastName} has been added to the team.`,
    });

    setIsAddDialogOpen(false);
    form.reset();
  };

  // Handle edit engineer
  const handleEditEngineer = (engineer: any) => {
    setSelectedEngineer(engineer);
    
    // Populate form with engineer data
    form.reset({
      firstName: engineer.firstName,
      lastName: engineer.lastName,
      email: engineer.email,
      department: engineer.department,
      role: engineer.role,
      isTeamLead: engineer.isTeamLead,
      notificationPreferences: {
        emailNotifications: engineer.notificationPreferences.emailNotifications,
        redlineAssignments: engineer.notificationPreferences.redlineAssignments,
        projectUpdates: engineer.notificationPreferences.projectUpdates,
      },
    });
    
    setIsEditDialogOpen(true);
  };

  // Handle update engineer
  const onUpdate = (values: z.infer<typeof engineerFormSchema>) => {
    if (!selectedEngineer) return;

    // Update the engineer in our local state
    const updatedEngineers = engineers.map(eng => 
      eng.id === selectedEngineer.id 
        ? { ...eng, ...values } 
        : eng
    );

    setEngineers(updatedEngineers);

    // Show success toast and close dialog
    toast({
      title: "Engineer updated successfully",
      description: `${values.firstName} ${values.lastName}'s information has been updated.`,
    });

    setIsEditDialogOpen(false);
    setSelectedEngineer(null);
    form.reset();
  };

  // Filter for team leads only
  const [showTeamLeadsOnly, setShowTeamLeadsOnly] = useState(false);
  const filteredEngineers = showTeamLeadsOnly 
    ? engineers.filter(eng => eng.isTeamLead) 
    : engineers;

  // Department filter
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const departmentFilteredEngineers = departmentFilter === "All"
    ? filteredEngineers
    : filteredEngineers.filter(eng => eng.department === departmentFilter);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Engineering Team Members</CardTitle>
              <CardDescription>
                Manage engineers, team leads, and notification preferences
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FontAwesomeIcon icon="user-plus" className="mr-2 h-4 w-4" />
                  Add Engineer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Add New Engineer</DialogTitle>
                  <DialogDescription>
                    Add a new engineer to the team and set their notification preferences.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Mechanical">Mechanical</SelectItem>
                                <SelectItem value="IT">IT</SelectItem>
                                <SelectItem value="NTC">NTC</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role/Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Engineer title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isTeamLead"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Team Lead</FormLabel>
                            <FormDescription>
                              Designate this person as a department team lead
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="notificationPreferences.emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Email Notifications</FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notificationPreferences.redlineAssignments"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Redline Assignments</FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notificationPreferences.projectUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Project Updates</FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Engineer</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="team-lead-filter"
                checked={showTeamLeadsOnly}
                onCheckedChange={setShowTeamLeadsOnly}
              />
              <label htmlFor="team-lead-filter" className="text-sm font-medium">
                Show Team Leads Only
              </label>
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="NTC">NTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team Lead</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentFilteredEngineers.map((engineer) => (
                <TableRow key={engineer.id}>
                  <TableCell className="font-medium">{engineer.firstName} {engineer.lastName}</TableCell>
                  <TableCell>{engineer.department}</TableCell>
                  <TableCell>{engineer.role}</TableCell>
                  <TableCell>
                    <Badge variant={engineer.status === "Active" ? "outline" : "secondary"}>
                      {engineer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {engineer.isTeamLead ? (
                      <Badge variant="default">Team Lead</Badge>
                    ) : "No"}
                  </TableCell>
                  <TableCell>{engineer.email}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FontAwesomeIcon icon="ellipsis-vertical" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEngineer(engineer)}>
                          <FontAwesomeIcon icon="edit" className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="envelope" className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FontAwesomeIcon icon="user-slash" className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Engineer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Engineer</DialogTitle>
            <DialogDescription>
              Update engineer information and notification preferences.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Mechanical">Mechanical</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="NTC">NTC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role/Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Engineer title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isTeamLead"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Team Lead</FormLabel>
                      <FormDescription>
                        Designate this person as a department team lead
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="notificationPreferences.emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Email Notifications</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notificationPreferences.redlineAssignments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Redline Assignments</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notificationPreferences.projectUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Project Updates</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedEngineer(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit">Update Engineer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}