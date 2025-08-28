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
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';

export default function Home() {
  const [showModeSelector, setShowModeSelector] = useState(false);
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
  if (showModeSelector || (stats.totalDomains === 0 && !loading)) {
    return <ModeSelector />;
  }

  // Quick actions
  const quickActions = [
    {
      title: 'Analyse Domaines',
      description: 'Import domaines et analyse SEMrush',
      icon: <FaChartLine className="text-orange-600 text-2xl" />,
      href: '/import',
      color: 'bg-orange-50 hover:bg-orange-100',
      border: 'border-orange-200',
      badge: 'SEMrush'
    },
    {
      title: 'Prospection Mots-clés', 
      description: 'Recherche Google et découverte prospects',
      icon: <FaSearch className="text-blue-600 text-2xl" />,
      href: '/keywords',
      color: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-200',
      badge: 'Google'
    },
    {
      title: 'Lancer Scraping',
      description: 'Start scraping process for imported domains',
      icon: <FaPlay className="text-green-600 text-2xl" />,
      href: '/scrape',
      color: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-200'
    },
    {
      title: 'View Results',
      description: 'Browse scraped domains and emails',
      icon: <FaTable className="text-purple-600 text-2xl" />,
      href: '/domains',
      color: 'bg-purple-50 hover:bg-purple-100',
      border: 'border-purple-200'
    },
    {
      title: 'Export Data',
      description: 'Download your data in Excel format',
      icon: <FaDownload className="text-indigo-600 text-2xl" />,
      href: '/export',
      color: 'bg-indigo-50 hover:bg-indigo-100',
      border: 'border-indigo-200'
    },
    {
      title: 'Email Campaign',
      description: 'Lancer campagne emailing automatisée',
      icon: <FaEnvelope className="text-pink-600 text-2xl" />,
      href: '/campaigns',
      color: 'bg-pink-50 hover:bg-pink-100',
      border: 'border-pink-200',
      badge: 'Nouveau'
    }
  ];

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="dashboard-container space-y-8">
        
        {/* Header avec bouton de mode */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Hybride</h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble de votre outil de prospection SEMrush + Google
            </p>
          </div>
          
          <button
            onClick={() => setShowModeSelector(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
          >
            <FaSearch className="text-sm" />
            <span>Changer de mode</span>
          </button>
        </div>

        {/* Processus actifs */}
        {activeProcesses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaClock className="mr-2 text-blue-500" />
              Processus en cours ({activeProcesses.length})
            </h2>
            
            {activeProcesses.map((process) => (
              <RealTimeFeedback 
                key={process.id}
                processId={process.id}
                compact={true}
                showDetails={false}
              />
            ))}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <FaTable className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDomains}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <FaPlay className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scraped Domains</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scrapedDomains}</p>
                <p className="text-sm text-gray-500">
                  {stats.totalDomains > 0 ? Math.round((stats.scrapedDomains / stats.totalDomains) * 100) : 0}% complete
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <FaEnvelope className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmails}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valid Emails</p>
                <p className="text-2xl font-bold text-gray-900">{stats.validEmails}</p>
                <p className="text-sm text-gray-500">
                  {stats.totalEmails > 0 ? Math.round((stats.validEmails / stats.totalEmails) * 100) : 0}% valid
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-rapides space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className={`p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer relative ${action.color} ${action.border}`}>
                  {/* Badge si présent */}
                  {action.badge && (
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        action.badge === 'Nouveau' 
                          ? 'bg-green-100 text-green-700'
                          : action.badge === 'SEMrush'
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {action.badge}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activité récente</h2>
          
          {activeProcesses.length === 0 ? (
            <div className="text-center py-8">
              <FaClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun processus actif</h3>
              <p className="mt-1 text-sm text-gray-500">
                Lancez un nouveau processus de scraping ou de prospection pour commencer.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowModeSelector(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Choisir un mode
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProcesses.slice(0, 5).map((process) => (
                <div key={process.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      process.status === 'running' ? 'bg-blue-500' :
                      process.status === 'completed' ? 'bg-green-500' :
                      process.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{process.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(process.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{process.progress}%</p>
                    <p className="text-xs text-gray-500">{process.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
