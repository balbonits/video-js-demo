import { FastifyInstance } from 'fastify';
import { analyticsService } from './analyticsService';
import { activeConnections } from '../utils/metrics';
import { logger } from '../utils/logger';

export class WebSocketService {
  private connections = new Map<string, any>();

  constructor(private fastify: FastifyInstance) {}

  async initialize() {
    this.fastify.get('/ws', { websocket: true }, (connection, req) => {
      const connectionId = this.generateConnectionId();
      this.handleConnection(connectionId, connection);
    });

    // Listen to analytics events
    analyticsService.on('event', (event) => {
      this.broadcast('analytics_event', event);
    });

    // Send real-time metrics every 5 seconds
    setInterval(async () => {
      const metrics = await analyticsService.getRealtimeMetrics();
      this.broadcast('realtime_metrics', metrics);
    }, 5000);
  }

  private handleConnection(id: string, connection: any) {
    this.connections.set(id, connection);
    activeConnections.set(this.connections.size);

    logger.info(`WebSocket connection established: ${id}`);

    connection.socket.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        this.handleMessage(id, data);
      } catch (error) {
        logger.error('Invalid WebSocket message:', error);
      }
    });

    connection.socket.on('close', () => {
      this.connections.delete(id);
      activeConnections.set(this.connections.size);
      logger.info(`WebSocket connection closed: ${id}`);
    });

    // Send initial data
    this.sendInitialData(connection);
  }

  private async handleMessage(connectionId: string, data: any) {
    const { type, payload } = data;

    switch (type) {
      case 'subscribe_video':
        // Subscribe to specific video metrics
        break;
      case 'subscribe_user':
        // Subscribe to user engagement updates
        break;
      case 'ping':
        this.send(connectionId, 'pong', {});
        break;
    }
  }

  private async sendInitialData(connection: any) {
    const metrics = await analyticsService.getRealtimeMetrics();
    connection.socket.send(JSON.stringify({
      type: 'initial_data',
      payload: metrics,
    }));
  }

  private broadcast(type: string, payload: any) {
    const message = JSON.stringify({ type, payload });

    for (const connection of this.connections.values()) {
      try {
        connection.socket.send(message);
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
      }
    }
  }

  private send(connectionId: string, type: string, payload: any) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.socket.send(JSON.stringify({ type, payload }));
    }
  }

  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}