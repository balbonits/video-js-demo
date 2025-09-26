import { Server, Socket } from 'socket.io';
import { getDatabase } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { sanitizeMessage } from '../utils/sanitizer';
import { RateLimiter } from '../utils/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  metadata?: any;
  reactions?: Record<string, string[]>;
  created_at: Date;
  edited_at?: Date;
  deleted_at?: Date;
}

export interface Room {
  id: string;
  name: string;
  type: 'video' | 'stream' | 'private';
  settings: any;
  created_at: Date;
}

export class ChatService {
  private db = getDatabase();
  private redis = getRedisClient();
  private rateLimiter = new RateLimiter();
  private rooms = new Map<string, Set<string>>();
  private userSockets = new Map<string, string>();

  constructor(private io: Server) {}

  async initialize() {
    // Load active rooms from database
    const activeRooms = await this.db('rooms').select('id');
    for (const room of activeRooms) {
      this.rooms.set(room.id, new Set());
    }
    logger.info('Chat service initialized');
  }

  async joinRoom(socket: Socket, roomId: string, userId: string, username: string) {
    try {
      // Leave previous rooms
      const previousRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      previousRooms.forEach(room => {
        socket.leave(room);
        this.rooms.get(room)?.delete(userId);
      });

      // Join new room
      socket.join(roomId);

      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId)!.add(userId);
      this.userSockets.set(userId, socket.id);

      // Update presence
      await this.updatePresence(userId, roomId, true);

      // Notify room members
      socket.to(roomId).emit('user_joined', {
        user_id: userId,
        username,
        timestamp: new Date(),
      });

      // Send room history
      const history = await this.getRoomHistory(roomId);
      socket.emit('room_history', history);

      // Send room stats
      this.broadcastRoomStats(roomId);

      logger.info(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  async leaveRoom(socket: Socket, roomId: string, userId: string) {
    try {
      socket.leave(roomId);
      this.rooms.get(roomId)?.delete(userId);
      this.userSockets.delete(userId);

      // Update presence
      await this.updatePresence(userId, roomId, false);

      // Notify room members
      socket.to(roomId).emit('user_left', {
        user_id: userId,
        timestamp: new Date(),
      });

      // Update room stats
      this.broadcastRoomStats(roomId);

      logger.info(`User ${userId} left room ${roomId}`);
    } catch (error) {
      logger.error('Error leaving room:', error);
    }
  }

  async sendMessage(socket: Socket, data: any) {
    try {
      const { room_id, user_id, username, content, type = 'text' } = data;

      // Rate limiting
      if (!await this.rateLimiter.checkLimit(user_id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      // Sanitize message
      const sanitizedContent = sanitizeMessage(content);

      // Create message
      const message: Message = {
        id: uuidv4(),
        room_id,
        user_id,
        username,
        content: sanitizedContent,
        type,
        created_at: new Date(),
      };

      // Save to database
      await this.db('messages').insert(message);

      // Cache recent messages
      await this.cacheMessage(room_id, message);

      // Broadcast to room
      this.io.to(room_id).emit('new_message', message);

      logger.debug(`Message sent in room ${room_id} by user ${user_id}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  async handleTyping(socket: Socket, data: any) {
    const { room_id, user_id, username, is_typing } = data;

    socket.to(room_id).emit('user_typing', {
      user_id,
      username,
      is_typing,
    });
  }

  async addReaction(socket: Socket, data: any) {
    try {
      const { message_id, user_id, reaction } = data;

      // Update message reactions
      const message = await this.db('messages')
        .where({ id: message_id })
        .first();

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      const reactions = message.reactions || {};
      if (!reactions[reaction]) {
        reactions[reaction] = [];
      }

      if (!reactions[reaction].includes(user_id)) {
        reactions[reaction].push(user_id);
      }

      await this.db('messages')
        .where({ id: message_id })
        .update({ reactions: JSON.stringify(reactions) });

      // Broadcast update
      this.io.to(message.room_id).emit('reaction_added', {
        message_id,
        user_id,
        reaction,
      });
    } catch (error) {
      logger.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  }

  private async getRoomHistory(roomId: string, limit: number = 50): Promise<Message[]> {
    // Try cache first
    const cached = await this.redis.get(`room:${roomId}:messages`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const messages = await this.db('messages')
      .where({ room_id: roomId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(limit);

    // Cache for 5 minutes
    await this.redis.setex(
      `room:${roomId}:messages`,
      300,
      JSON.stringify(messages)
    );

    return messages.reverse();
  }

  private async cacheMessage(roomId: string, message: Message) {
    const key = `room:${roomId}:messages`;
    const cached = await this.redis.get(key);

    let messages: Message[] = cached ? JSON.parse(cached) : [];
    messages.push(message);

    // Keep only last 50 messages in cache
    if (messages.length > 50) {
      messages = messages.slice(-50);
    }

    await this.redis.setex(key, 300, JSON.stringify(messages));
  }

  private async updatePresence(userId: string, roomId: string, isOnline: boolean) {
    if (isOnline) {
      await this.db('presence')
        .insert({
          user_id: userId,
          room_id: roomId,
          socket_id: this.userSockets.get(userId),
          last_seen: new Date(),
        })
        .onConflict(['user_id', 'room_id'])
        .merge();
    } else {
      await this.db('presence')
        .where({ user_id: userId, room_id: roomId })
        .delete();
    }
  }

  private broadcastRoomStats(roomId: string) {
    const roomUsers = this.rooms.get(roomId);
    const stats = {
      online_users: roomUsers ? roomUsers.size : 0,
      room_id: roomId,
    };

    this.io.to(roomId).emit('room_stats', stats);
  }
}