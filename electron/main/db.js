const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('node:path');

// Manages the active project database connection
let db = null;
let currentProjectPath = null;

function initDatabase(projectPath) {
  try {
    // Ensure project directory exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    const dbPath = path.join(projectPath, 'project.db');
    
    // Close existing connection if any
    if (db) {
      db.close();
    }

    db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });
    currentProjectPath = projectPath;

    // Pragma optimizations for SQLite
    db.pragma('journal_mode = WAL');

    // Initialize Schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS references_list (
        id TEXT PRIMARY KEY,
        reference_type TEXT DEFAULT 'Journal Article',
        authors TEXT,
        title TEXT,
        year TEXT,
        journal TEXT,
        doi TEXT,
        raw_metadata TEXT,
        review_status TEXT DEFAULT 'unreviewed'
      );

      CREATE TABLE IF NOT EXISTS custom_styles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        xml_content TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT
      );

      CREATE TABLE IF NOT EXISTS reference_folders (
        ref_id TEXT,
        folder_id TEXT,
        PRIMARY KEY(ref_id, folder_id)
      );

      CREATE TABLE IF NOT EXISTS graphing_datasets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'column',
        columns_json TEXT,
        rows_json TEXT,
        metadata_json TEXT,
        variable_mapping_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS graphing_analyses (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        test_name TEXT NOT NULL,
        config_json TEXT,
        result_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dataset_id) REFERENCES graphing_datasets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS graphing_figures (
        id TEXT PRIMARY KEY,
        dataset_id TEXT,
        analysis_id TEXT,
        name TEXT NOT NULL,
        graph_type TEXT NOT NULL DEFAULT 'bar',
        options_json TEXT,
        annotation_json TEXT,
        thumbnail_dataurl TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dataset_id) REFERENCES graphing_datasets(id) ON DELETE SET NULL,
        FOREIGN KEY (analysis_id) REFERENCES graphing_analyses(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS extraction_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fields_json TEXT
      );

      CREATE TABLE IF NOT EXISTS extracted_data_points (
        id TEXT PRIMARY KEY,
        ref_id TEXT NOT NULL,
        reviewer_id TEXT,
        template_id TEXT NOT NULL,
        data_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rob_assessments (
        id TEXT PRIMARY KEY,
        ref_id TEXT NOT NULL,
        reviewer_id TEXT,
        tool_used TEXT NOT NULL,
        domain_scores_json TEXT,
        overall_risk TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviewer_decisions (
        ref_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        decision TEXT NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ref_id, reviewer_id, stage)
      );

      -- ═══ Table Builder & Results Reporting ═══
      CREATE TABLE IF NOT EXISTS tb_tables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        table_type TEXT NOT NULL DEFAULT 'custom',
        table_number TEXT DEFAULT '',
        numbering_mode TEXT DEFAULT 'auto',
        category TEXT DEFAULT '',
        style_preset TEXT DEFAULT 'general-journal',
        columns_json TEXT NOT NULL DEFAULT '[]',
        rows_json TEXT NOT NULL DEFAULT '[]',
        grouped_headers_json TEXT DEFAULT '[]',
        footnotes_json TEXT DEFAULT '[]',
        source_analysis_id TEXT,
        source_dataset_id TEXT,
        source_mapping_json TEXT DEFAULT '{}',
        link_status TEXT DEFAULT 'none',
        last_refresh_at DATETIME,
        style_options_json TEXT DEFAULT '{}',
        section_target TEXT DEFAULT '',
        keywords TEXT DEFAULT '',
        notes_to_self TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT DEFAULT '',
        FOREIGN KEY (source_analysis_id) REFERENCES graphing_analyses(id) ON DELETE SET NULL,
        FOREIGN KEY (source_dataset_id) REFERENCES graphing_datasets(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS tb_narratives (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        narrative_type TEXT DEFAULT 'concise',
        tone TEXT DEFAULT 'neutral',
        content TEXT DEFAULT '',
        settings_json TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tb_tables(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tb_document_links (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        insertion_type TEXT DEFAULT 'linked',
        position_marker TEXT DEFAULT '',
        caption_placement TEXT DEFAULT 'above',
        include_footnotes INTEGER DEFAULT 1,
        include_narrative INTEGER DEFAULT 0,
        last_synced_at DATETIME,
        update_status TEXT DEFAULT 'synced',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tb_tables(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tb_audit_log (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details_json TEXT DEFAULT '{}',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tb_tables(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tb_export_history (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        format TEXT NOT NULL,
        file_path TEXT DEFAULT '',
        options_json TEXT DEFAULT '{}',
        exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tb_tables(id) ON DELETE CASCADE
      );
    `);

    // Migration: Ensure new columns exist for older projects
    const columnsToEnsure = [
      { table: 'references_list', col: 'reference_type', type: "TEXT DEFAULT 'Journal Article'" },
      { table: 'references_list', col: 'review_status', type: "TEXT DEFAULT 'unreviewed'" },
      { table: 'references_list', col: 'notes', type: "TEXT" },
      { table: 'references_list', col: 'tags', type: "TEXT" },
      { table: 'references_list', col: 'pdf_path', type: "TEXT" }
    ];

    for (const {table, col, type} of columnsToEnsure) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
      } catch (e) {
        // Column already exists
      }
    }

    // Insert or update project creation time
    const stmt = db.prepare(`INSERT OR IGNORE INTO metadata (key, value) VALUES ('created_at', ?)`);
    stmt.run(new Date().toISOString());

    return { success: true, path: projectPath };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error: error.message };
  }
}

function getDb() {
  if (!db) {
    throw new Error('No project database is currently open.');
  }
  return db;
}

function getMetadata(key) {
  const dbInst = getDb();
  const row = dbInst.prepare(`SELECT value FROM metadata WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function setMetadata(key, value) {
  const dbInst = getDb();
  dbInst.prepare(`INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)`).run(key, value);
  return { success: true };
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    currentProjectPath = null;
  }
}

function getReferences() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM references_list ORDER BY year DESC, title ASC`).all();
}

function addReference(ref) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  const stmt = dbInst.prepare(`
    INSERT INTO references_list (id, reference_type, authors, title, year, journal, doi, raw_metadata, notes, tags, pdf_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, ref.reference_type || 'Journal Article', ref.authors, ref.title, ref.year, ref.journal, ref.doi || null, ref.raw_metadata || null,
    ref.notes || null, ref.tags || null, ref.pdf_path || null
  );
  return { id, ...ref };
}

function updateReference(id, updates) {
  const dbInst = getDb();
  
  // Dynamic update logic to preserve existing fields if not provided
  const current = dbInst.prepare(`SELECT * FROM references_list WHERE id = ?`).get(id);
  if (!current) throw new Error('Reference not found');

  const newReferenceType = updates.reference_type !== undefined ? updates.reference_type : current.reference_type;
  const newAuthors = updates.authors !== undefined ? updates.authors : current.authors;
  const newTitle = updates.title !== undefined ? updates.title : current.title;
  const newYear = updates.year !== undefined ? updates.year : current.year;
  const newJournal = updates.journal !== undefined ? updates.journal : current.journal;
  const newDoi = updates.doi !== undefined ? updates.doi : current.doi;
  const newRawMetadata = updates.raw_metadata !== undefined ? updates.raw_metadata : current.raw_metadata;
  const newNotes = updates.notes !== undefined ? updates.notes : current.notes;
  const newTags = updates.tags !== undefined ? updates.tags : current.tags;
  const newPdfPath = updates.pdf_path !== undefined ? updates.pdf_path : current.pdf_path;

  const stmt = dbInst.prepare(`
    UPDATE references_list 
    SET reference_type = ?, authors = ?, title = ?, year = ?, journal = ?, doi = ?, raw_metadata = ?, notes = ?, tags = ?, pdf_path = ?
    WHERE id = ?
  `);
  stmt.run(newReferenceType, newAuthors, newTitle, newYear, newJournal, newDoi, newRawMetadata, newNotes, newTags, newPdfPath, id);
  return { id, ...updates };
}

function deleteReference(id) {
  const dbInst = getDb();
  const stmt = dbInst.prepare(`DELETE FROM references_list WHERE id = ?`);
  stmt.run(id);
  return { success: true };
}

function updateReferenceStatus(id, status) {
  const dbInst = getDb();
  const stmt = dbInst.prepare(`UPDATE references_list SET review_status = ? WHERE id = ?`);
  stmt.run(status, id);
  return { id, review_status: status };
}

function getCustomStyles() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM custom_styles`).all();
}

function addCustomStyle(id, name, xml_content) {
  const dbInst = getDb();
  const stmt = dbInst.prepare(`
    INSERT OR REPLACE INTO custom_styles (id, name, xml_content)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, name, xml_content);
  return { id, name, xml_content };
}

// === FOLDERS ===

function getFolders() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM folders`).all();
}

function createFolder(name, parent_id = null) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  const stmt = dbInst.prepare(`INSERT INTO folders (id, name, parent_id) VALUES (?, ?, ?)`);
  stmt.run(id, name, parent_id);
  return { id, name, parent_id };
}

function deleteFolder(id) {
  const dbInst = getDb();
  // We should also delete mappings
  dbInst.prepare(`DELETE FROM reference_folders WHERE folder_id = ?`).run(id);
  dbInst.prepare(`DELETE FROM folders WHERE id = ?`).run(id);
  // Also delete child folders cascade (simple approach for now: just level 1)
  dbInst.prepare(`DELETE FROM folders WHERE parent_id = ?`).run(id);
  return { success: true };
}

function renameFolder(id, newName) {
  const dbInst = getDb();
  dbInst.prepare(`UPDATE folders SET name = ? WHERE id = ?`).run(newName, id);
  return { id, name: newName };
}

function getReferenceFolders(ref_id) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT folder_id FROM reference_folders WHERE ref_id = ?`).all().map(r => r.folder_id);
}

function getAllFolderMappings() {
  const dbInst = getDb();
  const rows = dbInst.prepare(`SELECT ref_id, folder_id FROM reference_folders`).all();
  const mapping = {};
  for (const row of rows) {
    if (!mapping[row.ref_id]) mapping[row.ref_id] = [];
    mapping[row.ref_id].push(row.folder_id);
  }
  return mapping;
}

function setReferenceFolders(ref_id, folder_ids) {
  const dbInst = getDb();
  const tx = dbInst.transaction(() => {
    dbInst.prepare(`DELETE FROM reference_folders WHERE ref_id = ?`).run(ref_id);
    const insert = dbInst.prepare(`INSERT INTO reference_folders (ref_id, folder_id) VALUES (?, ?)`);
    for (const fId of folder_ids) {
      insert.run(ref_id, fId);
    }
  });
  tx();
  return { success: true };
}

// === DOCUMENTS ===

function getDocuments() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT id, title, updated_at, created_at FROM documents ORDER BY updated_at DESC`).all();
}

function getDocument(id) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
}

function createDocument(title) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  const stmt = dbInst.prepare(`
    INSERT INTO documents (id, title, content)
    VALUES (?, ?, ?)
  `);
  // Initialize with empty content
  stmt.run(id, title || 'Untitled Document', '');
  return getDocument(id);
}

function updateDocument(id, updates) {
  const dbInst = getDb();
  // We allow updating just title, just content, or both
  const current = getDocument(id);
  if (!current) throw new Error('Document not found');

  const newTitle = updates.title !== undefined ? updates.title : current.title;
  const newContent = updates.content !== undefined ? updates.content : current.content;

  const stmt = dbInst.prepare(`
    UPDATE documents 
    SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(newTitle, newContent, id);
  return getDocument(id);
}

function deleteDocument(id) {
  const dbInst = getDb();
  const stmt = dbInst.prepare(`DELETE FROM documents WHERE id = ?`);
  stmt.run(id);
  return { success: true };
}

// === GRAPHING DATASETS ===

function getGraphingDatasets() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT id, name, format, variable_mapping_json, metadata_json, created_at, updated_at FROM graphing_datasets ORDER BY updated_at DESC`).all();
}

function getGraphingDataset(id) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM graphing_datasets WHERE id = ?`).get(id);
}

