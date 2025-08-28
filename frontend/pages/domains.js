import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DomainTable from '../components/DomainTable';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch domains
  const fetchDomains = async (page = 1, search = '') => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/export/domains?page=${page}&limit=${pagination.limit}&search=${search}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data.domains);
      setPagination(data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchDomains();
  }, []);
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages) return;
    fetchDomains(page, searchTerm);
  };
  
  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchDomains(1, term);
  };
  
  return (
    <Layout title="Domains">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Domains</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-red-500 text-lg mr-2" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          </div>
        )}
        
        {loading && domains.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <FaSpinner className="animate-spin text-indigo-600 text-2xl mr-2" />
            <span>Loading domains...</span>
          </div>
        ) : (
          <DomainTable
            domains={domains}
            className="domain-table"
          />
        )}
      </div>
    </Layout>
  );
}