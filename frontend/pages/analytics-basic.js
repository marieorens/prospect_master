import { useState } from 'react';
import Layout from '../components/Layout';

// Version ultra-simplifiée sans icônes externes
const BasicAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Données de test
  const stats = {
    totalEmails: 3750,
    openRate: 22.96,
    clickRate: 4.16,
    deliveryRate: 95.84
  };

  return (
    <div className="space-y-6">
      {/* Message d'information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900">Mode Démonstration</h3>
        <p className="text-sm text-blue-700 mt-1">
          Interface d'analytics avec données de test. Créez des campagnes pour voir vos vraies données.
        </p>
      </div>

      {/* Navigation simple */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance
          </button>
        </nav>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600">Total Emails</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmails}</p>
              <p className="text-xs text-gray-500">3 campagnes</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600">Taux d'Ouverture</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openRate}%</p>
              <p className="text-xs text-gray-500">861 ouvertures</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600">Taux de Clic</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clickRate}%</p>
              <p className="text-xs text-gray-500">156 clics</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600">Taux de Livraison</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
              <p className="text-xs text-gray-500">3594 livrés</p>
            </div>
          </div>

          {/* Graphique simple */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Campagne</h3>
            <div className="space-y-4">
              {[
                { name: 'Envoyés', value: 1250, max: 1250, color: 'bg-blue-500' },
                { name: 'Livrés', value: 1198, max: 1250, color: 'bg-green-500' },
                { name: 'Ouverts', value: 287, max: 1250, color: 'bg-yellow-500' },
                { name: 'Cliqués', value: 52, max: 1250, color: 'bg-red-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-20 text-sm text-gray-600">{item.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${item.color}`}
                      style={{ width: `${(item.value / item.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-sm font-semibold text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques Détaillées</h3>
          <div className="space-y-6">
            {[
              { metric: 'Taux de livraison', rate: 95.84, color: 'bg-green-500' },
              { metric: 'Taux d\'ouverture', rate: 22.96, color: 'bg-blue-500' },
              { metric: 'Taux de clic', rate: 4.16, color: 'bg-orange-500' },
              { metric: 'Taux de bounce', rate: 4.16, color: 'bg-red-500' }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">{item.metric}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${item.color}`}
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
  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête simple */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Analysez les performances de vos campagnes email
          </p>
        </div>

        {/* Contenu principal */}
        <BasicAnalytics />
      </div>
    </Layout>
  );
}
