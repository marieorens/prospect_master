import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const ABTesting = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTests, setActiveTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Données demo pour les tests A/B
  const demoTests = [
    {
      id: 'ab_1703592000_test1',
      name: 'Test Sujet Email B2B',
      description: 'Comparaison entre sujet direct vs. sujet question',
      campaign_id: 1,
      status: 'active',
      split_percentage: 50,
      winning_criteria: 'open_rate',
      created_at: '2024-01-15T10:00:00Z',
      variant_count: 2,
      total_assignments: 250,
      variants: [
        {
          variant_name: 'A (Contrôle)',
          subject_line: 'Partenariat commercial - Opportunité',
          total_sent: 125,
          total_opened: 32,
          total_clicked: 6,
          open_rate: 25.6,
          click_rate: 4.8
        },
        {
          variant_name: 'B (Test)',
          subject_line: 'Puis-je vous proposer un partenariat ?',
          total_sent: 125,
          total_opened: 41,
          total_clicked: 9,
          open_rate: 32.8,
          click_rate: 7.2
        }
      ],
      winner: {
        variant_name: 'B (Test)',
        winning_metric: 'open_rate',
        winning_value: 32.8,
        improvement: 28.1
      }
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Charger les vrais tests depuis l'API
      const response = await fetch('http://localhost:4000/api/ab-testing/dashboard');
      if (response.ok) {
        const data = await response.json();
        setActiveTests(data.tests || demoTests);
      } else {
        // Fallback vers les données demo
        setActiveTests(demoTests);
      }
    } catch (error) {
      setError('Erreur lors du chargement des tests A/B');
      console.error('A/B Testing fetch error:', error);
      // Fallback vers les données demo
      setActiveTests(demoTests);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async (testData) => {
    try {
      setCreating(true);
      const response = await fetch('http://localhost:4000/api/ab-testing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateModal(false);
        await loadDashboardData(); // Recharger la liste
        return result;
      } else {
        throw new Error('Erreur lors de la création du test');
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const NewABTestModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      campaign_id: '1',
      split_percentage: 50,
      winning_criteria: 'open_rate',
      variants: [
        { name: 'Variante A (Contrôle)', subject_line: '', content: '' },
        { name: 'Variante B (Test)', subject_line: '', content: '' }
      ]
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await onSubmit(formData);
        setFormData({
          name: '',
          description: '',
          campaign_id: '1',
          split_percentage: 50,
          winning_criteria: 'open_rate',
          variants: [
            { name: 'Variante A (Contrôle)', subject_line: '', content: '' },
            { name: 'Variante B (Test)', subject_line: '', content: '' }
          ]
        });
      } catch (error) {
        alert('Erreur lors de la création du test: ' + error.message);
      }
    };

    const updateVariant = (index, field, value) => {
      const newVariants = [...formData.variants];
      newVariants[index][field] = value;
      setFormData({ ...formData, variants: newVariants });
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🧪 Nouveau Test A/B</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                disabled={loading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">📋 Informations du Test</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du test
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Test sujet email B2B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Décrivez l'objectif de ce test A/B"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Répartition (%)
                    </label>
                    <select
                      value={formData.split_percentage}
                      onChange={(e) => setFormData({ ...formData, split_percentage: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={50}>50% / 50%</option>
                      <option value={30}>70% / 30%</option>
                      <option value={20}>80% / 20%</option>
                      <option value={10}>90% / 10%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Critère de succès
                    </label>
                    <select
                      value={formData.winning_criteria}
                      onChange={(e) => setFormData({ ...formData, winning_criteria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open_rate">Taux d'ouverture</option>
                      <option value="click_rate">Taux de clic</option>
                      <option value="response_rate">Taux de réponse</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Variantes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">⚖️ Variantes du Test</h3>
                
                {formData.variants.map((variant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {variant.name}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ligne de sujet
                        </label>
                        <input
                          type="text"
                          required
                          value={variant.subject_line}
                          onChange={(e) => updateVariant(index, 'subject_line', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Saisissez la ligne de sujet"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contenu de l'email (optionnel)
                        </label>
                        <textarea
                          value={variant.content}
                          onChange={(e) => updateVariant(index, 'content', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contenu spécifique pour cette variante..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Créer le Test
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des tests A/B...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NewABTestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createTest}
        loading={creating}
      />
      
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🧪</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
                <p className="mt-2 text-gray-600">
                  Optimisez vos campagnes en testant différentes variantes d'emails
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Nouveau Test A/B
              </button>
            </div>
          </div>
        </div>

        {/* Message d'information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-xl mr-2">💡</div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Mode Démonstration</h3>
              <p className="text-sm text-blue-700 mt-1">
                Interface A/B Testing avec données de test. Les vraies fonctionnalités seront activées avec des campagnes réelles.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', emoji: '📊' },
              { id: 'active', name: 'Tests Actifs', emoji: '⚡' },
              { id: 'results', name: 'Résultats', emoji: '🏆' },
              { id: 'create', name: 'Créer Test', emoji: '➕' }
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
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🧪</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tests Actifs</p>
                    <p className="text-3xl font-bold text-gray-900">{activeTests.length}</p>
                    <p className="text-xs text-gray-500">En cours d'analyse</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👥</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assignations</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {activeTests.reduce((sum, test) => sum + test.total_assignments, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Destinataires testés</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📈</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Amélioration Moyenne</p>
                    <p className="text-3xl font-bold text-green-600">+28.1%</p>
                    <p className="text-xs text-gray-500">Taux d'ouverture</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tests en cours */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Tests en Cours</h2>
              {activeTests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">🧪</div>
                  <p>Aucun test A/B actif</p>
                  <p className="text-sm mt-2">Créez votre premier test pour optimiser vos campagnes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>📅 {new Date(test.created_at).toLocaleDateString()}</span>
                            <span>👥 {test.total_assignments} assignations</span>
                            <span>📊 {test.variant_count} variantes</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                            test.status === 'active' ? 'bg-green-100 text-green-800' :
                            test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {test.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tests actifs */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {activeTests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{test.name}</h3>
                    <p className="text-gray-600 mt-1">{test.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>🎯 Critère: {test.winning_criteria.replace('_', ' ')}</span>
                      <span>⚖️ Répartition: {test.split_percentage}%/{100-test.split_percentage}%</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    ⏹️ Arrêter Test
                  </button>
                </div>

                {/* Comparaison des variantes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {test.variants.map((variant, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${
                      variant.variant_name === test.winner?.variant_name ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{variant.variant_name}</h4>
                        {variant.variant_name === test.winner?.variant_name && (
                          <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">🏆 Gagnant</span>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 font-medium">Ligne de sujet:</p>
                        <p className="text-sm text-gray-900 italic">"{variant.subject_line}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{variant.open_rate}%</div>
                          <div className="text-xs text-gray-500">Taux d'ouverture</div>
                          <div className="text-xs text-gray-400">{variant.total_opened}/{variant.total_sent}</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">{variant.click_rate}%</div>
                          <div className="text-xs text-gray-500">Taux de clic</div>
                          <div className="text-xs text-gray-400">{variant.total_clicked}/{variant.total_sent}</div>
                        </div>
                      </div>

                      {variant.variant_name === test.winner?.variant_name && test.winner.improvement > 0 && (
                        <div className="mt-3 p-2 bg-green-100 rounded text-center">
                          <span className="text-sm font-semibold text-green-800">
                            +{test.winner.improvement}% d'amélioration
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recommandations */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">💡 Recommandations</h5>
                  {test.winner && test.winner.improvement > 15 ? (
                    <p className="text-sm text-blue-800">
                      Excellents résultats ! La variante "{test.winner.variant_name}" montre une amélioration significative de +{test.winner.improvement}%. 
                      Vous pouvez appliquer cette variante à toute la campagne.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-800">
                      Test en cours d'analyse. Attendez plus de données pour des résultats statistiquement significatifs.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Résultats */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Historique des Résultats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variante Gagnante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amélioration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Métrique</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échantillon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{test.name}</div>
                        <div className="text-sm text-gray-500">{new Date(test.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.winner && (
                          <span className="flex items-center">
                            <span className="mr-2">🏆</span>
                            {test.winner.variant_name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {test.winner && (
                          <span className="text-green-600 font-semibold">
                            +{test.winner.improvement}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.winning_criteria.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.total_assignments} emails
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          test.status === 'active' ? 'bg-green-100 text-green-800' :
                          test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Créer test */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">➕ Créer un Nouveau Test A/B</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-xl mr-2">🚧</div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Fonctionnalité en Développement</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    L'interface de création de tests A/B sera bientôt disponible. Pour l'instant, utilisez l'API directement.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📋 Étapes pour créer un test A/B :</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
                  <li>Sélectionner une campagne existante</li>
                  <li>Définir les variantes à tester (minimum 2)</li>
                  <li>Choisir le critère de succès (taux d'ouverture, clic, etc.)</li>
                  <li>Configurer la répartition du trafic</li>
                  <li>Lancer le test et analyser les résultats</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ABTesting;
