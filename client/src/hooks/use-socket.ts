import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Create separate socket instances for different namespaces
let mainSocket: Socket | null = null;
let manufacturingSocket: Socket | null = null;

/**
 * Hook for accessing the Socket.IO connection
 * @param namespace Optional namespace to connect to (e.g. 'manufacturing')
 * @returns Socket instance for the requested namespace
 */
export function useSocket(namespace?: string) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine which socket to use based on namespace
    let socket: Socket | null = null;
    
    if (namespace === 'manufacturing') {
      // Create manufacturing namespace socket if it doesn't exist
      if (!manufacturingSocket) {
        manufacturingSocket = io('/manufacturing');
        
        manufacturingSocket.on('connect', () => {
          console.log('Manufacturing socket connected');
          setIsConnected(true);
        });
        
        manufacturingSocket.on('disconnect', () => {
          console.log('Manufacturing socket disconnected');
          setIsConnected(false);
        });
        
        manufacturingSocket.on('error', (error) => {
          console.error('Manufacturing socket error:', error);
        });
      }
      socket = manufacturingSocket;
    } else {
      // Use the main socket for default namespace
      if (!mainSocket) {
        mainSocket = io();
        
        mainSocket.on('connect', () => {
          console.log('Main socket connected');
          setIsConnected(true);
        });
        
        mainSocket.on('disconnect', () => {
          console.log('Main socket disconnected');
          setIsConnected(false);
        });
        
        mainSocket.on('error', (error) => {
          console.error('Main socket error:', error);
        });
      }
      socket = mainSocket;
    }

    // Cleanup function
    return () => {
      // We don't disconnect the socket when component unmounts
      // because we want to maintain the connection across components
    };
  }, [namespace]);

  // Return the appropriate socket based on namespace
  return namespace === 'manufacturing' ? manufacturingSocket : mainSocket;
}