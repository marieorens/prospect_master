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

// Create database connection
const db = new sqlite3.Database(dbFile);

// Create tables
db.serialize(() => {
  // Create domains table
  db.run(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      semrush_url TEXT,
      traffic INTEGER,
      backlinks INTEGER,
      keywords INTEGER,
      scraping_status TEXT DEFAULT 'pending',
      error_message TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    body TEXT,
    variables TEXT,
    category TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
  // Create emails table
  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER,
      email TEXT,
      is_valid INTEGER DEFAULT 0,
      source_url TEXT,
      date_found DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `);

  // Create jobs table to track scraping jobs
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'queued',
      total INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      process_id TEXT,
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
      CREATE TABLE IF NOT EXISTS job_domains (
      job_id TEXT,
      domain_id INTEGER,
      status TEXT DEFAULT 'pending',
      PRIMARY KEY (job_id, domain_id),
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `);

  // Create job_domains table to track domains in a job
  db.run(`
    CREATE TABLE IF NOT EXISTS job_domains (
      job_id TEXT,
      domain_id INTEGER,
      status TEXT DEFAULT 'pending',
      PRIMARY KEY (job_id, domain_id),
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `);

  // Create A/B Testing tables
  db.run(`
    CREATE TABLE IF NOT EXISTS ab_tests (
      id TEXT PRIMARY KEY,
      campaign_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      split_percentage INTEGER DEFAULT 50,
      winning_criteria TEXT DEFAULT 'open_rate',
      winner_variant TEXT,
      total_assignments INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ab_test_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      subject_line TEXT NOT NULL,
      email_content TEXT NOT NULL,
      allocation_percentage REAL DEFAULT 50,
      created_at TEXT NOT NULL,
      FOREIGN KEY(test_id) REFERENCES ab_tests(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ab_test_assignments (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      email_address TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
      FOREIGN KEY(variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE
    )
  `);

  // Create campaigns table
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      template_id INTEGER,
      send_from_name TEXT,
      send_from_email TEXT,
      reply_to_email TEXT,
      scheduled_at DATETIME,
      send_rate_per_hour INTEGER DEFAULT 10,
      filter_criteria TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(template_id) REFERENCES email_templates(id) ON DELETE SET NULL
    )
  `);

  // Create prospect_groups table
  db.run(`
    CREATE TABLE IF NOT EXISTS prospect_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create prospect_group_members table
  db.run(`
    CREATE TABLE IF NOT EXISTS prospect_group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospect_group_id INTEGER,
      domain_id INTEGER,
      FOREIGN KEY(prospect_group_id) REFERENCES prospect_groups(id) ON DELETE CASCADE,
      FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `);

  console.log('Database migration completed successfully');
});

// Close the database connection
db.close();