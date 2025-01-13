import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { db } from "@db";
import { equipment } from "@db/schema";
import { eq } from "drizzle-orm";

interface User {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

const users = new Map<string, User>();
const clients = new Map<string, string>(); // userId -> socketId

export let wsServer: SocketServer | null = null;

export function setupWebSocketServer(httpServer: Server) {
  wsServer = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  // Broadcast presence update to all clients
  function broadcastPresence() {
    const activeUsers = Array.from(users.values())
      .map(({ id, name, status, lastSeen }) => ({ id, name, status, lastSeen }));
    wsServer?.emit('presence:update', activeUsers);
  }

  // Broadcast equipment updates
  async function broadcastEquipmentUpdate(equipmentId: string) {
    try {
      const [updatedEquipment] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, parseInt(equipmentId)))
        .limit(1);

      if (updatedEquipment) {
        wsServer?.emit('equipment:update', {
          id: updatedEquipment.id.toString(),
          status: updatedEquipment.status,
          healthScore: parseFloat(updatedEquipment.healthScore.toString()),
          deviceConnectionStatus: updatedEquipment.deviceConnectionStatus,
          lastUpdate: updatedEquipment.updatedAt.toISOString()
        });
      }
    } catch (error) {
      console.error("Error broadcasting equipment update:", error);
    }
  }

  // Handle socket connections
  wsServer.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store the socket ID for this user
    clients.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // Register user presence
    users.set(userId, {
      id: userId,
      name: `User ${userId.slice(0, 4)}`,
      status: 'online',
      lastSeen: new Date()
    });
    broadcastPresence();

    // Handle presence events
    socket.on('presence:status', ({ status }) => {
      const user = users.get(userId);
      if (user) {
        users.set(userId, { ...user, status, lastSeen: new Date() });
        broadcastPresence();
      }
    });

    // Handle equipment monitoring
    socket.on('equipment:subscribe', (equipmentId: string) => {
      socket.join(`equipment:${equipmentId}`);
    });

    socket.on('equipment:unsubscribe', (equipmentId: string) => {
      socket.leave(`equipment:${equipmentId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = users.get(userId);
      if (user) {
        users.set(userId, { ...user, status: 'offline', lastSeen: new Date() });
        clients.delete(userId);
        broadcastPresence();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.disconnect();
    });
  });

  return {
    broadcastEquipmentUpdate,
    getActiveUsers: () => Array.from(users.values())
      .filter(user => user.status === 'online')
      .map(user => user.id),
    close: () => wsServer?.close()
  };
}