function createGraphingDataset(data) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  const stmt = dbInst.prepare(`
    INSERT INTO graphing_datasets (id, name, format, columns_json, rows_json, metadata_json, variable_mapping_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.name || 'Untitled Dataset', data.format || 'column',
    data.columns_json || '[]', data.rows_json || '[]',
    data.metadata_json || '{}', data.variable_mapping_json || '{}');
  return getGraphingDataset(id);
}

function updateGraphingDataset(id, updates) {
  const dbInst = getDb();
  const current = getGraphingDataset(id);
  if (!current) throw new Error('Graphing dataset not found');

  const name = updates.name !== undefined ? updates.name : current.name;
  const format = updates.format !== undefined ? updates.format : current.format;
  const columns_json = updates.columns_json !== undefined ? updates.columns_json : current.columns_json;
  const rows_json = updates.rows_json !== undefined ? updates.rows_json : current.rows_json;
  const metadata_json = updates.metadata_json !== undefined ? updates.metadata_json : current.metadata_json;
  const variable_mapping_json = updates.variable_mapping_json !== undefined ? updates.variable_mapping_json : current.variable_mapping_json;

  dbInst.prepare(`
    UPDATE graphing_datasets
    SET name = ?, format = ?, columns_json = ?, rows_json = ?, metadata_json = ?, variable_mapping_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, format, columns_json, rows_json, metadata_json, variable_mapping_json, id);
  return getGraphingDataset(id);
}

