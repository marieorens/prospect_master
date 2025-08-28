const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { feedbackManager } = require('../services/feedbackManager');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'feedback-routes' },
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
 * GET /api/feedback/processes
 * Obtient tous les processus actifs
 */
router.get('/processes', (req, res) => {
  try {
    const activeProcesses = feedbackManager.getActiveProcesses();
    
    res.json({
      success: true,
      data: {
        activeProcesses,
        count: activeProcesses.length
      }
    });
  } catch (error) {
    logger.error('Error getting active processes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active processes'
    });
  }
});

/**
 * GET /api/feedback/processes/:processId
 * Obtient l'état d'un processus spécifique
 */
router.get('/processes/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const process = feedbackManager.getProcessStatus(processId);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        error: 'Process not found'
      });
    }

    res.json({
      success: true,
      data: process
    });
  } catch (error) {
    logger.error('Error getting process status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get process status'
    });
  }
});

/**
 * GET /api/feedback/history
 * Obtient l'historique des processus
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type; // Filtrer par type si spécifié
    
    let history = feedbackManager.getProcessHistory(limit);
    
    // Filtrer par type si spécifié
    if (type) {
      history = history.filter(p => p.type === type);
    }

    res.json({
      success: true,
      data: {
        processes: history,
        count: history.length
      }
    });
  } catch (error) {
    logger.error('Error getting process history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get process history'
    });
  }
});

/**
 * POST /api/feedback/processes/:processId/cancel
 * Annule un processus en cours
 */
router.post('/processes/:processId/cancel', (req, res) => {
  try {
    const { processId } = req.params;
    const process = feedbackManager.getProcessStatus(processId);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        error: 'Process not found'
      });
    }

    if (process.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Process is not running'
      });
    }

    // Marquer le processus comme annulé
    feedbackManager.completeProcess(processId, 'cancelled', 'Process cancelled by user');

    res.json({
      success: true,
      message: 'Process cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling process:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel process'
    });
  }
});

/**
 * GET /api/feedback/stats
 * Obtient les statistiques globales des processus
 */
router.get('/stats', (req, res) => {
  try {
    const activeProcesses = feedbackManager.getActiveProcesses();
    const history = feedbackManager.getProcessHistory(100);
    
    // Calculer les statistiques
    const stats = {
      active: {
        total: activeProcesses.length,
        byType: {},
        byStatus: {}
      },
      history: {
        total: history.length,
        completed: history.filter(p => p.status === 'completed').length,
        errors: history.filter(p => p.status === 'error').length,
        cancelled: history.filter(p => p.status === 'cancelled').length,
        byType: {},
        avgDuration: {}
      }
    };

    // Statistiques par type pour les processus actifs
    activeProcesses.forEach(p => {
      stats.active.byType[p.type] = (stats.active.byType[p.type] || 0) + 1;
      stats.active.byStatus[p.status] = (stats.active.byStatus[p.status] || 0) + 1;
    });

    // Statistiques par type pour l'historique
    history.forEach(p => {
      stats.history.byType[p.type] = (stats.history.byType[p.type] || 0) + 1;
      
      // Calculer durée moyenne par type
      if (p.totalDuration) {
        if (!stats.history.avgDuration[p.type]) {
          stats.history.avgDuration[p.type] = { total: 0, count: 0, avg: 0 };
        }
        stats.history.avgDuration[p.type].total += p.totalDuration;
        stats.history.avgDuration[p.type].count += 1;
        stats.history.avgDuration[p.type].avg = Math.round(
          stats.history.avgDuration[p.type].total / stats.history.avgDuration[p.type].count / 1000
        ); // en secondes
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback stats'
    });
  }
});

/**
 * Initialise le serveur WebSocket pour les mises à jour temps réel
 * @param {Object} server - Serveur HTTP Express
 */
function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws/feedback'
  });

  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    
    logger.info(`WebSocket connection established: ${clientId}`);
    
    // Enregistrer le client
    feedbackManager.registerClient(clientId, ws);

    // Gestion des messages du client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'subscribe':
            if (data.processId) {
              feedbackManager.subscribeToProcess(clientId, data.processId);
              ws.send(JSON.stringify({
                type: 'subscription_confirmed',
                processId: data.processId
              }));
            }
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
            
          default:
            logger.warn(`Unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
      }
    });

    // Gestion de la déconnexion
    ws.on('close', () => {
      feedbackManager.unregisterClient(clientId);
      logger.info(`WebSocket connection closed: ${clientId}`);
    });

    // Gestion des erreurs
    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      feedbackManager.unregisterClient(clientId);
    });

    // Heartbeat pour maintenir la connexion
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // Ping toutes les 30 secondes

    ws.on('pong', () => {
      // Client répond au ping - connexion active
    });
  });

  logger.info('WebSocket server initialized on /ws/feedback');
}

module.exports = {
  router,
  initializeWebSocket
};
