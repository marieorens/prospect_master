const express = require('express');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

/**
 * GET /api/analytics/campaign/:id
 * Récupère les analytics détaillées d'une campagne
 */
router.get('/campaign/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const analytics = await analyticsService.getCampaignAnalytics(parseInt(id));
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des analytics'
    });
  }
});

/**
 * GET /api/analytics/campaign/:id/timeline
 * Récupère la timeline d'événements d'une campagne
 */
router.get('/campaign/:id/timeline', async (req, res) => {
  const { id } = req.params;
  const { limit = 100 } = req.query;
  
  try {
    const timeline = await analyticsService.getCampaignTimeline(parseInt(id), parseInt(limit));
    res.json({ success: true, timeline });
  } catch (error) {
    console.error('Error fetching campaign timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la timeline'
    });
  }
});

/**
 * GET /api/analytics/campaign/:id/segmentation
 * Analyse la segmentation de l'audience d'une campagne
 */
router.get('/campaign/:id/segmentation', async (req, res) => {
  const { id } = req.params;
  
  try {
    const segmentation = await analyticsService.getAudienceSegmentation(parseInt(id));
    res.json({ success: true, segmentation });
  } catch (error) {
    console.error('Error fetching audience segmentation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse de segmentation'
    });
  }
});

/**
 * GET /api/analytics/performance-report
 * Génère un rapport de performance pour une période
 */
router.get('/performance-report', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Les paramètres startDate et endDate sont requis'
    });
  }
  
  try {
    const report = await analyticsService.getPerformanceReport(startDate, endDate);
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport'
    });
  }
});

/**
 * GET /api/analytics/template-comparison
 * Compare les performances des templates
 */
router.get('/template-comparison', async (req, res) => {
  try {
    const comparison = await analyticsService.compareTemplatePerformance();
    res.json({ success: true, comparison });
  } catch (error) {
    console.error('Error comparing template performance:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la comparaison des templates'
    });
  }
});

/**
 * GET /api/analytics/global-metrics
 * Récupère les métriques globales du système
 */
router.get('/global-metrics', async (req, res) => {
  try {
    const metrics = await analyticsService.getGlobalMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching global metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des métriques globales'
    });
  }
});

/**
 * POST /api/analytics/export-report
 * Exporte un rapport au format CSV/Excel
 */
router.post('/export-report', async (req, res) => {
  const { campaignId, format = 'csv' } = req.body;
  
  try {
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'ID de campagne requis'
      });
    }
    
    const analytics = await analyticsService.getCampaignAnalytics(campaignId);
    const timeline = await analyticsService.getCampaignTimeline(campaignId, 1000);
    
    if (format === 'csv') {
      // Générer CSV
      let csv = 'Event Type,Email,Domain,Date,Details\n';
      timeline.forEach(event => {
        csv += `"${event.event_type}","${event.recipient_email}","${event.domain}","${event.created_at}","${JSON.stringify(event.event_data)}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaignId}-report.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        analytics,
        timeline,
        message: 'Données prêtes pour l\'export'
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export du rapport'
    });
  }
});

module.exports = router;
