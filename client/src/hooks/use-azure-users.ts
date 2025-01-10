import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "@/lib/msal-config";
import { useEffect, useState, useCallback } from "react";
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

// For testing purposes, we'll use some mock users
const mockUsers: AzureADUser[] = [
  {
    id: '1',
    displayName: 'John Smith',
    mail: 'john.smith@company.com',
    userPrincipalName: 'john.smith',
    presence: { status: 'offline' }
  },
  {
    id: '2',
    displayName: 'Alice Johnson',
    mail: 'alice.johnson@company.com',
    userPrincipalName: 'alice.johnson',
    presence: { status: 'offline' }
  },
  {
    id: '3',
    displayName: 'Bob Wilson',
    mail: 'bob.wilson@company.com',
    userPrincipalName: 'bob.wilson',
    presence: { status: 'offline' }
  }
];

export function useAzureUsers() {
  const { instance, accounts } = useMsal();
  const [users, setUsers] = useState<AzureADUser[]>(mockUsers);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUserPresence = useCallback((userId: string, status: 'online' | 'offline') => {
    setUsers(currentUsers => 
      currentUsers.map(user => 
        user.id === userId
          ? {
              ...user,
              presence: {
                status,
                lastSeen: status === 'online' ? new Date() : user.presence.lastSeen,
              }
            }
          : user
      )
    );
  }, []);

  useEffect(() => {
    let socket: ReturnType<typeof io>;

    try {
      socket = io('/', {
        query: {
          userId: accounts[0]?.homeAccountId || '1', // Use mock ID if not authenticated
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
        setUsers(currentUsers => 
          currentUsers.map(user => ({
            ...user,
            presence: {
              status: data.users.includes(user.id) ? 'online' : 'offline',
              lastSeen: data.users.includes(user.id) ? new Date() : user.presence.lastSeen,
            }
          }))
        );
      });

      // Simulate John Smith being online for testing
      setTimeout(() => {
        updateUserPresence('1', 'online');
      }, 1000);

      setIsLoading(false);
    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize presence service'));
      setIsLoading(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [accounts, updateUserPresence]);

  return {
    users,
    error,
    isLoading,
  };
}