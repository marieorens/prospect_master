const EventEmitter = require('events');
const winston = require('winston');

// Configure logger for notification service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'notification-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/notifications-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/notifications.log' })
  ]
});

/**
 * Service de notifications et alertes pour le système
 */
class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.notifications = new Map(); // Stockage des notifications actives
    this.alertRules = new Map();   // Règles d'alertes configurées
    this.subscribers = new Map();  // Abonnés aux notifications
    this.stats = {
      sent: 0,
      failed: 0,
      alerts_triggered: 0
    };

    // Initialiser les règles par défaut
    this.initializeDefaultAlerts();
  }

  /**
   * Initialise les règles d'alerte par défaut
   */
  initializeDefaultAlerts() {
    // Alerte haute utilisation mémoire
    this.addAlertRule('high_memory', {
      condition: (data) => data.memoryUsage > 500 * 1024 * 1024, // > 500MB
      severity: 'warning',
      title: 'Utilisation mémoire élevée',
      message: 'L\'utilisation mémoire dépasse 500MB',
      cooldown: 300 // 5 minutes
    });

    // Alerte faible taux de hit cache
    this.addAlertRule('low_cache_hit', {
      condition: (data) => data.hitRatio < 0.3 && data.totalRequests > 50,
      severity: 'warning',
      title: 'Taux de hit cache faible',
      message: 'Le taux de hit du cache est inférieur à 30%',
      cooldown: 600 // 10 minutes
    });

    // Alerte échec de scraping
    this.addAlertRule('scraping_failure', {
      condition: (data) => data.errorRate > 0.5,
      severity: 'error',
      title: 'Échecs de scraping fréquents',
      message: 'Plus de 50% des tentatives de scraping échouent',
      cooldown: 300
    });

    // Alerte processus long
    this.addAlertRule('long_process', {
      condition: (data) => data.duration > 600, // > 10 minutes
      severity: 'info',
      title: 'Processus de longue durée',
      message: 'Un processus s\'exécute depuis plus de 10 minutes',
      cooldown: 1800 // 30 minutes
    });

    logger.info('Default alert rules initialized');
  }

  /**
   * Génère un ID unique pour une notification
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée une notification
   * @param {Object} notification - Données de la notification
   */
  createNotification(notification) {
    const id = this.generateNotificationId();
    const timestamp = new Date().toISOString();
    
    const fullNotification = {
      id,
      timestamp,
      read: false,
      dismissed: false,
      ...notification
    };

    this.notifications.set(id, fullNotification);
    
    // Émettre l'événement
    this.emit('notification_created', fullNotification);
    
    // Log
    logger.info(`Notification created: ${notification.title}`, {
      notificationId: id,
      type: notification.type,
      severity: notification.severity
    });

    this.stats.sent++;
    return fullNotification;
  }

  /**
   * Notifications par type
   */
  
  // Notification de succès
  success(title, message, data = {}) {
    return this.createNotification({
      type: 'success',
      severity: 'info',
      title,
      message,
      icon: '✅',
      color: 'green',
      ...data
    });
  }

  // Notification d'erreur
  error(title, message, data = {}) {
    return this.createNotification({
      type: 'error',
      severity: 'error',
      title,
      message,
      icon: '❌',
      color: 'red',
      persistent: true, // Les erreurs persistent jusqu'à être lues
      ...data
    });
  }

  // Notification d'avertissement
  warning(title, message, data = {}) {
    return this.createNotification({
      type: 'warning',
      severity: 'warning',
      title,
      message,
      icon: '⚠️',
      color: 'yellow',
      ...data
    });
  }

  // Notification d'information
  info(title, message, data = {}) {
    return this.createNotification({
      type: 'info',
      severity: 'info',
      title,
      message,
      icon: 'ℹ️',
      color: 'blue',
      ...data
    });
  }

  // Notification de processus terminé
  processCompleted(processType, results, data = {}) {
    let icon = '🎉';
    let title = 'Processus terminé';
    
    switch (processType) {
      case 'scraping':
        icon = '🕷️';
        title = 'Scraping terminé';
        break;
      case 'email_campaign':
        icon = '📧';
        title = 'Campagne email envoyée';
        break;
      case 'export':
        icon = '📊';
        title = 'Export terminé';
        break;
    }

    return this.success(title, `Processus ${processType} terminé avec succès`, {
      icon,
      processType,
      results,
      actionButton: data.downloadUrl ? {
        label: 'Télécharger',
        url: data.downloadUrl
      } : null,
      ...data
    });
  }

  /**
   * Gestion des alertes automatiques
   */
  
  // Ajoute une règle d'alerte
  addAlertRule(name, rule) {
    this.alertRules.set(name, {
      ...rule,
      lastTriggered: 0 // Timestamp de dernière activation
    });
    logger.info(`Alert rule added: ${name}`);
  }

  // Supprime une règle d'alerte
  removeAlertRule(name) {
    this.alertRules.delete(name);
    logger.info(`Alert rule removed: ${name}`);
  }

  // Vérifie les alertes avec des données
  checkAlerts(data) {
    const now = Date.now();
    
    for (const [name, rule] of this.alertRules) {
      try {
        // Vérifier si la condition est remplie
        if (rule.condition(data)) {
          // Vérifier le cooldown
          const timeSinceLastTrigger = now - rule.lastTriggered;
          if (timeSinceLastTrigger >= (rule.cooldown * 1000)) {
            // Déclencher l'alerte
            this.triggerAlert(name, rule, data);
            rule.lastTriggered = now;
            this.stats.alerts_triggered++;
          }
        }
      } catch (error) {
        logger.error(`Error checking alert rule ${name}:`, error);
      }
    }
  }

  // Déclenche une alerte
  triggerAlert(ruleName, rule, data) {
    const notification = this.createNotification({
      type: 'alert',
      severity: rule.severity,
      title: rule.title,
      message: typeof rule.message === 'function' ? rule.message(data) : rule.message,
      icon: rule.severity === 'error' ? '🚨' : rule.severity === 'warning' ? '⚠️' : 'ℹ️',
      color: rule.severity === 'error' ? 'red' : rule.severity === 'warning' ? 'yellow' : 'blue',
      persistent: rule.severity === 'error',
      ruleName,
      alertData: data
    });

    logger.warn(`Alert triggered: ${ruleName}`, {
      notificationId: notification.id,
      severity: rule.severity,
      data
    });

    this.emit('alert_triggered', { ruleName, rule, data, notification });
  }

  /**
   * Gestion des notifications
   */
  
  // Récupère toutes les notifications
  getAllNotifications(options = {}) {
    const {
      unreadOnly = false,
      limit = 50,
      offset = 0,
      type = null,
      severity = null
    } = options;

    let notifications = Array.from(this.notifications.values());

    // Filtres
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    if (severity) {
      notifications = notifications.filter(n => n.severity === severity);
    }

    // Tri par timestamp décroissant
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const total = notifications.length;
    notifications = notifications.slice(offset, offset + limit);

    return {
      notifications,
      total,
      unread: Array.from(this.notifications.values()).filter(n => !n.read).length
    };
  }

  // Marque une notification comme lue
  markAsRead(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.emit('notification_read', notification);
      return true;
    }
    return false;
  }

  // Marque toutes les notifications comme lues
  markAllAsRead() {
    let count = 0;
    for (const notification of this.notifications.values()) {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    }
    this.emit('all_notifications_read', count);
    return count;
  }

  // Supprime une notification
  dismissNotification(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.dismissed = true;
      this.notifications.delete(notificationId);
      this.emit('notification_dismissed', notification);
      return true;
    }
    return false;
  }

  // Nettoie les anciennes notifications
  cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24h par défaut
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, notification] of this.notifications) {
      const age = now - new Date(notification.timestamp).getTime();
      if (age > maxAge && !notification.persistent && notification.read) {
        this.notifications.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} old notifications`);
    }

    return cleaned;
  }

  /**
   * Notifications métier spécifiques
   */
  
  // Scraping terminé
  scrapingCompleted(domainsProcessed, emailsFound, errors = []) {
    return this.processCompleted('scraping', {
      domainsProcessed,
      emailsFound,
      errors: errors.length,
      successRate: ((domainsProcessed - errors.length) / domainsProcessed * 100).toFixed(1) + '%'
    }, {
      message: `${domainsProcessed} domaines traités, ${emailsFound} emails trouvés`
    });
  }

  // Campagne email envoyée
  campaignSent(campaignName, totalSent, deliveryRate) {
    return this.processCompleted('email_campaign', {
      campaignName,
      totalSent,
      deliveryRate
    }, {
      message: `Campagne "${campaignName}" envoyée à ${totalSent} destinataires (${deliveryRate}% de livraison)`
    });
  }

  // Export Excel généré
  exportReady(filename, recordCount, downloadUrl) {
    return this.processCompleted('export', {
      filename,
      recordCount
    }, {
      message: `Export Excel prêt: ${recordCount} enregistrements`,
      downloadUrl,
      actionButton: {
        label: 'Télécharger',
        url: downloadUrl
      }
    });
  }

  // Erreur critique système
  systemError(component, error, context = {}) {
    return this.error(
      `Erreur système - ${component}`,
      `Une erreur critique s'est produite: ${error.message}`,
      {
        component,
        error: error.stack,
        context,
        persistent: true,
        actionButton: {
          label: 'Voir les logs',
          url: '/performance'
        }
      }
    );
  }

  /**
   * Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      totalNotifications: this.notifications.size,
      unreadCount: Array.from(this.notifications.values()).filter(n => !n.read).length,
      alertRules: this.alertRules.size,
      activeAlerts: Array.from(this.notifications.values()).filter(n => n.type === 'alert' && !n.read).length
    };
  }
}

// Instance singleton
const notificationService = new NotificationService();

// Nettoyage automatique toutes les heures
setInterval(() => {
  notificationService.cleanup();
}, 60 * 60 * 1000);
module.exports = notificationService;