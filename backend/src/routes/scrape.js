const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const winston = require('winston');
const sqlite3 = require('better-sqlite3');
const { scrapeDomainOnSemrush } = require('../services/scrapers/semrushScraper');
const { extractEmailsFromSite } = require('../services/scrapers/emailScraper');
const { feedbackManager } = require('../services/feedbackManager');
const notificationService = require('../services/notificationService');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'scrape-route' },
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

// Active jobs tracking
const activeJobs = new Map();

/**
 * Process a single domain
 * @param {string} domain - Domain to process
 * @param {string} jobId - Job ID
 */
async function processDomain(domain, jobId, processId = null) {
  const db = getDb();
  
  try {
    logger.info(`Processing domain: ${domain} for job: ${jobId}`);
    
    if (processId) {
      feedbackManager.updateStep(processId, `🔍 Début traitement: ${domain}`);
    }
    
    // Update domain status
    db.prepare('UPDATE domains SET scraping_status = ? WHERE domain = ?')
      .run('processing', domain);
    
    // Update job domain status
    db.prepare('UPDATE job_domains SET status = ? WHERE job_id = ? AND domain_id = (SELECT id FROM domains WHERE domain = ?)')
      .run('processing', jobId, domain);
    
    // Step 1: Scrape SEMrush data
    let semrushData;
    try {
      if (processId) {
        feedbackManager.updateStep(processId, `📊 Analyse SEMrush: ${domain}`);
      }
      
      semrushData = await scrapeDomainOnSemrush(domain);
      logger.info(`SEMrush data for ${domain}:`, semrushData);
      
      if (processId) {
        feedbackManager.updateStep(processId, `✅ SEMrush OK: ${domain} (trafic: ${semrushData.traffic || 'N/A'}, backlinks: ${semrushData.backlinks || 'N/A'})`);
      }
      
      // Update domain with SEMrush data
      db.prepare(`
        UPDATE domains 
        SET semrush_url = ?, traffic = ?, backlinks = ?, keywords = ?
        WHERE domain = ?
      `).run(
        semrushData.semrush_url || null,
        semrushData.traffic || null,
        semrushData.backlinks || null,
        semrushData.keywords || null,
        domain
      );
    } catch (semrushError) {
      logger.error(`SEMrush scraping error for ${domain}:`, semrushError);
      
      // Update domain with error
      db.prepare(`
        UPDATE domains 
        SET scraping_status = ?, error_message = ?
        WHERE domain = ?
      `).run(
        'semrush_error',
        semrushError.message || 'SEMrush scraping failed',
        domain
      );
      
      // Update job domain status
      db.prepare(`
        UPDATE job_domains 
        SET status = ? 
        WHERE job_id = ? AND domain_id = (SELECT id FROM domains WHERE domain = ?)
      `).run('failed', jobId, domain);
      
      // Update job stats
      updateJobStats(jobId);
      
      db.close();
      return;
    }
    
    // Step 2: Extract emails
    let emails;
    try {
      emails = await extractEmailsFromSite(domain);
      logger.info(`Found ${emails.length} emails for ${domain}`);
      
      // Get domain ID
      const domainId = db.prepare('SELECT id FROM domains WHERE domain = ?')
        .get(domain).id;
      
      // Delete existing emails for this domain
      db.prepare('DELETE FROM emails WHERE domain_id = ?').run(domainId);
      
      // Insert new emails
      const insertEmail = db.prepare(`
        INSERT INTO emails (domain_id, email, is_valid, source_url)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const email of emails) {
        insertEmail.run(
          domainId,
          email.email,
          email.is_valid,
          email.source_url
        );
      }
      
      // Update domain status
      const status = emails.length > 0 ? 'completed' : 'no_emails_found';
      db.prepare('UPDATE domains SET scraping_status = ? WHERE domain = ?')
        .run(status, domain);
      
      // Update job domain status
      db.prepare(`
        UPDATE job_domains 
        SET status = ? 
        WHERE job_id = ? AND domain_id = (SELECT id FROM domains WHERE domain = ?)
      `).run('completed', jobId, domain);
    } catch (emailError) {
      logger.error(`Email extraction error for ${domain}:`, emailError);
      
      // Update domain with error
      db.prepare(`
        UPDATE domains 
        SET scraping_status = ?, error_message = ?
        WHERE domain = ?
      `).run(
        'email_error',
        emailError.message || 'Email extraction failed',
        domain
      );
      
      // Update job domain status
      db.prepare(`
        UPDATE job_domains 
        SET status = ? 
        WHERE job_id = ? AND domain_id = (SELECT id FROM domains WHERE domain = ?)
      `).run('failed', jobId, domain);
    }
    
    // Update job stats
    updateJobStats(jobId);
  } catch (error) {
    logger.error(`Processing error for ${domain}:`, error);
    
    // Update domain with error
    db.prepare(`
      UPDATE domains 
      SET scraping_status = ?, error_message = ?
      WHERE domain = ?
    `).run(
      'processing_error',
      error.message || 'Processing failed',
      domain
    );
    
    // Update job domain status
    db.prepare(`
      UPDATE job_domains 
      SET status = ? 
      WHERE job_id = ? AND domain_id = (SELECT id FROM domains WHERE domain = ?)
    `).run('failed', jobId, domain);
    
    // Update job stats
    updateJobStats(jobId);
  } finally {
    db.close();
  }
}

/**
 * Update job statistics
 * @param {string} jobId - Job ID
 */
function updateJobStats(jobId) {
  const db = getDb();
  
  try {
    // Get counts
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM job_domains
      WHERE job_id = ?
    `).get(jobId);
    
    // Update job
    db.prepare(`
      UPDATE jobs
      SET 
        total = ?,
        completed = ?,
        failed = ?,
        status = ?,
        date_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      counts.total,
      counts.completed,
      counts.failed,
      counts.completed + counts.failed >= counts.total ? 'done' : 'running',
      jobId
    );
    
    // If job is complete, remove from active jobs
    if (counts.completed + counts.failed >= counts.total) {
      activeJobs.delete(jobId);
      logger.info(`Job ${jobId} completed`);
    }
  } catch (error) {
    logger.error(`Error updating job stats for ${jobId}:`, error);
  } finally {
    db.close();
  }
}

/**
 * Process domains sequentially
 * @param {Array} domains - Domains to process
 * @param {string} jobId - Job ID
 */
async function processSequentially(domains, jobId, processId) {
  let processedCount = 0;
  for (const domain of domains) {
    processedCount++;
    feedbackManager.updateStep(processId, `Traitement séquentiel: ${domain} (${processedCount}/${domains.length})`);
    await processDomain(domain, jobId, processId);
  }
  
  // Calculer les statistiques finales
  const db = new sqlite3(process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite'));
  const emailsFound = db.prepare('SELECT COUNT(*) as count FROM emails WHERE job_id = ?').get(jobId)?.count || 0;
  const errors = [];
  
  feedbackManager.completeProcess(processId, 'completed', `Scraping séquentiel terminé avec succès pour ${domains.length} domaines`, {
    domainsProcessed: processedCount,
    mode: 'sequential'
  });

  // Envoyer notification
  notificationService.scrapingCompleted(processedCount, emailsFound, errors);
  db.close();
}

/**
 * Process domains in parallel
 * @param {Array} domains - Domains to process
 * @param {string} jobId - Job ID
 * @param {string} processId - Process ID for feedback
 */
async function processInParallel(domains, jobId, processId) {
  const concurrency = parseInt(process.env.CONCURRENCY || 3);
  const chunks = [];
  
  // Split domains into chunks
  for (let i = 0; i < domains.length; i += concurrency) {
    chunks.push(domains.slice(i, i + concurrency));
  }
  
  let processedCount = 0;
  
  // Process chunks sequentially, but domains within chunks in parallel
  for (const [chunkIndex, chunk] of chunks.entries()) {
    feedbackManager.updateStep(processId, `Traitement parallèle chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} domaines)`);
    
    await Promise.all(chunk.map(domain => {
      return processDomain(domain, jobId, processId).then(() => {
        processedCount++;
        if (processedCount % 5 === 0 || processedCount === domains.length) {
          feedbackManager.updateStep(processId, `Domaines traités: ${processedCount}/${domains.length}`);
        }
      });
    }));
  }
  
  // Calculer les statistiques finales
  const db = new sqlite3(process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite'));
  const emailsFound = db.prepare('SELECT COUNT(*) as count FROM emails WHERE job_id = ?').get(jobId)?.count || 0;
  const errors = [];
  
  feedbackManager.completeProcess(processId, 'completed', `Scraping parallèle terminé avec succès pour ${domains.length} domaines`, {
    domainsProcessed: processedCount,
    mode: 'parallel',
    concurrency
  });

  // Envoyer notification
  notificationService.scrapingCompleted(processedCount, emailsFound, errors);
  db.close();
}

// POST /api/scrape/start - Start scraping job
router.post('/start', async (req, res) => {
  try {
    const { domains, mode = 'sequential' } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ error: 'Invalid domains array' });
    }
    
    const jobId = uuidv4();
    
    // Démarrer le feedback temps réel
    const processId = feedbackManager.startProcess(
      'semrush-scraping',
      `Scraping SEMrush - ${domains.length} domaines en mode ${mode}`,
      domains.length * 2, // 2 étapes par domaine (SEMrush + emails)
      {
        jobId,
        mode,
        domainsCount: domains.length,
        domains: domains.slice(0, 5) // Échantillon pour debug
      }
    );
    
    logger.info(`Starting scrape job ${jobId} with process ${processId} for ${domains.length} domains in ${mode} mode`);
    
    feedbackManager.updateStep(processId, `Initialisation du job pour ${domains.length} domaines`);
    
    const db = getDb();
    
    // Create job
    db.prepare(`
      INSERT INTO jobs (id, status, total, completed, failed, process_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(jobId, 'queued', domains.length, 0, 0, processId);
    
    feedbackManager.updateStep(processId, 'Job créé dans la base de données');
    
    // Add domains to job
    const insertJobDomain = db.prepare(`
      INSERT INTO job_domains (job_id, domain_id)
      VALUES (?, (SELECT id FROM domains WHERE domain = ?))
    `);
    
    let domainsProcessed = 0;
    for (const domain of domains) {
      // Check if domain exists
      const domainExists = db.prepare('SELECT id FROM domains WHERE domain = ?').get(domain);
      
      if (domainExists) {
        insertJobDomain.run(jobId, domain);
      } else {
        // Add domain if it doesn't exist
        db.prepare('INSERT INTO domains (domain) VALUES (?)').run(domain);
        insertJobDomain.run(jobId, domain);
      }
      
      domainsProcessed++;
      if (domainsProcessed % 10 === 0 || domainsProcessed === domains.length) {
        feedbackManager.updateStep(processId, `Domaines ajoutés au job: ${domainsProcessed}/${domains.length}`);
      }
    }
    
    db.close();
    
    feedbackManager.updateStep(processId, `Job ${jobId} préparé, démarrage du scraping...`);
    
    // Start processing in background
    if (mode === 'parallel') {
      processInParallel(domains, jobId, processId).catch(error => {
        logger.error(`Error in parallel processing for job ${jobId}:`, error);
        feedbackManager.addError(processId, 'Erreur dans le traitement parallèle', error, true);
      });
    } else {
      processSequentially(domains, jobId, processId).catch(error => {
        logger.error(`Error in sequential processing for job ${jobId}:`, error);
        feedbackManager.addError(processId, 'Erreur dans le traitement séquentiel', error, true);
      });
    }
    
    res.json({ 
      success: true, 
      jobId, 
      processId,
      message: `Scraping started for ${domains.length} domains in ${mode} mode`,
      totalSteps: domains.length * 2
    });
    
    // Add to active jobs
    activeJobs.set(jobId, { 
      startTime: Date.now(),
      mode,
      domains: domains.length,
      processId
    });
    
  } catch (error) {
    logger.error('Error starting scrape job:', error);
    if (typeof processId !== 'undefined') {
      feedbackManager.addError(processId, 'Erreur lors du démarrage du job', error, true);
    }
    return res.status(500).json({ error: 'Failed to start scrape job' });
  }
});

