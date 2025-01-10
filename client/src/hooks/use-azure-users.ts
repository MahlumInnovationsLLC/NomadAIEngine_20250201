import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "@/lib/msal-config";

interface AzureADUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export function useAzureUsers() {
  const { instance, accounts } = useMsal();
  const queryClient = useQueryClient();

  const getAccessToken = async () => {
    if (accounts[0]) {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
          scopes: ["User.Read.All"]
        });
        return response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          const response = await instance.acquireTokenPopup({
            ...loginRequest,
            scopes: ["User.Read.All"]
          });
          return response.accessToken;
        }
        throw error;
      }
    }
    throw new Error("No authenticated account");
  };

  const fetchUsers = async (): Promise<AzureADUser[]> => {
    const accessToken = await getAccessToken();
    const response = await fetch("https://graph.microsoft.com/v1.0/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users from Azure AD");
    }

    const data = await response.json();
    return data.value.map((user: any) => ({
      id: user.id,
      displayName: user.displayName,
      mail: user.mail || user.userPrincipalName,
      userPrincipalName: user.userPrincipalName,
    }));
  };

  const { data: users, error, isLoading } = useQuery<AzureADUser[], Error>({
    queryKey: ["azureUsers"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: false,
  });

  return {
    users,
    error,
    isLoading,
  };
}
