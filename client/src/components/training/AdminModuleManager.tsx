import { useState } from "react";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface ModuleAssignment {
  userId: string;
  moduleId: string;
}

export function AdminModuleManager() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ['/api/team/members'],
  });

  const { data: modules } = useQuery<any[]>({
    queryKey: ['/api/training/modules'],
  });

  const handleAssignModule = async () => {
    if (!selectedUser || !selectedModule) {
      toast({
        title: "Error",
        description: "Please select both a team member and a module",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/training/assign-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          moduleId: selectedModule,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign module');

      toast({
        title: "Success",
        description: "Module assigned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign module",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Training Modules</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Team Member</label>
            <Select onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Training Module</label>
            <Select onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {modules?.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAssignModule} className="w-full">
            Assign Module
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
