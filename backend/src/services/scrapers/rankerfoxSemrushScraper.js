import puppeteer from 'puppeteer';
import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'rankerfox-semrush-scraper' },
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

/**
 * Scrape SEMrush metrics via RankerFox
 * @param {string} domain - Domain to analyze
 * @returns {Object} - Scraped metrics
 */
export async function scrapeSemrushViaRankerFox(domain) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    page.on('dialog', async dialog => {
      logger.warn('Pop-up detected:', dialog.message());
      await dialog.accept();
    });

    // 1. Login to RankerFox
    await page.goto('https://rankerfox.com/login', { waitUntil: 'networkidle2' });
    await page.type('input[name="log"]', process.env.RANKERFOX_LOGIN);
    await page.type('input[name="pwd"]', process.env.RANKERFOX_PASSWORD);
    await page.click('.impu-form-submit input[type="submit"][value="Log In"]');

    // 2. Access SEMrush via RankerFox
    await page.waitForSelector('input[type="submit"][value="semrush"]', { timeout: 10000 });
    await page.click('input[type="submit"][value="semrush"]');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Keep only the main tab
    let pages = await browser.pages();
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
    const mainPage = (await browser.pages())[0];

    // 4. Ensure redirection
    const currentUrl = mainPage.url();
    if (!/https:\/\/sem\.[a-z0-9]+server\.click\/projects/.test(currentUrl)) {
      await mainPage.goto('https://rankerfox.com/semrush', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    }
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Find search bar
    const searchInputSelector = '[data-test="searchbar_input"]';
    let searchInput = null;
    try {
      searchInput = await mainPage.waitForSelector(searchInputSelector, { timeout: 10000 });
    } catch (error) {
      const frames = mainPage.frames();
      for (const frame of frames) {
        try {
          searchInput = await frame.waitForSelector(searchInputSelector, { timeout: 10000 });
          if (searchInput) break;
        } catch (error) {}
      }
    }
    if (!searchInput) {
      logger.error('Search bar not found');
      await browser.close();
      return null;
    }

    // 6. Type domain and launch search
    await searchInput.type(domain, { delay: 100 });
    const searchButtonSelector = '[data-ui-name="Button.Text"]';
    await mainPage.waitForSelector(searchButtonSelector, { timeout: 10000 });
    const isButtonVisible = await mainPage.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }, searchButtonSelector);
    if (isButtonVisible) {
      await mainPage.evaluate((selector) => {
        document.querySelector(selector).closest('span').click();
      }, searchButtonSelector);
    } else {
      logger.error('Search button not visible');
      await browser.close();
      return null;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Scrape metrics (to be adapted to actual page structure)
    // Example selectors, to be customized
    const metrics = await mainPage.evaluate(() => {
      const traffic = document.querySelector('[data-test="traffic_metric"]')?.textContent?.trim() || null;
      const backlinks = document.querySelector('[data-test="backlinks_metric"]')?.textContent?.trim() || null;
      const keywords = document.querySelector('[data-test="keywords_metric"]')?.textContent?.trim() || null;
      return { traffic, backlinks, keywords };
    });

    await browser.close();
    return metrics;
  } catch (error) {
    logger.error('Critical error:', error);
    await browser.close();
    throw error;
  }
}
