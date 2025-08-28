const express = require('express');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/notifications
 * Récupère toutes les notifications
 */
router.get('/', (req, res) => {
  try {
    const {
      unreadOnly = false,
      limit = 50,
      offset = 0,
      type = null,
      severity = null
    } = req.query;

    const options = {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      severity
    };

    const result = notificationService.getAllNotifications(options);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Crée une nouvelle notification
 */
router.post('/', (req, res) => {
  try {
    const { type, title, message, severity = 'info', data = {} } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let notification;
    switch (type) {
      case 'success':
        notification = notificationService.success(title, message, data);
        break;
      case 'error':
        notification = notificationService.error(title, message, data);
        break;
      case 'warning':
        notification = notificationService.warning(title, message, data);
        break;
      case 'info':
      default:
        notification = notificationService.info(title, message, data);
        break;
    }

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marque une notification comme lue
 */
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const success = notificationService.markAsRead(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marque toutes les notifications comme lues
 */
router.put('/read-all', (req, res) => {
  try {
    const count = notificationService.markAllAsRead();
    
    res.json({
      success: true,
      message: `${count} notifications marquées comme lues`,
      count
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des notifications',
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Supprime une notification
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = notificationService.dismissNotification(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notification supprimée'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la notification',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/stats
 * Statistiques des notifications
 */
router.get('/stats', (req, res) => {
  try {
    const stats = notificationService.getStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/test/:type
 * Crée une notification de test
 */
router.post('/test/:type', (req, res) => {
  try {
    const { type } = req.params;
    let notification;

    switch (type) {
      case 'scraping-completed':
        notification = notificationService.scrapingCompleted(10, 45, ['domain1.com']);
        break;
      case 'campaign-sent':
        notification = notificationService.campaignSent('Test Campaign', 100, 95.5);
        break;
      case 'export-ready':
        notification = notificationService.exportReady('export_2024.xlsx', 250, '/downloads/export_2024.xlsx');
        break;
      case 'system-error':
        notification = notificationService.systemError('Database', new Error('Connection timeout'), { query: 'SELECT * FROM domains' });
        break;
      case 'high-memory':
        notificationService.checkAlerts({ memoryUsage: 600 * 1024 * 1024 });
        notification = { message: 'Alert check triggered' };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de test invalide',
          validTypes: ['scraping-completed', 'campaign-sent', 'export-ready', 'system-error', 'high-memory']
        });
    }

    res.json({
      success: true,
      data: notification,
      message: `Notification de test ${type} créée`
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification de test',
      error: error.message
    });
  }
});

module.exports = router;
