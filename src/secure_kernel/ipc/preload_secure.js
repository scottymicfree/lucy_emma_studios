// src/secure_kernel/ipc/preload_secure.js
const { contextBridge, ipcRenderer } = require('electron');

// We expose a hyper-constrained API to the renderer. No require(), no process.env.
contextBridge.exposeInMainWorld('LucyCoreAPI', {
  requestProposalExecution: (proposal) => {
    // The renderer acts as a blind client sending an intent.
    return ipcRenderer.invoke('SECURE_CORE:EXECUTE', proposal);
  },
  onTelemetry: (callback) => {
    ipcRenderer.on('SECURE_CORE:TELEMETRY', (event, data) => callback(data));
  }
});
