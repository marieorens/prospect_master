import { useState } from 'react';
import { 
  FiTrendingUp, FiMail, FiEye, FiMousePointer, FiUsers, 
  FiBarChart3, FiInfo
} from 'react-icons/fi';

const DemoAnalytics = () => {
  const [activeDemo, setActiveDemo] = useState('overview');

  // Données factices pour la démo
  const demoData = {
    campaigns: [
      { 
        id: 1, 
        name: 'Campagne Demo Tech', 
        status: 'completed',
        sent_count: 1250,
        opened_count: 287,
        clicked_count: 52,
        delivered_count: 1198,
        bounced_count: 52,
        open_rate: '23.95',
        click_rate: '4.34',
        delivery_rate: '95.84',
        bounce_rate: '4.16',
        template_name: 'Template Prospection B2B',
        created_at: '2024-01-15T10:00:00Z'
      }
    ],
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
    timeline: [
      { event_type: 'sent', recipient_email: 'contact@example.com', domain: 'example.com', created_at: '2024-01-15T11:30:00Z' },
      { event_type: 'delivered', recipient_email: 'contact@example.com', domain: 'example.com', created_at: '2024-01-15T11:31:00Z' },
      { event_type: 'opened', recipient_email: 'contact@example.com', domain: 'example.com', created_at: '2024-01-15T14:22:00Z' },
      { event_type: 'clicked', recipient_email: 'info@demo-corp.com', domain: 'demo-corp.com', created_at: '2024-01-15T16:45:00Z' }
    ],
    segmentation: [
      { traffic_segment: 'High Traffic', recipients_count: 145, open_rate: '28.3', click_rate: '6.2' },
      { traffic_segment: 'Medium Traffic', recipients_count: 678, open_rate: '22.1', click_rate: '3.8' },
      { traffic_segment: 'Low Traffic', recipients_count: 427, open_rate: '19.7', click_rate: '2.4' }
    ]
  };

  const performanceData = [
    { name: 'Envoyés', value: 1250, color: '#3B82F6' },
    { name: 'Livrés', value: 1198, color: '#10B981' },
    { name: 'Ouverts', value: 287, color: '#F59E0B' },
    { name: 'Cliqués', value: 52, color: '#EF4444' },
    { name: 'Bounced', value: 52, color: '#6B7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Avertissement Demo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiInfo className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Mode Démonstration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Ceci sont des données fictives pour démontrer les fonctionnalités d'analytics. 
              Créez une campagne réelle pour voir vos vrais données.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation demo */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Vue d\'ensemble', icon: FiBarChart3 },
            { id: 'performance', name: 'Performance', icon: FiTrendingUp },
            { id: 'templates', name: 'Templates', icon: FiMail }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDemo(tab.id)}
              className={`inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeDemo === tab.id
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

      {/* Vue d'ensemble */}
      {activeDemo === 'overview' && (
        <div className="space-y-6">
          {/* KPIs globaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiMail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Emails</p>
                  <p className="text-2xl font-bold text-gray-900">{demoData.global.total_sent}</p>
                  <p className="text-xs text-gray-500">{demoData.global.total_campaigns} campagnes</p>
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
                  <p className="text-2xl font-bold text-gray-900">{demoData.global.avg_open_rate}%</p>
                  <p className="text-xs text-gray-500">{demoData.global.total_opened} ouvertures</p>
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
                  <p className="text-2xl font-bold text-gray-900">{demoData.global.avg_click_rate}%</p>
                  <p className="text-xs text-gray-500">{demoData.global.total_clicked} clics</p>
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
                  <p className="text-2xl font-bold text-gray-900">{demoData.global.avg_delivery_rate}%</p>
                  <p className="text-xs text-gray-500">{demoData.global.total_delivered} livrés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance de la Campagne Demo</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {performanceData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-600">{item.name}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(item.value / 1250) * 100}%`,
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

      {/* Performance */}
      {activeDemo === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentation par Trafic (Demo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demoData.segmentation.map((segment, index) => (
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
          </div>
        </div>
      )}

      {/* Templates */}
      {activeDemo === 'templates' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des Templates (Demo)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux d'Ouverture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demoData.templates.map((template) => (
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
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, template.avg_open_rate)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.performance_score >= 70 ? 'bg-green-100 text-green-800' :
                        template.performance_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {template.performance_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoAnalytics;
