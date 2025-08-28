const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'semrush-scraper' },
  transports: [
    new winston.transports.File({ filename: 'logs/semrush-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/semrush.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Add stealth plugin
puppeteer.use(StealthPlugin());

// Ensure sessions directory exists
const sessionDir = process.env.SESSION_DIR || path.join(__dirname, '../../../sessions');
const errorDir = path.join(sessionDir, 'errors');

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

if (!fs.existsSync(errorDir)) {
  fs.mkdirSync(errorDir, { recursive: true });
}

// SEMrush login URL
const SEMRUSH_LOGIN_URL = 'https://www.semrush.com/login/';
const SEMRUSH_DOMAIN_OVERVIEW_URL = 'https://www.semrush.com/analytics/overview/';

/**
 * Save cookies to file
 * @param {Array} cookies - Browser cookies to save
 */
async function saveCookies(cookies) {
  const cookiesPath = path.join(sessionDir, 'semrush.json');
  await fs.promises.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
  logger.info('Cookies saved successfully');
}

/**
 * Load cookies from file
 * @returns {Array|null} - Cookies or null if file doesn't exist
 */
async function loadCookies() {
  const cookiesPath = path.join(sessionDir, 'semrush.json');
  try {
    if (fs.existsSync(cookiesPath)) {
      const cookiesString = await fs.promises.readFile(cookiesPath, 'utf8');
      return JSON.parse(cookiesString);
    }
  } catch (error) {
    logger.error('Error loading cookies:', error);
  }
  return null;
}

/**
 * Take screenshot on error
 * @param {Object} page - Puppeteer page
 * @param {string} domain - Domain being scraped
 * @param {string} errorMessage - Error message
 */
async function takeErrorScreenshot(page, domain, errorMessage) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(errorDir, `${domain}-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Save HTML content as well
    const htmlPath = path.join(errorDir, `${domain}-${timestamp}.html`);
    const content = await page.content();
    await fs.promises.writeFile(htmlPath, content);
    
    logger.error(`Error scraping ${domain}: ${errorMessage}. Screenshot saved at ${screenshotPath}`);
  } catch (error) {
    logger.error('Error taking screenshot:', error);
  }
}

/**
 * Login to SEMrush
 * @param {Object} page - Puppeteer page
 */
async function login(page) {
  logger.info('Logging in to SEMrush...');
  
  try {
    await page.goto(SEMRUSH_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Check if we're already logged in
    const loggedIn = await page.evaluate(() => {
      return document.querySelector('.sso-login__form') === null;
    });
    
    if (loggedIn) {
      logger.info('Already logged in to SEMrush');
      return true;
    }
    
    // Fill in login form
    await page.waitForSelector('input[name="email"]', { visible: true, timeout: 10000 });
    
    // Type with human-like delay
    await page.type('input[name="email"]', process.env.SEMRUSH_EMAIL, { delay: 100 });
    await page.type('input[name="password"]', process.env.SEMRUSH_PASSWORD, { delay: 120 });
    
    // Click login button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Check if login was successful
    const loginFailed = await page.evaluate(() => {
      const errorElement = document.querySelector('.sso-login__error');
      return errorElement !== null;
    });
    
    if (loginFailed) {
      throw new Error('Login failed. Check your credentials.');
    }
    
    logger.info('Successfully logged in to SEMrush');
    
    // Save cookies for future sessions
    const cookies = await page.cookies();
    await saveCookies(cookies);
    
    return true;
  } catch (error) {
    logger.error('Login error:', error);
    await takeErrorScreenshot(page, 'login', error.message);
    throw error;
  }
}

/**
 * Check if CAPTCHA is present
 * @param {Object} page - Puppeteer page
 * @returns {boolean} - True if CAPTCHA is detected
 */
async function isCaptchaPresent(page) {
  return await page.evaluate(() => {
    return document.querySelector('.g-recaptcha') !== null || 
           document.querySelector('iframe[src*="recaptcha"]') !== null ||
           document.querySelector('[data-sitekey]') !== null;
  });
}

/**
 * Scrape domain data from SEMrush
 * @param {string} domain - Domain to scrape
 * @returns {Object} - Scraped data
 */
async function scrapeDomainOnSemrush(domain) {
  logger.info(`Starting scrape for domain: ${domain}`);
  const startTime = Date.now();
  
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
    
    // Set timeout
    page.setDefaultNavigationTimeout(parseInt(process.env.REQUEST_TIMEOUT_MS || 60000));
    
    // Load cookies if available
    const cookies = await loadCookies();
    if (cookies) {
      await page.setCookie(...cookies);
    }
    
    // Try to navigate to domain overview page directly
    await page.goto(`${SEMRUSH_DOMAIN_OVERVIEW_URL}?q=${encodeURIComponent(domain)}&db=us`, { 
      waitUntil: 'networkidle2',
      timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 60000)
    });
    
    // Check if we need to login
    const needsLogin = await page.evaluate(() => {
      return document.querySelector('.sso-login__form') !== null;
    });
    
    if (needsLogin) {
      await login(page);
      // Navigate back to domain overview after login
      await page.goto(`${SEMRUSH_DOMAIN_OVERVIEW_URL}?q=${encodeURIComponent(domain)}&db=us`, { 
        waitUntil: 'networkidle2',
        timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 60000)
      });
    }
    
    // Check for CAPTCHA
    if (await isCaptchaPresent(page)) {
      await takeErrorScreenshot(page, domain, 'CAPTCHA detected');
      throw new Error('CAPTCHA detected. Manual intervention required.');
    }
    
    // Wait for data to load
    await page.waitForSelector('.srf-overview__metrics', { 
      visible: true, 
      timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 60000)
    }).catch(() => {
      // If the selector doesn't appear, try an alternative approach
      return page.waitForFunction(() => {
        return document.querySelector('.srf-overview__metrics') !== null || 
               document.querySelector('.srf-overview__error') !== null;
      }, { timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 60000) });
    });
    
    // Extract data
    const result = await page.evaluate(() => {
      // Check if there's an error message
      const errorElement = document.querySelector('.srf-overview__error');
      if (errorElement) {
        return { error: errorElement.textContent.trim() };
      }
      
      // Try to get traffic, backlinks and keywords
      let traffic = null;
      let backlinks = null;
      let keywords = null;
      
      // Different selectors to try for traffic
      const trafficSelectors = [
        '.srf-overview__metric--traffic .srf-overview__metric-value',
        '[data-ga-label="Traffic"] .srf-overview__metric-value',
        '.srf-overview__metrics [title*="traffic"] .srf-overview__metric-value'
      ];
      
      for (const selector of trafficSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          traffic = element.textContent.trim().replace(/[^0-9.]/g, '');
          break;
        }
      }
      
      // Different selectors to try for backlinks
      const backlinksSelectors = [
        '.srf-overview__metric--backlinks .srf-overview__metric-value',
        '[data-ga-label="Backlinks"] .srf-overview__metric-value',
        '.srf-overview__metrics [title*="backlink"] .srf-overview__metric-value'
      ];
      
      for (const selector of backlinksSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          backlinks = element.textContent.trim().replace(/[^0-9.]/g, '');
          break;
        }
      }
      
      // Different selectors to try for keywords
      const keywordsSelectors = [
        '.srf-overview__metric--keywords .srf-overview__metric-value',
        '[data-ga-label="Keywords"] .srf-overview__metric-value',
        '.srf-overview__metrics [title*="keyword"] .srf-overview__metric-value'
      ];
      
      for (const selector of keywordsSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          keywords = element.textContent.trim().replace(/[^0-9.]/g, '');
          break;
        }
      }
      
      return {
        traffic: traffic ? parseInt(traffic.replace(/[^0-9]/g, '')) : null,
        backlinks: backlinks ? parseInt(backlinks.replace(/[^0-9]/g, '')) : null,
        keywords: keywords ? parseInt(keywords.replace(/[^0-9]/g, '')) : null,
        semrush_url: window.location.href
      };
    });
    
    // Save cookies for future sessions
    const newCookies = await page.cookies();
    await saveCookies(newCookies);
    
    // Take screenshot for successful scrape (for debugging)
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(sessionDir, `${domain}-${timestamp}.png`);
      await page.screenshot({ path: screenshotPath });
    }
    
    // Close browser
    await browser.close();
    
    // Check if we got an error
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Log completion time
    const endTime = Date.now();
    logger.info(`Completed scrape for ${domain} in ${(endTime - startTime) / 1000}s`);
    
    return result;
  } catch (error) {
    logger.error(`Error scraping ${domain}:`, error);
    
    try {
      // Try to close browser
      await browser.close();
    } catch (closeError) {
      logger.error('Error closing browser:', closeError);
    }
    
    throw error;
  }
}

module.exports = {
  scrapeDomainOnSemrush
};