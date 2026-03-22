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
    `);

    // Migration: Ensure new columns exist for older projects
    const columnsToEnsure = [
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
    INSERT INTO references_list (id, authors, title, year, journal, doi, raw_metadata, notes, tags, pdf_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, ref.authors, ref.title, ref.year, ref.journal, ref.doi || null, ref.raw_metadata || null,
    ref.notes || null, ref.tags || null, ref.pdf_path || null
  );
  return { id, ...ref };
}

function updateReference(id, updates) {
  const dbInst = getDb();
  
  // Dynamic update logic to preserve existing fields if not provided
  const current = dbInst.prepare(`SELECT * FROM references_list WHERE id = ?`).get(id);
  if (!current) throw new Error('Reference not found');

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
    SET authors = ?, title = ?, year = ?, journal = ?, doi = ?, raw_metadata = ?, notes = ?, tags = ?, pdf_path = ?
    WHERE id = ?
  `);
  stmt.run(newAuthors, newTitle, newYear, newJournal, newDoi, newRawMetadata, newNotes, newTags, newPdfPath, id);
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

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
  getProjectPath: () => currentProjectPath,
  
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
  setReferenceFolders,

  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
};
