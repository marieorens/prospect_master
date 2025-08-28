import React from 'react';
import Layout from '../components/Layout';
import EmailTester from '../components/EmailTester';

export default function EmailTest() {
  return (
    <Layout title="Test d'Email">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Test du Système d'Email</h1>
            <p className="mt-2 text-lg text-gray-600">
              Testez l'envoi d'emails et vérifiez la configuration de votre système
            </p>
          </div>
          
          <EmailTester />
          
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Mode Simulation</h3>
                <p className="text-gray-600">
                  Si aucune clé SendGrid n'est configurée, le système fonctionne en mode simulation.
                  Les emails ne sont pas réellement envoyés mais toutes les opérations sont loggées.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Configuration SendGrid</h3>
                <p className="text-gray-600">
                  Pour l'envoi réel, configurez votre clé API SendGrid dans le fichier .env :
                  <code className="block mt-1 bg-gray-100 px-2 py-1 rounded">
                    SENDGRID_API_KEY=votre_clé_ici
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
