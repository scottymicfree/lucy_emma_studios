/**
 * @file APIServer.ts
 * @description The external gateway for the OS. 
 * Exposes a REST API for basic health/commands and a WebSocket server for real-time EventBus streaming to React.
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { EventBus, SystemEvent } from './EventBus';
import { CommandBus } from './CommandBus';
import { DiagnosticsEngine } from './DiagnosticsEngine';

export class APIServer {
  private static instance: APIServer;
  private app: express.Express;
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;

  private constructor() {
    this.app = express();
    this.app.use(express.json());
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupRoutes();
    this.setupWebSockets();
  }

  public static getInstance(): APIServer {
    if (!APIServer.instance) {
      APIServer.instance = new APIServer();
    }
    return APIServer.instance;
  }

  private setupRoutes() {
    // Basic Health Endpoint
    this.app.get('/api/health', (req, res) => {
      res.json(DiagnosticsEngine.getInstance().getFullDiagnostics());
    });

    // Manual Command Ingestion (e.g. from the React Terminal/Chat)
    this.app.post('/api/commands', (req, res) => {
      const { name, target, payload } = req.body;
      if (!name || !target) {
        return res.status(400).json({ error: 'Command name and target required.' });
      }

      const cmd = CommandBus.getInstance().dispatch(name, target, payload, 'ReactUI');
      res.status(202).json({ commandId: cmd.id, state: cmd.state });
    });
  }

  private setupWebSockets() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[APIServer] Frontend connected via WebSocket');

      // The frontend is purely an observer.
      // We pipe ALL SystemEvents down the socket so React can render the state.
      const eventListener = (event: SystemEvent) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event));
        }
      };

      EventBus.getInstance().onAny(eventListener);

      ws.on('close', () => {
        console.log('[APIServer] Frontend disconnected');
        EventBus.getInstance().off('*', eventListener as any); // Abstracted for brevity
      });
    });
  }

  public start(port: number = 3000) {
    this.server.listen(port, () => {
      console.log(`[APIServer] OS Gateway active on http://localhost:${port}`);
      EventBus.getInstance().emit('APIServer', 'SYSTEM_GATEWAY_OPEN', { port });
    });
  }
}
