import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

const clients = new Map<string, string>(); // userId -> socketId

export function setupWebSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store the socket ID for this user
    clients.set(userId, socket.id);

    // Join a room specific to this user
    socket.join(`user-${userId}`);

    socket.on('disconnect', () => {
      // Remove user mapping on disconnect
      if (clients.get(userId) === socket.id) {
        clients.delete(userId);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (clients.get(userId) === socket.id) {
        clients.delete(userId);
      }
    });
  });

  return {
    broadcast: (userIds: string[], message: any) => {
      // Broadcast to specific users' rooms
      userIds.forEach(userId => {
        io.to(`user-${userId}`).emit('notification', message);
      });
    },
    close: () => {
      io.close();
    }
  };
}