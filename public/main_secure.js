// Secure Main Process for Electron/Node container
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload_secure.js')
    }
  });

  // Security: Prevent navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    console.warn('Navigation prevented for security:', url);
  });

  // Security: Prevent new windows
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.loadURL('http://localhost:3000'); // Or file:// path in prod
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Secure postMessage bridge enforcement
ipcMain.on('secure-ipc', (event, arg) => {
  // Validate IPC payload here
  console.log('Secure IPC received:', arg);
});