function deleteGraphingDataset(id) {
  const dbInst = getDb();
  // Cascade: delete related analyses and figures
  dbInst.prepare(`DELETE FROM graphing_analyses WHERE dataset_id = ?`).run(id);
  dbInst.prepare(`DELETE FROM graphing_figures WHERE dataset_id = ?`).run(id);
  dbInst.prepare(`DELETE FROM graphing_datasets WHERE id = ?`).run(id);
  return { success: true };
}

// === GRAPHING ANALYSES ===

function getGraphingAnalyses(datasetId) {
  const dbInst = getDb();
  if (datasetId) {
    return dbInst.prepare(`SELECT * FROM graphing_analyses WHERE dataset_id = ? ORDER BY created_at DESC`).all(datasetId);
  }
  return dbInst.prepare(`SELECT * FROM graphing_analyses ORDER BY created_at DESC`).all();
}

function createGraphingAnalysis(data) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  dbInst.prepare(`
    INSERT INTO graphing_analyses (id, dataset_id, test_name, config_json, result_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.dataset_id, data.test_name || 'Unknown', data.config_json || '{}', data.result_json || '{}');
  return dbInst.prepare(`SELECT * FROM graphing_analyses WHERE id = ?`).get(id);
}

function deleteGraphingAnalysis(id) {
  const dbInst = getDb();
  dbInst.prepare(`DELETE FROM graphing_analyses WHERE id = ?`).run(id);
  return { success: true };
}

// === GRAPHING FIGURES ===

function getGraphingFigures(datasetId) {
  const dbInst = getDb();
  if (datasetId) {
    return dbInst.prepare(`SELECT * FROM graphing_figures WHERE dataset_id = ? ORDER BY updated_at DESC`).all(datasetId);
  }
  return dbInst.prepare(`SELECT * FROM graphing_figures ORDER BY updated_at DESC`).all();
}

function getGraphingFigure(id) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM graphing_figures WHERE id = ?`).get(id);
}

