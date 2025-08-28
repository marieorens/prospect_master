const sgMail = require('@sendgrid/mail');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const winston = require('winston');

// Configure logger for email service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

class EmailService {
  constructor() {
    this.dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite');
    this.isInitialized = false;
    this.queue = [];
    this.isProcessing = false;
    this.sendRate = 10; // emails per hour by default
    this.init();
  }

  async init() {
    try {
      // Initialize SendGrid
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        logger.warn('SENDGRID_API_KEY not found. Email sending will be simulated.');
        this.simulationMode = true;
      } else {
        sgMail.setApiKey(apiKey);
        this.simulationMode = false;
      }

      this.isInitialized = true;
      logger.info('Email service initialized', { simulationMode: this.simulationMode });
      
      // Start processing queue
      this.startQueueProcessor();
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Ajoute un email à la queue d'envoi
   */
  async queueEmail(campaignId, recipientId, templateData) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      // Récupérer les données de la campagne et du template
      const query = `
        SELECT 
          c.id as campaign_id,
          c.name as campaign_name,
          c.send_from_name,
          c.send_from_email,
          c.reply_to_email,
          c.send_rate_per_hour,
          et.subject,
          et.body,
          et.variables,
          cr.id as recipient_id,
          cr.custom_variables,
          d.domain,
          d.traffic,
          d.backlinks,
          d.keywords,
          e.email as recipient_email
        FROM campaigns c
        JOIN email_templates et ON c.template_id = et.id
        JOIN campaign_recipients cr ON c.id = cr.campaign_id
        JOIN domains d ON cr.domain_id = d.id
        JOIN emails e ON cr.email_id = e.id
        WHERE c.id = ? AND cr.id = ?
      `;
      
      db.get(query, [campaignId, recipientId], (err, row) => {
        if (err) {
          logger.error('Error fetching email data:', err);
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Campaign or recipient not found'));
          return;
        }
        
        try {
          // Parse variables
          const templateVariables = row.variables ? JSON.parse(row.variables) : [];
          const customVariables = row.custom_variables ? JSON.parse(row.custom_variables) : {};
          
          // Créer les données pour le template
          const emailData = {
            company_name: customVariables.company_name || row.domain,
            contact_name: customVariables.contact_name || 'Contact',
            domain: row.domain,
            traffic: row.traffic || '0',
            backlinks: row.backlinks || '0',
            keywords: row.keywords || '0',
            ...customVariables
          };
          
          // Remplacer les variables dans le sujet et le corps
          const subject = this.replaceVariables(row.subject, emailData);
          const body = this.replaceVariables(row.body, emailData);
          
          const emailJob = {
            id: Date.now() + Math.random(),
            campaignId: row.campaign_id,
            recipientId: row.recipient_id,
            to: row.recipient_email,
            from: {
              email: row.send_from_email,
              name: row.send_from_name
            },
            replyTo: row.reply_to_email || row.send_from_email,
            subject: subject,
            html: this.convertToHtml(body),
            text: body,
            sendRate: row.send_rate_per_hour || 10,
            createdAt: new Date(),
            status: 'queued'
          };
          
          this.queue.push(emailJob);
          this.sendRate = emailJob.sendRate;
          
          logger.info('Email queued', { 
            campaignId, 
            recipientId, 
            to: emailJob.to,
            queueSize: this.queue.length 
          });
          
          resolve(emailJob);
        } catch (parseError) {
          logger.error('Error preparing email data:', parseError);
          reject(parseError);
        }
      });
      
      db.close();
    });
  }

  /**
   * Remplace les variables dans le texte
   */
  replaceVariables(text, variables) {
    let result = text;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || `[${key}]`);
    });
    return result;
  }

  /**
   * Convertit le texte en HTML simple
   */
  convertToHtml(text) {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Démarre le processeur de queue
   */
  startQueueProcessor() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Traite la queue d'emails
   */
  async processQueue() {
    while (this.queue.length > 0) {
      const emailJob = this.queue.shift();
      
      try {
        await this.sendEmail(emailJob);
        await this.logEmailEvent(emailJob.campaignId, emailJob.recipientId, 'sent', 'Email sent successfully');
        
        // Respect du rate limiting (emails par heure)
        const delayMs = (60 * 60 * 1000) / this.sendRate; // Convert rate to delay in ms
        await this.sleep(delayMs);
        
      } catch (error) {
        logger.error('Failed to send email:', error, emailJob);
        await this.logEmailEvent(
          emailJob.campaignId, 
          emailJob.recipientId, 
          'failed', 
          error.message
        );
        
        // Retry logic - add back to queue with retry count
        if (!emailJob.retryCount) emailJob.retryCount = 0;
        if (emailJob.retryCount < 3) {
          emailJob.retryCount++;
          emailJob.status = 'retry';
          this.queue.push(emailJob);
          logger.info('Email queued for retry', { 
            campaignId: emailJob.campaignId,
            recipientId: emailJob.recipientId,
            retryCount: emailJob.retryCount 
          });
        }
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Envoie un email via SendGrid ou simulation
   */
  async sendEmail(emailJob) {
    if (this.simulationMode) {
      // Mode simulation pour développement
      logger.info('SIMULATION: Email would be sent', {
        to: emailJob.to,
        from: emailJob.from,
        subject: emailJob.subject,
        campaignId: emailJob.campaignId
      });
      
      // Simuler un délai d'envoi
      await this.sleep(1000);
      return { messageId: 'simulation-' + emailJob.id };
    }
    
    // Envoi réel via SendGrid
    const msg = {
      to: emailJob.to,
      from: emailJob.from,
      replyTo: emailJob.replyTo,
      subject: emailJob.subject,
      text: emailJob.text,
      html: emailJob.html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };
    
    const [response] = await sgMail.send(msg);
    logger.info('Email sent via SendGrid', {
      to: emailJob.to,
      messageId: response.headers['x-message-id'],
      campaignId: emailJob.campaignId
    });
    
    return response;
  }

  /**
   * Enregistre un événement d'email dans la base
   */
  async logEmailEvent(campaignId, recipientId, eventType, details) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO campaign_events (campaign_id, recipient_id, event_type, event_data, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(query, [
        campaignId,
        recipientId,
        eventType,
        JSON.stringify({ details, timestamp: new Date().toISOString() })
      ], function(err) {
        if (err) {
          logger.error('Failed to log email event:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      db.close();
    });
  }

  /**
   * Récupère les statistiques d'une campagne
   */
  async getCampaignStats(campaignId) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          event_type,
          COUNT(*) as count
        FROM campaign_events 
        WHERE campaign_id = ?
        GROUP BY event_type
      `;
      
      db.all(query, [campaignId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const stats = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            failed: 0
          };
          
          rows.forEach(row => {
            stats[row.event_type] = row.count;
          });
          
          resolve(stats);
        }
      });
      
      db.close();
    });
  }

  /**
   * Démarre l'envoi d'une campagne
   */
  async startCampaign(campaignId) {
    const db = new sqlite3.Database(this.dbFile);
    
    return new Promise((resolve, reject) => {
      // Récupérer tous les destinataires de la campagne
      const query = `
        SELECT id FROM campaign_recipients WHERE campaign_id = ?
      `;
      
      db.all(query, [campaignId], async (err, recipients) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          // Mettre à jour le statut de la campagne
          db.run(
            'UPDATE campaigns SET status = ?, started_at = datetime("now") WHERE id = ?',
            ['running', campaignId]
          );
          
          // Queue tous les emails
          const queuePromises = recipients.map(recipient => 
            this.queueEmail(campaignId, recipient.id)
          );
          
          await Promise.all(queuePromises);
          
          logger.info('Campaign started', { 
            campaignId, 
            recipientCount: recipients.length,
            queueSize: this.queue.length 
          });
          
          resolve({
            success: true,
            message: `Campagne démarrée avec ${recipients.length} destinataires`,
            recipientCount: recipients.length
          });
        } catch (error) {
          logger.error('Failed to start campaign:', error);
          reject(error);
        }
      });
      
      db.close();
    });
  }

  /**
   * Pause une campagne
   */
  async pauseCampaign(campaignId) {
    const db = new sqlite3.Database(this.dbFile);
    const self = this; // Sauvegarder le contexte
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE campaigns SET status = ? WHERE id = ?',
        ['paused', campaignId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // Supprimer les emails de cette campagne de la queue
            self.queue = self.queue.filter(job => job.campaignId !== campaignId);
            
            logger.info('Campaign paused', { campaignId });
            resolve({ success: true, message: 'Campagne mise en pause' });
          }
        }
      );
      
      db.close();
    });
  }

  /**
   * Utilitaire de sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Récupère l'état de la queue
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      sendRate: this.sendRate,
      simulationMode: this.simulationMode
    };
  }
}

// Export singleton instance
module.exports = new EmailService();
