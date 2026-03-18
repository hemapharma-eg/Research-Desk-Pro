const electron = require('electron');
const contextBridge = electron.contextBridge;
const ipcRenderer = electron.ipcRenderer;

contextBridge.exposeInMainWorld('api', {
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  createOrOpenProject: (path) => ipcRenderer.invoke('project:createOrOpen', path),
  closeProject: () => ipcRenderer.invoke('project:close'),
  getCurrentProject: () => ipcRenderer.invoke('project:getCurrent'),
  
  // References
  getReferences: () => ipcRenderer.invoke('reference:getAll'),
  createReference: (refData) => ipcRenderer.invoke('reference:create', refData),
  updateReference: (id, updates) => ipcRenderer.invoke('reference:update', id, updates),
  deleteReference: (id) => ipcRenderer.invoke('reference:delete', id)
});
