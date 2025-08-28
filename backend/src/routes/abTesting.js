const express = require('express');
const router = express.Router();
const abTestingService = require('../services/abTestingService');

/**
 * POST /api/ab-testing/create
 * Crée un nouveau test A/B
 */
router.post('/create', async (req, res) => {
  try {
    const { campaignId, testConfig } = req.body;

    if (!campaignId || !testConfig) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and test configuration are required'
      });
    }

    // Validation des variantes
    if (!testConfig.variants || testConfig.variants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 variants are required for A/B testing'
      });
    }

    const result = await abTestingService.createABTest(campaignId, testConfig);
    
    res.json({
      success: true,
      data: result,
      message: 'A/B test created successfully'
    });

  } catch (error) {
    console.error('Error in /ab-testing/create:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create A/B test',
      error: error.message
    });
  }
});

/**
 * GET /api/ab-testing/active
 * Liste tous les tests A/B actifs
 */
router.get('/active', async (req, res) => {
  try {
    const allTests = await abTestingService.getAllTests();
    const activeTests = allTests.filter(test => test.status === 'active');
    
    res.json({
      success: true,
      data: activeTests,
      count: activeTests.length
    });

  } catch (error) {
    console.error('Error in /ab-testing/active:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active tests',
      error: error.message
    });
  }
});

/**
 * GET /api/ab-testing/:testId/results
 * Récupère les résultats d'un test A/B
 */
router.get('/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await abTestingService.getTestResults(testId);
    
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error(`Error in /ab-testing/${req.params.testId}/results:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test results',
      error: error.message
    });
  }
});

/**
 * POST /api/ab-testing/:testId/assign
 * Assigne une variante à un destinataire
 */
router.post('/:testId/assign', async (req, res) => {
  try {
    const { testId } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    const variant = await abTestingService.assignVariant(testId, recipientEmail);
    
    res.json({
      success: true,
      data: {
        testId,
        recipientEmail,
        assignedVariant: variant
      }
    });

  } catch (error) {
    console.error(`Error in /ab-testing/${req.params.testId}/assign:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign variant',
      error: error.message
    });
  }
});

/**
 * POST /api/ab-testing/:testId/complete
 * Termine un test A/B
 */
router.post('/:testId/complete', async (req, res) => {
  try {
    const { testId } = req.params;
    const { winnerVariant } = req.body;

    const result = await abTestingService.completeTest(testId, winnerVariant);
    
    res.json({
      success: true,
      data: result,
      message: 'A/B test completed successfully'
    });

  } catch (error) {
    console.error(`Error in /ab-testing/${req.params.testId}/complete:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete test',
      error: error.message
    });
  }
});

/**
 * GET /api/ab-testing/dashboard
 * Dashboard avec résumé de tous les tests
 */
router.get('/dashboard', async (req, res) => {
  try {
    const allTests = await abTestingService.getAllTests();
    const activeTests = allTests.filter(test => test.status === 'active');
    
    // Statistiques globales
    const dashboard = {
      summary: {
        total_active_tests: activeTests.length,
        total_variants: activeTests.reduce((sum, test) => sum + (test.variant_count || 0), 0),
        total_assignments: activeTests.reduce((sum, test) => sum + (test.total_assignments || 0), 0)
      },
      tests: activeTests, // Changé de active_tests à tests pour correspondre au frontend
      recommendations: []
    };

    // Ajouter des recommandations basées sur les données
    if (activeTests.length === 0) {
      dashboard.recommendations.push({
        type: 'info',
        message: 'Aucun test A/B actif. Créez votre premier test pour optimiser vos campagnes.'
      });
    }

    for (const test of activeTests) {
      if (test.total_assignments > 500) {
        dashboard.recommendations.push({
          type: 'success',
          message: `Le test "${test.name}" a suffisamment de données pour être analysé.`,
          testId: test.id
        });
      }
    }
    
    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Error in /ab-testing/dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

/**
 * POST /api/ab-testing/batch-assign
 * Assigne des variantes à plusieurs destinataires en lot
 */
router.post('/batch-assign', async (req, res) => {
  try {
    const { testId, recipients } = req.body;

    if (!testId || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Test ID and recipients array are required'
      });
    }

    const assignments = [];
    const errors = [];

    for (const email of recipients) {
      try {
        const variant = await abTestingService.assignVariant(testId, email);
        assignments.push({ email, variant });
      } catch (error) {
        errors.push({ email, error: error.message });
      }
    }
    
    res.json({
      success: true,
      data: {
        testId,
        total_requested: recipients.length,
        successful_assignments: assignments.length,
        failed_assignments: errors.length,
        assignments,
        errors
      }
    });

  } catch (error) {
    console.error('Error in /ab-testing/batch-assign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch assign variants',
      error: error.message
    });
  }
});

module.exports = router;
