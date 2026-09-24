// ==============================================================================
// OceanSense — Real-Time WebSocket Server & Differential Event Bus
// Demonstrates: Week 11 Real-Time Streaming & High-Frequency Delta Batching
// ==============================================================================

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { simulationEngine } from '../simulation/engine.js';

export interface WebSocketMessage {
  type: string;
  timestamp: number;
  data: any;
}

export class OceanSenseWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private broadcastInterval: NodeJS.Timeout | null = null;

  initialize(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.clients.add(ws);
      console.log(`[WebSocket] Client connected from ${req.socket.remoteAddress}. Active clients: ${this.clients.size}`);

      // Send initial snapshot on connection
      ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        timestamp: Date.now(),
        data: {
          kpis: simulationEngine.getAggregatedKPIs(),
          fishSchools: simulationEngine.getFishSchools(),
          auvs: simulationEngine.getAUVs(),
        }
      }));

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsed);
        } catch (e) {
          console.error('[WebSocket] Error parsing client message:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Active clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WebSocket] Client error:', err);
        this.clients.delete(ws);
      });
    });

    // Start 10Hz differential delta broadcaster (Never broadcast massive 1,000 nodes repeatedly)
    this.startDeltaBroadcast();
  }

  private handleClientMessage(ws: WebSocket, msg: any) {
    if (msg.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
    } else if (msg.type === 'SUBSCRIBE_TAMPER') {
      console.log('[WebSocket] Client subscribed to high-priority tamper alerts.');
    }
  }

  private startDeltaBroadcast() {
    this.broadcastInterval = setInterval(() => {
      if (this.clients.size === 0) return;

      const deltas = simulationEngine.consumeDeltas();
      if (deltas.length > 0) {
        this.broadcast({
          type: 'NODE_BATCH_DELTA',
          timestamp: Date.now(),
          data: {
            count: deltas.length,
            updates: deltas,
          },
        });
      }

      // Send AUV Robotics Telemetry every 500ms
      if (Date.now() % 500 < 100) {
        this.broadcast({
          type: 'AUV_TELEMETRY_UPDATE',
          timestamp: Date.now(),
          data: simulationEngine.getAUVs(),
        });
      }

      // Also send rolling KPI & Fish School updates every second
      if (Date.now() % 1000 < 100) {
        this.broadcast({
          type: 'KPI_TELEMETRY_TICK',
          timestamp: Date.now(),
          data: simulationEngine.getAggregatedKPIs(),
        });
        this.broadcast({
          type: 'FISH_TRACK_UPDATE',
          timestamp: Date.now(),
          data: {
            schools: simulationEngine.getFishSchools(),
            detections: simulationEngine.getFishDetections(),
          },
        });
      }
    }, 100);
  }

  broadcast(message: WebSocketMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  getActiveClientCount(): number {
    return this.clients.size;
  }
}

export const wsServer = new OceanSenseWebSocketServer();
