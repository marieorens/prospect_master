const express = require('express');
const cacheService = require('../services/cacheService');

const router = express.Router();

/**
 * GET /api/cache/stats
 * Statistiques du cache
 */
router.get('/stats', (req, res) => {
  try {
    const stats = cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        performance: {
          hitRatio: (stats.hitRatio * 100).toFixed(2) + '%',
          totalRequests: stats.hits + stats.misses,
          efficiency: stats.hits > 0 ? 'Excellent' : 'Needs warming up'
        }
      }
    });

  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de cache',
      error: error.message
    });
  }
});

/**
 * DELETE /api/cache/flush
 * Vider le cache
 */
router.delete('/flush', (req, res) => {
  try {
    const { type } = req.query; // default, long, short, ou all
    
    cacheService.flush(type || null);
    
    res.json({
      success: true,
      message: `Cache ${type || 'all'} vidé avec succès`,
      flushed: type || 'all'
    });

  } catch (error) {
    console.error('Error flushing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache',
      error: error.message
    });
  }
});

/**
 * DELETE /api/cache/invalidate/:type
 * Invalider un type de cache spécifique
 */
router.delete('/invalidate/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { campaignId } = req.query;

    let invalidated = 0;

    switch (type) {
      case 'analytics':
        cacheService.invalidateAnalytics(campaignId);
        invalidated = 1;
        break;
      case 'domains':
        cacheService.invalidateDomains();
        invalidated = 1;
        break;
      case 'templates':
        cacheService.invalidateTemplates();
        invalidated = 1;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Type de cache invalide: ${type}`,
          validTypes: ['analytics', 'domains', 'templates']
        });
    }
    
    res.json({
      success: true,
      message: `Cache ${type} invalidé avec succès`,
      invalidated,
      campaignId: campaignId || 'all'
    });

  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'invalidation du cache',
      error: error.message
    });
  }
});

/**
 * POST /api/cache/warm
 * Préchauffer le cache avec des données fréquemment utilisées
 */
router.post('/warm', async (req, res) => {
  try {
    const analyticsService = require('../services/analyticsService');
    
    // Préchauffer les métriques globales
    await analyticsService.getGlobalMetrics();
    
    // Préchauffer la comparaison des templates
    await analyticsService.compareTemplatePerformance();
    
    // Vous pouvez ajouter d'autres données à préchauffer ici
    
    res.json({
      success: true,
      message: 'Cache préchauffé avec succès',
      warmed: ['global_metrics', 'template_performance']
    });

  } catch (error) {
    console.error('Error warming cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du préchauffage du cache',
      error: error.message
    });
  }
});

/**
 * GET /api/cache/health
 * Santé du système de cache
 */
router.get('/health', (req, res) => {
  try {
    const stats = cacheService.getStats();
    const uptime = process.uptime();
    
    // Détermine la santé du cache
    const health = {
      status: 'healthy',
      issues: []
    };

    // Vérifications de santé
    if (stats.hitRatio < 0.3 && stats.hits + stats.misses > 50) {
      health.status = 'warning';
      health.issues.push('Faible taux de hit cache (< 30%)');
    }

    if (uptime < 300) { // Moins de 5 minutes
      health.status = 'warning';
      health.issues.push('Service récemment redémarré, cache en cours de chargement');
    }

    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // > 500MB
      health.status = 'warning';
      health.issues.push('Utilisation mémoire élevée');
    }

    res.json({
      success: true,
      health,
      metrics: {
        hitRatio: (stats.hitRatio * 100).toFixed(2) + '%',
        totalRequests: stats.hits + stats.misses,
        uptime: Math.round(uptime),
        memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
      }
    });

  } catch (error) {
    console.error('Error checking cache health:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'error',
        issues: ['Unable to check cache health']
      },
      error: error.message
    });
  }
});

module.exports = router;
