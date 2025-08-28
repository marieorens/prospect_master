const puppeteer = require('puppeteer');
const winston = require('winston');
const { feedbackManager } = require('../feedbackManager');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'google-email-extractor' },
  transports: [
    new winston.transports.File({ filename: 'logs/google-email-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/google-email.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Extracteur d'emails pour les résultats de recherche Google
 */
class GoogleEmailExtractor {
  constructor() {
    this.browser = null;
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000;
    this.headless = process.env.HEADLESS !== 'false';
  }

  /**
   * Initialise un navigateur léger pour l'extraction
   */
  async initialize(processId) {
    try {
      feedbackManager.updateStep(processId, 'Initialisation extracteur emails...');

      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-images',
          '--disable-javascript', // On n'a pas besoin de JS pour l'extraction d'emails
          '--disable-plugins',
          '--disable-extensions',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      logger.info('Google Email Extractor initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize email extractor:', error);
      feedbackManager.addError(processId, 'Erreur initialisation extracteur emails', error, false);
      throw error;
    }
  }

  /**
   * Extrait les emails d'une liste d'entreprises trouvées par Google
   * @param {string} processId - ID du processus de feedback
   * @param {Array} companies - Liste des entreprises
   * @param {Object} options - Options d'extraction
   * @returns {Array} - Entreprises avec emails extraits
   */
  async extractEmailsFromCompanies(processId, companies, options = {}) {
    const {
      maxConcurrent = 2,
      timeoutPerSite = 15000,
      maxEmailsPerCompany = 5,
      skipSocialMedia = true
    } = options;

    const results = [];
    const total = companies.length;
    
    feedbackManager.updateStep(processId, `Extraction emails: 0/${total} entreprises traitées`);

    // Traitement par batch pour éviter la surcharge
    const batches = this.createBatches(companies, maxConcurrent);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      const batchPromises = batch.map(async (company, index) => {
        const globalIndex = batchIndex * maxConcurrent + index;
        return this.extractEmailsFromCompany(processId, company, {
          ...options,
          currentIndex: globalIndex,
          total
        });
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          // Ajouter l'entreprise même sans email
          const company = batch[index];
          results.push({
            ...company,
            contactInfo: {
              ...company.contactInfo,
              extractionStatus: 'failed',
              extractionError: result.reason?.message || 'Extraction failed'
            }
          });
        }
      });

      // Délai entre les batches
      if (batchIndex < batches.length - 1) {
        await this.sleep(2000 + Math.random() * 3000);
      }
    }

    feedbackManager.updateStep(processId, `Extraction terminée: ${results.length}/${total} entreprises traitées`);
    return results;
  }

  /**
   * Extrait les emails d'une entreprise spécifique
   */
  async extractEmailsFromCompany(processId, company, options = {}) {
    let page = null;
    
    try {
      const { currentIndex = 0, total = 1, timeoutPerSite = 15000 } = options;
      
      if ((currentIndex + 1) % 5 === 0) {
        feedbackManager.updateStep(processId, `Extraction emails: ${currentIndex + 1}/${total} entreprises traitées`);
      }

      // Skip si pas d'URL ou si c'est un réseau social et qu'on les ignore
      if (!company.url || (options.skipSocialMedia && this.isSocialMediaUrl(company.url))) {
        return {
          ...company,
          contactInfo: {
            ...company.contactInfo,
            extractionStatus: 'skipped',
            extractionReason: 'No URL or social media skipped'
          }
        };
      }

      page = await this.browser.newPage();
      await page.setDefaultTimeout(timeoutPerSite);
      
      // Configuration de la page pour l'extraction
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        // On bloque tout sauf les documents HTML
        if (['stylesheet', 'image', 'font', 'script', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Tentative de chargement de la page
      await page.goto(company.url, { 
        waitUntil: 'domcontentloaded',
        timeout: timeoutPerSite 
      });

      // Extraction des emails depuis la page
      const emails = await this.extractEmailsFromPage(page, company.domain);
      
      // Tentative d'extraction depuis une page contact si pas d'emails trouvés
      let contactEmails = [];
      if (emails.length === 0) {
        contactEmails = await this.tryContactPage(page, company.url, company.domain);
      }

      const allEmails = [...emails, ...contactEmails];
      const uniqueEmails = [...new Set(allEmails)];

      // Validation et nettoyage des emails
      const validEmails = uniqueEmails
        .filter(email => this.isValidEmail(email))
        .filter(email => this.isRelevantEmail(email, company.domain))
        .slice(0, options.maxEmailsPerCompany || 5);

      await page.close();

      return {
        ...company,
        contactInfo: {
          ...company.contactInfo,
          emails: validEmails,
          extractionStatus: validEmails.length > 0 ? 'success' : 'no_emails_found',
          extractedAt: new Date().toISOString(),
          extractionMethod: 'google_website_scan'
        }
      };

    } catch (error) {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignorer les erreurs de fermeture
        }
      }

      logger.warn(`Email extraction failed for ${company.companyName}:`, error);
      
      return {
        ...company,
        contactInfo: {
          ...company.contactInfo,
          extractionStatus: 'error',
          extractionError: error.message,
          extractedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Extrait les emails depuis une page web
   */
  async extractEmailsFromPage(page, domain) {
    try {
      const emails = await page.evaluate((domain) => {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const pageText = document.body.innerText || document.body.textContent || '';
        
        const foundEmails = pageText.match(emailRegex) || [];
        
        // Filtrage basique
        return foundEmails.filter(email => {
          // Éviter les emails d'exemple ou génériques
          const lowerEmail = email.toLowerCase();
          const excludePatterns = [
            'example.com', 'test.com', 'domain.com', 'email.com',
            'noreply', 'no-reply', 'donotreply', 'mailer-daemon',
            'postmaster', 'webmaster', 'admin@', 'root@',
            'info@example', 'contact@example', 'support@example'
          ];
          
          return !excludePatterns.some(pattern => lowerEmail.includes(pattern));
        });
      }, domain);

      return emails || [];
    } catch (error) {
      logger.warn('Failed to extract emails from page:', error);
      return [];
    }
  }

  /**
   * Tente d'extraire des emails depuis une page contact
   */
  async tryContactPage(page, baseUrl, domain) {
    try {
      const contactUrls = [
        '/contact',
        '/contact-us',
        '/contactez-nous',
        '/nous-contacter',
        '/about',
        '/about-us',
        '/a-propos',
        '/equipe',
        '/team'
      ];

      for (const contactPath of contactUrls) {
        try {
          const contactUrl = new URL(contactPath, baseUrl).href;
          await page.goto(contactUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
          });

          const emails = await this.extractEmailsFromPage(page, domain);
          if (emails.length > 0) {
            return emails;
          }
        } catch (e) {
          // Page contact non trouvée, continuer
          continue;
        }
      }

      return [];
    } catch (error) {
      logger.warn('Failed to check contact pages:', error);
      return [];
    }
  }

  /**
   * Valide le format d'un email
   */
  isValidEmail(email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailRegex.test(email) && email.length <= 100;
  }

  /**
   * Vérifie si un email est pertinent pour l'entreprise
   */
  isRelevantEmail(email, domain) {
    const emailDomain = email.split('@')[1];
    
    // Priorité aux emails du même domaine
    if (domain && emailDomain === domain) {
      return true;
    }

    // Éviter les emails de services génériques
    const genericDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'free.fr', 'orange.fr', 'wanadoo.fr', 'laposte.net',
      'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com'
    ];

    return !genericDomains.includes(emailDomain);
  }

  /**
   * Vérifie si une URL est un réseau social
   */
  isSocialMediaUrl(url) {
    const socialMediaDomains = [
      'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
      'youtube.com', 'tiktok.com', 'snapchat.com', 'pinterest.com'
    ];
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return socialMediaDomains.some(socialDomain => domain.includes(socialDomain));
    } catch (e) {
      return false;
    }
  }

  /**
   * Crée des batches pour le traitement parallèle
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Fonction utilitaire pour les délais
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ferme le navigateur
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info('Google Email Extractor closed');
    } catch (error) {
      logger.error('Error closing email extractor:', error);
    }
  }
}

module.exports = GoogleEmailExtractor;
