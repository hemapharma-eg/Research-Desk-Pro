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
  importReferencesFile: (folderId) => ipcRenderer.invoke('reference:importFile', folderId),
  exportLib: (refs, format) => ipcRenderer.invoke('reference:exportLib', refs, format),
  importStyleFile: () => ipcRenderer.invoke('reference:importStyle'),
  getCustomStyles: () => ipcRenderer.invoke('reference:getCustomStyles'),
  getFolders: () => ipcRenderer.invoke('reference:getFolders'),
  createFolder: (name, parent_id) => ipcRenderer.invoke('reference:createFolder', name, parent_id),
  deleteFolder: (id) => ipcRenderer.invoke('reference:deleteFolder', id),
  renameFolder: (id, newName) => ipcRenderer.invoke('reference:renameFolder', id, newName),
  getFoldersByRef: (ref_id) => ipcRenderer.invoke('reference:getFoldersByRef', ref_id),
  getAllFolderMappings: () => ipcRenderer.invoke('reference:getAllFolderMappings'),
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

  importCSVFile: () => ipcRenderer.invoke('graphing:importCSVFile'),

  // Utilities
  readFileBase64: (filePath) => ipcRenderer.invoke('file:readBase64', filePath),

  // Systematic Review
  getExtractionTemplates: () => ipcRenderer.invoke('systematic:getExtractionTemplates'),
  createExtractionTemplate: (data) => ipcRenderer.invoke('systematic:createExtractionTemplate', data),
  deleteExtractionTemplate: (id) => ipcRenderer.invoke('systematic:deleteExtractionTemplate', id),
  getExtractedDataPoints: (refId) => ipcRenderer.invoke('systematic:getExtractedDataPoints', refId),
  saveExtractedDataPoint: (data) => ipcRenderer.invoke('systematic:saveExtractedDataPoint', data),
  getRobAssessments: (refId) => ipcRenderer.invoke('systematic:getRobAssessments', refId),
  saveRobAssessment: (data) => ipcRenderer.invoke('systematic:saveRobAssessment', data),
  getReviewerDecisions: (refId) => ipcRenderer.invoke('systematic:getReviewerDecisions', refId),
  saveReviewerDecision: (data) => ipcRenderer.invoke('systematic:saveReviewerDecision', data),
  autoFetchPDFs: (refs, email) => ipcRenderer.invoke('systematic:autoFetchPDFs', refs, email),
  exportCollaborationData: (reviewerId) => ipcRenderer.invoke('systematic:exportCollaborationData', reviewerId),
  importCollaborationData: () => ipcRenderer.invoke('systematic:importCollaborationData'),
  exportToGraphingStudio: (refs) => ipcRenderer.invoke('systematic:exportToGraphingStudio', refs),

  // Table Builder
  getTbTables: () => ipcRenderer.invoke('tableBuilder:getTables'),
  getTbTable: (id) => ipcRenderer.invoke('tableBuilder:getTable', id),
  createTbTable: (data) => ipcRenderer.invoke('tableBuilder:createTable', data),
  updateTbTable: (id, updates) => ipcRenderer.invoke('tableBuilder:updateTable', id, updates),
  deleteTbTable: (id) => ipcRenderer.invoke('tableBuilder:deleteTable', id),
  getTbNarratives: (tableId) => ipcRenderer.invoke('tableBuilder:getNarratives', tableId),
  createTbNarrative: (data) => ipcRenderer.invoke('tableBuilder:createNarrative', data),
  updateTbNarrative: (id, updates) => ipcRenderer.invoke('tableBuilder:updateNarrative', id, updates),
  deleteTbNarrative: (id) => ipcRenderer.invoke('tableBuilder:deleteNarrative', id),
  getTbDocLinks: (tableId) => ipcRenderer.invoke('tableBuilder:getDocLinks', tableId),
  createTbDocLink: (data) => ipcRenderer.invoke('tableBuilder:createDocLink', data),
  updateTbDocLink: (id, updates) => ipcRenderer.invoke('tableBuilder:updateDocLink', id, updates),
  deleteTbDocLink: (id) => ipcRenderer.invoke('tableBuilder:deleteDocLink', id),
  getTbAuditLog: (tableId) => ipcRenderer.invoke('tableBuilder:getAuditLog', tableId),
  createTbAuditEntry: (data) => ipcRenderer.invoke('tableBuilder:createAuditEntry', data),
  getTbExportHistory: (tableId) => ipcRenderer.invoke('tableBuilder:getExportHistory', tableId),
  createTbExportEntry: (data) => ipcRenderer.invoke('tableBuilder:createExportEntry', data),
  getTbSettings: () => ipcRenderer.invoke('tableBuilder:getSettings'),
  updateTbSettings: (settings_json) => ipcRenderer.invoke('tableBuilder:updateSettings', settings_json),
  exportTbPDF: (html, defaultName) => ipcRenderer.invoke('tableBuilder:exportTablePDF', html, defaultName),
  exportTbCSV: (csvContent, defaultName) => ipcRenderer.invoke('tableBuilder:exportTableCSV', csvContent, defaultName),
  exportTbImage: (imageDataUrl, defaultName) => ipcRenderer.invoke('tableBuilder:exportTableImage', imageDataUrl, defaultName),
  importTbCSV: () => ipcRenderer.invoke('tableBuilder:importCSV'),
});