function createGraphingFigure(data) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  dbInst.prepare(`
    INSERT INTO graphing_figures (id, dataset_id, analysis_id, name, graph_type, options_json, annotation_json, thumbnail_dataurl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.dataset_id || null, data.analysis_id || null,
    data.name || 'Untitled Figure', data.graph_type || 'bar',
    data.options_json || '{}', data.annotation_json || '{}', data.thumbnail_dataurl || null);
  return getGraphingFigure(id);
}

function updateGraphingFigure(id, updates) {
  const dbInst = getDb();
  const current = getGraphingFigure(id);
  if (!current) throw new Error('Graphing figure not found');

  const name = updates.name !== undefined ? updates.name : current.name;
  const dataset_id = updates.dataset_id !== undefined ? updates.dataset_id : current.dataset_id;
  const analysis_id = updates.analysis_id !== undefined ? updates.analysis_id : current.analysis_id;
  const graph_type = updates.graph_type !== undefined ? updates.graph_type : current.graph_type;
  const options_json = updates.options_json !== undefined ? updates.options_json : current.options_json;
  const annotation_json = updates.annotation_json !== undefined ? updates.annotation_json : current.annotation_json;
  const thumbnail_dataurl = updates.thumbnail_dataurl !== undefined ? updates.thumbnail_dataurl : current.thumbnail_dataurl;

  dbInst.prepare(`
    UPDATE graphing_figures
    SET name = ?, dataset_id = ?, analysis_id = ?, graph_type = ?, options_json = ?, annotation_json = ?, thumbnail_dataurl = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, dataset_id, analysis_id, graph_type, options_json, annotation_json, thumbnail_dataurl, id);
  return getGraphingFigure(id);
}

