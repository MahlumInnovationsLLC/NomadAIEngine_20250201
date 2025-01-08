import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
  socketId: string;
}

const users = new Map<string, User>();
const clients = new Map<string, string>(); // userId -> socketId

export function setupWebSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Broadcast presence update to all clients
  function broadcastPresence() {
    const activeUsers = Array.from(users.values()).map(({ socketId, ...user }) => user);
    io.emit('presence:update', activeUsers);
  }

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store the socket ID for this user
    clients.set(userId, socket.id);

    // Join user-specific room for targeted notifications
    socket.join(`user-${userId}`);

    // Handle presence events
    socket.on('presence:join', ({ userId: uid, name = `User ${uid.slice(0, 4)}` }) => {
      users.set(uid, {
        id: uid,
        name,
        status: 'online',
        socketId: socket.id,
        lastSeen: new Date()
      });
      broadcastPresence();
    });

    // Handle user status updates
    socket.on('presence:status', ({ status }) => {
      const user = users.get(userId);
      if (user) {
        users.set(userId, { ...user, status, lastSeen: new Date() });
        broadcastPresence();
      }
    });

    socket.on('disconnect', () => {
      // Update user status on disconnect
      const user = users.get(userId);
      if (user) {
        users.set(userId, {
          ...user,
          status: 'offline',
          lastSeen: new Date()
        });
        broadcastPresence();
      }

      // Remove socket mapping
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