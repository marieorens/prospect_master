const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite');

/**
 * GET /api/campaigns/templates
 * Récupère tous les templates d'emails
 */
router.get('/templates', (req, res) => {
  const db = new sqlite3.Database(dbFile);
  
  const query = `
    SELECT 
      id, name, description, subject, body, variables, category, is_default,
      created_at, updated_at
    FROM email_templates 
    ORDER BY is_default DESC, created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching templates:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des templates' 
      });
    }
    
    // Parse JSON variables
    const templates = rows.map(template => ({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : []
    }));
    
    res.json({ success: true, templates });
  });
  
  db.close();
});

/**
 * POST /api/campaigns/templates
 * Crée un nouveau template d'email
 */
router.post('/templates', (req, res) => {
  const { name, description, subject, body, variables, category } = req.body;
  
  if (!name || !subject || !body) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nom, sujet et corps de l\'email sont requis' 
    });
  }
  
  const db = new sqlite3.Database(dbFile);
  
  const query = `
    INSERT INTO email_templates (name, description, subject, body, variables, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    name, 
    description, 
    subject, 
    body, 
    JSON.stringify(variables || []),
    category || 'custom'
  ], function(err) {
    if (err) {
      console.error('Error creating template:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la création du template' 
      });
    }
    
    res.json({ 
      success: true, 
      template: { id: this.lastID, name, description, subject, body, variables, category }
    });
  });
  
  db.close();
});

/**
 * PUT /api/campaigns/templates/:id
 * Met à jour un template d'email
 */
router.put('/templates/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, subject, body, variables, category } = req.body;
  
  const db = new sqlite3.Database(dbFile);
  
  const query = `
    UPDATE email_templates 
    SET name = ?, description = ?, subject = ?, body = ?, variables = ?, category = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [
    name, description, subject, body, 
    JSON.stringify(variables || []), category, id
  ], function(err) {
    if (err) {
      console.error('Error updating template:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour du template' 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template non trouvé' 
      });
    }
    
    res.json({ success: true, message: 'Template mis à jour avec succès' });
  });
  
  db.close();
});

/**
 * DELETE /api/campaigns/templates/:id
 * Supprime un template d'email
 */
router.delete('/templates/:id', (req, res) => {
  const { id } = req.params;
  
  const db = new sqlite3.Database(dbFile);
  
  // Vérifier que ce n'est pas un template par défaut
  db.get('SELECT is_default FROM email_templates WHERE id = ?', [id], (err, template) => {
    if (err) {
      console.error('Error checking template:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la vérification du template' 
      });
    }
    
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template non trouvé' 
      });
    }
    
    if (template.is_default) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer un template par défaut' 
      });
    }
    
    // Supprimer le template
    db.run('DELETE FROM email_templates WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting template:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la suppression du template' 
        });
      }
      
      res.json({ success: true, message: 'Template supprimé avec succès' });
    });
  });
  
  db.close();
});

/**
 * GET /api/campaigns
 * Récupère toutes les campagnes
 */
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbFile);
  
  const query = `
    SELECT 
      c.*,
      et.name as template_name,
      et.subject as template_subject
    FROM campaigns c
    LEFT JOIN email_templates et ON c.template_id = et.id
    ORDER BY c.created_at DESC
  `;
  
  db.all(query, [], (err, campaigns) => {
    if (err) {
      console.error('Error fetching campaigns:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des campagnes' 
      });
    }
    
    // Parse JSON fields
    const parsedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      filter_criteria: campaign.filter_criteria ? JSON.parse(campaign.filter_criteria) : null
    }));
    
    res.json({ success: true, campaigns: parsedCampaigns });
  });
  
  db.close();
});

/**
 * POST /api/campaigns
 * Crée une nouvelle campagne
 */
router.post('/', (req, res) => {
  const { 
    name, description, template_id, 
    send_from_name, send_from_email, reply_to_email,
    scheduled_at, send_rate_per_hour, filter_criteria 
  } = req.body;
  
  if (!name || !template_id || !send_from_email) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nom, template et email expéditeur sont requis' 
    });
  }
  
  const db = new sqlite3.Database(dbFile);
  
  const query = `
    INSERT INTO campaigns (
      name, description, template_id, send_from_name, send_from_email, 
      reply_to_email, scheduled_at, send_rate_per_hour, filter_criteria
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    name, description, template_id, send_from_name, send_from_email,
    reply_to_email, scheduled_at, send_rate_per_hour || 10,
    JSON.stringify(filter_criteria || {})
  ], function(err) {
    if (err) {
      console.error('Error creating campaign:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la création de la campagne' 
      });
    }
    
    res.json({ 
      success: true, 
      campaign: { id: this.lastID, name, description, template_id }
    });
  });
  
  db.close();
});

/**
 * GET /api/campaigns/:id/prospects
 * Récupère les prospects éligibles pour une campagne
 */
router.get('/:id/prospects', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(dbFile);
  
  // Query pour récupérer les prospects avec emails valides
  const query = `
    SELECT 
      d.id as domain_id,
      d.domain,
      d.traffic,
      d.backlinks,
      d.keywords,
      e.id as email_id,
      e.email,
      e.is_valid,
      GROUP_CONCAT(pg.name) as groups
    FROM domains d
    JOIN emails e ON d.id = e.domain_id
    LEFT JOIN prospect_group_members pgm ON d.id = pgm.domain_id
    LEFT JOIN prospect_groups pg ON pgm.prospect_group_id = pg.id
    WHERE e.is_valid = 1
    GROUP BY d.id, e.id
    ORDER BY d.traffic DESC
  `;
  
  db.all(query, [], (err, prospects) => {
    if (err) {
      console.error('Error fetching prospects:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des prospects' 
      });
    }
    
    res.json({ success: true, prospects });
  });
  
  db.close();
});

/**
 * POST /api/campaigns/:id/recipients
 * Ajoute des prospects à une campagne
 */
router.post('/:id/recipients', (req, res) => {
  const { id } = req.params;
  const { prospect_ids, custom_variables } = req.body; // prospect_ids = [{domain_id, email_id}, ...]
  
  if (!prospect_ids || !Array.isArray(prospect_ids)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Liste des prospects requise' 
    });
  }
  
  const db = new sqlite3.Database(dbFile);
  
  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO campaign_recipients (campaign_id, domain_id, email_id, custom_variables)
      VALUES (?, ?, ?, ?)
    `);
    
    let insertedCount = 0;
    let errors = [];
    
    prospect_ids.forEach(({ domain_id, email_id }, index) => {
      stmt.run([
        id, 
        domain_id, 
        email_id, 
        JSON.stringify(custom_variables || {})
      ], function(err) {
        if (err) {
          errors.push(`Prospect ${index + 1}: ${err.message}`);
        } else {
          insertedCount++;
        }
        
        // Si c'est le dernier prospect
        if (index === prospect_ids.length - 1) {
          stmt.finalize();
          
          // Mettre à jour le nombre de destinataires dans la campagne
          db.run(
            'UPDATE campaigns SET total_recipients = ? WHERE id = ?', 
            [insertedCount, id]
          );
          
          res.json({ 
            success: true, 
            message: `${insertedCount} prospects ajoutés à la campagne`,
            errors: errors.length > 0 ? errors : null
          });
        }
      });
    });
  });
  
  db.close();
});

module.exports = router;
