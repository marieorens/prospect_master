require('dotenv').config({ path: '../../../../.env' });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Simple logger pour la migration
const logger = {
  info: (msg) => console.log(`✅ ${msg}`),
  error: (msg, error) => console.error(`❌ ${msg}`, error)
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`✅ Created directory: ${dataDir}`);
}

const dbFile = path.join(dataDir, 'db.sqlite');
console.log(`📁 Database path: ${dbFile}`);

// Create database connection
const db = new sqlite3.Database(dbFile);

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbExec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

async function createABTestingTables() {
  try {
    // Table des tests A/B
    await dbExec(`
      CREATE TABLE IF NOT EXISTS ab_tests (
        id TEXT PRIMARY KEY,
        campaign_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        split_percentage INTEGER DEFAULT 50,
        test_duration INTEGER, -- en millisecondes
        winning_criteria TEXT DEFAULT 'open_rate', -- 'open_rate', 'click_rate', 'conversion_rate'
        status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
        winner_variant TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
      )
    `);

    // Table des variantes
    await dbExec(`
      CREATE TABLE IF NOT EXISTS ab_test_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        variant_name TEXT NOT NULL,
        subject_line TEXT NOT NULL,
        email_content TEXT NOT NULL,
        allocation_percentage REAL DEFAULT 50,
        created_at TEXT NOT NULL,
        FOREIGN KEY (test_id) REFERENCES ab_tests (id),
        UNIQUE(test_id, variant_name)
      )
    `);

    // Table des assignations (qui reçoit quelle variante)
    await dbExec(`
      CREATE TABLE IF NOT EXISTS ab_test_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        variant_name TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        FOREIGN KEY (test_id) REFERENCES ab_tests (id),
        UNIQUE(test_id, recipient_email)
      )
    `);

    // Index pour les performances
    await dbExec(`
      CREATE INDEX IF NOT EXISTS idx_ab_assignments_test_email 
      ON ab_test_assignments(test_id, recipient_email)
    `);

    await dbExec(`
      CREATE INDEX IF NOT EXISTS idx_ab_tests_status 
      ON ab_tests(status)
    `);

    await dbExec(`
      CREATE INDEX IF NOT EXISTS idx_ab_variants_test 
      ON ab_test_variants(test_id)
    `);

    logger.info('A/B Testing tables created successfully');
    return true;

  } catch (error) {
    logger.error('Error creating A/B Testing tables:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Exporter la fonction de migration
if (require.main === module) {
  createABTestingTables()
    .then(() => {
      console.log('✅ A/B Testing database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ A/B Testing database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createABTestingTables };
