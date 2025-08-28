import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaSearch, FaSync, FaExternalLinkAlt, FaEnvelope } from 'react-icons/fa';

export default function DomainTable({ domains, pagination, onPageChange, onSearch, source = 'semrush' }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  // Handle scrape single domain
  const handleScrape = async (domain) => {
    try {
      const response = await fetch('/api/scrape/domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }
      
      const data = await response.json();
      router.push(`/scrape?jobId=${data.jobId}`);
    } catch (error) {
      console.error('Error scraping domain:', error);
      alert('Failed to start scraping: ' + error.message);
    }
  };
  
  // Format numbers with commas
  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-';
  };
  
  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending_email_extraction':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_emails_found':
        return 'bg-orange-100 text-orange-800';
      case 'skipped':
        return 'bg-gray-100 text-gray-600';
      case 'failed':
      case 'error':
      case 'semrush_error':
      case 'email_error':
      case 'processing_error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <form onSubmit={handleSearch} className="w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search domains..."
              className="form-input pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <button type="submit" className="hidden">Search</button>
          </div>
        </form>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {source === 'google-search' ? 'Entreprise' : 'Domain'}
              </th>
              {source === 'semrush' && (
                <>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Traffic
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backlinks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keywords
                  </th>
                </>
              )}
              {source === 'google-search' && (
                <>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secteur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                </>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Emails
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {domains.length > 0 ? (
              domains.map((domain, index) => (
                <tr key={domain.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {source === 'google-search' ? domain.companyName || domain.title : domain.domain}
                      </div>
                      {source === 'google-search' && domain.domain && (
                        <div className="text-xs text-gray-500 mt-1">
                          {domain.domain}
                        </div>
                      )}
                    </div>
                  </td>
                  {source === 'semrush' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(domain.traffic)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(domain.backlinks)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(domain.keywords)}
                      </td>
                    </>
                  )}
                  {source === 'google-search' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {domain.businessInfo?.sector || 'Non défini'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          domain.source === 'google_search' ? 'bg-blue-100 text-blue-800' : 
                          domain.source === 'google_maps' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {domain.source === 'google_search' ? 'Google' : 
                           domain.source === 'google_maps' ? 'Maps' : 
                           domain.source || 'Inconnu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {domain.url && (
                          <a 
                            href={domain.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 truncate block max-w-40"
                          >
                            {domain.url.replace(/^https?:\/\//, '').substring(0, 30)}...
                          </a>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FaEnvelope className="mr-1 text-gray-400" />
                      {source === 'google-search' ? 
                        (domain.contactInfo?.emails?.length || 0) : 
                        (domain.email_count || 0)
                      }
                      {source === 'google-search' && domain.contactInfo?.emails?.length > 0 && (
                        <div className="ml-2">
                          <div className="text-xs text-gray-400">
                            {domain.contactInfo.emails.slice(0, 2).join(', ')}
                            {domain.contactInfo.emails.length > 2 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      source === 'google-search' ? 
                        getStatusBadge(domain.contactInfo?.extractionStatus || domain.status) :
                        getStatusBadge(domain.scraping_status)
                    }`}>
                      {source === 'google-search' ? 
                        (domain.contactInfo?.extractionStatus || domain.status || 'pending') :
                        (domain.scraping_status || 'pending')
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {source === 'semrush' && (
                        <>
                          <button
                            onClick={() => handleScrape(domain.domain)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Scrape domain"
                          >
                            <FaSync />
                          </button>
                          {domain.semrush_url && (
                            <a
                              href={domain.semrush_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View on SEMrush"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          )}
                        </>
                      )}
                      {source === 'google-search' && domain.url && (
                        <a
                          href={domain.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Visiter le site"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={source === 'google-search' ? "7" : "7"} className="px-6 py-4 text-center text-sm text-gray-500">
                  {source === 'google-search' ? 'Aucune entreprise trouvée' : 'No domains found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> domains
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`btn ${
                pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-secondary'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`btn ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}