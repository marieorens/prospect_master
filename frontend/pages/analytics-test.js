import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiBarChart, FiActivity } from 'react-icons/fi';

// Composant de test simple
const SimpleAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiBarChart className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Analytics Test</h3>
            <p className="text-sm text-blue-700 mt-1">
              Cette page de test fonctionne correctement.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiActivity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Test Métrique</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-xs text-gray-500">Test unitaire</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [activeView, setActiveView] = useState('simple');
  const [loading, setLoading] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics - Version Test</h1>
              <p className="mt-2 text-gray-600">
                Version simplifiée pour tester les imports
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveView('simple')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeView === 'simple'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiActivity className="inline mr-2" size={14} />
                Test Simple
              </button>
            </div>
          </div>
        </div>

        {/* Contenu simple */}
        {activeView === 'simple' && (
          <SimpleAnalytics />
        )}
      </div>
    </Layout>
  );
}
