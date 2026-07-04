import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../middleware/logger';

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;
  // Map to store userId -> set of socketIds
  private userSockets: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Customize this in production
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Socket connected: ${socket.id}`);

      // Handle user registration with socket
      socket.on('register', (userId: string) => {
        if (!userId) return;
        socket.data.userId = userId;

        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);
        
        logger.debug(`User registered: ${userId} with socket: ${socket.id}`);
        this.broadcastOnlineUsers();
      });

      socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: ${socket.id}`);
        const userId = socket.data.userId;
        if (userId && this.userSockets.has(userId)) {
          const sockets = this.userSockets.get(userId)!;
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        this.broadcastOnlineUsers();
      });
    });

    return this.io;
  }

  public sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  public broadcast(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  private broadcastOnlineUsers(): void {
    const onlineUsers = this.getOnlineUsers();
    this.broadcast('online_users', onlineUsers);
  }
}

export const socketService = SocketService.getInstance();
