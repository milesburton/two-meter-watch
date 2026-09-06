import type { Server as HttpServer } from 'node:http';
import type { Logger } from 'pino';
import { WebSocket, WebSocketServer as WsServer } from 'ws';
import type { WaterfallFrame } from '../dsp/waterfall.js';

export type Channel = 'waterfall' | 'sstv';

export interface ChannelMessage<T = unknown> {
  channel: Channel;
  data: T;
}

/**
 * Thin wrapper around `ws`'s WebSocketServer providing two logical channels
 * ("waterfall" and "sstv" — sstv stays idle until Phase 2) and a hard cap on
 * concurrent connections.
 */
export class TwoMeterWebSocketServer {
  private readonly wss: WsServer;
  private readonly clients = new Set<WebSocket>();

  constructor(
    httpServer: HttpServer,
    private readonly maxConnections: number,
    private readonly logger: Logger,
  ) {
    this.wss = new WsServer({ server: httpServer, path: '/ws' });

    this.wss.on('connection', (socket) => {
      if (this.clients.size >= this.maxConnections) {
        this.logger.warn({ maxConnections }, 'websocket connection cap reached, rejecting client');
        socket.close(1013, 'server at capacity');
        return;
      }

      this.clients.add(socket);
      this.logger.debug({ clientCount: this.clients.size }, 'websocket client connected');

      socket.on('close', () => {
        this.clients.delete(socket);
      });

      socket.on('error', (err) => {
        this.logger.debug({ err }, 'websocket client error');
        this.clients.delete(socket);
      });
    });
  }

  get connectionCount(): number {
    return this.clients.size;
  }

  broadcastWaterfallFrame(frame: WaterfallFrame): void {
    this.broadcast({ channel: 'waterfall', data: frame });
  }

  broadcast<T>(message: ChannelMessage<T>): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.wss.close();
  }
}
