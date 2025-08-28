const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { feedbackManager } = require('../services/feedbackManager');
const GoogleSearchScraper = require('../services/scrapers/googleSearchScraper');
const GoogleEmailExtractor = require('../services/scrapers/googleEmailExtractor');
const { mxValidator } = require('../services/validators/mxValidator');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'google-search-routes' },
  transports: [
    new winston.transports.File({ filename: 'logs/google-search-routes-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/google-search-routes.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Configuration Multer pour l'upload de fichiers
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Route POST /api/google-search
 * Lance une recherche Google pour des entreprises
 */
router.post('/', async (req, res) => {
  let processId = null;
  let scraper = null;
  let emailExtractor = null;

  try {
    const {
      searchQueries = [],
      options = {},
      includeEmailExtraction = true,
      includeMapsSearch = false
    } = req.body;

    // Validation des paramètres
    if (!searchQueries || !Array.isArray(searchQueries) || searchQueries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'searchQueries is required and must be a non-empty array'
      });
    }

    const {
      maxResultsPerQuery = 25,
      region = 'fr',
      language = 'fr',
      businessType = '',
      location = '',
      emailOptions = {}
    } = options;

    // Démarrage du processus avec feedback
    const totalSteps = searchQueries.length * (includeMapsSearch ? 2 : 1) + (includeEmailExtraction ? 1 : 0) + 3;
    processId = feedbackManager.startProcess(
      'google-search',
      `Recherche Google: ${searchQueries.length} requête(s)`,
      totalSteps,
      {
        queries: searchQueries,
        maxResultsPerQuery,
        region,
        language,
        includeEmailExtraction,
        includeMapsSearch
      }
    );

    logger.info('Google search process started', { processId, searchQueries, options });

    // Initialisation du scraper
    scraper = new GoogleSearchScraper();
    await scraper.initialize(processId);

    let allResults = [];

    // Recherche pour chaque requête
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      
      feedbackManager.updateStep(processId, `Traitement requête ${i + 1}/${searchQueries.length}: "${query}"`);

      try {
        // Recherche Google classique
        const searchResults = await scraper.searchCompanies(processId, query, {
          maxResults: maxResultsPerQuery,
          region,
          language,
          businessType,
          location
        });

        allResults = allResults.concat(searchResults);

        // Recherche Google Maps si activée
        if (includeMapsSearch && location) {
          feedbackManager.updateStep(processId, `Recherche Maps pour: "${query}"`);
          
          const mapsResults = await scraper.searchGoogleMaps(processId, query, location, {
            maxResults: Math.min(10, maxResultsPerQuery)
          });

          allResults = allResults.concat(mapsResults);
        }

      } catch (error) {
        logger.error(`Search failed for query "${query}":`, error);
        feedbackManager.addError(processId, `Erreur recherche: "${query}"`, error, false);
      }

      // Délai entre les requêtes
      if (i < searchQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      }
    }

    // Dédoublonnage par domaine
    const deduplicateByDomain = (results) => {
      const seen = new Set();
      return results.filter(company => {
        if (!company.domain) return true;
        if (seen.has(company.domain)) return false;
        seen.add(company.domain);
        return true;
      });
    };
    const uniqueResults = deduplicateByDomain(allResults);
    
    feedbackManager.updateStep(processId, `${uniqueResults.length} entreprises uniques trouvées`);

    let finalResults = uniqueResults;

    // Extraction des emails si demandée
    if (includeEmailExtraction && uniqueResults.length > 0) {
      feedbackManager.updateStep(processId, 'Début extraction des emails...');

      emailExtractor = new GoogleEmailExtractor();
      await emailExtractor.initialize(processId);

      finalResults = await emailExtractor.extractEmailsFromCompanies(
        processId,
        uniqueResults,
        emailOptions
      );

      await emailExtractor.close();
    }

    // Validation MX si emails trouvés
    let validatedResults = finalResults;
    const emailCount = finalResults.reduce((count, company) => count + (company.contactInfo?.emails?.length || 0), 0);
    
    if (emailCount > 0) {
      feedbackManager.updateStep(processId, `Validation MX de ${emailCount} emails...`);
      
      try {
        validatedResults = await this.validateEmailsMX(processId, finalResults);
      } catch (error) {
        logger.error('MX validation failed:', error);
        feedbackManager.addWarning(processId, 'Validation MX échouée', { error: error.message });
      }
    }

    // Fermeture du scraper
    await scraper.close();

    // Statistiques finales
    const stats = calculateStats(validatedResults);
    
    feedbackManager.updateStep(processId, 'Génération du rapport final...');

    // Completion du processus
    feedbackManager.completeProcess(processId, 'completed', 'Recherche Google terminée avec succès', {
      totalCompanies: validatedResults.length,
      totalEmails: stats.totalEmails,
      validEmails: stats.validEmails,
      stats
    });

    logger.info('Google search completed successfully', { 
      processId, 
      totalResults: validatedResults.length,
      stats 
    });

    res.json({
      success: true,
      processId,
      data: {
        companies: validatedResults,
        stats,
        metadata: {
          searchQueries,
          totalCompanies: validatedResults.length,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Google search process failed:', error);

    if (processId) {
      feedbackManager.completeProcess(processId, 'error', error.message);
    }

    // Nettoyage
    if (scraper) await scraper.close();
    if (emailExtractor) await emailExtractor.close();

    res.status(500).json({
      success: false,
      processId,
      error: error.message
    });
  }
});

/**
 * Route POST /api/google-search/batch
 * Traitement par lots depuis un fichier CSV
 */
router.post('/batch', upload.single('file'), async (req, res) => {
  let processId = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'CSV file is required'
      });
    }

    const {
      includeEmailExtraction = 'true',
      includeMapsSearch = 'false',
      maxResultsPerQuery = '25',
      region = 'fr',
      language = 'fr'
    } = req.body;

    // Lecture du fichier CSV
    const csvPath = req.file.path;
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'CSV must contain headers and at least one data row'
      });
    }

    // Parsing du CSV (simple)
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const searchQueries = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= 1 && values[0]) {
        // Construire la requête à partir de la première colonne (terme principal)
        let query = values[0];
        
        // Ajouter la localisation si présente dans la 2e colonne
        if (values.length > 1 && values[1]) {
          query += ` ${values[1]}`;
        }
        
        searchQueries.push(query);
      }
    }

    if (searchQueries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid search queries found in CSV'
      });
    }

    // Nettoyage du fichier uploadé
    fs.unlinkSync(csvPath);

    // Lancement de la recherche avec les requêtes extraites
    const searchRequest = {
      searchQueries,
      options: {
        maxResultsPerQuery: parseInt(maxResultsPerQuery),
        region,
        language,
        emailOptions: {
          maxConcurrent: 2,
          maxEmailsPerCompany: 3
        }
      },
      includeEmailExtraction: includeEmailExtraction === 'true',
      includeMapsSearch: includeMapsSearch === 'true'
    };

    // Rediriger vers la route principale
    req.body = searchRequest;
    return router.handle({ ...req, method: 'POST', url: '/' }, res);

  } catch (error) {
    logger.error('Batch Google search failed:', error);

    if (processId) {
      feedbackManager.completeProcess(processId, 'error', error.message);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route GET /api/google-search/process/:processId
 * Récupère le statut d'un processus de recherche Google
 */
router.get('/process/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const processStatus = feedbackManager.getProcessStatus(processId);

    if (!processStatus) {
      return res.status(404).json({
        success: false,
        error: 'Process not found'
      });
    }

    res.json({
      success: true,
      process: processStatus
    });
  } catch (error) {
    logger.error('Failed to get process status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Méthodes utilitaires de classe
router.deduplicateByDomain = function(results) {
  const seen = new Set();
  const deduped = [];

  for (const result of results) {
    const key = result.domain || result.url || result.companyName;
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  }

  return deduped;
};

router.validateEmailsMX = async function(processId, companies) {
  const results = [];
  let processedCount = 0;

  for (const company of companies) {
    if (company.contactInfo?.emails?.length > 0) {
      const validatedEmails = [];

      for (const email of company.contactInfo.emails) {
        try {
          const isValid = await mxValidator.validateEmail(email);
          if (isValid) {
            validatedEmails.push(email);
          }
        } catch (error) {
          logger.warn(`MX validation failed for ${email}:`, error);
        }
      }

      results.push({
        ...company,
        contactInfo: {
          ...company.contactInfo,
          emails: validatedEmails,
          validEmails: validatedEmails.length,
          mxValidated: true
        }
      });

      processedCount++;
      if (processedCount % 10 === 0) {
        feedbackManager.updateStep(processId, `Validation MX: ${processedCount}/${companies.length} entreprises`);
      }
    } else {
      results.push(company);
    }
  }

  return results;
};

// Fonction locale pour calculer les stats
function calculateStats(results) {
  const stats = {
    totalCompanies: results.length,
    companiesWithEmails: 0,
    companiesWithValidEmails: 0,
    totalEmails: 0,
    validEmails: 0,
    bySource: {},
    bySector: {},
    averageEmailsPerCompany: 0
  };

  for (const company of results) {
    const emails = company.contactInfo?.emails || [];
    const validEmails = company.contactInfo?.validEmails || emails.length;

    if (emails.length > 0) {
      stats.companiesWithEmails++;
      stats.totalEmails += emails.length;
    }

    if (validEmails > 0) {
      stats.companiesWithValidEmails++;
      stats.validEmails += validEmails;
    }

    // Statistiques par source
    const source = company.source || 'unknown';
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;

    // Statistiques par secteur
    const sector = company.businessInfo?.sector || 'unknown';
    stats.bySector[sector] = (stats.bySector[sector] || 0) + 1;
  }

  stats.averageEmailsPerCompany = stats.totalCompanies > 0 ? (stats.totalEmails / stats.totalCompanies) : 0;
  return stats;
}

module.exports = router;
