import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

interface UseWebSocketOptions {
  namespace?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const namespace = options.namespace ? `/${options.namespace}` : '';
    const newSocket = io(window.location.origin + namespace, {
      withCredentials: true,
      query: {
        userId: '1', // This should be replaced with actual user ID from auth context
      },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected to namespace:', namespace || 'default');
      // Join the user's room
      newSocket.emit('presence:join', {
        userId: '1', // Replace with actual user ID
        name: 'User' // Replace with actual user name
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    // Common event handlers
    newSocket.on('ONLINE_USERS_UPDATE', (data) => {
      console.log('Online users updated:', data);
    });

    newSocket.on('presence:update', (users) => {
      console.log('User presence updated:', users);
    });

    newSocket.on('notification:new', (notification) => {
      console.log('New notification received:', notification);
    });

    newSocket.on('notification:read', (data) => {
      console.log('Notification marked as read:', data);
    });

    newSocket.on('training:level', (level) => {
      console.log('Training level updated:', level);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.off('ONLINE_USERS_UPDATE');
        newSocket.off('presence:update');
        newSocket.off('notification:new');
        newSocket.off('notification:read');
        newSocket.off('training:level');
        newSocket.close();
      }
    };
  }, [options.namespace]);

  return socket;
}

// Example usage for manufacturing namespace:
// const socket = useWebSocket({ namespace: 'manufacturing' });