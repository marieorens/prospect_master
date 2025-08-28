const puppeteer = require('puppeteer');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { feedbackManager } = require('../feedbackManager');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'google-search-scraper' },
  transports: [
    new winston.transports.File({ filename: 'logs/google-search-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/google-search.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Scraper Google Search pour la prospection d'entreprises
 */
class GoogleSearchScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.sessionDir = process.env.SESSION_DIR || './sessions';
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT_MS) || 60000;
    this.concurrency = parseInt(process.env.CONCURRENCY) || 2;
    this.headless = process.env.HEADLESS !== 'false';
  }

  /**
   * Initialise le navigateur et la session
   */
  async initialize(processId) {
    try {
      feedbackManager.updateStep(processId, 'Initialisation du navigateur Google Search...');
      
      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }

      const userDataDir = path.join(this.sessionDir, 'google-chrome-data');
      
      this.browser = await puppeteer.launch({
        headless: this.headless,
        userDataDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Configuration de la page
      await this.page.setViewport({ width: 1366, height: 768 });
      await this.page.setDefaultTimeout(this.requestTimeout);
      
      // Blocage des ressources inutiles pour optimiser
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'font', 'image'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      logger.info('Google Search scraper initialized successfully');
      feedbackManager.updateStep(processId, 'Navigateur initialisé avec succès');
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize Google Search scraper:', error);
      feedbackManager.addError(processId, 'Erreur initialisation navigateur', error, false);
      throw error;
    }
  }

  /**
   * Effectue une recherche Google avec des mots-clés spécifiques
   * @param {string} query - Requête de recherche
   * @param {Object} options - Options de recherche
   * @returns {Array} - Résultats de recherche
   */
  async searchCompanies(processId, query, options = {}) {
    try {
      const {
        maxResults = 50,
        region = 'fr',
        language = 'fr',
        businessType = '',
        location = ''
      } = options;

      // Construction de la requête optimisée pour les entreprises
      let searchQuery = query;
      if (businessType) {
        searchQuery += ` ${businessType}`;
      }
      if (location) {
        searchQuery += ` ${location}`;
      }
      
      // Ajout de termes pour cibler les entreprises
      searchQuery += ' site:linkedin.com/company OR site:*.com contact';

      feedbackManager.updateStep(processId, `Recherche Google: "${searchQuery}"`);

      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=${language}&gl=${region}`;
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Gestion des cookies/GDPR si nécessaire
      try {
        await this.page.click('button[id*="accept"], button[id*="agree"], .QS5gu', { timeout: 3000 });
      } catch (e) {
        // Pas de bannière de cookies
      }

      const results = [];
      let currentPage = 1;
      let totalFound = 0;

      while (results.length < maxResults && currentPage <= 5) {
        feedbackManager.updateStep(processId, `Extraction des résultats - Page ${currentPage}...`);

        // Extraction des résultats de la page
        const pageResults = await this.extractSearchResults();
        
        for (const result of pageResults) {
          if (results.length >= maxResults) break;
          
          // Filtrage et enrichissement des résultats
          const enrichedResult = await this.enrichSearchResult(processId, result);
          if (enrichedResult) {
            results.push(enrichedResult);
            totalFound++;
            
            if (totalFound % 5 === 0) {
              feedbackManager.updateStep(processId, `${totalFound} entreprises trouvées...`);
            }
          }
        }

        // Navigation vers la page suivante
        if (results.length < maxResults && currentPage < 5) {
          const nextButton = await this.page.$('a#pnnext');
          if (nextButton) {
            await nextButton.click();
            await this.page.waitForTimeout(2000 + Math.random() * 2000); // Délai aléatoire
            currentPage++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      logger.info(`Google search completed: ${results.length} companies found`);
      feedbackManager.updateStep(processId, `Recherche terminée: ${results.length} entreprises trouvées`);

      return results;

    } catch (error) {
      logger.error('Google search failed:', error);
      feedbackManager.addError(processId, 'Erreur lors de la recherche Google', error, false);
      throw error;
    }
  }

  /**
   * Extrait les résultats de recherche de la page actuelle
   */
  async extractSearchResults() {
    return await this.page.evaluate(() => {
      const results = [];
      const searchResults = document.querySelectorAll('div.g, div[data-ved]');

      searchResults.forEach(result => {
        const titleElement = result.querySelector('h3');
        const linkElement = result.querySelector('a[href^="http"]');
        const snippetElement = result.querySelector('.VwiC3b, .s3v9rd, .IsZvec');

        if (titleElement && linkElement) {
          const title = titleElement.textContent.trim();
          const url = linkElement.href;
          const snippet = snippetElement ? snippetElement.textContent.trim() : '';

          // Filtrage basique pour les entreprises
          const isCompany = /\b(company|entreprise|société|SARL|SAS|SA|EURL|SNC|contact|about|qui sommes|équipe)\b/i.test(title + ' ' + snippet);
          
          if (isCompany && title && url) {
            results.push({
              title,
              url,
              snippet,
              domain: new URL(url).hostname,
              source: 'google_search'
            });
          }
        }
      });

      return results;
    });
  }

  /**
   * Enrichit un résultat de recherche avec des informations supplémentaires
   */
  async enrichSearchResult(processId, result) {
    try {
      // Extraction du nom de l'entreprise à partir du titre
      const companyName = this.extractCompanyName(result.title);
      
      if (!companyName) {
        return null;
      }

      // Enrichissement basique
      const enrichedResult = {
        ...result,
        companyName,
        domain: result.domain,
        contactInfo: {
          emails: [],
          phones: [],
          addresses: []
        },
        socialMedia: {
          linkedin: null,
          facebook: null,
          twitter: null
        },
        businessInfo: {
          sector: this.detectBusinessSector(result.snippet),
          description: result.snippet.substring(0, 200),
          estimatedSize: null
        },
        extractedAt: new Date().toISOString(),
        status: 'pending_email_extraction'
      };

      // Si c'est un profil LinkedIn, extraire les infos spécifiques
      if (result.url.includes('linkedin.com/company')) {
        enrichedResult.socialMedia.linkedin = result.url;
        enrichedResult.businessInfo.estimatedSize = this.extractLinkedInSize(result.snippet);
      }

      return enrichedResult;

    } catch (error) {
      logger.warn('Failed to enrich search result:', error);
      return null;
    }
  }

  /**
   * Extrait le nom de l'entreprise à partir du titre
   */
  extractCompanyName(title) {
    // Nettoyage du titre pour extraire le nom de l'entreprise
    let companyName = title
      .replace(/\s*-\s*(Accueil|Home|Contact|À propos|About).*$/i, '')
      .replace(/\s*\|\s*.*$/, '')
      .replace(/\s*•\s*.*$/, '')
      .trim();

    // Si trop court ou générique, ignorer
    if (companyName.length < 3 || /^(contact|accueil|home|about)$/i.test(companyName)) {
      return null;
    }

    return companyName;
  }

  /**
   * Détecte le secteur d'activité à partir du texte
   */
  detectBusinessSector(text) {
    const sectors = {
      'Technologie': /\b(software|tech|digital|IT|informatique|développement|web|application|logiciel)\b/i,
      'Conseil': /\b(conseil|consulting|advisory|expert|consultant)\b/i,
      'Marketing': /\b(marketing|communication|publicité|advertising|SEO|digital marketing)\b/i,
      'Finance': /\b(finance|banque|assurance|comptabilité|investment|crédit)\b/i,
      'Santé': /\b(santé|médical|pharmaceutique|healthcare|clinique|hôpital)\b/i,
      'Industrie': /\b(industrie|manufacturing|production|usine|fabrication)\b/i,
      'Commerce': /\b(commerce|retail|vente|distribution|magasin|boutique)\b/i,
      'Services': /\b(services|service|prestation|maintenance|réparation)\b/i,
      'Immobilier': /\b(immobilier|real estate|construction|bâtiment|architecture)\b/i,
      'Transport': /\b(transport|logistique|livraison|shipping|logistics)\b/i
    };

    for (const [sector, regex] of Object.entries(sectors)) {
      if (regex.test(text)) {
        return sector;
      }
    }

    return 'Autre';
  }

  /**
   * Extrait la taille d'entreprise depuis LinkedIn
   */
  extractLinkedInSize(snippet) {
    const sizePatterns = [
      /(\d+)-(\d+)\s+employees/i,
      /(\d+)\s*à\s*(\d+)\s*employés/i,
      /(\d+)\+?\s*employés/i
    ];

    for (const pattern of sizePatterns) {
      const match = snippet.match(pattern);
      if (match) {
        if (match[2]) {
          return `${match[1]}-${match[2]} employés`;
        } else {
          return `${match[1]}+ employés`;
        }
      }
    }

    return null;
  }

  /**
   * Effectue une recherche Google Maps pour des entreprises locales
   */
  async searchGoogleMaps(processId, query, location, options = {}) {
    try {
      feedbackManager.updateStep(processId, `Recherche Google Maps: "${query}" à ${location}`);

      const { maxResults = 20 } = options;
      
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query + ' ' + location)}`;
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(3000);

      const results = [];
      let attempts = 0;
      const maxAttempts = 3;

      while (results.length < maxResults && attempts < maxAttempts) {
        attempts++;
        
        const mapResults = await this.page.evaluate(() => {
          const businesses = [];
          const elements = document.querySelectorAll('[role="article"]');

          elements.forEach(el => {
            const nameEl = el.querySelector('[data-value="Name"]');
            const ratingEl = el.querySelector('[data-value="Rating"]');
            const addressEl = el.querySelector('[data-value="Address"]');
            const websiteEl = el.querySelector('a[data-value="Website"]');

            if (nameEl) {
              businesses.push({
                name: nameEl.textContent.trim(),
                rating: ratingEl ? ratingEl.textContent.trim() : null,
                address: addressEl ? addressEl.textContent.trim() : null,
                website: websiteEl ? websiteEl.href : null,
                source: 'google_maps'
              });
            }
          });

          return businesses;
        });

        for (const business of mapResults) {
          if (results.length >= maxResults) break;
          
          const enrichedBusiness = {
            companyName: business.name,
            domain: business.website ? new URL(business.website).hostname : null,
            url: business.website,
            title: business.name,
            snippet: `${business.name} - ${business.address || 'Adresse non disponible'}`,
            contactInfo: {
              emails: [],
              phones: [],
              addresses: business.address ? [business.address] : []
            },
            socialMedia: {
              linkedin: null,
              facebook: null,
              twitter: null
            },
            businessInfo: {
              sector: this.detectBusinessSector(business.name),
              description: `Entreprise trouvée via Google Maps: ${business.name}`,
              estimatedSize: null,
              rating: business.rating,
              address: business.address
            },
            extractedAt: new Date().toISOString(),
            status: 'pending_email_extraction',
            source: 'google_maps'
          };

          results.push(enrichedBusiness);
        }

        // Scroll pour charger plus de résultats
        if (results.length < maxResults) {
          await this.page.evaluate(() => {
            const scrollContainer = document.querySelector('[role="main"]');
            if (scrollContainer) {
              scrollContainer.scrollTop += 1000;
            }
          });
          await this.page.waitForTimeout(2000);
        }
      }

      feedbackManager.updateStep(processId, `Google Maps: ${results.length} entreprises trouvées`);
      return results;

    } catch (error) {
      logger.error('Google Maps search failed:', error);
      feedbackManager.addError(processId, 'Erreur recherche Google Maps', error, false);
      return [];
    }
  }

  /**
   * Ferme le navigateur
   */
  async close() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info('Google Search scraper closed successfully');
    } catch (error) {
      logger.error('Error closing Google Search scraper:', error);
    }
  }

  /**
   * Prend une capture d'écran pour le débogage
   */
  async takeScreenshot(filename) {
    try {
      if (this.page) {
        const screenshotPath = path.join(this.sessionDir, 'errors', filename);
        await this.page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        logger.info(`Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
      }
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
    }
  }
}

module.exports = GoogleSearchScraper;
