import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Keywords = () => {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [showNewSearch, setShowNewSearch] = useState(false);

  // Données demo pour les recherches sauvegardées
  const demoSearches = [
    {
      id: 1,
      query: 'cabinet comptable',
      location: 'France',
      date: '2025-01-15T10:00:00Z',
      results_count: 45,
      emails_found: 12,
      status: 'completed',
      last_scraped: '2025-01-15T14:30:00Z',
      results: [
        {
          title: 'Cabinet Expertise Comptable Martin',
          url: 'https://cabinet-martin.fr',
          snippet: 'Expert comptable depuis 20 ans, nous accompagnons les entreprises...',
          emails: ['contact@cabinet-martin.fr', 'martin@cabinet-martin.fr'],
          phone: '01 23 45 67 89',
          address: '15 rue de la Paix, 75001 Paris',
          scraped: true
        },
        {
          title: 'Comptabilité & Gestion Pro',
          url: 'https://comptabilite-pro.com',
          snippet: 'Services comptables et de gestion pour PME et TPE...',
          emails: ['info@comptabilite-pro.com'],
          phone: '01 34 56 78 90',
          address: '8 avenue des Champs, 75008 Paris',
          scraped: true
        }
      ]
    },
    {
      id: 2,
      query: 'agence marketing digital',
      location: 'Lyon',
      date: '2025-01-14T09:00:00Z',
      results_count: 38,
      emails_found: 15,
      status: 'completed',
      last_scraped: '2025-01-14T16:20:00Z'
    },
    {
      id: 3,
      query: 'consultant RH',
      location: 'Marseille',
      date: '2025-01-13T11:00:00Z',
      results_count: 0,
      emails_found: 0,
      status: 'pending',
      last_scraped: null
    }
  ];

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      setLoading(true);
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 800));
      setSearches(demoSearches);
    } catch (error) {
      console.error('Erreur lors du chargement des recherches:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recherche ?')) {
      setSearches(searches.filter(s => s.id !== searchId));
    }
  };

  const NewSearchModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
      query: '',
      location: '',
      max_results: 50
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      // Simuler la création d'une nouvelle recherche
      const newSearch = {
        id: searches.length + 1,
        query: formData.query,
        location: formData.location,
        date: new Date().toISOString(),
        results_count: 0,
        emails_found: 0,
        status: 'pending',
        last_scraped: null
      };
      setSearches([newSearch, ...searches]);
      setFormData({ query: '', location: '', max_results: 50 });
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">🔍 Nouvelle Recherche</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mots-clés de recherche
                </label>
                <input
                  type="text"
                  required
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: cabinet comptable, agence web..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Paris, Lyon, France..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre maximum de résultats
                </label>
                <select
                  value={formData.max_results}
                  onChange={(e) => setFormData({ ...formData, max_results: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 résultats</option>
                  <option value={25}>25 résultats</option>
                  <option value={50}>50 résultats</option>
                  <option value={100}>100 résultats</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <span className="mr-2">🚀</span>
                  Lancer la Recherche
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des recherches...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NewSearchModal 
        isOpen={showNewSearch} 
        onClose={() => setShowNewSearch(false)} 
      />
      
      <div className="space-y-6 p-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🔍</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Recherches Google</h1>
                <p className="mt-2 text-gray-600">
                  Gérez et consultez vos recherches de mots-clés sauvegardées
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewSearch(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Nouvelle Recherche
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recherches</p>
                <p className="text-3xl font-bold text-gray-900">{searches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🌐</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Résultats Totaux</p>
                <p className="text-3xl font-bold text-gray-900">
                  {searches.reduce((sum, search) => sum + search.results_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📧</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Trouvés</p>
                <p className="text-3xl font-bold text-green-600">
                  {searches.reduce((sum, search) => sum + search.emails_found, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">⚡</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recherches Actives</p>
                <p className="text-3xl font-bold text-blue-600">
                  {searches.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des recherches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">📋 Historique des Recherches</h2>
          </div>

          {searches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500 mb-2">Aucune recherche sauvegardée</p>
              <p className="text-sm text-gray-400 mb-4">Commencez par effectuer une recherche Google</p>
              <button
                onClick={() => setShowNewSearch(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Nouvelle Recherche
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recherche</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résultats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emails</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searches.map((search) => (
                    <tr key={search.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{search.query}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{search.location || 'Global'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{search.results_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">{search.emails_found}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          search.status === 'completed' ? 'bg-green-100 text-green-800' :
                          search.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {search.status === 'completed' ? '✅ Terminé' :
                           search.status === 'pending' ? '⏳ En attente' : search.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(search.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedSearch(search)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Voir les détails"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => deleteSearch(search.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Détails de la recherche sélectionnée */}
        {selectedSearch && selectedSearch.results && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Résultats: {selectedSearch.query}
              </h3>
              <button
                onClick={() => setSelectedSearch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedSearch.results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          {result.title}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{result.snippet}</p>
                      
                      <div className="mt-3 space-y-2">
                        {result.emails && result.emails.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">📧 Emails:</span>
                            <div className="flex flex-wrap gap-2">
                              {result.emails.map((email, i) => (
                                <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {email}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {result.phone && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">📞 Téléphone:</span>
                            <span className="text-sm text-gray-600">{result.phone}</span>
                          </div>
                        )}
                        
                        {result.address && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">📍 Adresse:</span>
                            <span className="text-sm text-gray-600">{result.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.scraped ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.scraped ? '✅ Scrapé' : '⏳ Non traité'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Keywords;
