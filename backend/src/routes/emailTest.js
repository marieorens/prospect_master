const express = require('express');
const router = express.Router();

/**
 * GET /api/email-test/status
 * Test simple pour vérifier que les routes email fonctionnent
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Service email accessible',
    timestamp: new Date().toISOString(),
    simulationMode: !process.env.SENDGRID_API_KEY
  });
});

/**
 * POST /api/email-test/simulate
 * Simule l'envoi d'un email pour tester
 */
router.post('/simulate', (req, res) => {
  const { to, subject, from } = req.body;
  
  console.log('SIMULATION - Email envoyé:', {
    to: to,
    subject: subject,
    from: from,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: `Email simulé envoyé à ${to}`,
    simulation: true
  });
});

module.exports = router;