function deleteGraphingFigure(id) {
  const dbInst = getDb();
  dbInst.prepare(`DELETE FROM graphing_figures WHERE id = ?`).run(id);
  return { success: true };
}

// === SYSTEMATIC REVIEW ===

function getExtractionTemplates() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM extraction_templates ORDER BY name ASC`).all();
}

function createExtractionTemplate(data) {
  const dbInst = getDb();
  const id = data.id || crypto.randomUUID();
  dbInst.prepare(`
    INSERT OR REPLACE INTO extraction_templates (id, name, fields_json)
    VALUES (?, ?, ?)
  `).run(id, data.name || 'Untitled Template', data.fields_json || '[]');
  return dbInst.prepare(`SELECT * FROM extraction_templates WHERE id = ?`).get(id);
}

function deleteExtractionTemplate(id) {
  const dbInst = getDb();
  dbInst.prepare(`DELETE FROM extraction_templates WHERE id = ?`).run(id);
  return { success: true };
}

function getExtractedDataPoints(refId) {
  const dbInst = getDb();
  if (refId) {
    return dbInst.prepare(`SELECT * FROM extracted_data_points WHERE ref_id = ?`).all(refId);
  }
  return dbInst.prepare(`SELECT * FROM extracted_data_points`).all();
}

function saveExtractedDataPoint(data) {
  const dbInst = getDb();
  const id = data.id || crypto.randomUUID();
  dbInst.prepare(`
    INSERT OR REPLACE INTO extracted_data_points (id, ref_id, reviewer_id, template_id, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, data.ref_id, data.reviewer_id || null, data.template_id, data.data_json || '{}');
  return dbInst.prepare(`SELECT * FROM extracted_data_points WHERE id = ?`).get(id);
}

function getRobAssessments(refId) {
  const dbInst = getDb();
  if (refId) {
    return dbInst.prepare(`SELECT * FROM rob_assessments WHERE ref_id = ?`).all(refId);
  }
  return dbInst.prepare(`SELECT * FROM rob_assessments`).all();
}

