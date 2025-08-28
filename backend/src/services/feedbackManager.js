const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'feedback-manager' },
  transports: [
    new winston.transports.File({ filename: 'logs/feedback-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/feedback.log' })
  ]
});


if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Gestionnaire centralisé des feedbacks temps réel
 * Permet le suivi détaillé de chaque processus avec WebSockets
 */

class FeedbackManager {
  constructor() {
    // Stockage en mémoire des processus actifs
    this.activeProcesses = new Map();
    
    // WebSocket clients connectés
    this.clients = new Map();
    
    // Historique des processus (derniers 100)
    this.processHistory = [];
  }

  /**
   * Démarre un nouveau processus avec feedback
   * @param {string} type - Type de processus (semrush, google-search, email-campaign, etc.)
   * @param {string} description - Description du processus
   * @param {number} totalSteps - Nombre total d'étapes prévues
   * @param {Object} metadata - Métadonnées additionnelles
   * @returns {string} processId - ID unique du processus
   */
  startProcess(type, description, totalSteps = 100, metadata = {}) {
    const processId = uuidv4();
    const startTime = Date.now();
    
    const process = {
      id: processId,
      type,
      description,
      status: 'running',
      progress: 0,
      totalSteps,
      currentStep: 0,
      startTime,
      lastUpdate: startTime,
      steps: [],
      metadata,
      errors: [],
      warnings: []
    };

    this.activeProcesses.set(processId, process);
    
    // Log du démarrage
    logger.info(`Process started: ${type} - ${description}`, {
      processId,
      type,
      totalSteps,
      metadata
    });

    // Notification WebSocket
    this.broadcastUpdate(processId, {
      type: 'process_started',
      process: this.sanitizeProcess(process)
    });

    return processId;
  }

  /**
   * Met à jour le processus avec une nouvelle étape
   * @param {string} processId - ID du processus
   * @param {string} stepDescription - Description de l'étape actuelle
   * @param {number} currentStep - Numéro d'étape actuel (optionnel)
   * @param {Object} stepData - Données additionnelles de l'étape
   */
  updateStep(processId, stepDescription, currentStep = null, stepData = {}) {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      logger.warn(`Process not found: ${processId}`);
      return false;
    }

    const now = Date.now();
    const stepDuration = now - process.lastUpdate;
    
    // Mise à jour du processus
    if (currentStep !== null) {
      process.currentStep = currentStep;
      process.progress = Math.round((currentStep / process.totalSteps) * 100);
    } else {
      process.currentStep++;
      process.progress = Math.round((process.currentStep / process.totalSteps) * 100);
    }

    // Ajouter l'étape à l'historique
    const step = {
      stepNumber: process.currentStep,
      description: stepDescription,
      timestamp: now,
      duration: stepDuration,
      data: stepData
    };

    process.steps.push(step);
    process.lastUpdate = now;

    // Estimation du temps restant
    const avgStepDuration = process.steps.reduce((acc, s) => acc + s.duration, 0) / process.steps.length;
    const remainingSteps = process.totalSteps - process.currentStep;
    process.estimatedTimeRemaining = Math.round((avgStepDuration * remainingSteps) / 1000); // en secondes

    logger.info(`Process step: ${process.type} - ${stepDescription}`, {
      processId,
      step: process.currentStep,
      progress: process.progress,
      estimatedTimeRemaining: process.estimatedTimeRemaining
    });

    // Notification WebSocket
    this.broadcastUpdate(processId, {
      type: 'step_updated',
      process: this.sanitizeProcess(process),
      step
    });

