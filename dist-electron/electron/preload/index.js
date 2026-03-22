const electron = require('electron');
const contextBridge = electron.contextBridge;
const ipcRenderer = electron.ipcRenderer;

contextBridge.exposeInMainWorld('api', {
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),
  createOrOpenProject: (path) => ipcRenderer.invoke('project:createOrOpen', path),
  closeProject: () => ipcRenderer.invoke('project:close'),
  getCurrentProject: () => ipcRenderer.invoke('project:getCurrent'),
  
  // References
  getReferences: () => ipcRenderer.invoke('reference:getAll'),
  createReference: (refData) => ipcRenderer.invoke('reference:create', refData),
  updateReference: (id, updates) => ipcRenderer.invoke('reference:update', id, updates),
  updateReferenceStatus: (id, status) => ipcRenderer.invoke('reference:updateStatus', id, status),
  deleteReference: (id) => ipcRenderer.invoke('reference:delete', id),
  fetchDOI: (doi) => ipcRenderer.invoke('reference:fetchDOI', doi),
  importReferencesFile: () => ipcRenderer.invoke('reference:importFile'),
  importStyleFile: () => ipcRenderer.invoke('reference:importStyle'),
  getCustomStyles: () => ipcRenderer.invoke('reference:getCustomStyles'),

  // Documents
  getDocuments: () => ipcRenderer.invoke('document:getAll'),
  getDocument: (id) => ipcRenderer.invoke('document:get', id),
  createDocument: (title) => ipcRenderer.invoke('document:create', title),
  updateDocument: (id, updates) => ipcRenderer.invoke('document:update', id, updates),
  deleteDocument: (id) => ipcRenderer.invoke('document:delete', id),
  exportDocx: (html, title) => ipcRenderer.invoke('document:exportDocx', html, title)
});
