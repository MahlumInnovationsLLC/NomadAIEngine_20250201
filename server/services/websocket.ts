import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { db } from "@db";
import { userTraining } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { z } from 'zod';
import { notifications, userNotifications } from "@db/schema";
import type { ShipmentStatus, LogisticsEvent } from "@/types/material";

// Validation schemas
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  status: z.enum(['online', 'away', 'offline']),
  lastSeen: z.date().optional(),
  socketId: z.string(),
  trainingLevel: z.object({
    level: z.string(),
    progress: z.number()
  }).optional()
});

type User = z.infer<typeof userSchema>;

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
  metadata?: Record<string, any>;
}

export class WebSocketManager {
  public io: SocketIOServer;
  private users: Map<string, User> = new Map();
  private clients: Map<string, string> = new Map();
  private shipmentSubscriptions: Map<string, Set<string>> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow any Replit domain or local development
          if (!origin || origin.includes('.replit.dev') || origin.includes('.replit.app') || origin.includes('localhost')) {
            callback(null, true);
          } else {
            callback(null, true); // Allow all origins for broader compatibility
          }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type", "Accept"]
      },
      allowEIO3: true, // Compatibility mode for older Socket.IO clients
      pingInterval: 25000, // Increased for Replit environment
      pingTimeout: 10000, // Increased for Replit environment
      transports: ['polling', 'websocket'], // Prioritize polling for better Replit compatibility
    });

    this.setupSocketIO();
  }

  private setupSocketIO() {
    // Main namespace handlers
    this.io.on('connection', (socket) => {
      console.log('Socket.IO client connected');
      const userId = socket.handshake.query.userId as string;

      if (!userId) {
        socket.disconnect();
        return;
      }

      this.registerUser(userId, socket.id);
      socket.join(`user-${userId}`);

      // Logistics tracking events
      socket.on('subscribe-shipment', (shipmentId: string) => {
        this.subscribeToShipment(userId, shipmentId);
        socket.join(`shipment-${shipmentId}`);
      });

      socket.on('unsubscribe-shipment', (shipmentId: string) => {
        this.unsubscribeFromShipment(userId, shipmentId);
        socket.leave(`shipment-${shipmentId}`);
      });

      // Send initial state
      socket.emit('ONLINE_USERS_UPDATE', {
        type: 'ONLINE_USERS_UPDATE',
        users: this.getActiveUsers()
      });

      socket.on('presence:join', async ({ userId: uid, name = `User ${uid.slice(0, 4)}` }) => {
        await this.handleUserJoin(uid, name, socket.id);
      });

      socket.on('presence:status', ({ status }) => {
        this.updateUserStatus(userId, status);
      });

      socket.on('training:request_level', async () => {
        await this.broadcastTrainingLevel(userId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(userId);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.handleDisconnect(userId);
      });
    });
  }

  private handleDisconnect(userId: string) {
    // Clean up shipment subscriptions
    this.shipmentSubscriptions.forEach((subscribers, shipmentId) => {
      if (subscribers.has(userId)) {
        this.unsubscribeFromShipment(userId, shipmentId);
      }
    });

    this.users.delete(userId);
    this.clients.delete(userId);
    this.broadcastPresence();
  }

  // Logistics specific methods
  private subscribeToShipment(userId: string, shipmentId: string) {
    if (!this.shipmentSubscriptions.has(shipmentId)) {
      this.shipmentSubscriptions.set(shipmentId, new Set());
    }
    this.shipmentSubscriptions.get(shipmentId)!.add(userId);
  }

  private unsubscribeFromShipment(userId: string, shipmentId: string) {
    const subscribers = this.shipmentSubscriptions.get(shipmentId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.shipmentSubscriptions.delete(shipmentId);
      }
    }
  }

  public updateShipmentLocation(shipmentId: string, location: { latitude: number; longitude: number }) {
    this.io.to(`shipment-${shipmentId}`).emit('location-update', {
      ...location,
      lastUpdate: new Date().toISOString()
    });
  }

  public notifyShipmentDelay(shipmentId: string, shipment: ShipmentStatus, reason: string) {
    this.io.to(`shipment-${shipmentId}`).emit('shipment-delay', {
      shipment,
      reason
    });
  }

  public notifyDeliveryAttempt(shipmentId: string, shipment: ShipmentStatus, status: string) {
    this.io.to(`shipment-${shipmentId}`).emit('delivery-attempt', {
      shipment,
      status
    });
  }

  public broadcastWeatherAlert(region: string, alert: string) {
    this.io.emit('weather-alert', {
      region,
      alert
    });
  }

  private handleUserJoin(userId: string, name: string, socketId: string) {
    this.registerUser(userId, socketId);
    this.broadcastTrainingLevel(userId);
  }

  private updateUserStatus(userId: string, status: User['status']) {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.lastSeen = new Date();
      this.users.set(userId, user);
      this.broadcastPresence();
    }
  }

  private broadcastPresence() {
    const activeUsers = Array.from(this.users.values()).map(({ socketId, ...user }) => user);
    this.broadcast('presence:update', activeUsers);
  }

  private async broadcastTrainingLevel(userId: string) {
    try {
      const completedModules = await db
        .select({
          moduleId: userTraining.moduleId,
          progress: userTraining.progress,
          status: userTraining.status,
        })
        .from(userTraining)
        .where(eq(userTraining.userId, userId));

      let totalProgress = 0;
      if (completedModules.length > 0) {
        const completedCount = completedModules.filter(m => m.status === 'completed').length;
        totalProgress = (completedCount / completedModules.length) * 100;
      }

      const level = totalProgress >= 80 ? "Expert" : totalProgress >= 50 ? "Intermediate" : "Beginner";
      const trainingLevel = { level, progress: Math.round(totalProgress) };

      const user = this.users.get(userId);
      if (user) {
        user.trainingLevel = trainingLevel;
        this.users.set(userId, user);
      }

      this.io.to(`user-${userId}`).emit('training:level', trainingLevel);
    } catch (error) {
      console.error("Error broadcasting training level:", error);
    }
  }

  private broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public registerUser(userId: string, socketId: string) {
    this.users.set(userId, {
      id: userId,
      name: `User ${userId.slice(0, 4)}`,
      status: 'online',
      socketId,
      lastSeen: new Date()
    });
    this.clients.set(userId, socketId);
    this.broadcastPresence();
  }

  public getActiveUsers(): string[] {
    return Array.from(this.users.values())
      .filter(user => user.status === 'online')
      .map(user => user.id);
  }

  public cleanup() {
    this.io.close();
  }

  public async sendNotification(userId: string, payload: NotificationPayload) {
    try {
      // Insert notification into database
      const [notification] = await db.insert(notifications)
        .values({
          type: payload.type,
          message: payload.message,
          title: payload.title,
          priority: payload.priority,
          link: payload.link,
          metadata: payload.metadata,
        })
        .returning();

      // Create user notification
      await db.insert(userNotifications)
        .values({
          userId: userId,
          notificationId: notification.id,
        });

      // Send real-time notification
      this.io.to(`user-${userId}`).emit('notification:new', {
        ...notification,
        read: false,
      });

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  public async markNotificationRead(userId: string, notificationId: number) {
    try {
      await db.update(userNotifications)
        .set({
          read: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(userNotifications.userId, userId),
            eq(userNotifications.notificationId, notificationId)
          )
        );

      this.io.to(`user-${userId}`).emit('notification:read', { notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  public async getUnreadNotifications(userId: string) {
    try {
      return await db.select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        priority: notifications.priority,
        link: notifications.link,
        metadata: notifications.metadata,
        createdAt: notifications.createdAt,
        read: userNotifications.read,
        readAt: userNotifications.readAt,
      })
        .from(notifications)
        .innerJoin(
          userNotifications,
          eq(notifications.id, userNotifications.notificationId)
        )
        .where(
          and(
            eq(userNotifications.userId, userId),
            eq(userNotifications.read, false)
          )
        );
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }
}

export function setupWebSocketServer(server: HttpServer) {
  return new WebSocketManager(server);
}