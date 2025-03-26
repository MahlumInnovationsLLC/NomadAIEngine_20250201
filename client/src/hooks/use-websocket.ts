import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';

interface UseWebSocketOptions {
  namespace?: string;
  debug?: boolean;
}

// Enhanced socket type with one-time event handling
interface EnhancedSocket extends Socket {
  oncePromise: <T = any>(event: string, timeout?: number) => Promise<T>;
}

// Singleton pattern to reuse socket connections across hook instances
const socketInstances: Record<string, EnhancedSocket> = {};

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<EnhancedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const namespace = options.namespace ? `/${options.namespace}` : '';
  const namespaceKey = namespace || 'default';
  const debug = options.debug || false;
  
  // Use a ref to track event listeners to avoid memory leaks
  const eventListenersRef = useRef<{event: string, handler: (...args: any[]) => void}[]>([]);

  // Promise-based one-time event handler
  const createOncePromise = useCallback((socketInstance: Socket) => {
    return <T = any>(event: string, timeout: number = 5000): Promise<T> => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          socketInstance.off(event, handleEvent);
          reject(new Error(`Socket event '${event}' timed out after ${timeout}ms`));
        }, timeout);
        
        const handleEvent = (data: T) => {
          clearTimeout(timeoutId);
          socketInstance.off(event, handleEvent);
          resolve(data);
        };
        
        socketInstance.on(event, handleEvent);
        
        // Track this event listener for cleanup if component unmounts
        eventListenersRef.current.push({ event, handler: handleEvent });
      });
    };
  }, []);

  useEffect(() => {
    console.log(`Setting up WebSocket for namespace: ${namespaceKey}`);
    
    // Use the existing socket instance or create a new one
    let socketInstance = socketInstances[namespaceKey] as EnhancedSocket | undefined;
    
    if (!socketInstance) {
      console.log(`Creating new socket instance for namespace: ${namespaceKey}`);
      
      // For Replit environment, use the current URL as the base
      let socketUrl = window.location.origin;
      
      // Create socket with more permissive CORS settings for Replit
      socketInstance = io(socketUrl + namespace, {
        withCredentials: true,
        query: {
          userId: '1', // This should be replaced with actual user ID from auth context
        },
        transports: ['polling', 'websocket'], // Polling first as a fallback strategy for Replit
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10, // Increased for Replit environment
        timeout: 20000 // Increased timeout for Replit environment
      }) as EnhancedSocket;
      
      // Enhance the socket with the oncePromise method
      socketInstance.oncePromise = createOncePromise(socketInstance);
      
      // Store the socket in our instances map
      socketInstances[namespaceKey] = socketInstance;
      
      // Add global event handlers
      socketInstance.on('connect', () => {
        console.log(`Socket connected to namespace: ${namespaceKey}`);
        // Join the user's room
        socketInstance?.emit('presence:join', {
          userId: '1', // Replace with actual user ID
          name: 'User' // Replace with actual user name
        });
      });

      socketInstance.on('connect_error', (error) => {
        console.error(`Socket connection error (${namespaceKey}):`, error);
      });

      socketInstance.on('disconnect', () => {
        console.log(`Socket disconnected from namespace: ${namespaceKey}`);
      });

      // Common event handlers
      socketInstance.on('ONLINE_USERS_UPDATE', (data) => {
        console.log('Online users updated:', data);
      });

      socketInstance.on('presence:update', (users) => {
        console.log('User presence updated:', users);
      });

      socketInstance.on('notification:new', (notification) => {
        console.log('New notification received:', notification);
      });

      socketInstance.on('notification:read', (data) => {
        console.log('Notification marked as read:', data);
      });

      socketInstance.on('training:level', (level) => {
        console.log('Training level updated:', level);
      });
    } else if (!socketInstance.oncePromise) {
      // Add oncePromise to existing socket instance if it doesn't have it
      socketInstance.oncePromise = createOncePromise(socketInstance);
    }
    
    // Set local connected state
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    
    // Set initial connected state
    setIsConnected(socketInstance.connected);
    
    // Log connection status 
    console.log('Socket connection status:', socketInstance.connected ? 'Connected' : 'Disconnected');
    
    if (debug) {
      console.log('Setting up socket event handlers');
      
      // Add a debugging listener to track all events
      const handleAnyEvent = (event: string, ...args: any[]) => {
        console.log(`[Socket Debug] Event '${event}' received:`, args);
      };
      
      socketInstance.onAny(handleAnyEvent);
      
      // Track this listener for cleanup
      eventListenersRef.current.push({ event: 'any', handler: handleAnyEvent });
    }
    
    // Set the socket for this hook instance
    setSocket(socketInstance);
    
    return () => {
      // Clean up local handlers but keep the socket connection alive
      socketInstance!.off('connect', handleConnect);
      socketInstance!.off('disconnect', handleDisconnect);
      
      // Clean up any remaining event listeners
      eventListenersRef.current.forEach(({ event, handler }) => {
        if (event === 'any') {
          socketInstance!.offAny(handler);
        } else {
          socketInstance!.off(event, handler);
        }
      });
      
      // Clear the tracked listeners
      eventListenersRef.current = [];
      
      // We don't close the socket when component unmounts because
      // we want to maintain the connection across components
    };
  }, [namespace, namespaceKey, debug, createOncePromise]);

  // Return the enhanced socket object
  return socket;
}

// Example usage for manufacturing namespace:
// const socket = useWebSocket({ namespace: 'manufacturing' });