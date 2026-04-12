const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('node:path');
const dbManager = require('./db.js');

process.env.DIST = path.join(__dirname, '../../dist');
process.env.VITE_PUBLIC = (app && app.isPackaged) ? process.env.DIST : path.join(process.env.DIST, '../public');

let win;
const VITE_DEV_SERVER_URL = "http://localhost:5173";

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, '../../build/icon.png'),
    width: 1280,
    height: 800,
    show: false,  // Don't show until content is ready
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      plugins: true, // Needed for built-in PDF viewer
      webSecurity: true 
    },
  });

  // Guarantee the window becomes visible once content is loaded
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Fallback: if ready-to-show never fires, force-show after 5 seconds
  setTimeout(() => {
    if (win && !win.isDestroyed() && !win.isVisible()) {
      console.warn('[MAIN] ready-to-show did not fire, force-showing window');
      win.show();
      win.focus();
    }
  }, 5000);

  // Log renderer crashes to help diagnose Intel issues
  win.webContents.on('render-process-gone', (event, details) => {
    console.error('[MAIN] Renderer process gone:', details.reason, details.exitCode);
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[MAIN] Failed to load:', errorCode, errorDescription);
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'));
  }
}

app.on('window-all-closed', () => {
  // Always close SQLite thoroughly before UI exits to ensure MAC caching checkpoint
  dbManager.closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  dbManager.closeDatabase();
});

// FIX: Prevent Chromium GPU process from white-screening on Mac Intel graphics chips
if (process.platform === 'darwin' && process.arch === 'x64') {
  app.disableHardwareAcceleration();
}

app.whenReady().then(() => {
  // Register custom protocol for local file access (wrapped in try-catch
  // because registerFileProtocol is deprecated in newer Electron versions)
  try {
    const protocol = electron.protocol;
    protocol.registerFileProtocol('local-resource', (request, callback) => {
      const url = request.url.replace('local-resource://', '');
      try {
        return callback(decodeURIComponent(url));
      }
      catch (error) {
        console.error(error);
      }
    });
  } catch (e) {
    console.warn('[MAIN] registerFileProtocol failed (may be deprecated):', e.message);
  }

  try {
    if (process.platform === 'darwin') {
      app.dock.setIcon(path.join(__dirname, '../../build/icon.png'));
    }
  } catch (e) {
    console.warn('[MAIN] dock.setIcon failed:', e.message);
  }

  createWindow();
});

// Handle activate event (macOS: clicking dock icon when no windows are open)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

require('./ipcHandlers.js');
