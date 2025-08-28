const express = require('express');
const emailService = require('../services/emailService');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite');

/**
 * POST /api/email/send-campaign/:id
 * Démarre l'envoi d'une campagne
 */
router.post('/send-campaign/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await emailService.startCampaign(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage de la campagne'
    });
  }
});

/**
 * POST /api/email/pause-campaign/:id  
 * Met en pause une campagne
 */
router.post('/pause-campaign/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await emailService.pauseCampaign(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise en pause de la campagne'
    });
  }
});

/**
 * GET /api/email/campaign-stats/:id
 * Récupère les statistiques d'une campagne
 */
router.get('/campaign-stats/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const stats = await emailService.getCampaignStats(parseInt(id));
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/email/queue-status
 * Récupère l'état de la queue d'emails
 */
router.get('/queue-status', (req, res) => {
  const status = emailService.getQueueStatus();
  res.json({ success: true, ...status });
});

/**
 * POST /api/email/test-send
 * Envoie un email de test
 */
router.post('/test-send', async (req, res) => {
  const { to, subject, body, from_name, from_email } = req.body;
  
  if (!to || !subject || !body || !from_email) {
    return res.status(400).json({
      success: false,
      error: 'Destinataire, sujet, corps et expéditeur requis'
    });
  }
  
  try {
    // Créer un job de test
    const testJob = {
      id: 'test-' + Date.now(),
      campaignId: 0,
      recipientId: 0,
      to: to,
      from: {
        email: from_email,
        name: from_name || 'Test'
      },
      replyTo: from_email,
      subject: subject,
      html: emailService.convertToHtml(body),
      text: body,
      createdAt: new Date(),
      status: 'test'
    };
    
    await emailService.sendEmail(testJob);
    
    res.json({
      success: true,
      message: emailService.simulationMode 
        ? 'Email de test simulé avec succès' 
        : 'Email de test envoyé avec succès'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email de test'
    });
  }
});

/**
 * GET /api/email/campaign-events/:id
 * Récupère les événements d'une campagne
 */
router.get('/campaign-events/:id', (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  const db = new sqlite3.Database(dbFile);
  
  const query = `
    SELECT 
      ce.*,
      cr.domain_id,
      d.domain,
      e.email as recipient_email
    FROM campaign_events ce
    LEFT JOIN campaign_recipients cr ON ce.recipient_id = cr.id
    LEFT JOIN domains d ON cr.domain_id = d.id  
    LEFT JOIN emails e ON cr.email_id = e.id
    WHERE ce.campaign_id = ?
    ORDER BY ce.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [id, limit, offset], (err, events) => {
    if (err) {
      console.error('Error fetching campaign events:', err);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des événements'
      });
    }
    
    // Parse JSON event_data
    const parsedEvents = events.map(event => ({
      ...event,
      event_data: event.event_data ? JSON.parse(event.event_data) : null
    }));
    
    res.json({ success: true, events: parsedEvents });
  });
  
  db.close();
});

/**
 * POST /api/email/webhook/sendgrid
 * Webhook pour recevoir les événements SendGrid
 */
router.post('/webhook/sendgrid', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const events = JSON.parse(req.body);
    
    events.forEach(async (event) => {
      // Extraire les IDs de campagne et destinataire du custom args ou headers
      const campaignId = event.campaignId || event.custom_args?.campaignId;
      const recipientId = event.recipientId || event.custom_args?.recipientId;
      
      if (campaignId && recipientId) {
        const eventType = event.event; // delivered, open, click, bounce, etc.
        const eventData = {
          timestamp: event.timestamp,
          email: event.email,
          reason: event.reason,
          url: event.url,
          useragent: event.useragent,
          ip: event.ip
        };
        
        await emailService.logEmailEvent(
          campaignId,
          recipientId,
          eventType,
          JSON.stringify(eventData)
        );
      }
    });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).send('Error processing webhook');
  }
});

module.exports = router;
