import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Performance = () => {
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheHealth, setCacheHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadPerformanceData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Charger statistiques cache
      const statsResponse = await fetch('http://localhost:4000/api/cache/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCacheStats(statsData.data);
      }

      // Charger santé cache
      const healthResponse = await fetch('http://localhost:4000/api/cache/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setCacheHealth(healthData);
      }

    } catch (error) {
      setError('Erreur lors du chargement des données de performance');
      console.error('Performance fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCacheAction = async (action, type = null) => {
    try {
      setActionLoading(action);
      
      let response;
      switch (action) {
        case 'flush':
          response = await fetch(`http://localhost:4000/api/cache/flush${type ? `?type=${type}` : ''}`, {
            method: 'DELETE'
          });
          break;
        case 'warm':
          response = await fetch('http://localhost:4000/api/cache/warm', {
            method: 'POST'
          });
          break;
        case 'invalidate':
          response = await fetch(`http://localhost:4000/api/cache/invalidate/${type}`, {
            method: 'DELETE'
          });
          break;
      }

      if (response && response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadPerformanceData(); // Recharger les données
      }
    } catch (error) {
      alert('Erreur lors de l\'action: ' + error.message);
    } finally {
      setActionLoading('');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading && !cacheStats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des performances...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">⚡</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance & Cache</h1>
                <p className="mt-2 text-gray-600">
                  Monitoring et optimisation des performances du système
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadPerformanceData}
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '🔄' : '↻'} Actualiser
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Santé du système */}
        {cacheHealth && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">🏥 Santé du Système</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                cacheHealth.health.status === 'healthy' ? 'bg-green-100 text-green-800' :
                cacheHealth.health.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {cacheHealth.health.status === 'healthy' ? '✅ Sain' :
                 cacheHealth.health.status === 'warning' ? '⚠️ Attention' :
                 '❌ Problème'}
              </div>
            </div>

            {cacheHealth.health.issues.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Issues détectées:</h4>
                <ul className="space-y-1">
                  {cacheHealth.health.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-center">
                      <span className="mr-2">⚠️</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cacheHealth.metrics.hitRatio}</div>
                <div className="text-sm text-gray-500">Taux de Hit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{cacheHealth.metrics.totalRequests}</div>
                <div className="text-sm text-gray-500">Total Requêtes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatUptime(cacheHealth.metrics.uptime)}</div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{cacheHealth.metrics.memoryUsage}</div>
                <div className="text-sm text-gray-500">Mémoire</div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques de cache */}
        {cacheStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📊 Statistiques de Cache</h2>
              <div className="text-sm text-gray-500">
                Efficacité: <span className="font-semibold text-green-600">{cacheStats.performance.hitRatio}</span>
              </div>
            </div>

            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{cacheStats.hits}</div>
                <div className="text-sm text-green-700">Cache Hits</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{cacheStats.misses}</div>
                <div className="text-sm text-red-700">Cache Misses</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{cacheStats.writes}</div>
                <div className="text-sm text-blue-700">Écritures</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{cacheStats.deletes}</div>
                <div className="text-sm text-purple-700">Suppressions</div>
              </div>
            </div>

            {/* Détails par type de cache */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(cacheStats.cacheInfo).map(([type, info]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 capitalize">
                    Cache {type === 'default' ? 'Principal' : type === 'long' ? 'Long terme' : 'Court terme'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clés actives:</span>
                      <span className="font-semibold">{info.keys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hits:</span>
                      <span className="font-semibold text-green-600">{info.stats.hits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Misses:</span>
                      <span className="font-semibold text-red-600">{info.stats.misses}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mémoire système */}
        {cacheStats && cacheStats.memory && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🧠 Utilisation Mémoire</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{formatBytes(cacheStats.memory.heapUsed)}</div>
                <div className="text-sm text-gray-500">Heap Utilisé</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{formatBytes(cacheStats.memory.heapTotal)}</div>
                <div className="text-sm text-gray-500">Heap Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{formatBytes(cacheStats.memory.external)}</div>
                <div className="text-sm text-gray-500">Externe</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{formatBytes(cacheStats.memory.rss)}</div>
                <div className="text-sm text-gray-500">RSS</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions de cache */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 Actions de Cache</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Actions de nettoyage */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Nettoyage</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCacheAction('flush')}
                  disabled={actionLoading === 'flush'}
                  className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'flush' ? '🔄 En cours...' : '🗑️ Vider Tout le Cache'}
                </button>
                <button
                  onClick={() => handleCacheAction('flush', 'default')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  🗑️ Vider Cache Principal
                </button>
                <button
                  onClick={() => handleCacheAction('flush', 'short')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  🗑️ Vider Cache Court Terme
                </button>
              </div>
            </div>

            {/* Actions d'optimisation */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Optimisation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCacheAction('warm')}
                  disabled={actionLoading === 'warm'}
                  className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'warm' ? '🔄 En cours...' : '🔥 Préchauffer Cache'}
                </button>
                <button
                  onClick={() => handleCacheAction('invalidate', 'analytics')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  ♻️ Invalider Analytics
                </button>
                <button
                  onClick={() => handleCacheAction('invalidate', 'templates')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  ♻️ Invalider Templates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-xl mr-3">💡</div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Recommandations Performance</h3>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Maintenez un taux de hit cache &gt; 70% pour des performances optimales</li>
                <li>• Préchauffez le cache après chaque redémarrage du serveur</li>
                <li>• Surveillez l'utilisation mémoire et nettoyez si nécessaire</li>
                <li>• Les caches long terme sont parfaits pour les données statiques</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Performance;
