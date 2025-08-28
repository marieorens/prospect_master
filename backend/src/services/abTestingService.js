const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ABTestingService {
  constructor() {
    this.dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../../../data/db.sqlite');
  }

  /**
   * Crée un nouveau test A/B pour une campagne
   */
  async createABTest(campaignId, testConfig) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbFile);
      
      try {
        const { 
          name,
          description = '',
          variants = []
        } = testConfig;

        const testId = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Créer le test A/B
        db.run(`
          INSERT INTO ab_tests (
            id, campaign_id, name, description, status, created_at
          ) VALUES (?, ?, ?, ?, 'active', ?)
        `, [testId, campaignId, name, description, new Date().toISOString()], function(err) {
          if (err) {
            console.error('Error creating A/B test:', err);
            db.close();
            return reject(err);
          }

          // Créer les variantes de manière séquentielle
          let variantIndex = 0;
          const insertVariant = () => {
            if (variantIndex >= variants.length) {
              console.log(`A/B test created: ${testId} for campaign ${campaignId}`);
              db.close();
              return resolve({ testId, status: 'created' });
            }

            const variant = variants[variantIndex];
            const allocationPercentage = 100 / variants.length; // Répartition équitable
            
            db.run(`
              INSERT INTO ab_test_variants (
                test_id, name, subject_line, content, 
                weight, created_at
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              testId,
              variant.name || `Variant ${String.fromCharCode(65 + variantIndex)}`,
              variant.subject,
              variant.content,
              allocationPercentage,
              new Date().toISOString()
            ], (err) => {
              if (err) {
                console.error('Error creating variant:', err);
                db.close();
                return reject(err);
              }
              variantIndex++;
              insertVariant();
            });
          };

          insertVariant();
        });

      } catch (error) {
        console.error('Error creating A/B test:', error);
        db.close();
        reject(error);
      }
    });
  }

  /**
   * Récupère tous les tests A/B
   */
  async getAllTests() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbFile);
      
      db.all(`
        SELECT * FROM ab_tests 
        ORDER BY created_at DESC
      `, [], (err, tests) => {
        if (err) {
          console.error('Error fetching A/B tests:', err);
          db.close();
          return reject(err);
        }

        db.close();
        resolve(tests);
      });
    });
  }

  /**
   * Récupère un test A/B avec ses variantes
   */
  async getTestWithVariants(testId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbFile);
      
      // Récupérer le test
      db.get(`SELECT * FROM ab_tests WHERE id = ?`, [testId], (err, test) => {
        if (err) {
          console.error('Error fetching test:', err);
          db.close();
          return reject(err);
        }

        if (!test) {
          db.close();
          return resolve(null);
        }

        // Récupérer les variantes
        db.all(`SELECT * FROM ab_test_variants WHERE test_id = ?`, [testId], (err, variants) => {
          if (err) {
            console.error('Error fetching variants:', err);
            db.close();
            return reject(err);
          }

          test.variants = variants;
          db.close();
          resolve(test);
        });
      });
    });
  }

  /**
   * Assigne une variante à un destinataire
   */
  async assignVariant(testId, recipientEmail) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbFile);
      
      // Vérifier si le destinataire a déjà une assignation
      db.get(`
        SELECT name FROM ab_test_assignments 
        WHERE test_id = ? AND recipient_email = ?
      `, [testId, recipientEmail], (err, existing) => {
        if (err) {
          console.error('Error checking existing assignment:', err);
          db.close();
          return reject(err);
        }

        if (existing) {
          db.close();
          return resolve(existing.name);
        }

        // Récupérer les variantes du test
        db.all(`
          SELECT name, weight 
          FROM ab_test_variants 
          WHERE test_id = ?
          ORDER BY name
        `, [testId], (err, variants) => {
          if (err) {
            console.error('Error fetching variants:', err);
            db.close();
            return reject(err);
          }

          if (!variants.length) {
            db.close();
            return reject(new Error(`No variants found for test ${testId}`));
          }

          // Algorithme de répartition basé sur le hash de l'email
          const hash = this.hashString(recipientEmail);
          const hashPercent = (hash % 100) + 1;

          let cumulativePercent = 0;
          let assignedVariant = variants[0].name;

          for (const variant of variants) {
            cumulativePercent += variant.weight;
            if (hashPercent <= cumulativePercent) {
              assignedVariant = variant.name;
              break;
            }
          }

          // Enregistrer l'assignation
          db.run(`
            INSERT INTO ab_test_assignments (test_id, recipient_email, name, assigned_at)
            VALUES (?, ?, ?, ?)
          `, [testId, recipientEmail, assignedVariant, new Date().toISOString()], function(err) {
            if (err) {
              console.error('Error saving assignment:', err);
              db.close();
              return reject(err);
            }

            console.log(`Assigned variant ${assignedVariant} to ${recipientEmail} for test ${testId}`);
            db.close();
            resolve(assignedVariant);
          });
        });
      });
    });
  }

  /**
   * Récupère les statistiques d'un test A/B
   */
  async getTestStats(testId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbFile);
      
      db.all(`
        SELECT 
          v.name,
          COUNT(a.recipient_email) as total_assigned,
          COUNT(CASE WHEN e.status = 'sent' THEN 1 END) as total_sent,
          COUNT(CASE WHEN e.status = 'opened' THEN 1 END) as total_opened,
          COUNT(CASE WHEN e.status = 'clicked' THEN 1 END) as total_clicked,
          ROUND(
            (COUNT(CASE WHEN e.status = 'opened' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(CASE WHEN e.status = 'sent' THEN 1 END), 0), 2
          ) as open_rate,
          ROUND(
            (COUNT(CASE WHEN e.status = 'clicked' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(CASE WHEN e.status = 'sent' THEN 1 END), 0), 2
          ) as click_rate
        FROM ab_test_variants v
        LEFT JOIN ab_test_assignments a ON v.test_id = a.test_id AND v.name = a.name
        LEFT JOIN email_campaigns e ON a.recipient_email = e.recipient_email
        WHERE v.test_id = ?
        GROUP BY v.name
        ORDER BY v.name
      `, [testId], (err, stats) => {
        if (err) {
          console.error('Error fetching test stats:', err);
          db.close();
          return reject(err);
        }

        db.close();
        resolve(stats);
      });
    });
  }

  /**
   * Met à jour le statut d'un test
   */
  async updateTestStatus(testId, status) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbFile);
      
      db.run(`
        UPDATE ab_tests 
        SET status = ?, updated_at = ?
        WHERE id = ?
      `, [status, new Date().toISOString(), testId], function(err) {
        if (err) {
          console.error('Error updating test status:', err);
          db.close();
          return reject(err);
        }

        console.log(`Test ${testId} status updated to ${status}`);
        db.close();
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  /**
   * Fonction hash simple pour la répartition
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = new ABTestingService();

