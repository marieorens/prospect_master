import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

// Données demo (extraites pour garder le composant propre)
const demoData = {
  global: {
    total_campaigns: 3,
    total_sent: 3750,
    total_opened: 861,
    total_clicked: 156,
    total_delivered: 3594,
    avg_open_rate: '22.96',
    avg_click_rate: '4.16',
    avg_delivery_rate: '95.84'
  },
  campaigns: [
    {
      id: 1,
      name: 'Campagne Demo Tech',
      status: 'completed',
      template_name: 'Template B2B Classique',
      created_at: '2024-01-15T10:00:00Z',
      sent_count: 1250,
      opened_count: 287,
      clicked_count: 52,
      delivered_count: 1198,
      bounced_count: 52,
      open_rate: '23.95',
      click_rate: '4.34',
      delivery_rate: '95.84',
      bounce_rate: '4.16'
    },
    {
      id: 2,
      name: 'Campagne Demo SaaS',
      status: 'active',
      template_name: 'Template Follow-up',
      created_at: '2024-01-10T09:00:00Z',
      sent_count: 2500,
      opened_count: 574,
      clicked_count: 104,
      delivered_count: 2396,
      bounced_count: 104,
      open_rate: '22.96',
      click_rate: '4.16',
      delivery_rate: '95.84',
      bounce_rate: '4.16'
    }
  ],
  templates: [
    {
      id: 1,
      name: 'Template B2B Classique',
      subject: 'Partenariat commercial',
      usage_count: 2,
      total_sent: 2500,
      avg_open_rate: '24.5',
      avg_click_rate: '4.8',
      performance_score: 78
    },
    {
      id: 2,
      name: 'Template Follow-up',
      subject: 'Suivi de notre conversation',
      usage_count: 1,
      total_sent: 1250,
      avg_open_rate: '19.2',
      avg_click_rate: '3.1',
      performance_score: 52
    }
  ],
  segmentation: [
    { traffic_segment: 'High Traffic', recipients_count: 145, open_rate: '28.3', click_rate: '6.2' },
    { traffic_segment: 'Medium Traffic', recipients_count: 678, open_rate: '22.1', click_rate: '3.8' },
    { traffic_segment: 'Low Traffic', recipients_count: 427, open_rate: '19.7', click_rate: '2.4' }
  ],
  timeline: [
    { event_type: 'sent', recipient_email: 'contact@example.com', domain: 'example.com', created_at: '2024-01-15T11:30:00Z' },
    { event_type: 'delivered', recipient_email: 'contact@example.com', domain: 'example.com', created_at: '2024-01-15T11:31:00Z' },
    { event_type: 'opened', recipient_email: 'contact@example.com', domain: 'example.com', created_at: '2024-01-15T14:22:00Z' },
    { event_type: 'clicked', recipient_email: 'info@demo-corp.com', domain: 'demo-corp.com', created_at: '2024-01-15T16:45:00Z' }
  ]
};

const ComprehensiveAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulation du chargement des données
    const loadData = async () => {
      try {
        setLoading(true);
        // Simuler un appel API
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCampaigns(demoData.campaigns);
        setGlobalStats(demoData.global);
        setTemplates(demoData.templates);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const exportReport = async (format = 'csv') => {
    try {
      // Simulation export
      alert(`${format.toUpperCase()} export en cours de développement...`);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des analytics...</span>
      </div>
    );
  }

  // Fallbacks pratiques
  const templatesData = templates.length > 0 ? templates : demoData.templates;
  const campaignsData = campaigns.length > 0 ? campaigns : demoData.campaigns;
  const selectedData = selectedCampaign ? campaignsData.find((c) => c.id === selectedCampaign) : null;

  return (
    <div className="space-y-6">
      {/* Message d'information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-xl mr-2">ℹ️</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Mode Démonstration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Interface d'analytics complète avec données de test. Créez des campagnes réelles pour voir vos vraies données.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: "Vue d'ensemble", emoji: '📊' },
            { id: 'campaigns', name: 'Par Campagne', emoji: '📈' },
            { id: 'performance', name: 'Performance', emoji: '🎯' },
            { id: 'templates', name: 'Templates', emoji: '📧' }
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
              <span className="mr-2">{tab.emoji}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs globaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 text-2xl">📧</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Emails</p>
                  <p className="text-3xl font-bold text-gray-900">{globalStats?.total_sent ?? demoData.global.total_sent}</p>
                  <p className="text-xs text-gray-500">{globalStats?.total_campaigns ?? demoData.global.total_campaigns} campagnes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 text-2xl">👀</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux d'Ouverture</p>
                  <p className="text-3xl font-bold text-gray-900">{globalStats?.avg_open_rate ?? demoData.global.avg_open_rate}%</p>
                  <p className="text-xs text-gray-500">{globalStats?.total_opened ?? demoData.global.total_opened} ouvertures</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 text-2xl">🖱️</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Clic</p>
                  <p className="text-3xl font-bold text-gray-900">{globalStats?.avg_click_rate ?? demoData.global.avg_click_rate}%</p>
                  <p className="text-xs text-gray-500">{globalStats?.total_clicked ?? demoData.global.total_clicked} clics</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 text-2xl">👥</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Livraison</p>
                  <p className="text-3xl font-bold text-gray-900">{globalStats?.avg_delivery_rate ?? demoData.global.avg_delivery_rate}%</p>
                  <p className="text-xs text-gray-500">{globalStats?.total_delivered ?? demoData.global.total_delivered} livrés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance des templates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Performance des Templates</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux d'Ouverture</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux de Clic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templatesData.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{template.usage_count} campagnes</div>
                        <div className="text-sm text-gray-500">{template.total_sent} emails</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{template.avg_open_rate}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(template.avg_open_rate))}%`, backgroundColor: '#10B981' }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{template.avg_click_rate}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${Math.min(100, parseFloat(template.avg_click_rate) * 5)}%`, backgroundColor: '#F59E0B' }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            template.performance_score >= 70 ? 'bg-green-100 text-green-800' : template.performance_score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {template.performance_score}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vue par campagne */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 Sélectionner une Campagne</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignsData.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCampaign === campaign.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{campaign.template_name}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'completed' ? 'bg-green-100 text-green-800' : campaign.status === 'active' ? 'bg-blue-100 text-blue-800' : campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(campaign.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedData && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedData.name}</h2>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>📧 Template: {selectedData.template_name}</span>
                      <span>•</span>
                      <span>📅 Créée le {new Date(selectedData.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportReport('csv')}
                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <span className="mr-2">💾</span>
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 text-xl">📧</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Emails Envoyés</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedData.sent_count}</p>
                      <p className="text-xs text-gray-500">destinataires</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 text-xl">👀</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Taux d'Ouverture</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedData.open_rate}%</p>
                      <p className="text-xs text-gray-500">{selectedData.opened_count} ouvertures</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 text-xl">🖱️</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Taux de Clic</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedData.click_rate}%</p>
                      <p className="text-xs text-gray-500">{selectedData.clicked_count} clics</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 text-xl">👥</div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Taux de Livraison</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedData.delivery_rate}%</p>
                      <p className="text-xs text-gray-500">{selectedData.delivered_count} livrés</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Vue d'ensemble des Performances</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { name: 'Envoyés', value: selectedData.sent_count, color: '#3B82F6' },
                    { name: 'Livrés', value: selectedData.delivered_count, color: '#10B981' },
                    { name: 'Ouverts', value: selectedData.opened_count, color: '#F59E0B' },
                    { name: 'Cliqués', value: selectedData.clicked_count, color: '#EF4444' },
                    { name: 'Bounced', value: selectedData.bounced_count, color: '#6B7280' }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: item.color }}>
                        {item.value}
                      </div>
                      <div className="text-sm text-gray-600">{item.name}</div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div
                          className="h-3 rounded-full"
                          style={{ width: `${(item.value / Math.max(selectedData.sent_count, 1)) * 100}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance détaillée */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Métriques de Performance</h3>
            <div className="space-y-6">
              {[
                { metric: 'Taux de livraison', rate: parseFloat(demoData.global.avg_delivery_rate), color: 'bg-green-500', emoji: '✅' },
                { metric: "Taux d'ouverture", rate: parseFloat(demoData.global.avg_open_rate), color: 'bg-blue-500', emoji: '👀' },
                { metric: 'Taux de clic', rate: parseFloat(demoData.global.avg_click_rate), color: 'bg-orange-500', emoji: '🖱️' },
                { metric: 'Taux de bounce', rate: 4.16, color: 'bg-red-500', emoji: '❌' }
              ].map((item, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 flex items-center">
                      <span className="mr-2">{item.emoji}</span>
                      {item.metric}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{item.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${item.color} transition-all duration-500`} style={{ width: `${Math.min(100, item.rate)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Segmentation par Trafic</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demoData.segmentation.map((segment, index) => (
                <div key={index} className="border rounded-lg p-4" style={{ borderColor: `hsl(${index * 45}, 70%, 50%)` }}>
                  <h4 className="font-medium text-gray-900 mb-2">🎯 {segment.traffic_segment}</h4>
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
                      <div className="h-3 rounded-full" style={{ width: `${segment.open_rate}%`, backgroundColor: `hsl(${index * 45}, 70%, 50%)` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Timeline des Événements</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {demoData.timeline.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    event.event_type === 'sent' ? 'bg-blue-500' : event.event_type === 'delivered' ? 'bg-green-500' : event.event_type === 'opened' ? 'bg-yellow-500' : event.event_type === 'clicked' ? 'bg-orange-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 capitalize flex items-center">
                        {event.event_type === 'sent' && '📤'}
                        {event.event_type === 'delivered' && '✅'}
                        {event.event_type === 'opened' && '👀'}
                        {event.event_type === 'clicked' && '🖱️'}
                        <span className="ml-2">{event.event_type}</span>
                      </span>
                      <span className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{event.recipient_email}</p>
                    <p className="text-xs text-gray-500">{event.domain}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates détaillé */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Analyse Détaillée des Templates</h3>
          <div className="space-y-6">
            {templatesData.map((template) => (
              <div key={template.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📧</span>
                      <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-gray-600 mt-1">{template.subject}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{template.usage_count}</div>
                        <div className="text-xs text-gray-500">Campagnes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{template.total_sent}</div>
                        <div className="text-xs text-gray-500">Emails envoyés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{template.avg_open_rate}%</div>
                        <div className="text-xs text-gray-500">Ouverture</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{template.avg_click_rate}%</div>
                        <div className="text-xs text-gray-500">Clic</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      template.performance_score >= 70 ? 'bg-green-100 text-green-800' : template.performance_score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Score: {template.performance_score}/100
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-3 mt-2">
                      <div className="bg-blue-500 h-3 rounded-full transition-all duration-300" style={{ width: `${template.performance_score}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Analytics() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">📊</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="mt-2 text-gray-600">Analysez les performances de vos campagnes email avec des métriques détaillées</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <ComprehensiveAnalytics />
      </div>
    </Layout>
  );
}
