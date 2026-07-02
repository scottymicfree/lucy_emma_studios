export enum MessageType {
  REQ_EXECUTION = 'REQ_EXECUTION',
  RES_EXECUTION = 'RES_EXECUTION',
  SYS_TELEMETRY = 'SYS_TELEMETRY',
  SYS_HALT      = 'SYS_HALT'
}

export interface SecurityEnvelope {
  type: MessageType;
  payload: any;
  nonce: string;
  signature?: string; // For cryptographic validation of messages
}

export class IPCBridge {
  static sendToCore(payload: any, windowRef: Window) {
    const envelope: SecurityEnvelope = {
      type: MessageType.REQ_EXECUTION,
      payload,
      nonce: crypto.randomUUID()
    };
    windowRef.postMessage(envelope, '*'); // Replace target origin in prod
  }

  static listenFromCore(handler: (env: SecurityEnvelope) => void) {
    window.addEventListener('message', (event) => {
      // Critical check: Origin Verification
      // if (event.origin !== 'EXPECTED_ORIGIN') return;
      
      const envelope = event.data as SecurityEnvelope;
      if (envelope && envelope.type) {
        handler(envelope);
      }
    });
  }
}