    return true;
  }

  /**
   * Ajoute un warning au processus
   * @param {string} processId - ID du processus
   * @param {string} message - Message d'avertissement
   * @param {Object} details - Détails additionnels
   */
  addWarning(processId, message, details = {}) {
    const process = this.activeProcesses.get(processId);
    if (!process) return false;

    const warning = {
      timestamp: Date.now(),
      message,
      details
    };

    process.warnings.push(warning);

    logger.warn(`Process warning: ${process.type} - ${message}`, {
      processId,
      details
    });

    // Notification WebSocket
    this.broadcastUpdate(processId, {
      type: 'warning_added',
      processId,
      warning
    });

    return true;
  }

  /**
   * Ajoute une erreur au processus
   * @param {string} processId - ID du processus
   * @param {string} message - Message d'erreur
   * @param {Object} error - Objet d'erreur
   * @param {boolean} fatal - Si l'erreur est fatale (arrête le processus)
   */
  addError(processId, message, error = {}, fatal = false) {
    const process = this.activeProcesses.get(processId);
    if (!process) return false;

    const errorObj = {
      timestamp: Date.now(),
      message,
      error: {
        name: error.name || 'Unknown',
        message: error.message || message,
        stack: error.stack || null
      },
      fatal
    };

    process.errors.push(errorObj);

    if (fatal) {
      this.completeProcess(processId, 'error', `Fatal error: ${message}`);
    }

    logger.error(`Process error: ${process.type} - ${message}`, {
      processId,
      error: errorObj,
      fatal
    });

    // Notification WebSocket
    this.broadcastUpdate(processId, {
      type: 'error_added',
      processId,
      error: errorObj
    });

    return true;
  }

  /**
   * Termine un processus
   * @param {string} processId - ID du processus
   * @param {string} status - Statut final (completed, error, cancelled)
   * @param {string} message - Message de fin
   * @param {Object} results - Résultats du processus
   */
  completeProcess(processId, status = 'completed', message = '', results = {}) {
    const process = this.activeProcesses.get(processId);
    if (!process) return false;

    const endTime = Date.now();
    const totalDuration = endTime - process.startTime;

    // Mise à jour finale
    process.status = status;
    process.endTime = endTime;
    process.totalDuration = totalDuration;
    process.completionMessage = message;
    process.results = results;

    if (status === 'completed') {
      process.progress = 100;
    }

    logger.info(`Process completed: ${process.type} - ${status}`, {
      processId,
      status,
      totalDuration,
      totalSteps: process.steps.length,
      errors: process.errors.length,
      warnings: process.warnings.length
    });

    // Ajouter à l'historique
    this.processHistory.unshift(this.sanitizeProcess(process));
    
    // Garder seulement les 100 derniers processus
    if (this.processHistory.length > 100) {
      this.processHistory = this.processHistory.slice(0, 100);
    }

    // Notification WebSocket
    this.broadcastUpdate(processId, {
      type: 'process_completed',
      process: this.sanitizeProcess(process)
    });

    // Retirer des processus actifs après 5 minutes
    setTimeout(() => {
      this.activeProcesses.delete(processId);
    }, 5 * 60 * 1000);

    return true;
  }

  /**
   * Obtient l'état d'un processus
   * @param {string} processId - ID du processus
   * @returns {Object|null} - État du processus ou null si non trouvé
   */
  getProcessStatus(processId) {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      // Vérifier dans l'historique
      const historicalProcess = this.processHistory.find(p => p.id === processId);
      return historicalProcess || null;
    }

    return this.sanitizeProcess(process);
  }

  /**
   * Obtient tous les processus actifs
   * @returns {Array} - Liste des processus actifs
   */
  getActiveProcesses() {
    const processes = Array.from(this.activeProcesses.values());
    return processes.map(p => this.sanitizeProcess(p));
  }

  /**
   * Obtient l'historique des processus
   * @param {number} limit - Limite du nombre de processus à retourner
   * @returns {Array} - Historique des processus
   */
  getProcessHistory(limit = 50) {
    return this.processHistory.slice(0, limit);
  }

  /**
   * Enregistre un client WebSocket
   * @param {string} clientId - ID du client
   * @param {Object} ws - WebSocket connection
   */
  registerClient(clientId, ws) {
    this.clients.set(clientId, {
      ws,
      connectedAt: Date.now(),
      subscriptions: new Set() // Processus auxquels le client est abonné
    });

    logger.info(`WebSocket client connected: ${clientId}`);

    // Envoyer l'état actuel
    ws.send(JSON.stringify({
      type: 'initial_state',
      activeProcesses: this.getActiveProcesses(),
      processHistory: this.getProcessHistory(10)
    }));
  }

  /**
   * Désenregistre un client WebSocket
   * @param {string} clientId - ID du client
   */
  unregisterClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    }
  }

  /**
   * Abonne un client à un processus spécifique
   * @param {string} clientId - ID du client
   * @param {string} processId - ID du processus
   */
  subscribeToProcess(clientId, processId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.add(processId);
      logger.info(`Client ${clientId} subscribed to process ${processId}`);
    }
  }

  /**
   * Diffuse une mise à jour à tous les clients connectés
   * @param {string} processId - ID du processus
   * @param {Object} update - Mise à jour à diffuser
   */
  broadcastUpdate(processId, update) {
    const message = JSON.stringify({
      ...update,
      timestamp: Date.now()
    });

    this.clients.forEach((client, clientId) => {
      try {
        // Vérifier si le client est abonné à ce processus ou à tous
        if (client.subscriptions.size === 0 || client.subscriptions.has(processId)) {
          client.ws.send(message);
        }
      } catch (error) {
        logger.error(`Failed to send WebSocket message to client ${clientId}:`, error);
        // Retirer le client défaillant
        this.unregisterClient(clientId);
      }
    });
  }

  /**
   * Nettoie les données du processus pour l'envoi au client
   * @param {Object} process - Processus à nettoyer
   * @returns {Object} - Processus nettoyé
   */
  sanitizeProcess(process) {
    return {
      id: process.id,
      type: process.type,
      description: process.description,
      status: process.status,
      progress: process.progress,
      currentStep: process.currentStep,
      totalSteps: process.totalSteps,
      startTime: process.startTime,
      endTime: process.endTime,
      totalDuration: process.totalDuration,
      estimatedTimeRemaining: process.estimatedTimeRemaining,
      completionMessage: process.completionMessage,
      metadata: process.metadata,
      results: process.results,
      errors: process.errors,
      warnings: process.warnings,
      recentSteps: process.steps.slice(-5) // Dernières 5 étapes seulement
    };
  }

  /**
   * Nettoie les processus anciens (plus de 24h)
   */
  cleanup() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Nettoyer les processus actifs anciens
    this.activeProcesses.forEach((process, processId) => {
      if (process.startTime < oneDayAgo) {
        this.activeProcesses.delete(processId);
        logger.info(`Cleaned up old active process: ${processId}`);
      }
    });

    // Nettoyer l'historique ancien
    this.processHistory = this.processHistory.filter(p => p.startTime >= oneDayAgo);
  }
}

// Instance singleton
const feedbackManager = new FeedbackManager();

// Nettoyage automatique toutes les heures
setInterval(() => {
  feedbackManager.cleanup();
}, 60 * 60 * 1000);

module.exports = {
  FeedbackManager,
  feedbackManager
};
