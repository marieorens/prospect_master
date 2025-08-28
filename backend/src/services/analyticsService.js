const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const winston = require('winston');
const cacheService = require('./cacheService');

// Configure logger for analytics service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'analytics-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/analytics-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/analytics.log' })
  ]
});

class AnalyticsService {
  constructor() {
    this.dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite');
  }

  /**
   * Calcule les statistiques détaillées d'une campagne avec cache
   */
  async getCampaignAnalytics(campaignId) {
    // Essayer le cache d'abord
    const cached = cacheService.getAnalyticsCache(campaignId);
    if (cached) {
      logger.info(`Analytics cache hit for campaign ${campaignId}`);
      return cached;
    }

    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.created_at,
          c.started_at,
          c.total_recipients,
          c.send_rate_per_hour,
          et.name as template_name,
          COUNT(DISTINCT cr.id) as total_recipients_actual,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'sent' THEN ce.id END) as sent_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'delivered' THEN ce.id END) as delivered_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'opened' THEN ce.id END) as opened_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'clicked' THEN ce.id END) as clicked_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'bounced' THEN ce.id END) as bounced_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'failed' THEN ce.id END) as failed_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'unsubscribed' THEN ce.id END) as unsubscribed_count
        FROM campaigns c
        LEFT JOIN email_templates et ON c.template_id = et.id
        LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
        LEFT JOIN campaign_events ce ON cr.id = ce.recipient_id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      db.get(query, [campaignId], (err, row) => {
        if (err) {
          logger.error('Error fetching campaign analytics:', err);
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Campaign not found'));
          return;
        }
        
        // Calculer les taux de performance
        const analytics = {
          ...row,
          delivery_rate: row.sent_count > 0 ? (row.delivered_count / row.sent_count * 100).toFixed(2) : 0,
          open_rate: row.delivered_count > 0 ? (row.opened_count / row.delivered_count * 100).toFixed(2) : 0,
          click_rate: row.delivered_count > 0 ? (row.clicked_count / row.delivered_count * 100).toFixed(2) : 0,
          click_to_open_rate: row.opened_count > 0 ? (row.clicked_count / row.opened_count * 100).toFixed(2) : 0,
          bounce_rate: row.sent_count > 0 ? (row.bounced_count / row.sent_count * 100).toFixed(2) : 0,
          unsubscribe_rate: row.delivered_count > 0 ? (row.unsubscribed_count / row.delivered_count * 100).toFixed(2) : 0
        };
        
        // Mettre en cache les résultats
        cacheService.setAnalyticsCache(campaignId, analytics);
        logger.info(`Analytics cached for campaign ${campaignId}`);
        
        resolve(analytics);
      });
      
      db.close();
    });
  }

  /**
   * Récupère les événements d'une campagne avec timeline
   */
  async getCampaignTimeline(campaignId, limit = 100) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ce.id,
          ce.event_type,
          ce.event_data,
          ce.created_at,
          cr.domain_id,
          d.domain,
          e.email as recipient_email
        FROM campaign_events ce
        LEFT JOIN campaign_recipients cr ON ce.recipient_id = cr.id
        LEFT JOIN domains d ON cr.domain_id = d.id
        LEFT JOIN emails e ON cr.email_id = e.id
        WHERE ce.campaign_id = ?
        ORDER BY ce.created_at DESC
        LIMIT ?
      `;
      
      db.all(query, [campaignId, limit], (err, rows) => {
        if (err) {
          logger.error('Error fetching campaign timeline:', err);
          reject(err);
          return;
        }
        
        const timeline = rows.map(row => ({
          ...row,
          event_data: row.event_data ? JSON.parse(row.event_data) : null
        }));
        
        resolve(timeline);
      });
      
      db.close();
    });
  }

  /**
   * Génère un rapport de performance pour une période donnée
   */
  async getPerformanceReport(startDate, endDate) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          DATE(c.created_at) as date,
          COUNT(DISTINCT c.id) as campaigns_created,
          COUNT(DISTINCT CASE WHEN c.status = 'running' THEN c.id END) as campaigns_running,
          COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as campaigns_completed,
          SUM(c.total_recipients) as total_recipients,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'sent' THEN ce.id END) as total_sent,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'delivered' THEN ce.id END) as total_delivered,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'opened' THEN ce.id END) as total_opened,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'clicked' THEN ce.id END) as total_clicked
        FROM campaigns c
        LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
        LEFT JOIN campaign_events ce ON cr.id = ce.recipient_id
        WHERE DATE(c.created_at) BETWEEN ? AND ?
        GROUP BY DATE(c.created_at)
        ORDER BY date DESC
      `;
      
      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          logger.error('Error generating performance report:', err);
          reject(err);
          return;
        }
        
        const report = rows.map(row => ({
          ...row,
          delivery_rate: row.total_sent > 0 ? (row.total_delivered / row.total_sent * 100).toFixed(2) : 0,
          open_rate: row.total_delivered > 0 ? (row.total_opened / row.total_delivered * 100).toFixed(2) : 0,
          click_rate: row.total_delivered > 0 ? (row.total_clicked / row.total_delivered * 100).toFixed(2) : 0
        }));
        
        resolve(report);
      });
      
      db.close();
    });
  }

  /**
   * Compare les performances de plusieurs templates
   */
  async compareTemplatePerformance() {
    // Essayer le cache d'abord
    const cached = cacheService.get('template_performance', 'default');
    if (cached) {
      logger.info('Template performance cache hit');
      return cached;
    }

    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          et.id as template_id,
          et.name as template_name,
          et.category,
          COUNT(DISTINCT c.id) as campaigns_count,
          COUNT(DISTINCT cr.id) as total_recipients,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'sent' THEN ce.id END) as sent_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'delivered' THEN ce.id END) as delivered_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'opened' THEN ce.id END) as opened_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'clicked' THEN ce.id END) as clicked_count,
          AVG(CASE WHEN ce.event_type = 'opened' AND ce2.event_type = 'sent' 
              THEN (julianday(ce.created_at) - julianday(ce2.created_at)) * 24 END) as avg_time_to_open_hours
        FROM email_templates et
        LEFT JOIN campaigns c ON et.id = c.template_id
        LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
        LEFT JOIN campaign_events ce ON cr.id = ce.recipient_id
        LEFT JOIN campaign_events ce2 ON cr.id = ce2.recipient_id AND ce2.event_type = 'sent'
        WHERE c.id IS NOT NULL
        GROUP BY et.id
        HAVING sent_count > 0
        ORDER BY (opened_count * 1.0 / delivered_count) DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          logger.error('Error comparing template performance:', err);
          reject(err);
          return;
        }
        
        const comparison = rows.map(row => ({
          ...row,
          delivery_rate: row.sent_count > 0 ? (row.delivered_count / row.sent_count * 100).toFixed(2) : 0,
          open_rate: row.delivered_count > 0 ? (row.opened_count / row.delivered_count * 100).toFixed(2) : 0,
          click_rate: row.delivered_count > 0 ? (row.clicked_count / row.delivered_count * 100).toFixed(2) : 0,
          avg_time_to_open_hours: row.avg_time_to_open_hours ? parseFloat(row.avg_time_to_open_hours).toFixed(2) : null
        }));
        
        // Mettre en cache le résultat (5 minutes)
        cacheService.set('template_performance', comparison, 300, 'default');
        logger.info('Template performance cached');
        
        resolve(comparison);
      });
      
      db.close();
    });
  }

  /**
   * Analyse la segmentation des audiences
   */
  async getAudienceSegmentation(campaignId) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          CASE 
            WHEN CAST(d.traffic as INTEGER) < 1000 THEN 'Faible trafic (<1K)'
            WHEN CAST(d.traffic as INTEGER) < 10000 THEN 'Trafic moyen (1K-10K)'
            WHEN CAST(d.traffic as INTEGER) < 100000 THEN 'Trafic élevé (10K-100K)'
            ELSE 'Très fort trafic (>100K)'
          END as traffic_segment,
          COUNT(DISTINCT cr.id) as recipients_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'opened' THEN ce.id END) as opened_count,
          COUNT(DISTINCT CASE WHEN ce.event_type = 'clicked' THEN ce.id END) as clicked_count
        FROM campaign_recipients cr
        JOIN domains d ON cr.domain_id = d.id
        LEFT JOIN campaign_events ce ON cr.id = ce.recipient_id
        WHERE cr.campaign_id = ?
        GROUP BY traffic_segment
        ORDER BY MIN(CAST(d.traffic as INTEGER))
      `;
      
      db.all(query, [campaignId], (err, rows) => {
        if (err) {
          logger.error('Error analyzing audience segmentation:', err);
          reject(err);
          return;
        }
        
        const segmentation = rows.map(row => ({
          ...row,
          open_rate: row.recipients_count > 0 ? (row.opened_count / row.recipients_count * 100).toFixed(2) : 0,
          click_rate: row.recipients_count > 0 ? (row.clicked_count / row.recipients_count * 100).toFixed(2) : 0
        }));
        
        resolve(segmentation);
      });
      
      db.close();
    });
  }

  /**
   * Génère des métriques globales du système
   */
  async getGlobalMetrics() {
    // Essayer le cache d'abord
    const cached = cacheService.get('global_metrics', 'default');
    if (cached) {
      logger.info('Global metrics cache hit');
      return cached;
    }

    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const queries = {
        campaigns: `
          SELECT 
            COUNT(*) as total_campaigns,
            COUNT(CASE WHEN status = 'running' THEN 1 END) as running_campaigns,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns,
            COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_campaigns
          FROM campaigns
        `,
        emails: `
          SELECT 
            COUNT(DISTINCT ce.id) as total_events,
            COUNT(CASE WHEN ce.event_type = 'sent' THEN 1 END) as total_sent,
            COUNT(CASE WHEN ce.event_type = 'delivered' THEN 1 END) as total_delivered,
            COUNT(CASE WHEN ce.event_type = 'opened' THEN 1 END) as total_opened,
            COUNT(CASE WHEN ce.event_type = 'clicked' THEN 1 END) as total_clicked
          FROM campaign_events ce
        `,
        recipients: `
          SELECT 
            COUNT(DISTINCT cr.id) as total_recipients,
            COUNT(DISTINCT cr.domain_id) as unique_domains
          FROM campaign_recipients cr
        `
      };
      
      const results = {};
      const queryKeys = Object.keys(queries);
      let completed = 0;
      
      queryKeys.forEach(key => {
        db.get(queries[key], [], (err, row) => {
          if (err) {
            logger.error(`Error in global metrics query ${key}:`, err);
            reject(err);
            return;
          }
          
          results[key] = row;
          completed++;
          
          if (completed === queryKeys.length) {
            // Calculer les taux globaux
            const globalMetrics = {
              ...results,
              global_delivery_rate: results.emails.total_sent > 0 
                ? (results.emails.total_delivered / results.emails.total_sent * 100).toFixed(2) : 0,
              global_open_rate: results.emails.total_delivered > 0 
                ? (results.emails.total_opened / results.emails.total_delivered * 100).toFixed(2) : 0,
              global_click_rate: results.emails.total_delivered > 0 
                ? (results.emails.total_clicked / results.emails.total_delivered * 100).toFixed(2) : 0
            };
            
            // Mettre en cache les résultats (10 minutes)
            cacheService.set('global_metrics', globalMetrics, 600, 'default');
            logger.info('Global metrics cached');
            
            resolve(globalMetrics);
          }
        });
      });
      
      db.close();
    });
  }
}

module.exports = new AnalyticsService();
