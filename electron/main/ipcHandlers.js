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
