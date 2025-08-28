
import { useState } from 'react';
import Layout from '../components/Layout';
import { 
  FiTrendingUp, FiMail, FiEye, FiMousePointer, FiUsers, 
  FiBarChart3, FiActivity, FiInfo 
} from 'react-icons/fi';

// Composant Demo Simple sans imports externes
const SimpleDemoAnalytics = () => {
  const [activeDemo, setActiveDemo] = useState('overview');

  // Données factices
  const demoStats = {
    total_campaigns: 3,
    total_sent: 3750,
    total_opened: 861,
    total_clicked: 156,
    avg_open_rate: '22.96',
    avg_click_rate: '4.16',
    avg_delivery_rate: '95.84'
  };

  return (
    <div className="space-y-6">
      {/* Avertissement Demo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiInfo className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Mode Démonstration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Données fictives pour démontrer les fonctionnalités d'analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation demo */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Vue d\'ensemble', icon: FiBarChart3 },
            { id: 'performance', name: 'Performance', icon: FiTrendingUp }
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
                  <p className="text-2xl font-bold text-gray-900">{demoStats.total_sent}</p>
                  <p className="text-xs text-gray-500">{demoStats.total_campaigns} campagnes</p>
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
                  <p className="text-2xl font-bold text-gray-900">{demoStats.avg_open_rate}%</p>
                  <p className="text-xs text-gray-500">{demoStats.total_opened} ouvertures</p>
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
                  <p className="text-2xl font-bold text-gray-900">{demoStats.avg_click_rate}%</p>
                  <p className="text-xs text-gray-500">{demoStats.total_clicked} clics</p>
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
                  <p className="text-2xl font-bold text-gray-900">{demoStats.avg_delivery_rate}%</p>
                  <p className="text-xs text-gray-500">Démonstration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance simplifiée */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Demo</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'Envoyés', value: 1250, color: '#3B82F6' },
                { name: 'Livrés', value: 1198, color: '#10B981' },
                { name: 'Ouverts', value: 287, color: '#F59E0B' },
                { name: 'Cliqués', value: 52, color: '#EF4444' },
                { name: 'Bounced', value: 52, color: '#6B7280' }
              ].map((item, index) => (
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques de Performance</h3>
          <div className="space-y-4">
            {[
              { metric: 'Taux de livraison', rate: 95.84 },
              { metric: 'Taux d\'ouverture', rate: 22.96 },
              { metric: 'Taux de clic', rate: 4.16 },
              { metric: 'Taux de bounce', rate: 4.16 }
            ].map((item, index) => (
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
      )}
    </div>
  );
};

export default function Analytics() {
  const [activeView, setActiveView] = useState('demo');
  const [loading, setLoading] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="mt-2 text-gray-600">
                Analysez les performances de vos campagnes email
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveView('demo')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeView === 'demo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiActivity className="inline mr-2" size={14} />
                Démonstration
              </button>
            </div>
          </div>
        </div>

        {/* Contenu Demo */}
        {activeView === 'demo' && (
          <SimpleDemoAnalytics />
        )}
      </div>
    </Layout>
  );
}
