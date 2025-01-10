import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "@/lib/msal-config";
import { useEffect, useState } from "react";
import io from "socket.io-client";

interface AzureADUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  presence: {
    status: 'online' | 'away' | 'offline';
    lastSeen?: Date;
  };
  trainingLevel?: {
    level: string;
    progress: number;
  };
}

// Azure AD group ID for GYM AI Engine users
const GYM_AI_ENGINE_GROUP_ID = process.env.VITE_AZURE_GROUP_ID;

export function useAzureUsers() {
  const { instance, accounts } = useMsal();
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Function to get Azure AD access token
  const getAccessToken = async () => {
    if (accounts[0]) {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
          scopes: ["GroupMember.Read.All", "User.Read.All", "Presence.Read.All"]
        });
        return response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          const response = await instance.acquireTokenPopup({
            ...loginRequest,
            scopes: ["GroupMember.Read.All", "User.Read.All", "Presence.Read.All"]
          });
          return response.accessToken;
        }
        throw error;
      }
    }
    throw new Error("No authenticated account");
  };

  // Fetch group members and their presence from Azure AD
  const fetchGroupMembers = async (): Promise<AzureADUser[]> => {
    try {
      const accessToken = await getAccessToken();

      // First, get group members
      const membersResponse = await fetch(
        `https://graph.microsoft.com/v1.0/groups/${GYM_AI_ENGINE_GROUP_ID}/members?$select=id,displayName,mail,userPrincipalName`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!membersResponse.ok) {
        throw new Error("Failed to fetch group members from Azure AD");
      }

      const membersData = await membersResponse.json();
      const users = membersData.value;

      // Then, get presence information for each user
      const presencePromises = users.map(async (user: any) => {
        try {
          const presenceResponse = await fetch(
            `https://graph.microsoft.com/v1.0/users/${user.id}/presence`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (presenceResponse.ok) {
            const presenceData = await presenceResponse.json();
            return {
              ...user,
              presence: {
                status: presenceData.availability === 'Available' ? 'online' : 'offline',
                lastSeen: new Date(),
              },
            } as AzureADUser;
          }
        } catch (error) {
          console.error(`Failed to fetch presence for user ${user.id}:`, error);
        }

        // Default to offline if presence fetch fails
        return {
          ...user,
          presence: {
            status: 'offline' as const,
          },
        } as AzureADUser;
      });

      const usersWithPresence = await Promise.all(presencePromises);

      // Sort users: online users first, then alphabetically by display name
      return usersWithPresence.sort((a, b) => {
        if (a.presence.status === b.presence.status) {
          return a.displayName.localeCompare(b.displayName);
        }
        return a.presence.status === 'online' ? -1 : 1;
      });
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  };

  // Query for fetching Azure AD users
  const { data: users, isLoading } = useQuery<AzureADUser[], Error>({
    queryKey: ["azureGroupMembers"],
    queryFn: fetchGroupMembers,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });

  // Setup WebSocket for real-time presence updates
  useEffect(() => {
    let socket: ReturnType<typeof io>;

    if (!users?.length) return;

    try {
      socket = io('/', {
        query: {
          userId: accounts[0]?.homeAccountId,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        setError(null);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(new Error('Failed to connect to presence service'));
      });

      socket.on('ONLINE_USERS_UPDATE', (data: { users: string[] }) => {
        queryClient.setQueryData<AzureADUser[]>(
          ["azureGroupMembers"],
          (currentUsers) => {
            if (!currentUsers) return currentUsers;

            // Update presence status for each user
            const updatedUsers = currentUsers.map(user => ({
              ...user,
              presence: {
                status: data.users.includes(user.id) ? 'online' : 'offline',
                lastSeen: data.users.includes(user.id) ? new Date() : user.presence.lastSeen,
              }
            }));

            // Sort: online users first, then alphabetically
            return updatedUsers.sort((a, b) => {
              if (a.presence.status === b.presence.status) {
                return a.displayName.localeCompare(b.displayName);
              }
              return a.presence.status === 'online' ? -1 : 1;
            });
          }
        );
      });

    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize presence service'));
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [accounts, users, queryClient]);

  return {
    users,
    error,
    isLoading,
  };
}