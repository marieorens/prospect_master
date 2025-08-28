import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import JobProgress from '../components/JobProgress';
import { toast } from 'react-toastify';
import { FaPlay, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export default function Scrape() {
  const router = useRouter();
  const { jobId } = router.query;
  
  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [mode, setMode] = useState('sequential');
  
  // Fetch domains
  const fetchDomains = async () => {
    setLoading(true);
    
    try {
      // Fetch all domains (up to 1000)
      const response = await fetch('/api/export/domains?page=1&limit=1000');
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data.domains);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    if (!jobId) {
      fetchDomains();
    }
  }, [jobId]);
  
  // Handle domain selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDomains(domains.map(domain => domain.domain));
    } else {
      setSelectedDomains([]);
    }
  };
  
  const handleSelectDomain = (domain, checked) => {
    if (checked) {
      setSelectedDomains([...selectedDomains, domain]);
    } else {
      setSelectedDomains(selectedDomains.filter(d => d !== domain));
    }
  };
  
  // Handle start scraping
  const handleStartScraping = async () => {
    if (selectedDomains.length === 0) {
      toast.error('Please select at least one domain');
      return;
    }
    
    setIsStarting(true);
    
    try {
      const response = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domains: selectedDomains,
          mode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }
      
      const data = await response.json();
      toast.success(`Scraping job started for ${data.queued} domains`);
      
      // Redirect to same page with jobId parameter
      router.push(`/scrape?jobId=${data.jobId}`);
    } catch (error) {
      console.error('Error starting scraping:', error);
      toast.error(`Failed to start scraping: ${error.message}`);
      setIsStarting(false);
    }
  };
  
  // Handle job completion
  const handleJobComplete = () => {
    toast.success('Scraping job completed');
  };
  
  // Filter domains by status
  const pendingDomains = domains.filter(d => !d.scraping_status || d.scraping_status === 'pending');
  const completedDomains = domains.filter(d => d.scraping_status === 'completed' || d.scraping_status === 'no_emails_found');
  const errorDomains = domains.filter(d => 
    d.scraping_status === 'semrush_error' || 
    d.scraping_status === 'email_error' || 
    d.scraping_status === 'processing_error'
  );
  
  return (
    <Layout title="Scrape Domains">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Scrape Domains</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-red-500 text-lg mr-2" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          </div>
        )}
        
        {/* Show job progress if jobId is provided */}
        {jobId ? (
          <JobProgress jobId={jobId} onComplete={handleJobComplete} />
        ) : (
          <>
            {/* Scraping options */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Scraping Options</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Processing Mode</label>
                    <select
                      className="form-input"
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="sequential">Sequential (Safer)</option>
                      <option value="parallel">Parallel (Faster)</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Sequential mode processes one domain at a time. Parallel mode processes multiple domains simultaneously.
                    </p>
                  </div>
                  
                  <div>
                    <label className="form-label">Domain Status</label>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <p className="text-sm text-yellow-500">Pending</p>
                        <p className="text-xl font-semibold text-yellow-700">{pendingDomains.length}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm text-green-500">Completed</p>
                        <p className="text-xl font-semibold text-green-700">{completedDomains.length}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="text-sm text-red-500">Error</p>
                        <p className="text-xl font-semibold text-red-700">{errorDomains.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    className="btn-scrape px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={handleStartScraping}
                    disabled={isStarting}
                  >
                    {isStarting ? <FaSpinner className="animate-spin inline mr-2" /> : <FaPlay className="inline mr-2" />}
                    Lancer le scraping
                  </button>
                </div>
              </div>
            </div>
            
            {/* Domain selection */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Select Domains</h3>
                <div className="flex items-center">
                  <input
                    id="select-all"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    checked={selectedDomains.length === domains.length && domains.length > 0}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
                    Select All
                  </label>
                </div>
              </div>
              <div className="border-t border-gray-200">
                {loading ? (
                  <div className="flex justify-center items-center p-12">
                    <FaSpinner className="animate-spin text-indigo-600 text-2xl mr-2" />
                    <span>Loading domains...</span>
                  </div>
                ) : domains.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Domain
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {domains.map((domain) => (
                          <tr key={domain.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                checked={selectedDomains.includes(domain.domain)}
                                onChange={(e) => handleSelectDomain(domain.domain, e.target.checked)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{domain.domain}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  domain.scraping_status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : domain.scraping_status === 'no_emails_found'
                                    ? 'bg-orange-100 text-orange-800'
                                    : domain.scraping_status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : domain.scraping_status === 'pending' || !domain.scraping_status
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {domain.scraping_status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No domains found. Please import domains first.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}