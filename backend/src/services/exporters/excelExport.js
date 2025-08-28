const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'excel-export' },
  transports: [
    new winston.transports.File({ filename: 'logs/excel-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/excel.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Export domains and emails to Excel file
 * @param {Array} domains - Array of domain objects with emails
 * @returns {string} - Path to the generated Excel file
 */
async function exportToXlsx(domains) {
  try {
    logger.info(`Starting Excel export for ${domains.length} domains`);
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Format data for Excel
    const rows = [];
    
    // Process each domain
    for (const domain of domains) {
      // Get emails for this domain
      const emails = domain.emails || [];
      
      // Create base row with domain data
      const baseRow = {
        'Domain': domain.domain,
        'Date Added': domain.date_added ? new Date(domain.date_added).toISOString().split('T')[0] : '',
        'SEMrush URL': domain.semrush_url || '',
        'Traffic': domain.traffic || '',
        'Backlinks': domain.backlinks || '',
        'Keywords': domain.keywords || '',
        'Scraping Status': domain.scraping_status || '',
        'Error Message': domain.error_message || ''
      };
      
      // If no emails, add just the domain row
      if (emails.length === 0) {
        rows.push({
          ...baseRow,
          'Email 1': '',
          'Email1_valid': '',
          'Email1_source': ''
        });
      } else {
        // Add a row for each email
        emails.forEach((email, index) => {
          if (index === 0) {
            // First email goes in the same row as domain data
            rows.push({
              ...baseRow,
              'Email 1': email.email || '',
              'Email1_valid': email.is_valid ? 'Yes' : 'No',
              'Email1_source': email.source_url || ''
            });
          } else {
            // Additional emails get their own rows with empty domain data
            const emailNum = index + 1;
            
            // Find the last row for this domain
            const lastRow = rows[rows.length - 1];
            
            // Add the email to the next available column
            lastRow[`Email ${emailNum}`] = email.email || '';
            lastRow[`Email${emailNum}_valid`] = email.is_valid ? 'Yes' : 'No';
            lastRow[`Email${emailNum}_source`] = email.source_url || '';
          }
        });
      }
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Domains');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `results_${timestamp}.xlsx`;
    const filePath = path.join(exportsDir, filename);
    
    // Write to file
    XLSX.writeFile(wb, filePath);
    
    logger.info(`Excel export completed: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
    throw error;
  }
}

module.exports = {
  exportToXlsx
};