function saveRobAssessment(data) {
  const dbInst = getDb();
  const id = data.id || crypto.randomUUID();
  dbInst.prepare(`
    INSERT OR REPLACE INTO rob_assessments (id, ref_id, reviewer_id, tool_used, domain_scores_json, overall_risk)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.ref_id, data.reviewer_id || null, data.tool_used, data.domain_scores_json || '{}', data.overall_risk || 'Unclear');
  return dbInst.prepare(`SELECT * FROM rob_assessments WHERE id = ?`).get(id);
}

function getReviewerDecisions(refId) {
  const dbInst = getDb();
  if (refId) {
    return dbInst.prepare(`SELECT * FROM reviewer_decisions WHERE ref_id = ?`).all(refId);
  }
  return dbInst.prepare(`SELECT * FROM reviewer_decisions`).all();
}

function saveReviewerDecision(data) {
  const dbInst = getDb();
  dbInst.prepare(`
    INSERT OR REPLACE INTO reviewer_decisions (ref_id, reviewer_id, stage, decision, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(data.ref_id, data.reviewer_id, data.stage, data.decision, data.notes || null);
  return dbInst.prepare(`SELECT * FROM reviewer_decisions WHERE ref_id = ? AND reviewer_id = ? AND stage = ?`).get(data.ref_id, data.reviewer_id, data.stage);
}


// === TABLE BUILDER ===

function getTbTables() {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM tb_tables ORDER BY updated_at DESC`).all();
}

function getTbTable(id) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM tb_tables WHERE id = ?`).get(id);
}

function createTbTable(data) {
  const dbInst = getDb();
  const id = data.id || crypto.randomUUID();
  dbInst.prepare(`
    INSERT INTO tb_tables (id, name, title, caption, table_type, table_number, numbering_mode, category, style_preset,
      columns_json, rows_json, grouped_headers_json, footnotes_json,
      source_analysis_id, source_dataset_id, source_mapping_json, link_status,
      style_options_json, section_target, keywords, notes_to_self, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.name || 'Untitled Table', data.title || '', data.caption || '',
    data.table_type || 'custom', data.table_number || '', data.numbering_mode || 'auto',
    data.category || '', data.style_preset || 'general-journal',
    data.columns_json || '[]', data.rows_json || '[]',
    data.grouped_headers_json || '[]', data.footnotes_json || '[]',
    data.source_analysis_id || null, data.source_dataset_id || null,
    data.source_mapping_json || '{}', data.link_status || 'none',
    data.style_options_json || '{}', data.section_target || '',
    data.keywords || '', data.notes_to_self || '', data.created_by || ''
  );
  return getTbTable(id);
}

function updateTbTable(id, updates) {
  const dbInst = getDb();
  const current = getTbTable(id);
  if (!current) throw new Error('Table not found');

  const fields = ['name','title','caption','table_type','table_number','numbering_mode','category','style_preset',
    'columns_json','rows_json','grouped_headers_json','footnotes_json',
    'source_analysis_id','source_dataset_id','source_mapping_json','link_status','last_refresh_at',
    'style_options_json','section_target','keywords','notes_to_self','created_by'];

  const values = fields.map(f => updates[f] !== undefined ? updates[f] : current[f]);

  dbInst.prepare(`
    UPDATE tb_tables SET
      name=?, title=?, caption=?, table_type=?, table_number=?, numbering_mode=?, category=?, style_preset=?,
      columns_json=?, rows_json=?, grouped_headers_json=?, footnotes_json=?,
      source_analysis_id=?, source_dataset_id=?, source_mapping_json=?, link_status=?, last_refresh_at=?,
      style_options_json=?, section_target=?, keywords=?, notes_to_self=?, created_by=?,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(...values, id);
  return getTbTable(id);
}

function deleteTbTable(id) {
  const dbInst = getDb();
  dbInst.prepare(`DELETE FROM tb_tables WHERE id = ?`).run(id);
  return { success: true };
}

function getTbNarratives(tableId) {
  const dbInst = getDb();
  if (tableId) return dbInst.prepare(`SELECT * FROM tb_narratives WHERE table_id = ?`).all(tableId);
  return dbInst.prepare(`SELECT * FROM tb_narratives`).all();
}

function createTbNarrative(data) {
  const dbInst = getDb();
  const id = data.id || crypto.randomUUID();
  dbInst.prepare(`
    INSERT INTO tb_narratives (id, table_id, narrative_type, tone, content, settings_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.table_id, data.narrative_type || 'concise', data.tone || 'neutral', data.content || '', data.settings_json || '{}');
  return dbInst.prepare(`SELECT * FROM tb_narratives WHERE id = ?`).get(id);
}

function updateTbNarrative(id, updates) {
  const dbInst = getDb();
  const current = dbInst.prepare(`SELECT * FROM tb_narratives WHERE id = ?`).get(id);
  if (!current) throw new Error('Narrative not found');
  dbInst.prepare(`
    UPDATE tb_narratives SET narrative_type=?, tone=?, content=?, settings_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(
    updates.narrative_type || current.narrative_type,
    updates.tone || current.tone,
    updates.content !== undefined ? updates.content : current.content,
    updates.settings_json || current.settings_json, id
  );
  return dbInst.prepare(`SELECT * FROM tb_narratives WHERE id = ?`).get(id);
}

function deleteTbNarrative(id) {
  const dbInst = getDb();
  dbInst.prepare(`DELETE FROM tb_narratives WHERE id = ?`).run(id);
  return { success: true };
}

function getTbDocLinks(tableId) {
  const dbInst = getDb();
  if (tableId) return dbInst.prepare(`SELECT * FROM tb_document_links WHERE table_id = ?`).all(tableId);
  return dbInst.prepare(`SELECT * FROM tb_document_links`).all();
}

function createTbDocLink(data) {
  const dbInst = getDb();
  const id = data.id || crypto.randomUUID();
  dbInst.prepare(`
    INSERT INTO tb_document_links (id, table_id, document_id, insertion_type, position_marker, caption_placement, include_footnotes, include_narrative)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.table_id, data.document_id, data.insertion_type || 'linked',
    data.position_marker || '', data.caption_placement || 'above',
    data.include_footnotes !== undefined ? data.include_footnotes : 1,
    data.include_narrative || 0);
  return dbInst.prepare(`SELECT * FROM tb_document_links WHERE id = ?`).get(id);
}

function updateTbDocLink(id, updates) {
  const dbInst = getDb();
  const current = dbInst.prepare(`SELECT * FROM tb_document_links WHERE id = ?`).get(id);
  if (!current) throw new Error('Doc link not found');
  dbInst.prepare(`
    UPDATE tb_document_links SET insertion_type=?, position_marker=?, caption_placement=?, include_footnotes=?, include_narrative=?, last_synced_at=?, update_status=? WHERE id=?
  `).run(
    updates.insertion_type || current.insertion_type,
    updates.position_marker !== undefined ? updates.position_marker : current.position_marker,
    updates.caption_placement || current.caption_placement,
    updates.include_footnotes !== undefined ? updates.include_footnotes : current.include_footnotes,
    updates.include_narrative !== undefined ? updates.include_narrative : current.include_narrative,
    updates.last_synced_at || current.last_synced_at,
    updates.update_status || current.update_status, id
  );
  return dbInst.prepare(`SELECT * FROM tb_document_links WHERE id = ?`).get(id);
}

function deleteTbDocLink(id) {
  const dbInst = getDb();
  dbInst.prepare(`DELETE FROM tb_document_links WHERE id = ?`).run(id);
  return { success: true };
}

function getTbAuditLog(tableId) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM tb_audit_log WHERE table_id = ? ORDER BY timestamp DESC`).all(tableId);
}

function createTbAuditEntry(data) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  dbInst.prepare(`INSERT INTO tb_audit_log (id, table_id, action, details_json) VALUES (?, ?, ?, ?)`).run(
    id, data.table_id, data.action, data.details_json || '{}'
  );
  return dbInst.prepare(`SELECT * FROM tb_audit_log WHERE id = ?`).get(id);
}

function getTbExportHistory(tableId) {
  const dbInst = getDb();
  return dbInst.prepare(`SELECT * FROM tb_export_history WHERE table_id = ? ORDER BY exported_at DESC`).all(tableId);
}

function createTbExportEntry(data) {
  const dbInst = getDb();
  const id = crypto.randomUUID();
  dbInst.prepare(`INSERT INTO tb_export_history (id, table_id, format, file_path, options_json) VALUES (?, ?, ?, ?, ?)`).run(
    id, data.table_id, data.format, data.file_path || '', data.options_json || '{}'
  );
  return dbInst.prepare(`SELECT * FROM tb_export_history WHERE id = ?`).get(id);
}

function getTbSettings() {
  const dbInst = getDb();
  const row = dbInst.prepare(`SELECT value FROM metadata WHERE key = 'tb_settings'`).get();
  return row ? row.value : '{}';
}

function updateTbSettings(settingsJson) {
  const dbInst = getDb();
  dbInst.prepare(`INSERT OR REPLACE INTO metadata (key, value) VALUES ('tb_settings', ?)`).run(settingsJson);
  return { success: true };
}

module.exports = {

  initDatabase,
  getDb,
  closeDatabase,
  getProjectPath: () => currentProjectPath,
  
  getMetadata,
  setMetadata,
  
  getReferences,
  addReference,
  updateReference,
  updateReferenceStatus,
  deleteReference,

  getCustomStyles,
  addCustomStyle,

  getFolders,
  createFolder,
  deleteFolder,
  renameFolder,
  getReferenceFolders,
  getAllFolderMappings,
  setReferenceFolders,

  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,

  getGraphingDatasets,
  getGraphingDataset,
  createGraphingDataset,
  updateGraphingDataset,
  deleteGraphingDataset,

  getGraphingAnalyses,
  createGraphingAnalysis,
  deleteGraphingAnalysis,

  getGraphingFigures,
  getGraphingFigure,
  createGraphingFigure,
  updateGraphingFigure,
  deleteGraphingFigure,

  getExtractionTemplates,
  createExtractionTemplate,
  deleteExtractionTemplate,
  getExtractedDataPoints,
  saveExtractedDataPoint,

  getRobAssessments,
  saveRobAssessment,

  getReviewerDecisions,
  saveReviewerDecision,

  // Table Builder
  getTbTables,
  getTbTable,
  createTbTable,
  updateTbTable,
  deleteTbTable,
  getTbNarratives,
  createTbNarrative,
  updateTbNarrative,
  deleteTbNarrative,
  getTbDocLinks,
  createTbDocLink,
  updateTbDocLink,
  deleteTbDocLink,
  getTbAuditLog,
  createTbAuditEntry,
  getTbExportHistory,
  createTbExportEntry,
  getTbSettings,
  updateTbSettings,
};
