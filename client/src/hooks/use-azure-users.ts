import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "@/lib/msal-config";
import { useEffect } from "react";
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
}

const GYM_AI_ENGINE_GROUP_ID = 'e8dd9d7a-62e9-4142-b6e2-9491e1dac1e8';

export function useAzureUsers() {
  const { instance, accounts } = useMsal();
  const queryClient = useQueryClient();

  const getAccessToken = async () => {
    if (accounts[0]) {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
          scopes: ["GroupMember.Read.All", "User.Read.All"]
        });
        return response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          const response = await instance.acquireTokenPopup({
            ...loginRequest,
            scopes: ["GroupMember.Read.All", "User.Read.All"]
          });
          return response.accessToken;
        }
        throw error;
      }
    }
    throw new Error("No authenticated account");
  };

  const fetchGroupMembers = async (): Promise<AzureADUser[]> => {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/groups/${GYM_AI_ENGINE_GROUP_ID}/members?$select=id,displayName,mail,userPrincipalName`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch group members from Azure AD");
    }

    const data = await response.json();

    // Fetch online status from our backend
    const onlineStatusResponse = await fetch('/api/users/online-status', {
      credentials: 'include'
    });
    const onlineUsers = onlineStatusResponse.ok ? await onlineStatusResponse.json() : [];

    return data.value.map((user: any) => ({
      id: user.id,
      displayName: user.displayName,
      mail: user.mail || user.userPrincipalName,
      userPrincipalName: user.userPrincipalName,
      presence: {
        status: onlineUsers.includes(user.id) ? 'online' : 'offline',
        lastSeen: onlineUsers.includes(user.id) ? new Date() : undefined
      }
    }));
  };

  // Setup real-time presence updates
  useEffect(() => {
    const socket = io('/', {
      query: {
        userId: accounts[0]?.homeAccountId,
      },
    });

    socket.on('ONLINE_USERS_UPDATE', (data: { users: string[] }) => {
      queryClient.setQueryData<AzureADUser[]>(
        ['azureGroupMembers'],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(user => ({
            ...user,
            presence: {
              status: data.users.includes(user.id) ? 'online' : 'offline',
              lastSeen: data.users.includes(user.id) ? new Date() : user.presence.lastSeen,
            }
          }));
        }
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [accounts, queryClient]);

  const { data: users, error, isLoading } = useQuery<AzureADUser[], Error>({
    queryKey: ["azureGroupMembers"],
    queryFn: fetchGroupMembers,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: false,
  });

  return {
    users,
    error,
    isLoading,
  };
}