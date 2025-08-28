import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function TestCampaigns() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      console.log('Testing campaigns API...');
      
      // Test templates endpoint
      const templatesResponse = await fetch('/api/campaigns/templates');
      const templatesData = await templatesResponse.json();
      console.log('Templates response:', templatesData);
      
      if (templatesData.success) {
        setTemplates(templatesData.templates);
      }

      // Test campaigns endpoint
      const campaignsResponse = await fetch('/api/campaigns');
      const campaignsData = await campaignsResponse.json();
      console.log('Campaigns response:', campaignsData);
      
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns);
      }

    } catch (error) {
      console.error('API test error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test API Campagnes</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <Layout title="Test API Campagnes">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Test API Campagnes</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Erreur: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Templates */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Templates d'emails ({templates.length})</h2>
          <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
            {templates.length > 0 ? (
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{template.name}</h3>
                      {template.is_default && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sujet: {template.subject}
                    </p>
                    {template.variables && template.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <span key={variable} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun template trouvé</p>
            )}
          </div>
        </div>

        {/* Campaigns */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Campagnes ({campaigns.length})</h2>
          <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border-b pb-3 last:border-b-0">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Template: {campaign.template_name}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucune campagne trouvée</p>
            )}
          </div>
        </div>
      </div>

      {/* Test actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Actions de test</h2>
        <div className="flex space-x-4">
          <button
            onClick={testAPI}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Rafraîchir les données
          </button>
          <button
            onClick={() => window.location.href = '/campaigns'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Aller aux Campagnes
          </button>
          <button
            onClick={() => window.location.href = '/email-templates'}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Aller aux Templates
          </button>
        </div>
      </div>
      </div>
    </Layout>
  );
}
