const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const sqlite3 = require('better-sqlite3');
const { exportToXlsx } = require('../services/exporters/excelExport');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'export-route' },
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

// Database connection
const getDb = () => {
  const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../data/db.sqlite');
  return sqlite3(dbFile);
};

// GET /api/export - Export domains to Excel
router.get('/', async (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    
    if (format !== 'xlsx') {
      return res.status(400).json({ error: 'Only xlsx format is supported' });
    }
    
    logger.info('Starting export to Excel');
    
    const db = getDb();
    
    // Get all domains
    const domains = db.prepare(`
      SELECT 
        d.id, 
        d.domain, 
        d.semrush_url, 
        d.traffic, 
        d.backlinks, 
        d.keywords, 
        d.scraping_status, 
        d.error_message, 
        d.date_added
      FROM domains d
      ORDER BY d.domain
    `).all();
    
    // Get emails for each domain
    const getEmails = db.prepare(`
      SELECT 
        e.email, 
        e.is_valid, 
        e.source_url, 
        e.date_found
      FROM emails e
      WHERE e.domain_id = ?
      ORDER BY e.is_valid DESC, e.email
    `);
    
    // Add emails to domains
    for (const domain of domains) {
      domain.emails = getEmails.all(domain.id);
    }
    
    db.close();
    
    // Export to Excel
    const filePath = await exportToXlsx(domains);
    
    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        logger.error('Error sending file:', err);
      }
    });
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
    return res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// GET /api/domains - Get domains with pagination
router.get('/domains', (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const db = getDb();
    
    // Build search condition
    let searchCondition = '';
    let searchParams = [];
    
    if (search) {
      searchCondition = 'WHERE d.domain LIKE ?';
      searchParams.push(`%${search}%`);
    }
    
    // Get domains with pagination
    const domains = db.prepare(`
      SELECT 
        d.id, 
        d.domain, 
        d.semrush_url, 
        d.traffic, 
        d.backlinks, 
        d.keywords, 
        d.scraping_status, 
        d.error_message, 
        d.date_added,
        COUNT(e.id) as email_count
      FROM domains d
      LEFT JOIN emails e ON d.id = e.domain_id
      ${searchCondition}
      GROUP BY d.id
      ORDER BY d.domain
      LIMIT ? OFFSET ?
    `).all(...searchParams, parseInt(limit), offset);
    
    // Get total count
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM domains d
      ${searchCondition}
    `).get(...searchParams).count;
    
    db.close();
    
    return res.json({
      domains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting domains:', error);
    return res.status(500).json({ error: 'Failed to get domains' });
  }
});

// GET /api/domains/:id - Get domain details with emails
router.get('/domains/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDb();
    
    // Get domain
    const domain = db.prepare(`
      SELECT 
        d.id, 
        d.domain, 
        d.semrush_url, 
        d.traffic, 
        d.backlinks, 
        d.keywords, 
        d.scraping_status, 
        d.error_message, 
        d.date_added
      FROM domains d
      WHERE d.id = ?
    `).get(id);
    
    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    // Get emails
    domain.emails = db.prepare(`
      SELECT 
        e.id,
        e.email, 
        e.is_valid, 
        e.source_url, 
        e.date_found
      FROM emails e
      WHERE e.domain_id = ?
      ORDER BY e.is_valid DESC, e.email
    `).all(id);
    
    db.close();
    
    return res.json(domain);
  } catch (error) {
    logger.error('Error getting domain details:', error);
    return res.status(500).json({ error: 'Failed to get domain details' });
  }
});

module.exports = router;