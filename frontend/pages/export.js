import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { FaDownload, FaSpinner, FaExclamationTriangle, FaFileCsv, FaFileExcel } from 'react-icons/fa';

export default function Export() {
  const [stats, setStats] = useState({
    totalDomains: 0,
    scrapedDomains: 0,
    totalEmails: 0,
    validEmails: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch domains to calculate stats
        const response = await fetch('/api/export/domains?page=1&limit=1000');
        
        if (!response.ok) {
          throw new Error('Failed to fetch domains');
        }
        
        const data = await response.json();
        
        // Calculate stats
        const totalDomains = data.pagination.total;
        const scrapedDomains = data.domains.filter(d => 
          d.scraping_status === 'completed' || d.scraping_status === 'no_emails_found'
        ).length;
        
        // Fetch a sample of domains with emails to estimate total emails
        const detailedResponse = await fetch(`/api/export/domains?page=1&limit=100`);
        const detailedData = await detailedResponse.json();
        
        // Get detailed domains with emails
        const emailPromises = detailedData.domains.slice(0, 20).map(domain => 
          fetch(`/api/export/domains/${domain.id}`).then(res => res.json())
        );
        
        const detailedDomains = await Promise.all(emailPromises);
        
        // Calculate email stats
        let totalEmails = 0;
        let validEmails = 0;
        
        detailedDomains.forEach(domain => {
          if (domain.emails) {
            totalEmails += domain.emails.length;
            validEmails += domain.emails.filter(e => e.is_valid).length;
          }
        });
        
        // Estimate total based on sample
        const emailsPerDomain = totalEmails / detailedDomains.length || 0;
        const estimatedTotalEmails = Math.round(emailsPerDomain * totalDomains);
        const validEmailsRatio = validEmails / totalEmails || 0;
        const estimatedValidEmails = Math.round(estimatedTotalEmails * validEmailsRatio);
        
        setStats({
          totalDomains,
          scrapedDomains,
          totalEmails: estimatedTotalEmails,
          validEmails: estimatedValidEmails,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Handle export
  const handleExport = async (format = 'xlsx') => {
    setIsExporting(true);
    
    try {
      // Create a link to download the file
      const link = document.createElement('a');
      link.href = `/api/export?format=${format}`;
      link.target = '_blank';
      link.download = `domains_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Export started in ${format.toUpperCase()} format`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Layout title="Export Data">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Export Data</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-red-500 text-lg mr-2" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Data Summary</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Total Domains</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats.totalDomains.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-green-500">Scraped Domains</p>
                <p className="text-2xl font-semibold text-green-900">
                  {loading ? '...' : stats.scrapedDomains.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-500">Total Emails</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {loading ? '...' : stats.totalEmails.toLocaleString()}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-md">
                <p className="text-sm text-indigo-500">Valid Emails</p>
                <p className="text-2xl font-semibold text-indigo-900">
                  {loading ? '...' : stats.validEmails.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Export options */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col items-center text-center">
                  <FaFileExcel className="text-green-600 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Excel Export (.xlsx)</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Export all domains and emails to an Excel spreadsheet with detailed information.
                  </p>
                  <button
                    className="btn-export px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? <FaSpinner className="animate-spin inline mr-2" /> : <FaDownload className="inline mr-2" />}
                    Exporter Excel
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col items-center text-center">
                  <FaFileCsv className="text-blue-600 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">CSV Export (Coming Soon)</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Export all domains and emails to a CSV file for easy import into other tools.
                  </p>
                  <button
                    className="btn btn-secondary"
                    disabled={true}
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Export details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Export Details</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Excel Export Format</h4>
            <p className="text-sm text-gray-500 mb-4">
              The Excel export includes the following columns:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Column
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Domain</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">The domain name</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Date Added</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">The date the domain was added</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SEMrush URL</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">The URL to the SEMrush domain overview</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Traffic</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Estimated organic traffic from SEMrush</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Backlinks</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Number of backlinks from SEMrush</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Keywords</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Number of keywords from SEMrush</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Email 1, Email 2, ...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Emails found on the domain</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Email1_valid, Email2_valid, ...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Whether the email has valid MX records</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Email1_source, Email2_source, ...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">The URL where the email was found</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Scraping Status</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">The status of the scraping process</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Error Message</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Any error message from the scraping process</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}