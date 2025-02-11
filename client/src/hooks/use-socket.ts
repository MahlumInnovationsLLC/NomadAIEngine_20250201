import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
}
