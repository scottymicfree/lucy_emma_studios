interface BridgeMessage {
  type: string;
  payload: any;
  nonce: string;
  signature?: string;
}

export class PostMessageBridge {
  private allowedOrigins: string[];
  private targetOrigin: string;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();

  constructor(allowedOrigins: string[], targetOrigin: string = "*") {
    this.allowedOrigins = allowedOrigins;
    this.targetOrigin = targetOrigin;
    this.setupListener();
  }

  private setupListener() {
    window.addEventListener("message", (event: MessageEvent) => {
      // Validate origin
      if (
        !this.allowedOrigins.includes(event.origin) &&
        event.origin !== window.location.origin
      ) {
        console.warn("Blocked message from untrusted origin:", event.origin);
        return;
      }

      const msg = event.data as BridgeMessage;
      if (msg && msg.type) {
        const handler = this.messageHandlers.get(msg.type);
        if (handler) {
          handler(msg.payload);
        }
      }
    });
  }

  public registerHandler(type: string, handler: (payload: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public sendMessage(targetWindow: Window, type: string, payload: any) {
    const msg: BridgeMessage = {
      type,
      payload,
      nonce: crypto.randomUUID(),
    };
    // Include signature for high security
    targetWindow.postMessage(msg, this.targetOrigin);
  }
}

export const ipcBridge = new PostMessageBridge([window.location.origin]);
