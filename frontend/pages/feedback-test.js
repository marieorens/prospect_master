import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import RealTimeFeedback from '../components/RealTimeFeedback';
import { FaPlay, FaStop, FaRocket } from 'react-icons/fa';

export default function FeedbackTest() {
  const [activeProcess, setActiveProcess] = useState(null);
  const [testType, setTestType] = useState('semrush');
  const [loading, setLoading] = useState(false);

  const startTestProcess = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const testDomains = ['github.com', 'stackoverflow.com'];
      
      const response = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domains: testDomains,
          mode: 'sequential'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveProcess(data.processId);
      } else {
        console.error('Error starting test:', data.error);
        alert('Erreur: ' + (data.error || 'Impossible de démarrer le test'));
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Erreur: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleProcessComplete = (process) => {
    console.log('Process completed:', process);
    setTimeout(() => {
      setActiveProcess(null);
    }, 5000); // Garder visible 5 secondes après completion
  };

  const handleProcessError = (error) => {
    console.error('Process error:', error);
  };

  return (
    <Layout title="Test Feedback Temps Réel">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-3">
            <FaRocket className="text-indigo-600" />
            <span>Test du Système de Feedback</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Testez le système de feedback temps réel avec WebSocket
          </p>
        </div>

        {/* Contrôles de test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contrôles de Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de test
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={activeProcess}
              >
                <option value="semrush">Test SEMrush Scraping</option>
                <option value="google" disabled>Test Google Search (Bientôt disponible)</option>
                <option value="email" disabled>Test Email Campaign (Bientôt disponible)</option>
              </select>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={startTestProcess}
                disabled={loading || activeProcess}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading || activeProcess
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <FaPlay className="text-sm" />
                <span>
                  {loading ? 'Démarrage...' : 'Démarrer Test'}
                </span>
              </button>
              
              {activeProcess && (
                <button
                  onClick={() => setActiveProcess(null)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
                >
                  <FaStop className="text-sm" />
                  <span>Arrêter Suivi</span>
                </button>
              )}
            </div>
          </div>
          
          {testType === 'semrush' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800">Test SEMrush</h4>
              <p className="text-sm text-blue-700 mt-1">
                Ce test va scraper 2 domaines (github.com, stackoverflow.com) avec l'ancien système SEMrush 
                mais avec le nouveau système de feedback temps réel.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Note:</strong> Assurez-vous que les credentials SEMrush sont configurés dans le fichier .env
              </p>
            </div>
          )}
        </div>

        {/* Feedback en temps réel */}
        {activeProcess && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Suivi Temps Réel
            </h2>
            
            <RealTimeFeedback
              processId={activeProcess}
              onComplete={handleProcessComplete}
              onError={handleProcessError}
              showDetails={true}
              className="w-full"
            />
          </div>
        )}

        {/* Instructions */}
        {!activeProcess && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Instructions
            </h2>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <p>Sélectionnez le type de test que vous voulez effectuer</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <p>Cliquez sur "Démarrer Test" pour lancer le processus</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <p>Observez le feedback temps réel avec WebSocket (progression, étapes, erreurs, etc.)</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <p>Le processus se terminera automatiquement ou vous pouvez arrêter le suivi</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800">⚠️ Prérequis</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Le serveur backend doit être en cours d'exécution</li>
                <li>• WebSocket doit être activé (/ws/feedback)</li>
                <li>• Pour SEMrush: credentials configurés dans .env</li>
                <li>• Base de données initialisée</li>
              </ul>
            </div>
          </div>
        )}

        {/* État de la connexion WebSocket */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">
              Connexion WebSocket active
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
