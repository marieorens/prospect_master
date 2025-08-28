const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Ensure examples directory exists
const examplesDir = path.join(__dirname);
if (!fs.existsSync(examplesDir)) {
  fs.mkdirSync(examplesDir, { recursive: true });
}

// Sample data
const domains = [
  {
    domain: 'github.com',
    date_added: '2025-08-10',
    semrush_url: 'https://www.semrush.com/analytics/overview/?q=github.com&db=us',
    traffic: 89500000,
    backlinks: 45600000,
    keywords: 1250000,
    scraping_status: 'completed',
    error_message: '',
    emails: [
      {
        email: 'support@github.com',
        is_valid: 1,
        source_url: 'https://github.com/contact'
      },
      {
        email: 'security@github.com',
        is_valid: 1,
        source_url: 'https://github.com/security'
      }
    ]
  },
  {
    domain: 'stackoverflow.com',
    date_added: '2025-08-10',
    semrush_url: 'https://www.semrush.com/analytics/overview/?q=stackoverflow.com&db=us',
    traffic: 62300000,
    backlinks: 28900000,
    keywords: 980000,
    scraping_status: 'completed',
    error_message: '',
    emails: [
      {
        email: 'team@stackoverflow.com',
        is_valid: 1,
        source_url: 'https://stackoverflow.com/company'
      }
    ]
  },
  {
    domain: 'mozilla.org',
    date_added: '2025-08-10',
    semrush_url: 'https://www.semrush.com/analytics/overview/?q=mozilla.org&db=us',
    traffic: 18700000,
    backlinks: 15400000,
    keywords: 420000,
    scraping_status: 'completed',
    error_message: '',
    emails: [
      {
        email: 'press@mozilla.com',
        is_valid: 1,
        source_url: 'https://mozilla.org/contact'
      },
      {
        email: 'donate@mozilla.org',
        is_valid: 1,
        source_url: 'https://mozilla.org/donate'
      }
    ]
  },
  {
    domain: 'wikipedia.org',
    date_added: '2025-08-10',
    semrush_url: 'https://www.semrush.com/analytics/overview/?q=wikipedia.org&db=us',
    traffic: 125000000,
    backlinks: 89700000,
    keywords: 3250000,
    scraping_status: 'completed',
    error_message: '',
    emails: [
      {
        email: 'info@wikimedia.org',
        is_valid: 1,
        source_url: 'https://wikipedia.org/contact'
      }
    ]
  },
  {
    domain: 'medium.com',
    date_added: '2025-08-10',
    semrush_url: 'https://www.semrush.com/analytics/overview/?q=medium.com&db=us',
    traffic: 45800000,
    backlinks: 32100000,
    keywords: 890000,
    scraping_status: 'semrush_error',
    error_message: 'CAPTCHA detected. Manual intervention required.',
    emails: []
  }
];

// Format data for Excel
const rows = [];

// Process each domain
for (const domain of domains) {
  // Get emails for this domain
  const emails = domain.emails || [];
  
  // Create base row with domain data
  const baseRow = {
    'Domain': domain.domain,
    'Date Added': domain.date_added,
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

// Write to file
const filePath = path.join(examplesDir, 'sample-output.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Excel file created: ${filePath}`);