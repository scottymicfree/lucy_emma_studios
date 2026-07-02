// Secure Preload Script
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lucyOS', {
  sendToOrchestrator: (channel, data) => {
    // Only allow specific channels
    const validChannels = ['system-stats', 'execute-wasm', 'log-vault'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send('secure-ipc', { channel, data });
    } else {
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  },
  receiveFromOrchestrator: (channel, func) => {
    const validChannels = ['system-stats', 'execution-result'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(`secure-${channel}`, (event, ...args) => func(...args));
    }
  }
});
