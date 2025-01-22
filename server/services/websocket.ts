import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocket, WebSocketServer } from 'ws';
import { db } from "@db";
import { userTraining } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { z } from 'zod';
import { notifications, userNotifications } from "@db/schema";

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

interface SocketMessage {
  type: string;
  data?: any;
}

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
  metadata?: Record<string, any>;
}

class WebSocketManager {
  private io: SocketIOServer;
  private wss: WebSocketServer;
  private users: Map<string, User> = new Map();
  private clients: Map<string, string> = new Map();
  private connectionPool: Map<string, Set<WebSocket | SocketIOServer.Socket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingInterval: 10000,
      pingTimeout: 5000,
      transports: ['websocket']
    });

    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      perMessageDeflate: true
    });

    this.setupSocketIO();
    this.setupWebSocket();
    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.connectionPool.forEach((connections, userId) => {
        connections.forEach((conn) => {
          if (conn instanceof WebSocket) {
            if (conn.readyState === WebSocket.OPEN) {
              conn.ping();
            } else {
              this.handleDisconnect(userId, conn);
            }
          }
        });
      });
    }, 30000);
  }

  private setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('Socket.IO client connected');
      const userId = socket.handshake.query.userId as string;

      if (!userId) {
        socket.disconnect();
        return;
      }

      this.addToConnectionPool(userId, socket);
      this.registerUser(userId);

      socket.join(`user-${userId}`);

      // Send initial state
      socket.emit('ONLINE_USERS_UPDATE', {
        type: 'ONLINE_USERS_UPDATE',
        users: this.getActiveUsers()
      });

      socket.on('presence:join', async ({ userId: uid, name = `User ${uid.slice(0, 4)}` }) => {
        await this.handleUserJoin(uid, name);
      });

      socket.on('presence:status', ({ status }) => {
        this.updateUserStatus(userId, status);
      });

      socket.on('training:request_level', async () => {
        await this.broadcastTrainingLevel(userId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(userId, socket);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.handleDisconnect(userId, socket);
      });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('Raw WebSocket client connected');
      const url = new URL(req.url!, `ws://${req.headers.host}`);
      const userId = url.searchParams.get('userId');

      if (!userId) {
        ws.close();
        return;
      }

      this.addToConnectionPool(userId, ws);
      this.registerUser(userId);

      // Send initial state
      ws.send(JSON.stringify({
        type: 'ONLINE_USERS_UPDATE',
        data: this.getActiveUsers()
      }));

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString()) as SocketMessage;
          await this.handleWebSocketMessage(userId, data, ws);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(userId, ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(userId, ws);
      });

      ws.on('pong', () => {
        const user = this.users.get(userId);
        if (user) {
          user.lastSeen = new Date();
          this.users.set(userId, user);
        }
      });
    });
  }

  private addToConnectionPool(userId: string, connection: WebSocket | SocketIOServer.Socket) {
    if (!this.connectionPool.has(userId)) {
      this.connectionPool.set(userId, new Set());
    }
    this.connectionPool.get(userId)!.add(connection);
  }

  private handleDisconnect(userId: string, connection: WebSocket | SocketIOServer.Socket) {
    const connections = this.connectionPool.get(userId);
    if (connections) {
      connections.delete(connection);
      if (connections.size === 0) {
        this.connectionPool.delete(userId);
        this.users.delete(userId);
        this.clients.delete(userId);
        this.broadcastPresence();
      }
    }
  }

  private async handleUserJoin(userId: string, name: string) {
    this.registerUser(userId);
    await this.broadcastTrainingLevel(userId);
  }

  private async handleWebSocketMessage(userId: string, data: SocketMessage, ws: WebSocket) {
    switch (data.type) {
      case 'presence:join':
        await this.handleUserJoin(userId, data.data?.name || `User ${userId.slice(0, 4)}`);
        break;
      case 'presence:status':
        this.updateUserStatus(userId, data.data?.status);
        break;
      case 'training:request_level':
        await this.broadcastTrainingLevel(userId);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
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
    this.broadcast(Array.from(this.users.keys()), {
      type: 'presence:update',
      data: activeUsers
    });
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

      this.broadcast([userId], {
        type: 'training:level',
        data: trainingLevel
      });
    } catch (error) {
      console.error("Error broadcasting training level:", error);
    }
  }

  public broadcast(userIds: string[], message: SocketMessage) {
    userIds.forEach(userId => {
      const connections = this.connectionPool.get(userId);
      if (connections) {
        connections.forEach(conn => {
          try {
            if (conn instanceof WebSocket) {
              if (conn.readyState === WebSocket.OPEN) {
                conn.send(JSON.stringify(message));
              }
            } else {
              conn.emit(message.type, message.data);
            }
          } catch (error) {
            console.error('Error broadcasting message:', error);
            this.handleDisconnect(userId, conn);
          }
        });
      }
    });
  }

  public registerUser(userId: string) {
    this.users.set(userId, {
      id: userId,
      name: `User ${userId.slice(0, 4)}`,
      status: 'online',
      socketId: '',
      lastSeen: new Date()
    });
    this.broadcastPresence();
  }

  public getActiveUsers(): string[] {
    return Array.from(this.users.values())
      .filter(user => user.status === 'online')
      .map(user => user.id);
  }

  public cleanup() {
    clearInterval(this.heartbeatInterval);
    this.io.close();
    this.wss.close();
  }

  public async sendNotification(userId: string, payload: NotificationPayload) {
    try {
      // Insert notification into database
      const [notification] = await db.insert(notifications)
        .values({
          type: payload.type,
          title: payload.title,
          message: payload.message,
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
      this.broadcast([userId], {
        type: 'notification:new',
        data: {
          ...notification,
          read: false,
        }
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

      this.broadcast([userId], {
        type: 'notification:read',
        data: { notificationId }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  public async getUnreadNotifications(userId: string) {
    try {
      return await db.select({
        id: notifications.id,
        type: notifications.type,
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