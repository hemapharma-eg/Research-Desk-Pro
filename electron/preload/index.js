const electron = require('electron');
const contextBridge = electron.contextBridge;
const ipcRenderer = electron.ipcRenderer;

contextBridge.exposeInMainWorld('api', {
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),
  openPdfDialog: () => ipcRenderer.invoke('dialog:openPdf'),
  openPath: (filePath) => ipcRenderer.invoke('dialog:openPath', filePath),
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
  exportLib: (refs, format) => ipcRenderer.invoke('reference:exportLib', refs, format),
  importStyleFile: () => ipcRenderer.invoke('reference:importStyle'),
  getCustomStyles: () => ipcRenderer.invoke('reference:getCustomStyles'),
  getFolders: () => ipcRenderer.invoke('reference:getFolders'),
  createFolder: (name, parent_id) => ipcRenderer.invoke('reference:createFolder', name, parent_id),
  deleteFolder: (id) => ipcRenderer.invoke('reference:deleteFolder', id),
  renameFolder: (id, newName) => ipcRenderer.invoke('reference:renameFolder', id, newName),
  getFoldersByRef: (ref_id) => ipcRenderer.invoke('reference:getFoldersByRef', ref_id),
  setFoldersForRef: (ref_id, folder_ids) => ipcRenderer.invoke('reference:setFoldersForRef', ref_id, folder_ids),

  // Documents
  getDocuments: () => ipcRenderer.invoke('document:getAll'),
  getDocument: (id) => ipcRenderer.invoke('document:get', id),
  createDocument: (title) => ipcRenderer.invoke('document:create', title),
  updateDocument: (id, updates) => ipcRenderer.invoke('document:update', id, updates),
  deleteDocument: (id) => ipcRenderer.invoke('document:delete', id),
  exportDocx: (html, title) => ipcRenderer.invoke('document:exportDocx', html, title),

  // Graphing Studio
  getGraphingDatasets: () => ipcRenderer.invoke('graphing:getDatasets'),
  getGraphingDataset: (id) => ipcRenderer.invoke('graphing:getDataset', id),
  createGraphingDataset: (data) => ipcRenderer.invoke('graphing:createDataset', data),
  updateGraphingDataset: (id, updates) => ipcRenderer.invoke('graphing:updateDataset', id, updates),
  deleteGraphingDataset: (id) => ipcRenderer.invoke('graphing:deleteDataset', id),

  getGraphingAnalyses: (datasetId) => ipcRenderer.invoke('graphing:getAnalyses', datasetId),
  createGraphingAnalysis: (data) => ipcRenderer.invoke('graphing:createAnalysis', data),
  deleteGraphingAnalysis: (id) => ipcRenderer.invoke('graphing:deleteAnalysis', id),

  getGraphingFigures: (datasetId) => ipcRenderer.invoke('graphing:getFigures', datasetId),
  getGraphingFigure: (id) => ipcRenderer.invoke('graphing:getFigure', id),
  createGraphingFigure: (data) => ipcRenderer.invoke('graphing:createFigure', data),
  updateGraphingFigure: (id, updates) => ipcRenderer.invoke('graphing:updateFigure', id, updates),
  deleteGraphingFigure: (id) => ipcRenderer.invoke('graphing:deleteFigure', id),

  exportGraphingFigure: (imageDataUrl, defaultName, format) => ipcRenderer.invoke('graphing:exportFigure', imageDataUrl, defaultName, format),

  importCSVFile: () => ipcRenderer.invoke('graphing:importCSVFile')
});
