import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ModeSelector from '../components/ModeSelector';
import RealTimeFeedback from '../components/RealTimeFeedback';
import Link from 'next/link';
import { 
  FaUpload, 
  FaPlay, 
  FaTable, 
  FaDownload, 
  FaExclamationTriangle,
  FaChartLine,
  FaSearch,
  FaEnvelope,
  FaClock
} from 'react-icons/fa';

export default function Home() {
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [stats, setStats] = useState({
    totalDomains: 0,
    scrapedDomains: 0,
    totalEmails: 0,
    validEmails: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats and processes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch domain stats (existing)
        const domainsResponse = await fetch('/api/export/domains?page=1&limit=1000');
        if (domainsResponse.ok) {
          const domainsData = await domainsResponse.json();
          
          // Calculate stats
          const totalDomains = domainsData.pagination.total;
          const scrapedDomains = domainsData.domains.filter(d => 
            d.scraping_status === 'completed' || d.scraping_status === 'no_emails_found'
          ).length;
          
          // Fetch detailed stats sample
          const detailedResponse = await fetch(`/api/export/domains?page=1&limit=100`);
          const detailedData = await detailedResponse.json();
          
          const emailPromises = detailedData.domains.map(domain => 
            fetch(`/api/export/domains/${domain.id}`).then(res => res.json())
          );
          
          const detailedDomains = await Promise.all(emailPromises);
          
          let totalEmails = 0;
          let validEmails = 0;
          
          detailedDomains.forEach(domain => {
            if (domain.emails) {
              totalEmails += domain.emails.length;
              validEmails += domain.emails.filter(e => e.is_valid).length;
            }
          });
          
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
        }

        // Fetch active processes (new)
        const processesResponse = await fetch('/api/feedback/processes');
        if (processesResponse.ok) {
          const processesData = await processesResponse.json();
          setActiveProcesses(processesData.data.activeProcesses || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Si l'utilisateur n'a pas encore choisi de mode ou n'a pas de données
  if (showModeSelector && stats.totalDomains === 0) {
    return <ModeSelector />;
  }
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
  
  // Quick actions
  const quickActions = [
    {
      title: 'Import Domains',
      description: 'Import domains from CSV or enter them manually',
      icon: <FaUpload className="text-indigo-600 text-2xl" />,
      href: '/import',
      color: 'bg-indigo-50',
    },
    {
      title: 'Start Scraping',
      description: 'Start a new scraping job for all or selected domains',
      icon: <FaPlay className="text-green-600 text-2xl" />,
      href: '/scrape',
      color: 'bg-green-50',
    },
    {
      title: 'View Domains',
      description: 'Browse and manage all your domains and emails',
      icon: <FaTable className="text-blue-600 text-2xl" />,
      href: '/domains',
      color: 'bg-blue-50',
    },
    {
      title: 'Export Results',
      description: 'Export all data to Excel or other formats',
      icon: <FaDownload className="text-purple-600 text-2xl" />,
      href: '/export',
      color: 'bg-purple-50',
    },
  ];
  
  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Domains</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {loading ? '...' : stats.totalDomains.toLocaleString()}
              </dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Scraped Domains</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {loading ? '...' : stats.scrapedDomains.toLocaleString()}
              </dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Emails</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {loading ? '...' : stats.totalEmails.toLocaleString()}
              </dd>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Valid Emails</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {loading ? '...' : stats.validEmails.toLocaleString()}
              </dd>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className={`${action.color} p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{action.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Getting Started */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Getting Started</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>
                <span className="font-medium text-gray-900">Import domains</span> - Upload a CSV file with domains or enter them manually
              </li>
              <li>
                <span className="font-medium text-gray-900">Start scraping</span> - Launch a scraping job to collect SEMrush data and emails
              </li>
              <li>
                <span className="font-medium text-gray-900">View results</span> - Browse the collected data in the Domains section
              </li>
              <li>
                <span className="font-medium text-gray-900">Export data</span> - Download all data as an Excel file
              </li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}