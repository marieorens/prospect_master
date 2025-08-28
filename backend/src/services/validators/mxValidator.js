const dns = require('dns');
const winston = require('winston');
const util = require('util');

// Promisify DNS resolve functions
const resolveMx = util.promisify(dns.resolveMx);

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mx-validator' },
  transports: [
    new winston.transports.File({ filename: 'logs/mx-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/mx.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Validate email by checking MX records
 * @param {string} email - Email to validate
 * @returns {boolean} - True if MX records exist
 */
async function validateEmailMx(email) {
  try {
    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      logger.warn(`Invalid email format: ${email}`);
      return false;
    }
    
    // Check MX records
    const mxRecords = await resolveMx(domain);
    
    // If MX records exist, the email domain is valid
    const isValid = Array.isArray(mxRecords) && mxRecords.length > 0;
    
    logger.info(`MX validation for ${email}: ${isValid ? 'Valid' : 'Invalid'}`);
    return isValid;
  } catch (error) {
    // ENOTFOUND means no MX records
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      logger.warn(`No MX records found for ${email}`);
      return false;
    }
    
    logger.error(`Error validating MX for ${email}:`, error);
    // Return false on error to be safe
    return false;
  }
}

module.exports = {
  validateEmailMx
};