// GET /api/scrape/status - Get job status
router.get('/status', (req, res) => {
  try {
    const { jobId } = req.query;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    
    const db = getDb();
    
    // Get job status
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    
    db.close();
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Calculate progress
    const progress = job.total > 0 ? Math.round((job.completed + job.failed) * 100 / job.total) : 0;
    
    return res.json({
      jobId,
      state: job.status,
      progress,
      total: job.total,
      completed: job.completed,
      failed: job.failed,
      updated: job.date_updated
    });
  } catch (error) {
    logger.error('Error getting job status:', error);
    return res.status(500).json({ error: 'Failed to get job status' });
  }
});

// POST /api/scrape/domain - Scrape a single domain
router.post('/domain', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    logger.info(`Starting single domain scrape for ${domain}`);
    
    const jobId = uuidv4();
    const db = getDb();
    
    // Create job
    db.prepare(`
      INSERT INTO jobs (id, status, total, completed, failed)
      VALUES (?, ?, ?, ?, ?)
    `).run(jobId, 'queued', 1, 0, 0);
    
    // Check if domain exists
    const domainExists = db.prepare('SELECT id FROM domains WHERE domain = ?').get(domain);
    
    if (!domainExists) {
      // Add domain if it doesn't exist
      db.prepare('INSERT INTO domains (domain) VALUES (?)').run(domain);
    }
    
    // Add domain to job
    db.prepare(`
      INSERT INTO job_domains (job_id, domain_id)
      VALUES (?, (SELECT id FROM domains WHERE domain = ?))
    `).run(jobId, domain);
    
    db.close();
    
    // Process domain in background
    processDomain(domain, jobId).catch(error => {
      logger.error(`Error processing domain ${domain}:`, error);
    });
    
    // Add to active jobs
    activeJobs.set(jobId, { 
      startTime: Date.now(),
      mode: 'single',
      domains: 1
    });
    
    return res.json({ jobId, domain });
  } catch (error) {
    logger.error('Error starting single domain scrape:', error);
    return res.status(500).json({ error: 'Failed to start single domain scrape' });
  }
});

module.exports = router;