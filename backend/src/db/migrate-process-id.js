require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'db.sqlite');

console.log('Running migration to add process_id column to jobs table...');

// Create database connection
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  // Check if process_id column exists
  db.all("PRAGMA table_info(jobs)", (err, rows) => {
    if (err) {
      console.error('Error checking table structure:', err);
      return;
    }
    
    const hasProcessId = rows.some(row => row.name === 'process_id');
    
    if (!hasProcessId) {
      console.log('Adding process_id column to jobs table...');
      db.run("ALTER TABLE jobs ADD COLUMN process_id TEXT", (err) => {
        if (err) {
          console.error('Error adding process_id column:', err);
        } else {
          console.log('✅ process_id column added successfully');
        }
      });
    } else {
      console.log('✅ process_id column already exists');
    }
  });
  
  console.log('Migration completed');
});

// Close the database connection
db.close();
