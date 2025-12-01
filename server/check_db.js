const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const columns = db.pragma('table_info(notes)');
console.log('Columns in notes table:', columns.map(c => c.name));
