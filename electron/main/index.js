const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const protocol = electron.protocol;
const path = require('node:path');
const dbManager = require('./db.js');

process.env.DIST = path.join(__dirname, '../../dist');
process.env.VITE_PUBLIC = (app && app.isPackaged) ? process.env.DIST : path.join(process.env.DIST, '../public');

let win;
const VITE_DEV_SERVER_URL = "http://localhost:5173";

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      plugins: true, // Needed for built-in PDF viewer
      webSecurity: true 
    },
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

app.whenReady().then(() => {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace('local-resource://', '');
    try {
      return callback(decodeURIComponent(url));
    }
    catch (error) {
      console.error(error);
    }
  });

  createWindow();
});

require('./ipcHandlers.js');
