const electron = require('electron');
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const dbManager = require('./db.js');
const utils = require('./utils.js');
const LicenseStorageService = require('./LicenseStorageService.js');

ipcMain.handle('dialog:openDirectory', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled) { return null; }
  return filePaths[0];
});

// ==========================================
// LICENSE & ACTIVATION HANDLERS
// ==========================================

ipcMain.handle('license:get-state', () => {
  return LicenseStorageService.getCombinedState();
});

ipcMain.handle('license:save-activation', (event, activationData) => {
  try {
    LicenseStorageService.updateLicenseState({
      mode: 'licensed_active',
      license_id: activationData.licenseId,
      customer_name: activationData.licensedToName,
      organization: activationData.licensedToOrganization,
      tier: activationData.tier,
      activation_date: activationData.activationDate,
      last_verified_at: new Date().toISOString(),
      offline_grace_days: activationData.offlineGraceDays,
      reverify_after_hours: activationData.reverifyAfterHours,
      entitlement_token: activationData.entitlementToken
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to save activation state:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('license:refresh-verification', (event, refreshData) => {
  try {
    LicenseStorageService.updateLicenseState({
      last_verified_at: new Date().toISOString(),
      entitlement_token: refreshData.entitlementToken,
      offline_grace_days: refreshData.offlineGraceDays,
      reverify_after_hours: refreshData.reverifyAfterHours
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('license:enter-demo', () => {
  try {
    LicenseStorageService.updateLicenseState({
      mode: 'demo',
      license_id: null,
      entitlement_token: null
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('license:track-usage', (event, { key, amount }) => {
  return LicenseStorageService.incrementCounter(key, amount || 1);
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

ipcMain.handle('dialog:openPdf', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'PDF Documents', extensions: ['pdf'] }
    ]
  });
  if (canceled || filePaths.length === 0) { return null; }
  return filePaths[0]; // Return the absolute path
});

ipcMain.handle('dialog:openPath', async (event, filePath) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Failed to open path:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('file:readBase64', async (event, filePath) => {
  try {
    const fs = require('node:fs');
    const buffer = fs.readFileSync(filePath);
    return { success: true, base64: buffer.toString('base64') };
  } catch (error) {
    console.error('Failed to read file:', error);
    return { success: false, error: String(error) };
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

ipcMain.handle('db:getMetadata', async (event, key) => {
  try {
    return dbManager.getMetadata(key);
  } catch (err) {
    console.error('getMetadata error:', err);
    return null;
  }
});

ipcMain.handle('db:setMetadata', async (event, key, value) => {
  try {
    return dbManager.setMetadata(key, value);
  } catch (err) {
    console.error('setMetadata error:', err);
    return { success: false, error: err.message };
  }
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

ipcMain.handle('reference:importFile', async (event, folderId) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Reference Files', extensions: ['ris', 'bib'] }]
  });
  if (canceled || filePaths.length === 0) return { success: false, canceled: true };
  try {
    const fileText = fs.readFileSync(filePaths[0], 'utf-8');
    
    // Lazy load citation-js plugins
    const { Cite } = require('@citation-js/core');
    require('@citation-js/plugin-bibtex');
    require('@citation-js/plugin-ris');

    let parsedData = [];

    if (filePaths[0].toLowerCase().endsWith('.bib')) {
      // Robust BibTeX parsing: split by entries and parse individually
      // This avoids the strict parser crashing on trailing commas between entries
      const entryRegex = /@\w+\s*\{/g;
      const entryStarts = [];
      let match;
      while ((match = entryRegex.exec(fileText)) !== null) {
        entryStarts.push(match.index);
      }

      for (let i = 0; i < entryStarts.length; i++) {
        const start = entryStarts[i];
        const end = i + 1 < entryStarts.length ? entryStarts[i + 1] : fileText.length;
        let entryText = fileText.substring(start, end).trim();
        // Remove any trailing comma after the closing brace
        entryText = entryText.replace(/\}\s*,\s*$/, '}');
        try {
          const entryCite = new Cite(entryText);
          parsedData = parsedData.concat(entryCite.data);
        } catch (entryErr) {
          console.warn('Skipping malformed BibTeX entry:', entryText.substring(0, 80), entryErr.message);
        }
      }
    } else {
      // RIS and other formats: parse whole file at once
      const cite = new Cite(fileText);
      parsedData = cite.data;
    }
    
    const addedReferences = [];
    for (const item of parsedData) {
      const authors = item.author ? item.author.map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(', ') : 'Unknown Author';
      const title = item.title || 'Untitled';
      const year = item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0][0].toString() : 'Unknown Year';
      const containerTitle = item['container-title'] || item.publisher || 'Unknown Journal';
      const doi = item.DOI || '';
      
      const refData = {
        authors,
        title,
        year,
        journal: containerTitle,
        doi,
        raw_metadata: JSON.stringify(item)
      };
      
      const added = dbManager.addReference(refData);
      
      // If a folder was selected during import, instantaneously bind it!
      if (folderId) {
        try {
          dbManager.setReferenceFolders(added.id, [folderId]);
        } catch(e) {
          console.error('Fast-binding folder failed for', added.id, e);
        }
      }
      
      addedReferences.push(added);
    }

    return { success: true, count: addedReferences.length, data: addedReferences };
  } catch (error) {
    console.error('Import Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('reference:exportLib', async (event, refs, format = 'ris') => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: `Export ${format.toUpperCase()}`,
      defaultPath: `library.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const { Cite } = require('@citation-js/core');
    require('@citation-js/plugin-bibtex');
    require('@citation-js/plugin-ris');

    // Reconstruct citation-js data structures from our sqlite fields
    // Map our new StructuredMetadata JSON into CSL-JSON format
    const mapped = refs.map(r => {
      let base = {
        id: r.id,
        type: 'article-journal', // Default CSL type
        title: r.title,
        author: r.authors ? [{ literal: r.authors }] : undefined,
        issued: r.year ? { 'date-parts': [[parseInt(r.year)]] } : undefined,
        'container-title': r.journal,
        DOI: r.doi
      };

      if (r.raw_metadata) {
        try { 
          const raw = JSON.parse(r.raw_metadata);
          
          // If it's our new StructuredMetadata form:
          if (raw.reference_type) {
            // Map types broadly
            switch (raw.reference_type) {
                case 'book': base.type = 'book'; break;
                case 'book_chapter': base.type = 'chapter'; break;
                case 'conference_paper': base.type = 'paper-conference'; break;
                case 'thesis': base.type = 'thesis'; break;
                case 'report': base.type = 'report'; break;
                case 'webpage': base.type = 'webpage'; break;
                case 'patent': base.type = 'patent'; break;
                default: base.type = 'article-journal'; break;
            }
            
            // Map complex contributors to CSL-JSON authors/editors
            if (raw.contributors && Array.isArray(raw.contributors)) {
                base.author = raw.contributors.filter(c => c.role === 'Author' || c.role === 'Organization').map(c => {
                    if (c.isCorporate) return { literal: c.corporateName };
                    return { given: c.firstName, family: c.lastName, literal: `${c.firstName || ''} ${c.lastName || ''}`.trim() };
                });
                const editors = raw.contributors.filter(c => c.role === 'Editor').map(c => {
                    if (c.isCorporate) return { literal: c.corporateName };
                    return { given: c.firstName, family: c.lastName, literal: `${c.firstName || ''} ${c.lastName || ''}`.trim() };
                });
                if (editors.length > 0) base.editor = editors;
                if (base.author.length === 0) delete base.author; // Clean up
            }

            if (raw.volume) base.volume = raw.volume;
            if (raw.issue) base.issue = raw.issue;
            if (raw.pages_start) base.page = raw.pages_start + (raw.pages_end ? '-' + raw.pages_end : '');
            if (raw.publisher) base.publisher = raw.publisher;
            if (raw.place_published) base['publisher-place'] = raw.place_published;
            if (raw.isbn) base.ISBN = raw.isbn;
            if (raw.issn) base.ISSN = raw.issn;
            if (raw.abstract) base.abstract = raw.abstract;
            if (raw.url) base.URL = raw.url;

          } else {
             // It's the old citation-js raw metadata
             return { ...base, ...raw };
          }
        } catch(e) { }
      }
      return base;
    });

    const cite = new Cite(mapped);
    let output = '';
    
    if (format === 'bib') {
      output = cite.format('bibtex');
    } else {
      output = cite.format('ris');
    }

    fs.writeFileSync(filePath, output, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Export Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('reference:importStyle', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSL Style', extensions: ['csl'] }]
  });
  if (canceled || filePaths.length === 0) return { success: false, canceled: true };
  try {
    const xml_content = fs.readFileSync(filePaths[0], 'utf-8');
    const idMatch = xml_content.match(/<id>(.*?)<\/id>/);
    const titleMatch = xml_content.match(/<title>(.*?)<\/title>/);
    
    const fileName = path.basename(filePaths[0], '.csl');
    let id = idMatch ? idMatch[1].split('/').pop() : fileName;
    let name = titleMatch ? titleMatch[1] : fileName;
    id = id.replace(/[^a-zA-Z0-9_-]/g, '-');
    
    const style = dbManager.addCustomStyle(id, name, xml_content);
    return { success: true, data: style };
  } catch (error) {
    console.error('Import Style Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('reference:getCustomStyles', async () => {
  try {
    const styles = dbManager.getCustomStyles();
    return { success: true, data: styles };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- Folders ---
ipcMain.handle('reference:getFolders', async () => {
  try {
    const folders = dbManager.getFolders();
    return { success: true, data: folders };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:createFolder', async (event, name, parent_id) => {
  try {
    const folder = dbManager.createFolder(name, parent_id);
    return { success: true, data: folder };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:deleteFolder', async (event, id) => {
  try {
    dbManager.deleteFolder(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:renameFolder', async (event, id, newName) => {
  try {
    const folder = dbManager.renameFolder(id, newName);
    return { success: true, data: folder };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:getFoldersByRef', async (event, ref_id) => {
  try {
    const folderIds = dbManager.getReferenceFolders(ref_id);
    return { success: true, data: folderIds }; // array of strings
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:getAllFolderMappings', async () => {
  try {
    const mappings = dbManager.getAllFolderMappings();
    return { success: true, data: mappings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reference:setFoldersForRef', async (event, ref_id, folder_ids) => {
  try {
    dbManager.setReferenceFolders(ref_id, folder_ids);
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

ipcMain.handle('document:exportDocx', async (event, html, defaultTitle = 'Document') => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export to DOCX',
      defaultPath: `${defaultTitle}.docx`,
      filters: [{ name: 'Word Document', extensions: ['docx'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const HTMLtoDOCX = require('html-to-docx');
    
    // Ensure styles and proper formatting
    // We wrap the html in a basic document structure to help parsing if needed, but html-to-docx is robust
    const fileBuffer = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
    });

    fs.writeFileSync(filePath, fileBuffer);
    return { success: true, filePath };
  } catch (error) {
    console.error("Export DOCX Error:", error);
    return { success: false, error: error.message };
  }
});

// --- Import DOCX (for Integrity Checker) ---
ipcMain.handle('document:importDocx', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import DOCX Manuscript',
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ path: filePath });
    const fileName = path.basename(filePath, path.extname(filePath));

    return {
      success: true,
      data: {
        html: result.value,
        fileName,
        filePath,
        warnings: result.messages.filter(m => m.type === 'warning').map(m => m.message)
      }
    };
  } catch (error) {
    console.error('Import DOCX Error:', error);
    return { success: false, error: error.message };
  }
});

// --- Graphing Studio: Datasets ---
ipcMain.handle('graphing:getDatasets', async () => {
  try {
    const datasets = dbManager.getGraphingDatasets();
    return { success: true, data: datasets };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:getDataset', async (event, id) => {
  try {
    const dataset = dbManager.getGraphingDataset(id);
    return { success: true, data: dataset };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:createDataset', async (event, data) => {
  try {
    const dataset = dbManager.createGraphingDataset(data);
    return { success: true, data: dataset };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:updateDataset', async (event, id, updates) => {
  try {
    const dataset = dbManager.updateGraphingDataset(id, updates);
    return { success: true, data: dataset };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:deleteDataset', async (event, id) => {
  try {
    dbManager.deleteGraphingDataset(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- Graphing Studio: Analyses ---
ipcMain.handle('graphing:getAnalyses', async (event, datasetId) => {
  try {
    const analyses = dbManager.getGraphingAnalyses(datasetId);
    return { success: true, data: analyses };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:createAnalysis', async (event, data) => {
  try {
    const analysis = dbManager.createGraphingAnalysis(data);
    return { success: true, data: analysis };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:deleteAnalysis', async (event, id) => {
  try {
    dbManager.deleteGraphingAnalysis(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- Graphing Studio: Figures ---
ipcMain.handle('graphing:getFigures', async (event, datasetId) => {
  try {
    const figures = dbManager.getGraphingFigures(datasetId);
    return { success: true, data: figures };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:getFigure', async (event, id) => {
  try {
    const figure = dbManager.getGraphingFigure(id);
    return { success: true, data: figure };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:createFigure', async (event, data) => {
  try {
    const figure = dbManager.createGraphingFigure(data);
    return { success: true, data: figure };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:updateFigure', async (event, id, updates) => {
  try {
    const figure = dbManager.updateGraphingFigure(id, updates);
    return { success: true, data: figure };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('graphing:deleteFigure', async (event, id) => {
  try {
    dbManager.deleteGraphingFigure(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- Graphing Studio: Export Figure to File ---
ipcMain.handle('graphing:exportFigure', async (event, imageDataUrl, defaultName, format) => {
  try {
    const filters = [];
    if (format === 'png') filters.push({ name: 'PNG Image', extensions: ['png'] });
    else if (format === 'svg') filters.push({ name: 'SVG Image', extensions: ['svg'] });
    else if (format === 'tiff') filters.push({ name: 'TIFF Image', extensions: ['tiff', 'tif'] });
    else if (format === 'pdf') filters.push({ name: 'PDF Document', extensions: ['pdf'] });
    else filters.push({ name: 'Image', extensions: ['png'] });

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Figure',
      defaultPath: `${defaultName || 'Figure'}.${format || 'png'}`,
      filters
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    // imageDataUrl is a data:image/* base64 string
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return { success: true, filePath };
  } catch (error) {
    console.error('Export Figure Error:', error);
    return { success: false, error: error.message };
  }
});

// --- Graphing: Import CSV/TSV file ---
ipcMain.handle('graphing:importCSVFile', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Data File',
      filters: [
        { name: 'Data Files', extensions: ['csv', 'tsv', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, path.extname(filePath));

    return { success: true, data: { content, fileName, filePath } };
  } catch (error) {
    console.error('Import CSV Error:', error);
    return { success: false, error: error.message };
  }
});

// --- Systematic Review Handlers ---

ipcMain.handle('systematic:getExtractionTemplates', async () => {
  try { return { success: true, data: dbManager.getExtractionTemplates() }; }
  catch (error) { return { success: false, error: error.message }; }
});
ipcMain.handle('systematic:createExtractionTemplate', async (event, data) => {
  try { return { success: true, data: dbManager.createExtractionTemplate(data) }; }
  catch (error) { return { success: false, error: error.message }; }
});
ipcMain.handle('systematic:deleteExtractionTemplate', async (event, id) => {
  try { return dbManager.deleteExtractionTemplate(id); }
  catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('systematic:getExtractedDataPoints', async (event, refId) => {
  try { return { success: true, data: dbManager.getExtractedDataPoints(refId) }; }
  catch (error) { return { success: false, error: error.message }; }
});
ipcMain.handle('systematic:saveExtractedDataPoint', async (event, data) => {
  try { return { success: true, data: dbManager.saveExtractedDataPoint(data) }; }
  catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('systematic:getRobAssessments', async (event, refId) => {
  try { return { success: true, data: dbManager.getRobAssessments(refId) }; }
  catch (error) { return { success: false, error: error.message }; }
});
ipcMain.handle('systematic:saveRobAssessment', async (event, data) => {
  try { return { success: true, data: dbManager.saveRobAssessment(data) }; }
  catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('systematic:getReviewerDecisions', async (event, refId) => {
  try { return { success: true, data: dbManager.getReviewerDecisions(refId) }; }
  catch (error) { return { success: false, error: error.message }; }
});
ipcMain.handle('systematic:saveReviewerDecision', async (event, data) => {
  try { return { success: true, data: dbManager.saveReviewerDecision(data) }; }
  catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('systematic:autoFetchPDFs', async (event, refs, email) => {
  try {
    const path = require('node:path');
    const fs = require('node:fs');
    
    const pdfsDir = path.join(dbManager.getProjectPath(), 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }

    let successCount = 0;
    let failedCount = 0;
    const successfulFetches = [];
    
    for (const ref of refs) {
      if (!ref.doi) {
        failedCount++;
        continue;
      }
      
      const doi = encodeURIComponent(ref.doi);
      const url = `https://api.unpaywall.org/v2/${doi}?email=${encodeURIComponent(email)}`;
      
      try {
        // Node 18+ native fetch
        const response = await fetch(url);
        if (!response.ok) {
          failedCount++;
          continue;
        }
        
        const data = await response.json();
        if (data.is_oa && data.best_oa_location && data.best_oa_location.url_for_pdf) {
          const pdfUrl = data.best_oa_location.url_for_pdf;
          const pdfRes = await fetch(pdfUrl);
          if (!pdfRes.ok) {
            failedCount++;
            continue;
          }
          
          const buffer = await pdfRes.arrayBuffer();
          const filePath = path.join(pdfsDir, `${ref.id}.pdf`);
          fs.writeFileSync(filePath, Buffer.from(buffer));
          
          try { dbManager.updateReference(ref.id, { pdf_path: filePath }); } catch(e) {}
          successfulFetches.push({ id: ref.id, pdfPath: filePath });
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error('Fetch error for DOI:', ref.doi, err);
        failedCount++;
      }
    }
    
    return { success: true, results: { successCount, failedCount, successfulFetches } };
  } catch (error) {
    console.error('AutoFetch Error:', error);
    return { success: false, error: String(error) };
  }
});

// --- Collaboration Handlers ---
ipcMain.handle('systematic:exportCollaborationData', async (event, reviewerId) => {
  try {
    const decisions = dbManager.getDb().prepare(`SELECT * FROM reviewer_decisions WHERE reviewer_id = ?`).all(reviewerId);
    const extractions = dbManager.getDb().prepare(`SELECT * FROM extracted_data_points WHERE reviewer_id = ?`).all(reviewerId);
    const robs = dbManager.getDb().prepare(`SELECT * FROM rob_assessments WHERE reviewer_id = ?`).all(reviewerId);

    const exportData = {
      version: '1.0',
      reviewerId,
      timestamp: new Date().toISOString(),
      decisions,
      extractions,
      robs
    };

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Reviewer Data',
      defaultPath: `ReviewerData_${reviewerId}_${Date.now()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const fs = require('node:fs');
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Export Collab Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('systematic:importCollaborationData', async (event) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Reviewer Data',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || filePaths.length === 0) return { success: false, canceled: true };

    const fs = require('node:fs');
    const importData = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
    
    if (!importData.version || !importData.reviewerId) {
      throw new Error('Invalid reviewer data file format.');
    }

    const { decisions, extractions, robs } = importData;
    
    const dbInst = dbManager.getDb();
    const tx = dbInst.transaction(() => {
      // Import decisions
      const insertDec = dbInst.prepare(`INSERT OR REPLACE INTO reviewer_decisions (ref_id, reviewer_id, stage, decision, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const d of (decisions || [])) {
        insertDec.run(d.ref_id, d.reviewer_id, d.stage, d.decision, d.notes, d.timestamp);
      }

      // Import extractions
      const insertExt = dbInst.prepare(`INSERT OR REPLACE INTO extracted_data_points (id, ref_id, reviewer_id, template_id, data_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const e of (extractions || [])) {
        insertExt.run(e.id, e.ref_id, e.reviewer_id, e.template_id, e.data_json, e.updated_at);
      }

      // Import RoBs
      const insertRob = dbInst.prepare(`INSERT OR REPLACE INTO rob_assessments (id, ref_id, reviewer_id, tool_used, domain_scores_json, overall_risk, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const r of (robs || [])) {
        insertRob.run(r.id, r.ref_id, r.reviewer_id, r.tool_used, r.domain_scores_json, r.overall_risk, r.created_at);
      }
    });
    
    tx();
    
    return { 
      success: true, 
      stats: {
        decisions: (decisions || []).length,
        extractions: (extractions || []).length,
        robs: (robs || []).length
      }
    };
  } catch (error) {
    console.error('Import Collab Error:', error);
    return { success: false, error: String(error) };
  }
});

// --- Graphing Integration ---
ipcMain.handle('systematic:exportToGraphingStudio', async (event, includedRefs) => {
  try {
     const dbInst = dbManager.getDb();
     if (!includedRefs || includedRefs.length === 0) return { success: false, error: 'No strictly included references provided.' };

     const templates = dbInst.prepare(`SELECT * FROM extraction_templates`).all();
     
     const columns = [
       { id: 'study_name', title: 'Study Name', subcolumns: 1, isX: true },
       { id: 'year', title: 'Year', subcolumns: 1, isX: false }
     ];
     
     templates.forEach(t => {
       const fields = JSON.parse(t.fields_json || '[]');
       fields.forEach(f => {
         const colId = `ext_${t.id}_${f.id}`;
         columns.push({ id: colId, title: `${t.name} - ${f.name}`, subcolumns: 1, isX: false });
       });
     });

     const rows = [];
     for (const ref of includedRefs) {
       const rowId = `row_${ref.id}`;
       const cells = {};
       
       columns.forEach(c => {
         cells[c.id] = [{ id: `cell_${rowId}_${c.id}`, value: null }];
       });

       cells['study_name'][0].value = ref.authors ? `${ref.authors.split(',')[0]} et al.` : ref.title;
       cells['year'][0].value = ref.year || null;

       const exts = dbInst.prepare(`SELECT * FROM extracted_data_points WHERE ref_id = ? ORDER BY updated_at DESC`).all(ref.id);
       
       exts.forEach(e => {
          const dataJson = JSON.parse(e.data_json || '{}');
          Object.keys(dataJson).forEach(fKey => {
             const colId = `ext_${e.template_id}_${fKey}`;
             if (cells[colId]) {
               cells[colId][0].value = dataJson[fKey];
             }
          });
       });

       rows.push({
         id: rowId,
         rowName: ref.authors ? `${ref.authors.split(',')[0]} et al.` : `Ref ${ref.id.substring(0,6)}`,
         cells
       });
     }

     const metadataStr = JSON.stringify({
        createdAt: Date.now(),
        updatedAt: Date.now(),
        notes: 'Imported from Systematic Review Protocol'
     });

     const dsResult = dbManager.createGraphingDataset({
        name: `Meta-Analysis Dataset (${new Date().toLocaleDateString()})`,
        format: 'column',
        columns_json: JSON.stringify(columns),
        rows_json: JSON.stringify(rows),
        metadata_json: metadataStr,
        variable_mapping_json: '{}'
     });

     return { success: true, datasetId: typeof dsResult === 'object' ? dsResult.id : dsResult };
  } catch (err) {
    console.error('Export Graphing Error:', err);
    return { success: false, error: String(err) };
  }
});

// ═══════════════════════════════════════════════
// Table Builder & Results Reporting — IPC Handlers
// ═══════════════════════════════════════════════

ipcMain.handle('tableBuilder:getTables', async () => {
  try { return { success: true, data: dbManager.getTbTables() }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:getTable', async (_, id) => {
  try { return { success: true, data: dbManager.getTbTable(id) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:createTable', async (_, data) => {
  try { return { success: true, data: dbManager.createTbTable(data) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:updateTable', async (_, id, updates) => {
  try { return { success: true, data: dbManager.updateTbTable(id, updates) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:deleteTable', async (_, id) => {
  try { return { success: true, data: dbManager.deleteTbTable(id) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:getNarratives', async (_, tableId) => {
  try { return { success: true, data: dbManager.getTbNarratives(tableId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:createNarrative', async (_, data) => {
  try { return { success: true, data: dbManager.createTbNarrative(data) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:updateNarrative', async (_, id, updates) => {
  try { return { success: true, data: dbManager.updateTbNarrative(id, updates) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:deleteNarrative', async (_, id) => {
  try { return { success: true, data: dbManager.deleteTbNarrative(id) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:getDocLinks', async (_, tableId) => {
  try { return { success: true, data: dbManager.getTbDocLinks(tableId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:createDocLink', async (_, data) => {
  try { return { success: true, data: dbManager.createTbDocLink(data) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:updateDocLink', async (_, id, updates) => {
  try { return { success: true, data: dbManager.updateTbDocLink(id, updates) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:deleteDocLink', async (_, id) => {
  try { return { success: true, data: dbManager.deleteTbDocLink(id) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:getAuditLog', async (_, tableId) => {
  try { return { success: true, data: dbManager.getTbAuditLog(tableId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:createAuditEntry', async (_, data) => {
  try { return { success: true, data: dbManager.createTbAuditEntry(data) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:getExportHistory', async (_, tableId) => {
  try { return { success: true, data: dbManager.getTbExportHistory(tableId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:createExportEntry', async (_, data) => {
  try { return { success: true, data: dbManager.createTbExportEntry(data) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:getSettings', async () => {
  try { return { success: true, data: dbManager.getMetadata('tb_settings') || '{}' }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:updateSettings', async (_, settings_json) => {
  try { return { success: true, data: dbManager.setMetadata('tb_settings', settings_json) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('tableBuilder:exportTablePDF', async (event, html, defaultName) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Table to PDF',
      defaultPath: `${defaultName || 'Table'}.pdf`,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const BrowserWindow = require('electron').BrowserWindow;
    const printWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true } });
    
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdf = await printWindow.webContents.printToPDF({
      marginsType: 0,
      pageSize: 'A4',
      printBackground: true,
      printSelectionOnly: false,
      landscape: false
    });
    
    fs.writeFileSync(filePath, pdf);
    printWindow.close();
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Export PDF Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('tableBuilder:exportTableCSV', async (event, csvContent, defaultName) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Table to CSV',
      defaultPath: `${defaultName || 'Table'}.csv`,
      filters: [{ name: 'CSV Document', extensions: ['csv'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Export CSV Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('tableBuilder:exportTableImage', async (event, html, defaultName) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Table Image',
      defaultPath: `${defaultName || 'Table'}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const BrowserWindow = require('electron').BrowserWindow;
    const printWindow = new BrowserWindow({ show: false, width: 1200, height: 800, webPreferences: { nodeIntegration: true } });
    
    // Add some padding to the HTML body for the screenshot
    const paddedHtml = `<div style="padding: 20px; background: white;">${html}</div>`;
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(paddedHtml)}`);
    
    // Wait for render
    await new Promise(r => setTimeout(r, 500));
    
    const image = await printWindow.webContents.capturePage();
    fs.writeFileSync(filePath, image.toPNG());
    printWindow.close();
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Export Image Error:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('tableBuilder:importCSV', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import CSV Data',
      filters: [
        { name: 'CSV/TSV Files', extensions: ['csv', 'tsv', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, path.extname(filePath));

    return { success: true, data: { content, fileName, filePath } };
  } catch (error) {
    console.error('Import CSV Error:', error);
    return { success: false, error: error.message };
  }
});

// --- Integrity Checker Handlers ---

ipcMain.handle('integrity:getScanSessions', async (event, documentId) => {
  try { return { success: true, data: dbManager.getIcScanSessions(documentId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:createScanSession', async (event, data) => {
  try { return { success: true, data: dbManager.createIcScanSession(data) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:updateScanSession', async (event, id, updates) => {
  try { return { success: true, data: dbManager.updateIcScanSession(id, updates) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:deleteScanSession', async (event, id) => {
  try { return { success: true, data: dbManager.deleteIcScanSession(id) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getFindings', async (event, sessionId) => {
  try { return { success: true, data: dbManager.getIcFindings(sessionId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:saveFindings', async (event, findings) => {
  try { return { success: true, data: dbManager.saveIcFindings(findings) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:updateFindingStatus', async (event, id, status, reviewerNote) => {
  try { return { success: true, data: dbManager.updateIcFindingStatus(id, status, reviewerNote) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getSettings', async (event, profileName) => {
  try { return { success: true, data: dbManager.getIcSettings(profileName) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:updateSettings', async (event, profileName, settingsJson) => {
  try { return { success: true, data: dbManager.updateIcSettings(profileName, settingsJson) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getAbbrevRegistry', async (event, sessionId) => {
  try { return { success: true, data: dbManager.getIcAbbrevRegistry(sessionId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:saveAbbrevRegistry', async (event, items) => {
  try { return { success: true, data: dbManager.saveIcAbbrevRegistry(items) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getCitationMapping', async (event, sessionId) => {
  try { return { success: true, data: dbManager.getIcCitationMapping(sessionId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:saveCitationMapping', async (event, items) => {
  try { return { success: true, data: dbManager.saveIcCitationMapping(items) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getAssetMapping', async (event, sessionId) => {
  try { return { success: true, data: dbManager.getIcAssetMapping(sessionId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:saveAssetMapping', async (event, items) => {
  try { return { success: true, data: dbManager.saveIcAssetMapping(items) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getComplianceStatements', async (event, sessionId) => {
  try { return { success: true, data: dbManager.getIcComplianceStatements(sessionId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:saveComplianceStatements', async (event, items) => {
  try { return { success: true, data: dbManager.saveIcComplianceStatements(items) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:getSampleSizeMentions', async (event, sessionId) => {
  try { return { success: true, data: dbManager.getIcSampleSizeMentions(sessionId) }; }
  catch (e) { return { success: false, error: String(e) }; }
});

ipcMain.handle('integrity:saveSampleSizeMentions', async (event, items) => {
  try { return { success: true, data: dbManager.saveIcSampleSizeMentions(items) }; }
  catch (e) { return { success: false, error: String(e) }; }
});
