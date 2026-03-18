const electron = require('electron');
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const dbManager = require('./db.js');
const utils = require('./utils.js');

ipcMain.handle('dialog:openDirectory', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled) { return null; }
  return filePaths[0];
});

const fs = require('node:fs');
const path = require('node:path');

ipcMain.handle('dialog:openImage', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'jpeg', 'svg', 'webp'] }
    ]
  });
  if (canceled || filePaths.length === 0) { return null; }
  
  try {
    const ext = path.extname(filePaths[0]).toLowerCase().substring(1);
    const mimeType = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);
    const base64str = fs.readFileSync(filePaths[0], { encoding: 'base64' });
    return `data:${mimeType};base64,${base64str}`;
  } catch (err) {
    console.error("Failed to read image file", err);
    return null;
  }
});

ipcMain.handle('project:createOrOpen', async (event, projectPath) => {
  return dbManager.initDatabase(projectPath);
});

ipcMain.handle('project:close', async (event) => {
  dbManager.closeDatabase();
  return { success: true };
});

ipcMain.handle('project:getCurrent', async () => {
  const path = dbManager.getProjectPath();
  return { success: true, path };
});

// --- References ---

ipcMain.handle('reference:getAll', async () => {
  try {
    const references = dbManager.getReferences();
    return { success: true, data: references };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:create', async (event, refData) => {
  try {
    const newRef = dbManager.addReference(refData);
    return { success: true, data: newRef };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:update', async (event, id, updates) => {
  try {
    const updatedRef = dbManager.updateReference(id, updates);
    return { success: true, data: updatedRef };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:updateStatus', async (event, id, status) => {
  try {
    const updatedRef = dbManager.updateReferenceStatus(id, status);
    return { success: true, data: updatedRef };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:delete', async (event, id) => {
  try {
    dbManager.deleteReference(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- Utilities ---
ipcMain.handle('reference:fetchDOI', async (event, doi) => {
  try {
    const data = await utils.fetchMetadataFromDOI(doi);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- Documents ---
ipcMain.handle('document:getAll', async () => {
  try {
    const docs = dbManager.getDocuments();
    return { success: true, data: docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('document:get', async (event, id) => {
  try {
    const doc = dbManager.getDocument(id);
    return { success: true, data: doc };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('document:create', async (event, title) => {
  try {
    const newDoc = dbManager.createDocument(title);
    return { success: true, data: newDoc };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('document:update', async (event, id, updates) => {
  try {
    const updatedDoc = dbManager.updateDocument(id, updates);
    return { success: true, data: updatedDoc };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('document:delete', async (event, id) => {
  try {
    dbManager.deleteDocument(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
