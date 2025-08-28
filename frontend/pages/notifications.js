import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadNotifications();
    loadStats();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      let url = 'http://localhost:4000/api/notifications';
      const params = new URLSearchParams({
        limit: '100',
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(filter !== 'all' && filter !== 'unread' && { type: filter })
      });
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      setError('Erreur lors du chargement des notifications');
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        await loadNotifications();
        await loadStats();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading('markAll');
      const response = await fetch('http://localhost:4000/api/notifications/read-all', {
        method: 'PUT'
      });
      
      if (response.ok) {
        await loadNotifications();
        await loadStats();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setActionLoading('');
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadNotifications();
        await loadStats();
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const createTestNotification = async (type) => {
    try {
      setActionLoading(`test-${type}`);
      const response = await fetch(`http://localhost:4000/api/notifications/test/${type}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadNotifications();
        await loadStats();
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
    } finally {
      setActionLoading('');
    }
  };

  const getNotificationIcon = (notification) => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'alert': return '🚨';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (notification) => {
    switch (notification.severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffMinutes / 1440)} jour(s)`;
  };

  if (loading && notifications.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des notifications...</span>
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
              <div className="text-3xl">🔔</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-2 text-gray-600">
                  Centre de notifications et alertes système
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadNotifications}
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '🔄' : '↻'} Actualiser
              </button>
              {stats && stats.unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading === 'markAll'}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'markAll' ? '🔄' : '✓'} Tout lire
                </button>
              )}
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

        {/* Statistiques */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Statistiques</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.totalNotifications}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{stats.unreadCount}</div>
                <div className="text-sm text-orange-700">Non lues</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{stats.activeAlerts}</div>
                <div className="text-sm text-red-700">Alertes actives</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
                <div className="text-sm text-green-700">Envoyées</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center space-x-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Filtrer:</span>
            {[
              { key: 'all', label: 'Toutes', emoji: '📋' },
              { key: 'unread', label: 'Non lues', emoji: '🔴' },
              { key: 'success', label: 'Succès', emoji: '✅' },
              { key: 'warning', label: 'Avertissements', emoji: '⚠️' },
              { key: 'error', label: 'Erreurs', emoji: '❌' },
              { key: 'alert', label: 'Alertes', emoji: '🚨' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.emoji} {filterOption.label}
              </button>
            ))}
          </div>

          {/* Tests */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tests de notifications:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'scraping-completed', label: 'Scraping terminé', emoji: '🕷️' },
                { key: 'campaign-sent', label: 'Campagne envoyée', emoji: '📧' },
                { key: 'export-ready', label: 'Export prêt', emoji: '📊' },
                { key: 'system-error', label: 'Erreur système', emoji: '🚨' },
                { key: 'high-memory', label: 'Alerte mémoire', emoji: '⚠️' }
              ].map(testType => (
                <button
                  key={testType.key}
                  onClick={() => createTestNotification(testType.key)}
                  disabled={actionLoading === `test-${testType.key}`}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {actionLoading === `test-${testType.key}` ? '🔄' : testType.emoji} {testType.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              📬 Notifications ({notifications.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>Aucune notification</p>
                <p className="text-sm mt-2">Les notifications apparaîtront ici au fur et à mesure</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${!notification.read ? 'bg-blue-25' : ''} ${getNotificationColor(notification)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        
                        {/* Détails supplémentaires */}
                        {notification.results && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            {Object.entries(notification.results).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace('_', ' ')}:</span>
                                <span className="font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bouton d'action */}
                        {notification.actionButton && (
                          <div className="mt-3">
                            <a
                              href={notification.actionButton.url}
                              className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              {notification.actionButton.label}
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.timestamp)}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              notification.severity === 'error' ? 'bg-red-100 text-red-800' :
                              notification.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              notification.severity === 'info' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {notification.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Marquer comme lu"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-xl mr-3">💡</div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Guide des Notifications</h3>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Succès (✅)</strong>: Processus terminés avec succès</li>
                <li>• <strong>Avertissements (⚠️)</strong>: Situations à surveiller</li>
                <li>• <strong>Erreurs (❌)</strong>: Problèmes nécessitant une intervention</li>
                <li>• <strong>Alertes (🚨)</strong>: Alertes système automatiques</li>
                <li>• Les notifications non lues apparaissent avec un point bleu</li>
                <li>• Utilisez les tests pour voir les différents types de notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
