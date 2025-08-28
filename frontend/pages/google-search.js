import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import RealTimeFeedback from '../components/RealTimeFeedback';
import DomainTable from '../components/DomainTable';

export default function GoogleSearch() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentProcessId, setCurrentProcessId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Paramètres de recherche
  const [searchQueries, setSearchQueries] = useState(['']);
  const [maxResults, setMaxResults] = useState(25);
  const [region, setRegion] = useState('fr');
  const [language, setLanguage] = useState('fr');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [includeEmailExtraction, setIncludeEmailExtraction] = useState(true);
  const [includeMapsSearch, setIncludeMapsSearch] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [searchMode, setSearchMode] = useState('manual');

  // Animation states
  const [animateResults, setAnimateResults] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddQuery = () => {
    setSearchQueries([...searchQueries, '']);
  };

  const handleRemoveQuery = (index) => {
    if (searchQueries.length > 1) {
      const newQueries = searchQueries.filter((_, i) => i !== index);
      setSearchQueries(newQueries);
    }
  };

  const handleQueryChange = (index, value) => {
    const newQueries = [...searchQueries];
    newQueries[index] = value;
    setSearchQueries(newQueries);
  };

  // Animation quand les résultats arrivent
  useEffect(() => {
    if (results) {
      setAnimateResults(true);
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [results]);

  const handleManualSearch = async () => {
    if (searchQueries.filter(q => q.trim()).length === 0) {
      setError('Veuillez saisir au moins une requête de recherche');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setAnimateResults(false);

    try {
      const response = await fetch('/api/google-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQueries: searchQueries.filter(q => q.trim()),
          options: {
            maxResultsPerQuery: maxResults,
            region,
            language,
            businessType,
            location,
            emailOptions: {
              maxConcurrent: 2,
              maxEmailsPerCompany: 3,
              skipSocialMedia: true
            }
          },
          includeEmailExtraction,
          includeMapsSearch
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentProcessId(data.processId);
        setResults(data.data);
      } else {
        setError(data.error || 'Erreur lors de la recherche');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Erreur de connexion au serveur');
    }

    setIsLoading(false);
  };

  const handleCsvSearch = async () => {
    if (!csvFile) {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setAnimateResults(false);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('includeEmailExtraction', includeEmailExtraction.toString());
      formData.append('includeMapsSearch', includeMapsSearch.toString());
      formData.append('maxResultsPerQuery', maxResults.toString());
      formData.append('region', region);
      formData.append('language', language);

      const response = await fetch('/api/google-search/batch', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCurrentProcessId(data.processId);
        setResults(data.data);
      } else {
        setError(data.error || 'Erreur lors du traitement du fichier CSV');
      }
    } catch (err) {
      console.error('CSV search error:', err);
      setError('Erreur de connexion au serveur');
    }

    setIsLoading(false);
  };

  const handleExport = () => {
    if (results && results.companies && results.companies.length > 0) {
      const processId = currentProcessId;
      router.push(`/export?processId=${processId}&source=google-search`);
    }
  };

  const handleProcessComplete = (processData) => {
    if (processData.status === 'completed' && processData.results) {
      setResults({
        companies: processData.results.companies || [],
        stats: processData.results.stats || {},
        metadata: {
          totalCompanies: processData.results.totalCompanies || 0,
          processedAt: new Date().toISOString()
        }
      });
    }
    setIsLoading(false);
  };

  return (
    <Layout title="Recherche Google">
      {/* Success notification */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 animate-bounce">
          ✅ Recherche terminée avec succès !
        </div>
      )}

      <div className="p-4 md:p-6 space-y-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* Header avec animations */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl p-8 mb-8 transform transition-all duration-500 hover:scale-[1.02]">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center md:justify-start gap-3">
                  🔍 <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Prospection Google Search
                  </span>
                </h1>
                <p className="text-blue-100 text-lg">
                  Trouvez et contactez vos prospects grâce à la puissance de Google
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-3xl">🚀</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode selector avec animations */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 transform transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mode de recherche</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setSearchMode('manual')}
                  className={`
                    flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 transform
                    ${searchMode === 'manual'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-[1.02]'
                    }
                  `}
                >
                  <span className="text-2xl mb-2 block">✋</span>
                  Recherche manuelle
                  <p className="text-sm opacity-75 mt-1">Saisissez vos requêtes manuellement</p>
                </button>
                <button
                  onClick={() => setSearchMode('csv')}
                  className={`
                    flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 transform
                    ${searchMode === 'csv'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-[1.02]'
                    }
                  `}
                >
                  <span className="text-2xl mb-2 block">📄</span>
                  Import CSV
                  <p className="text-sm opacity-75 mt-1">Importez un fichier de requêtes</p>
                </button>
              </div>
            </div>
          </div>

          {/* Search form avec transitions */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              
              {/* Mode recherche manuelle */}
              {searchMode === 'manual' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      🎯 Requêtes de recherche
                    </h3>
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors"
                    >
                      {showAdvancedOptions ? '📐 Masquer options' : '⚙️ Options avancées'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {searchQueries.map((query, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:shadow-md"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => handleQueryChange(index, e.target.value)}
                          placeholder={`Ex: "cabinet comptable Paris" ou "agence web Lyon"`}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300"
                        />
                        {searchQueries.length > 1 && (
                          <button
                            onClick={() => handleRemoveQuery(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddQuery}
                    className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 rounded-xl transition-all duration-300 font-medium transform hover:scale-[1.01]"
                  >
                    ➕ Ajouter une requête
                  </button>
                </div>
              )}

              {/* Mode import CSV */}
              {searchMode === 'csv' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    📁 Import fichier CSV
                  </h3>
                  <div className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-400 transition-all duration-300 transform hover:scale-[1.01]">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="space-y-4">
                        <div className="text-6xl transform transition-transform duration-300 hover:scale-110">
                          {csvFile ? '✅' : '📄'}
                        </div>
                        <div>
                          <p className="text-xl font-medium text-gray-700">
                            {csvFile ? csvFile.name : 'Cliquez pour sélectionner un fichier CSV'}
                          </p>
                          <p className="text-gray-500 mt-2">
                            Format: terme_recherche,localisation (optionnel)
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Options avancées */}
              {showAdvancedOptions && (
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl transition-all duration-500">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    ⚙️ Configuration avancée
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        🔢 Résultats max par requête
                      </label>
                      <input
                        type="number"
                        value={maxResults}
                        onChange={(e) => setMaxResults(parseInt(e.target.value) || 25)}
                        min="5"
                        max="100"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        🌍 Région
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                      >
                        <option value="fr">🇫🇷 France</option>
                        <option value="be">🇧🇪 Belgique</option>
                        <option value="ch">🇨🇭 Suisse</option>
                        <option value="ca">🇨🇦 Canada</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        🗣️ Langue
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 Anglais</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        🏢 Type d'entreprise
                      </label>
                      <input
                        type="text"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        placeholder="Ex: SARL, SAS, startup..."
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        📍 Localisation
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ex: Paris, Lyon, région..."
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-700">🎛️ Options supplémentaires</h5>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer transform hover:scale-[1.02]">
                        <input
                          type="checkbox"
                          checked={includeEmailExtraction}
                          onChange={(e) => setIncludeEmailExtraction(e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded transition-all"
                        />
                        <span className="text-sm font-medium text-gray-700">📧 Extraire les emails automatiquement</span>
                      </label>

                      <label className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer transform hover:scale-[1.02]">
                        <input
                          type="checkbox"
                          checked={includeMapsSearch}
                          onChange={(e) => setIncludeMapsSearch(e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded transition-all"
                        />
                        <span className="text-sm font-medium text-gray-700">🗺️ Inclure Google Maps</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={searchMode === 'manual' ? handleManualSearch : handleCsvSearch}
                  disabled={isLoading}
                  className={`
                    flex-1 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform
                    ${isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Recherche en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🔍 Lancer la recherche
                    </span>
                  )}
                </button>

                {results && results.companies && results.companies.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    📊 Exporter les résultats
                  </button>
                )}
              </div>

              {/* Messages d'erreur */}
              {error && (
                <div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center">
                    <span className="text-red-500 text-2xl mr-3">⚠️</span>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback temps réel */}
          {currentProcessId && (
            <div className="mb-8 transform transition-all duration-500">
              <RealTimeFeedback
                processId={currentProcessId}
                onProcessComplete={handleProcessComplete}
                title="Progression de la recherche Google"
              />
            </div>
          )}

          {/* Résultats */}
          {results && (
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-700 ${animateResults ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    🎉 Résultats de recherche
                  </h2>
                  <div className="text-sm text-gray-500 mt-2 md:mt-0 bg-gray-100 px-3 py-1 rounded-full">
                    {results.metadata ? results.metadata.totalCompanies : results.companies?.length || 0} entreprises trouvées
                  </div>
                </div>

                {/* Statistiques */}
                {results.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.stats.totalCompanies || results.companies?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Entreprises</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-green-600">
                        {results.stats.companiesWithValidEmails || 0}
                      </div>
                      <div className="text-sm text-gray-600">Avec emails valides</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-purple-600">
                        {results.stats.validEmails || results.stats.totalEmails || 0}
                      </div>
                      <div className="text-sm text-gray-600">Emails trouvés</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-orange-600">
                        {results.stats.averageEmailsPerCompany || '0'}
                      </div>
                      <div className="text-sm text-gray-600">Emails/entreprise</div>
                    </div>
                  </div>
                )}

                {/* Tableau des résultats */}
                {results.companies && results.companies.length > 0 && (
                  <DomainTable className="domain-table" domains={results.companies} source="google-search" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}