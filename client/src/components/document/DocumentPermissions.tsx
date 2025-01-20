import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: number;
  roleLevel: number;
  permissions: {
    view: boolean;
    edit: boolean;
    review: boolean;
    approve: boolean;
    manage: boolean;
  };
}

interface Role {
  id: number;
  name: string;
  level: number;
}

interface DocumentPermissionsProps {
  documentId: string;
}

export function DocumentPermissions({ documentId }: DocumentPermissionsProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: [`/api/documents/${documentId}/permissions`],
    enabled: !!documentId,
  });

  // Fetch available roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    enabled: true,
  });

  const addPermissionMutation = useMutation({
    mutationFn: async (roleLevel: number) => {
      const response = await fetch(`/api/documents/${documentId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleLevel }),
      });
      if (!response.ok) throw new Error('Failed to add permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/permissions`] });
      toast({
        title: "Permission added",
        description: "Role permission has been added successfully",
      });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ permissionId, updates }: { permissionId: number, updates: any }) => {
      const response = await fetch(`/api/documents/${documentId}/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/permissions`] });
      toast({
        title: "Permissions updated",
        description: "Role permissions have been updated successfully",
      });
    },
  });

  const handleAddRole = () => {
    if (!selectedRole) return;
    const role = roles?.find(r => r.id.toString() === selectedRole);
    if (role) {
      addPermissionMutation.mutate(role.level);
      setSelectedRole("");
    }
  };

  const handlePermissionChange = (permissionId: number, field: string, value: boolean) => {
    updatePermissionMutation.mutate({
      permissionId,
      updates: {
        [field]: value,
      },
    });
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon icon="shield" className="h-5 w-5" />
          Document Permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new role permission */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Add Role Permission</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddRole}
              disabled={!selectedRole || addPermissionMutation.isPending}
            >
              <FontAwesomeIcon icon="plus" className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>

          {/* Permissions table */}
          <div className="border rounded-lg">
            <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50">
              <div>Role</div>
              <div className="text-center">View</div>
              <div className="text-center">Edit</div>
              <div className="text-center">Review</div>
              <div className="text-center">Approve</div>
              <div className="text-center">Manage</div>
            </div>
            <div className="divide-y">
              {permissions?.map((permission) => {
                const role = roles?.find(r => r.level === permission.roleLevel);
                return (
                  <div key={permission.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                    <div>{role?.name || `Level ${permission.roleLevel}`}</div>
                    <div className="text-center">
                      <Checkbox
                        checked={permission.permissions.view}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.id, 'view', checked as boolean)
                        }
                      />
                    </div>
                    <div className="text-center">
                      <Checkbox
                        checked={permission.permissions.edit}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.id, 'edit', checked as boolean)
                        }
                      />
                    </div>
                    <div className="text-center">
                      <Checkbox
                        checked={permission.permissions.review}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.id, 'review', checked as boolean)
                        }
                      />
                    </div>
                    <div className="text-center">
                      <Checkbox
                        checked={permission.permissions.approve}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.id, 'approve', checked as boolean)
                        }
                      />
                    </div>
                    <div className="text-center">
                      <Checkbox
                        checked={permission.permissions.manage}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.id, 'manage', checked as boolean)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}