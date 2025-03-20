import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection if it doesn't exist
    if (!socket) {
      // Connect to the same host that serves the app
      // This assumes your Socket.IO server runs on the same host
      socket = io();

      // Set up event listeners
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    // Cleanup function
    return () => {
      // We don't disconnect the socket when component unmounts
      // because we want to maintain the connection across components
      // The socket will be disconnected when the browser tab is closed
    };
  }, []);

  return socket;
}