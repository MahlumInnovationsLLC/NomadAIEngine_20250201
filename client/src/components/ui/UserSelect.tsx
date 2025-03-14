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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface UserSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  defaultType?: 'members' | 'team';
}

export function UserSelect({
  value,
  onValueChange,
  label,
  placeholder = "Select user",
  disabled = false,
  error,
  required = false,
  defaultType = 'team'
}: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchType, setFetchType] = useState<'members' | 'team'>(defaultType);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let response;
        if (fetchType === 'members') {
          response = await fetch('/api/members');
        } else {
          response = await fetch('/api/manufacturing/resources/team');
        }
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [fetchType]);

  // Format name - get full name from either members or team member data
  const formatName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    // For team members that might have a different structure
    if ((user as any).name) {
      return (user as any).name;
    }
    return user.email || "Unknown User";
  };

  // Get initials for avatar fallback
  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if ((user as any).name) {
      const nameParts = (user as any).name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
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
          <button 
            type="button"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setFetchType(fetchType === 'members' ? 'team' : 'members')}
          >
            Switch to {fetchType === 'members' ? 'team members' : 'all members'}
          </button>
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