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
    `);

    // Migration: Ensure review_status column exists for older projects
    try {
      db.exec(`ALTER TABLE references_list ADD COLUMN review_status TEXT DEFAULT 'unreviewed'`);
    } catch (e) {
      // Column already exists
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
    INSERT INTO references_list (id, authors, title, year, journal, doi, raw_metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, ref.authors, ref.title, ref.year, ref.journal, ref.doi || null, ref.raw_metadata || null);
  return { id, ...ref };
}

function updateReference(id, updates) {
  const dbInst = getDb();
  const stmt = dbInst.prepare(`
    UPDATE references_list 
    SET authors = ?, title = ?, year = ?, journal = ?, doi = ?, raw_metadata = ?
    WHERE id = ?
  `);
  stmt.run(updates.authors, updates.title, updates.year, updates.journal, updates.doi || null, updates.raw_metadata || null, id);
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

  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
};
