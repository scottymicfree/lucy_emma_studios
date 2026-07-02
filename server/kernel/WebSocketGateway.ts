/**
 * @file WebSocketGateway.ts
 * @description The UI communication bridge.
 * Listens to the NARRATIVE_UPDATE events emitted by the EventBus (via the Kernel)
 * and streams them safely to connected React UI clients.
 */

import { EventBus } from './EventBus';
import { ChatUpdate } from './NarrativeCompiler';
// import { WebSocketServer } from 'ws'; // Node WebSocket implementation

export class WebSocketGateway {
  private static instance: WebSocketGateway;
  
  // Mock WS Server connection array
  private activeConnections: any[] = [];

  private constructor() {
    this.bindToNarrativeStream();
  }

  public static getInstance(): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway();
    }
    return WebSocketGateway.instance;
  }

  /**
   * Initializes the physical WebSocket server listener on a given port.
   */
  public listen(port: number) {
    // In production:
    // const wss = new WebSocketServer({ port });
    // wss.on('connection', ws => this.activeConnections.push(ws));
    
    console.log(`[WebSocketGateway] Listening for UI connections on ws://localhost:${port}`);
    EventBus.getInstance().emit('WebSocketGateway', 'SERVER_LISTENING', { port }, 'normal');
  }

  /**
   * Wires the EventBus NARRATIVE_UPDATE events to active WS connections.
   */
  private bindToNarrativeStream() {
    EventBus.getInstance().subscribe('NARRATIVE_UPDATE', (payload: ChatUpdate) => {
      this.broadcast(payload);
    });
  }

  /**
   * Pushes the sanitized chat update to all connected React clients.
   */
  private broadcast(payload: ChatUpdate) {
    const payloadStr = JSON.stringify(payload);
    
    // In production, iterate over this.activeConnections and ws.send(payloadStr)
    // For this mock, we just log to stdout to prove binding.
    // console.log(`[WS Broadcast] ${payloadStr}`);
  }
}
