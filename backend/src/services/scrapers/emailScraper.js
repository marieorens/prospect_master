const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { validateEmailMx } = require('../validators/mxValidator');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-scraper' },
  transports: [
    new winston.transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Add stealth plugin
puppeteer.use(StealthPlugin());

// Ensure error directory exists
const sessionDir = process.env.SESSION_DIR || path.join(__dirname, '../../../sessions');
const errorDir = path.join(sessionDir, 'errors');

if (!fs.existsSync(errorDir)) {
  fs.mkdirSync(errorDir, { recursive: true });
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
    const screenshotPath = path.join(errorDir, `email-${domain}-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Save HTML content as well
    const htmlPath = path.join(errorDir, `email-${domain}-${timestamp}.html`);
    const content = await page.content();
    await fs.promises.writeFile(htmlPath, content);
    
    logger.error(`Error scraping emails from ${domain}: ${errorMessage}. Screenshot saved at ${screenshotPath}`);
  } catch (error) {
    logger.error('Error taking screenshot:', error);
  }
}

/**
 * Extract emails from HTML content
 * @param {string} html - HTML content
 * @param {string} sourceUrl - Source URL
 * @returns {Array} - Array of email objects
 */
function extractEmailsFromHtml(html, sourceUrl) {
  const $ = cheerio.load(html);
  const emails = new Set();
  const results = [];
  
  // Standard email regex
  const standardEmailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  
  // Extract from text content
  const bodyText = $('body').text();
  const standardMatches = bodyText.match(standardEmailRegex) || [];
  standardMatches.forEach(email => emails.add(email.toLowerCase()));
  
  // Extract from mailto links
  $('a[href^="mailto:"]').each((i, el) => {
    const href = $(el).attr('href');
    const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (email.match(standardEmailRegex)) {
      emails.add(email);
    }
  });
  
  // Extract obfuscated emails (basic patterns)
  // Pattern: name [at] domain [dot] com
  const atDotRegex = /([A-Za-z0-9._%+-]+)\s*(?:\[at\]|\(at\)|@|&#64;|%40)\s*([A-Za-z0-9.-]+)\s*(?:\[dot\]|\(dot\)|\.|\&\#46\;|%2E)\s*([A-Za-z]{2,})/gi;
  const atDotMatches = bodyText.match(atDotRegex) || [];
  
  atDotMatches.forEach(match => {
    const parts = match.split(/(?:\[at\]|\(at\)|@|&#64;|%40)/i);
    if (parts.length === 2) {
      const name = parts[0].trim();
      const domainParts = parts[1].split(/(?:\[dot\]|\(dot\)|\.|\&\#46\;|%2E)/i);
      if (domainParts.length >= 2) {
        const domain = domainParts[0].trim();
        const tld = domainParts[1].trim().replace(/[^A-Za-z]/g, '');
        const email = `${name}@${domain}.${tld}`.toLowerCase();
        if (email.match(standardEmailRegex)) {
          emails.add(email);
        }
      }
    }
  });
  
  // Convert Set to array of objects
  for (const email of emails) {
    results.push({
      email,
      source_url: sourceUrl
    });
  }
  
  return results;
}

/**
 * Extract emails from a domain
 * @param {string} domain - Domain to scrape
 * @returns {Array} - Array of email objects
 */
async function extractEmailsFromSite(domain) {
  logger.info(`Starting email extraction for domain: ${domain}`);
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
    
    // Common paths to check for emails
    const pathsToCheck = ['/', '/contact', '/about', '/contact-us', '/about-us', '/team'];
    
    const allEmails = [];
    
    // Visit each path and extract emails
    for (const path of pathsToCheck) {
      try {
        const url = `https://${domain}${path}`;
        logger.info(`Checking ${url} for emails`);
        
        // Navigate to the page
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || 30000) // Shorter timeout for individual pages
        }).catch(e => {
          logger.warn(`Navigation to ${url} failed: ${e.message}`);
          return null; // Continue with next path
        });
        
        // Get page content
        const content = await page.content();
        
        // Extract emails from content
        const emails = extractEmailsFromHtml(content, url);
        
        if (emails.length > 0) {
          logger.info(`Found ${emails.length} emails on ${url}`);
          allEmails.push(...emails);
        }
      } catch (error) {
        logger.warn(`Error checking path ${path} on ${domain}: ${error.message}`);
        // Continue with next path
      }
    }
    
    // Close browser
    await browser.close();
    
    // Validate emails with MX records
    const validatedEmails = [];
    for (const emailObj of allEmails) {
      try {
        const isValid = await validateEmailMx(emailObj.email);
        validatedEmails.push({
          ...emailObj,
          is_valid: isValid ? 1 : 0
        });
      } catch (error) {
        logger.warn(`Error validating email ${emailObj.email}: ${error.message}`);
        validatedEmails.push({
          ...emailObj,
          is_valid: 0
        });
      }
    }
    
    // Log completion time
    const endTime = Date.now();
    logger.info(`Completed email extraction for ${domain} in ${(endTime - startTime) / 1000}s. Found ${validatedEmails.length} emails.`);
    
    return validatedEmails;
  } catch (error) {
    logger.error(`Error extracting emails from ${domain}:`, error);
    
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
  extractEmailsFromSite
};