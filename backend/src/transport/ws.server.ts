import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import { env } from '../config/env.js';
import type { MqttService } from '../services/mqtt.service.js';

/**
 * WebSocket server for ESP32-S3 voice satellites (PCM stream)
 * and the 7" AMOLED Kiosk dashboard (real-time telemetry & UI modals).
 */
export class VexisWsServer {
  private wss: WebSocketServer | null = null;
  private clients = new Set<WebSocket>();

  constructor(private readonly mqtt: MqttService) {}

  start(): void {
    this.wss = new WebSocketServer({ port: env.WS_PORT });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      if (!this.isAuthorized(req)) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      this.clients.add(ws);
      ws.send(JSON.stringify({ type: 'snapshot', data: this.mqtt.getSnapshot() }));

      ws.on('message', (data, isBinary) => {
        if (isBinary) {
          // TODO: forward PCM audio frames from ESP32-S3 to Whisper.cpp pipeline
          return;
        }
        // Handle JSON control messages from Kiosk or Satellite
        void data;
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    this.mqtt.on('state:updated', (payload) => {
      this.broadcast({ type: 'state:updated', data: payload });
    });

    console.log(`[WS] Listening on port ${env.WS_PORT}`);
  }

  private isAuthorized(req: IncomingMessage): boolean {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${env.WS_AUTH_TOKEN}`) return true;
    const url = new URL(req.url ?? '/', 'http://localhost');
    return url.searchParams.get('token') === env.WS_AUTH_TOKEN;
  }

  broadcast(message: unknown): void {
    const serialized = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  async close(): Promise<void> {
    if (!this.wss) return;
    await new Promise<void>((resolve) => this.wss?.close(() => resolve()));
  }
}
