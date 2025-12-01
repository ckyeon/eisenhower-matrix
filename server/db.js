const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create Notes table
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    quadrant INTEGER NOT NULL DEFAULT 0, -- 0: Unclassified, 1: Do First, 2: Schedule, 3: Delegate, 4: Don't Do
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    position INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Migration: Add description column if it doesn't exist
try {
  const columns = db.pragma('table_info(notes)');
  const hasDescription = columns.some(col => col.name === 'description');
  if (!hasDescription) {
    db.exec('ALTER TABLE notes ADD COLUMN description TEXT');
    console.log('Added description column to notes table');
  }

  const hasArchived = columns.some(col => col.name === 'is_archived');
  if (!hasArchived) {
    db.exec('ALTER TABLE notes ADD COLUMN is_archived INTEGER DEFAULT 0');
    console.log('Added is_archived column to notes table');
  }

  const userColumns = db.pragma('table_info(users)');
  const hasRefreshToken = userColumns.some(col => col.name === 'refresh_token');
  if (!hasRefreshToken) {
    db.exec('ALTER TABLE users ADD COLUMN refresh_token TEXT');
    console.log('Added refresh_token column to users table');
  }
} catch (err) {
  console.error('Migration failed:', err);
}

module.exports = db;
