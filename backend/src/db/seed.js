require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { parse } = require('csv-parse/sync');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'db.sqlite');

// Sample domains for seeding
const sampleDomains = [
  'github.com',
  'stackoverflow.com',
  'mozilla.org',
  'wikipedia.org',
  'medium.com'
];

// Create database connection
const db = new sqlite3.Database(dbFile);

// Function to seed from CSV file if provided
async function seedFromCsv(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true
      });
      
      console.log(`Importing ${records.length} domains from CSV...`);
      
      const stmt = db.prepare('INSERT OR IGNORE INTO domains (domain) VALUES (?)');
      records.forEach(record => {
        const domain = record.domain || record.Domain || record.url || record.URL || Object.values(record)[0];
        if (domain && typeof domain === 'string') {
          const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          if (cleanDomain) {
            stmt.run(cleanDomain);
          }
        }
      });
      stmt.finalize();
      console.log('CSV import completed');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing from CSV:', error);
    return false;
  }
}

// Seed the database
async function seedDatabase() {
  // Try to seed from sample-input.csv if it exists
  const csvPath = path.join(__dirname, '../../../sample-input.csv');
  const csvImported = await seedFromCsv(csvPath);
  
  // If no CSV was imported, use sample domains
  if (!csvImported) {
    console.log('Seeding database with sample domains...');
    
    const stmt = db.prepare('INSERT OR IGNORE INTO domains (domain) VALUES (?)');
    sampleDomains.forEach(domain => {
      stmt.run(domain);
    });
    stmt.finalize();
  }
  
  console.log('Database seeding completed successfully');
  db.close();
}

// Run the seeding process
seedDatabase();