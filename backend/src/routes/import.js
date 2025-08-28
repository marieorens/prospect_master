const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const winston = require('winston');
const sqlite3 = require('better-sqlite3');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'import-route' },
  transports: [
    new winston.transports.File({ filename: 'logs/routes-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/routes.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Database connection
const getDb = () => {
  const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../data/db.sqlite');
  return sqlite3(dbFile);
};

/**
 * Clean and normalize domain
 * @param {string} domain - Domain to clean
 * @returns {string} - Cleaned domain
 */
function cleanDomain(domain) {
  if (!domain) return null;
  
  // Convert to string if not already
  domain = String(domain);
  
  // Remove protocol and path
  return domain.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

/**
 * Import domains from array
 * @param {Array} domains - Array of domains
 * @returns {Object} - Import results
 */
function importDomains(domains) {
  const db = getDb();
  let imported = 0;
  let skipped = 0;
  
  // Prepare statement
  const stmt = db.prepare('INSERT OR IGNORE INTO domains (domain) VALUES (?)');
  
  // Process each domain
  domains.forEach(domain => {
    const cleanedDomain = cleanDomain(domain);
    
    if (cleanedDomain) {
      const result = stmt.run(cleanedDomain);
      
      if (result.changes > 0) {
        imported++;
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
  });
  
  db.close();
  
  return { imported, skipped };
}

// POST /api/import - Import domains from JSON
router.post('/', (req, res) => {
  try {
    const { domains } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ error: 'Invalid domains array' });
    }
    
    logger.info(`Importing ${domains.length} domains from JSON`);
    
    const result = importDomains(domains);
    
    return res.json(result);
  } catch (error) {
    logger.error('Error importing domains from JSON:', error);
    return res.status(500).json({ error: 'Failed to import domains' });
  }
});

// POST /api/import/csv - Import domains from CSV file
router.post('/csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    
    // Read and parse CSV
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true
    });
    
    logger.info(`Importing ${records.length} domains from CSV`);
    
    // Extract domains from records
    const domains = records.map(record => {
      // Try different common column names
      return record.domain || record.Domain || record.url || record.URL || Object.values(record)[0];
    }).filter(Boolean);
    
    const result = importDomains(domains);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    return res.json(result);
  } catch (error) {
    logger.error('Error importing domains from CSV:', error);
    return res.status(500).json({ error: 'Failed to import domains from CSV' });
  }
});

module.exports = router;