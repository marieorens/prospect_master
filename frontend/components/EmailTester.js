import { useState } from 'react';
import { FiMail, FiSend, FiCheck, FiX, FiActivity } from 'react-icons/fi';

const EmailTester = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Email - PROSPECTION',
    body: `Bonjour,

Ceci est un email de test du système PROSPECTION.

Si vous recevez ce message, cela signifie que la configuration d'envoi fonctionne correctement.

Cordialement,
L'équipe PROSPECTION`,
    from_name: 'PROSPECTION Test',
    from_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);

  const sendTestEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Essayer d'abord l'API de simulation
      const simulateResponse = await fetch('/api/email-test/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          from: formData.from_email
        })
      });

      if (simulateResponse.ok) {
        const simulateData = await simulateResponse.json();
        setResult({
          success: true,
          message: simulateData.message + ' (Mode simulation - vérifiez les logs du backend)'
        });
        return;
      }

      // Si la simulation échoue, essayer l'API principale
      const response = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Erreur de connexion au serveur: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkQueueStatus = async () => {
    try {
      // Essayer d'abord l'API de test simple
      const testResponse = await fetch('/api/email-test/status');
      const testData = await testResponse.json();
      console.log('Test API response:', testData);
      
      // Puis essayer l'API principale
      const response = await fetch('/api/email/queue-status');
      const data = await response.json();
      setQueueStatus(data);
    } catch (error) {
      console.error('Erreur lors de la vérification de la queue:', error);
      // Fallback avec données de test
      setQueueStatus({
        queueSize: 0,
        isProcessing: false,
        simulationMode: true,
        error: 'Service non disponible'
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <FiMail className="mr-3 text-blue-600" size={20} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Test d'Envoi d'Email</h2>
            <p className="text-sm text-gray-600">
              Testez votre configuration d'envoi d'emails
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={sendTestEmail} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email destinataire *
            </label>
            <input
              type="email"
              required
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="test@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email expéditeur *
            </label>
            <input
              type="email"
              required
              value={formData.from_email}
              onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="contact@votre-domaine.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom expéditeur
            </label>
            <input
              type="text"
              value={formData.from_name}
              onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Votre nom"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={checkQueueStatus}
              className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <FiActivity className="mr-2" size={14} />
              État de la Queue
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sujet *
          </label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Sujet de l'email de test"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corps de l'email *
          </label>
          <textarea
            required
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Contenu de l'email..."
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {queueStatus && (
              <div className="flex items-center space-x-4">
                <span>Queue: {queueStatus.queueSize} emails</span>
                <span>Mode: {queueStatus.simulationMode ? 'Simulation' : 'Réel'}</span>
                <span className={`inline-flex items-center ${
                  queueStatus.isProcessing ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {queueStatus.isProcessing ? 'En cours' : 'Arrêté'}
                </span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FiSend className="mr-2" size={14} />
            )}
            Envoyer Test
          </button>
        </div>

        {/* Résultat */}
        {result && (
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {result.success ? (
                <FiCheck className="mt-0.5 mr-2 text-green-600 flex-shrink-0" size={16} />
              ) : (
                <FiX className="mt-0.5 mr-2 text-red-600 flex-shrink-0" size={16} />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Succès' : 'Erreur'}
                </p>
                <p className={`text-sm mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message || result.error}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EmailTester;
