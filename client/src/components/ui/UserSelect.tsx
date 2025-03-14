import { useState, useEffect } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "./font-awesome-icon";
import { useToast } from "@/hooks/use-toast";
import { fetchAzureADUsers, type AzureADUser } from "../../services/azure-ad";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  name?: string; // Added for Azure AD users
  department?: string;
  jobTitle?: string;
}

interface UserSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  defaultType?: 'members' | 'team' | 'azure';
}

export function UserSelect({
  value,
  onValueChange,
  label,
  placeholder = "Select user",
  disabled = false,
  error,
  required = false,
  defaultType = 'azure' // Changed default to 'azure'
}: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchType, setFetchType] = useState<'members' | 'team' | 'azure'>(defaultType);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let data: User[] = [];
        
        if (fetchType === 'azure') {
          try {
            // Use our Azure AD service
            const azureUsers = await fetchAzureADUsers();
            if (azureUsers && azureUsers.length > 0) {
              data = azureUsers;
            } else {
              console.warn('No Azure AD users found, attempting fallback to team members');
              // Automatic fallback to team members if Azure AD fails
              setFetchType('team');
              toast({
                title: "Notice",
                description: "Switched to team data source due to Azure AD unavailability"
              });
              return; // The changed fetchType will trigger this effect again
            }
          } catch (azureError) {
            console.error('Azure AD error:', azureError);
            // Automatic fallback to team members
            setFetchType('team');
            toast({
              title: "Notice", 
              description: "Switched to team data source due to Azure AD error"
            });
            return; // The changed fetchType will trigger this effect again
          }
        } else if (fetchType === 'members') {
          const response = await fetch('/api/members');
          if (response.ok) {
            data = await response.json();
          } else {
            console.error('Failed to fetch members');
            toast({
              title: "Warning",
              description: "Failed to fetch members data"
            });
          }
        } else {
          const response = await fetch('/api/manufacturing/resources/team');
          if (response.ok) {
            data = await response.json();
          } else {
            console.error('Failed to fetch team members');
            toast({
              title: "Warning",
              description: "Failed to fetch team members data"
            });
          }
        }
        
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "An error occurred while fetching users"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [fetchType, toast]);

  // Format name - get full name from either members or team member data
  const formatName = (user: User) => {
    if (user.name) {
      return user.name;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Unknown User";
  };

  // Get initials for avatar fallback
  const getInitials = (user: User) => {
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return "??";
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between">
          <label className="text-sm font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">Source:</span>
            <select
              className="text-xs border rounded px-1 py-0.5 text-muted-foreground hover:text-primary bg-transparent transition-colors"
              value={fetchType}
              onChange={(e) => setFetchType(e.target.value as 'azure' | 'members' | 'team')}
            >
              <option value="azure">Azure AD</option>
              <option value="members">Members</option>
              <option value="team">Team</option>
            </select>
          </div>
        </div>
      )}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <SelectItem 
                key={user.id} 
                value={user.id.toString()}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{formatName(user)}</span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-muted-foreground">
              No users found
            </div>
          )}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}