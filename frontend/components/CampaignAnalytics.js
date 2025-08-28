import { useState, useEffect } from 'react';
import { 
  FiTrendingUp, FiMail, FiEye, FiMousePointer, FiUsers, 
  FiBarChart3, FiPieChart, FiDownload, FiCalendar, FiClock 
} from 'react-icons/fi';

const CampaignAnalytics = ({ campaignId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [segmentation, setSegmentation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les données en parallèle
      const [analyticsRes, timelineRes, segmentationRes] = await Promise.all([
        fetch(`/api/analytics/campaign/${campaignId}`),
        fetch(`/api/analytics/campaign/${campaignId}/timeline?limit=50`),
        fetch(`/api/analytics/campaign/${campaignId}/segmentation`)
      ]);

      const [analyticsData, timelineData, segmentationData] = await Promise.all([
        analyticsRes.json(),
        timelineRes.json(),
        segmentationRes.json()
      ]);

      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
      
      if (timelineData.success) {
        setTimeline(timelineData.timeline);
      }
      
      if (segmentationData.success) {
        setSegmentation(segmentationData.segmentation);
      }
    } catch (error) {
      setError('Erreur lors du chargement des analytics');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'csv') => {
    try {
      const response = await fetch('/api/analytics/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ campaignId, format })
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-${campaignId}-report.csv`;
        a.click();
      } else {
        const data = await response.json();
        console.log('Export data:', data);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error || 'Données non disponibles'}</p>
      </div>
    );
  }

  // Données pour les graphiques
  const performanceData = [
    { name: 'Envoyés', value: analytics.sent_count, color: '#3B82F6' },
    { name: 'Livrés', value: analytics.delivered_count, color: '#10B981' },
    { name: 'Ouverts', value: analytics.opened_count, color: '#F59E0B' },
    { name: 'Cliqués', value: analytics.clicked_count, color: '#EF4444' },
    { name: 'Bounced', value: analytics.bounced_count, color: '#6B7280' }
  ];

  const rateData = [
    { metric: 'Taux de livraison', rate: parseFloat(analytics.delivery_rate) },
    { metric: 'Taux d\'ouverture', rate: parseFloat(analytics.open_rate) },
    { metric: 'Taux de clic', rate: parseFloat(analytics.click_rate) },
    { metric: 'Taux de bounce', rate: parseFloat(analytics.bounce_rate) }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête avec infos campagne */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{analytics.name}</h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>Template: {analytics.template_name}</span>
              <span>•</span>
              <span>Créée le {new Date(analytics.created_at).toLocaleDateString()}</span>
              {analytics.started_at && (
                <>
                  <span>•</span>
                  <span>Démarrée le {new Date(analytics.started_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportReport('csv')}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiDownload className="mr-2" size={14} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Vue d\'ensemble', icon: FiBarChart3 },
            { id: 'performance', name: 'Performance', icon: FiTrendingUp },
            { id: 'timeline', name: 'Timeline', icon: FiClock },
            { id: 'segmentation', name: 'Segmentation', icon: FiPieChart }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="mr-2" size={16} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiMail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Emails Envoyés</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.sent_count}</p>
                  <p className="text-xs text-gray-500">sur {analytics.total_recipients_actual} destinataires</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiEye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux d'Ouverture</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.open_rate}%</p>
                  <p className="text-xs text-gray-500">{analytics.opened_count} ouvertures</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiMousePointer className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Clic</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.click_rate}%</p>
                  <p className="text-xs text-gray-500">{analytics.clicked_count} clics</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiUsers className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Livraison</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.delivery_rate}%</p>
                  <p className="text-xs text-gray-500">{analytics.delivered_count} livrés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique en barres des performances */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble des Performances</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {performanceData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-600">{item.name}</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div 
                      className="h-3 rounded-full" 
                      style={{ 
                        width: `${(item.value / Math.max(...performanceData.map(d => d.value))) * 100}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Graphique des taux */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux de Performance</h3>
            <div className="space-y-4">
              {rateData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.metric}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, item.rate)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métriques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Métriques d'Engagement</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux d'ouverture</span>
                  <span className="font-semibold">{analytics.open_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de clic</span>
                  <span className="font-semibold">{analytics.click_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux clic/ouverture</span>
                  <span className="font-semibold">{analytics.click_to_open_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de désabonnement</span>
                  <span className="font-semibold">{analytics.unsubscribe_rate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Métriques de Livraison</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de livraison</span>
                  <span className="font-semibold">{analytics.delivery_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de bounce</span>
                  <span className="font-semibold">{analytics.bounce_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emails échoués</span>
                  <span className="font-semibold">{analytics.failed_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline des Événements</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {timeline.length > 0 ? timeline.map((event, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  event.event_type === 'sent' ? 'bg-blue-500' :
                  event.event_type === 'delivered' ? 'bg-green-500' :
                  event.event_type === 'opened' ? 'bg-yellow-500' :
                  event.event_type === 'clicked' ? 'bg-orange-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {event.event_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.recipient_email}</p>
                  <p className="text-xs text-gray-500">{event.domain}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">Aucun événement enregistré</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'segmentation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentation par Trafic</h3>
            {segmentation.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {segmentation.map((segment, index) => (
                  <div key={index} className="border rounded-lg p-4" style={{borderColor: `hsl(${index * 45}, 70%, 50%)`}}>
                    <h4 className="font-medium text-gray-900 mb-2">{segment.traffic_segment}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Destinataires</span>
                        <span className="font-semibold">{segment.recipients_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taux d'ouverture</span>
                        <span className="font-semibold">{segment.open_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taux de clic</span>
                        <span className="font-semibold">{segment.click_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div 
                          className="h-3 rounded-full" 
                          style={{ 
                            width: `${segment.open_rate}%`,
                            backgroundColor: `hsl(${index * 45}, 70%, 50%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Données de segmentation non disponibles</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignAnalytics;
