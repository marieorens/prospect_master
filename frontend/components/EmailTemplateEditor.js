import { useState, useEffect } from 'react';
import { FiEdit3, FiTrash2, FiPlus, FiSave, FiX, FiEye, FiCode, FiFileText, FiMail } from 'react-icons/fi';

const EmailTemplateEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    variables: [],
    category: 'custom'
  });
  const [availableVariables] = useState([
    'company_name', 'contact_name', 'domain', 'traffic', 'backlinks', 'keywords'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/campaigns/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const url = selectedTemplate 
        ? `/api/campaigns/templates/${selectedTemplate.id}`
        : '/api/campaigns/templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(selectedTemplate ? 'Template mis à jour' : 'Template créé');
        setEditMode(false);
        fetchTemplates();
        resetForm();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Template supprimé');
        fetchTemplates();
        if (selectedTemplate && selectedTemplate.id === templateId) {
          resetForm();
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      body: '',
      variables: [],
      category: 'custom'
    });
    setSelectedTemplate(null);
    setEditMode(false);
    setPreviewMode(false);
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      subject: template.subject || '',
      body: template.body || '',
      variables: template.variables || [],
      category: template.category || 'custom'
    });
    setEditMode(false);
    setPreviewMode(false);
  };

  const addVariable = (varName) => {
    if (!formData.variables.includes(varName)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, varName]
      });
    }
  };

  const removeVariable = (varName) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== varName)
    });
  };

  const insertVariableIntoBody = (varName) => {
    const variable = `{{${varName}}}`;
    const textarea = document.getElementById('template-body');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = formData.body;
    
    const newBody = currentBody.substring(0, start) + variable + currentBody.substring(end);
    setFormData({ ...formData, body: newBody });
    
    // Refocus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const renderPreview = () => {
    let preview = formData.body;
    formData.variables.forEach(variable => {
      const placeholder = getVariablePlaceholder(variable);
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), placeholder);
    });
    return preview;
  };

  const getVariablePlaceholder = (variable) => {
    const placeholders = {
      company_name: 'Exemple Corp',
      contact_name: 'Jean Dupont',
      domain: 'exemple.com',
      traffic: '10,000',
      backlinks: '500',
      keywords: '250'
    };
    return placeholders[variable] || `[${variable}]`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Liste des templates */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Templates Email</h2>
            <button
              onClick={() => {
                resetForm();
                setEditMode(true);
              }}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="mr-1.5" size={14} />
              Nouveau
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto h-full pb-20">
          {loading && templates.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTemplate?.id === template.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => selectTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {template.name}
                        </h3>
                        {template.is_default && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            Défaut
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {template.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Sujet: {template.subject}
                      </p>
                    </div>
                    {!template.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Éditeur/Aperçu */}
      <div className="flex-1 flex flex-col">
        {selectedTemplate || editMode ? (
          <>
            {/* En-tête */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {editMode ? (selectedTemplate ? 'Modifier le template' : 'Nouveau template') : selectedTemplate?.name}
                  </h1>
                  {!editMode && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                          previewMode 
                            ? 'bg-gray-200 text-gray-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {previewMode ? <FiCode className="mr-1.5" size={14} /> : <FiEye className="mr-1.5" size={14} />}
                        {previewMode ? 'Code' : 'Aperçu'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <FiSave className="mr-1.5" size={14} />
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => {
                          if (selectedTemplate) {
                            selectTemplate(selectedTemplate);
                          } else {
                            resetForm();
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <FiX className="mr-1.5" size={14} />
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FiEdit3 className="mr-1.5" size={14} />
                      Modifier
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 flex overflow-hidden">
              {editMode ? (
                <div className="flex-1 flex">
                  {/* Formulaire d'édition */}
                  <div className="w-2/3 p-6 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Informations de base */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du template
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Email de prospection"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catégorie
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="custom">Personnalisé</option>
                            <option value="cold-email">Email à froid</option>
                            <option value="follow-up">Relance</option>
                            <option value="thank-you">Remerciement</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Description courte du template"
                        />
                      </div>

                      {/* Sujet */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sujet de l'email
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: Partenariat avec {{company_name}}"
                        />
                      </div>

                      {/* Corps de l'email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Corps de l'email
                        </label>
                        <textarea
                          id="template-body"
                          value={formData.body}
                          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          placeholder={`Bonjour {{contact_name}},

Je vous contacte concernant {{domain}}...`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variables */}
                  <div className="w-1/3 bg-gray-50 p-4 border-l border-gray-200 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Variables disponibles</h3>
                    
                    <div className="space-y-2 mb-6">
                      {availableVariables.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => insertVariableIntoBody(variable)}
                          className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="font-mono text-blue-600">{`{{${variable}}}`}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {getVariablePlaceholder(variable)}
                          </div>
                        </button>
                      ))}
                    </div>

                    {formData.variables.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Variables utilisées</h4>
                        <div className="space-y-1">
                          {formData.variables.map((variable) => (
                            <div key={variable} className="flex items-center justify-between px-2 py-1 bg-blue-50 rounded text-sm">
                              <span className="font-mono text-blue-600">{variable}</span>
                              <button
                                onClick={() => removeVariable(variable)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-6 overflow-y-auto">
                  {previewMode ? (
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* En-tête de l'email */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div>
                              <strong>De:</strong> Example Corp &lt;contact@example.com&gt;
                            </div>
                            <div>
                              <FiMail className="inline mr-1" />
                              Email de prospection
                            </div>
                          </div>
                          <div className="mt-2">
                            <strong className="text-gray-900">Sujet:</strong> {formData.subject.replace(/{{(\w+)}}/g, (match, variable) => getVariablePlaceholder(variable))}
                          </div>
                        </div>
                        
                        {/* Corps de l'email */}
                        <div className="p-6">
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                              {renderPreview()}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Nom</h3>
                            <p className="mt-1 text-lg text-gray-900">{selectedTemplate.name}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Catégorie</h3>
                            <p className="mt-1 text-lg text-gray-900">{selectedTemplate.category}</p>
                          </div>
                        </div>
                        
                        {selectedTemplate.description && (
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</h3>
                            <p className="mt-1 text-gray-900">{selectedTemplate.description}</p>
                          </div>
                        )}
                        
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sujet</h3>
                          <p className="mt-1 text-gray-900 font-mono bg-gray-50 p-3 rounded">{selectedTemplate.subject}</p>
                        </div>
                        
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Corps de l'email</h3>
                          <pre className="mt-1 text-gray-900 font-mono bg-gray-50 p-4 rounded whitespace-pre-wrap overflow-x-auto">
                            {selectedTemplate.body}
                          </pre>
                        </div>
                        
                        {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Variables</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedTemplate.variables.map((variable) => (
                                <span
                                  key={variable}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono"
                                >
                                  {`{{${variable}}}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun template sélectionné</h3>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez un template dans la liste ou créez-en un nouveau.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages de statut */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
            <FiX size={16} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">
            <FiX size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
