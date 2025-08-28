import { useState, useEffect } from 'react';
import { FiMail, FiUsers, FiCalendar, FiPlay, FiPause, FiSettings, FiEye, FiTarget, FiFilter } from 'react-icons/fi';

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      setError('Erreur lors du chargement des campagnes');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/campaigns/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates');
    }
  };

  const startCampaign = async (campaignId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/send-campaign/${campaignId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        fetchCampaigns(); // Refresh campaigns
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors du lancement de la campagne');
    } finally {
      setLoading(false);
    }
  };

  const pauseCampaign = async (campaignId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/pause-campaign/${campaignId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        fetchCampaigns(); // Refresh campaigns
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la pause de la campagne');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planifiée' },
      running: { bg: 'bg-green-100', text: 'text-green-800', label: 'En cours' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En pause' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Terminée' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' }
    };

    const badge = badges[status] || badges.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const CampaignCard = ({ campaign }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900 truncate">{campaign.name}</h3>
              <div className="ml-3">
                {getStatusBadge(campaign.status)}
              </div>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
            )}
          </div>
          <button
            onClick={() => setSelectedCampaign(campaign)}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiEye size={20} />
          </button>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-500 space-x-6">
          <div className="flex items-center">
            <FiMail className="mr-1" size={14} />
            <span>{campaign.template_name || 'Sans template'}</span>
          </div>
          <div className="flex items-center">
            <FiUsers className="mr-1" size={14} />
            <span>{campaign.total_recipients || 0} destinataires</span>
          </div>
          <div className="flex items-center">
            <FiCalendar className="mr-1" size={14} />
            <span>
              {campaign.scheduled_at 
                ? new Date(campaign.scheduled_at).toLocaleDateString()
                : 'Non planifiée'
              }
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <span>Créée le {new Date(campaign.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            {campaign.status === 'draft' && (
              <button 
                onClick={() => startCampaign(campaign.id)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiPlay className="mr-1" size={12} />
                Lancer
              </button>
            )}
            {campaign.status === 'running' && (
              <button 
                onClick={() => pauseCampaign(campaign.id)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                <FiPause className="mr-1" size={12} />
                Pause
              </button>
            )}
            <button className="inline-flex items-center px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
              <FiSettings className="mr-1" size={12} />
              Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campagnes Email</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gérez vos campagnes d'emailing et suivez leurs performances
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiMail className="mr-2" size={16} />
              Nouvelle campagne
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiMail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campagnes actives</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'running').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiUsers className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total destinataires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTarget className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails envoyés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCalendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Planifiées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FiFilter className="mr-2 text-gray-400" size={16} />
                <span className="text-sm font-medium text-gray-700">Filtrer par:</span>
              </div>
              <select className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="scheduled">Planifiée</option>
                <option value="running">En cours</option>
                <option value="paused">En pause</option>
                <option value="completed">Terminée</option>
              </select>
              <select className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous les templates</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Liste des campagnes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Chargement des campagnes...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <FiMail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune campagne</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première campagne d'emailing.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiMail className="mr-2" size={16} />
                Créer une campagne
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de création de campagne */}
      {showCreateModal && (
        <CreateCampaignModal
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCampaigns();
            setSuccess('Campagne créée avec succès');
          }}
        />
      )}

      {/* Modal de détails de campagne */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}

      {/* Messages de statut */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}
      
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}
    </div>
  );
};

// Modal pour créer une nouvelle campagne
const CreateCampaignModal = ({ templates, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    send_from_name: '',
    send_from_email: '',
    reply_to_email: '',
    scheduled_at: '',
    send_rate_per_hour: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.template_id || !formData.send_from_email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la création de la campagne');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Créer une nouvelle campagne</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la campagne *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Prospection Q1 2024"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description de la campagne..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template d'email *
              </label>
              <select
                required
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'expéditeur *
              </label>
              <input
                type="text"
                required
                value={formData.send_from_name}
                onChange={(e) => setFormData({ ...formData, send_from_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email expéditeur *
              </label>
              <input
                type="email"
                required
                value={formData.send_from_email}
                onChange={(e) => setFormData({ ...formData, send_from_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de réponse
              </label>
              <input
                type="email"
                value={formData.reply_to_email}
                onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="reponse@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planifier l'envoi
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Laisser vide pour un envoi immédiat
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vitesse d'envoi (emails/heure)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.send_rate_per_hour}
                onChange={(e) => setFormData({ ...formData, send_rate_per_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Recommandé: 10-20 emails/heure pour éviter le spam
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal pour afficher les détails d'une campagne
const CampaignDetailsModal = ({ campaign, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{campaign.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Contenu détaillé de la campagne */}
          <p className="text-gray-600">
            Détails de la campagne à implémenter...
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;
