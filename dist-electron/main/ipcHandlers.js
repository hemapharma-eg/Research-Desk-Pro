const electron = require('electron');
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const dbManager = require('./db.js');

ipcMain.handle('dialog:openDirectory', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled) { return null; }
  return filePaths[0];
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

ipcMain.handle('reference:delete', async (event, id) => {
  try {
    dbManager.deleteReference(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
