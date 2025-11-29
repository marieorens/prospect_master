require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database connection
const dataDir = path.join(__dirname, '../../data');
const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'db.sqlite');
const db = new sqlite3.Database(dbFile);

console.log('🚀 Migration des tables de campagnes email...');

db.serialize(() => {

  // Table des campagnes
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      template_id INTEGER,
      status TEXT DEFAULT 'draft', -- draft, scheduled, active, paused, completed
      total_recipients INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      opened_count INTEGER DEFAULT 0,
      clicked_count INTEGER DEFAULT 0,
      replied_count INTEGER DEFAULT 0,
      bounced_count INTEGER DEFAULT 0,
      
      -- Configuration d'envoi
      send_from_name TEXT,
      send_from_email TEXT,
      reply_to_email TEXT,
      
      -- Planification
      scheduled_at DATETIME,
      send_rate_per_hour INTEGER DEFAULT 10, -- Limite d'envoi par heure
      
      -- Segmentation
      filter_criteria JSON, -- Critères de filtrage des prospects
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY(template_id) REFERENCES email_templates(id) ON DELETE SET NULL
    )
  `);

  // Table des prospects dans une campagne
  db.run(`
    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      domain_id INTEGER,
      email_id INTEGER,
      
      -- Variables personnalisées pour ce prospect
      custom_variables JSON,
      
      -- Statut d'envoi
      status TEXT DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, replied, bounced, failed
      
      -- Tracking
      sent_at DATETIME,
      delivered_at DATETIME,
      campaign_id INTEGER,
      recipient_id INTEGER,
      
      event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, replied, bounced, failed
      event_data JSON, -- Données spécifiques à l'événement
      
      -- Métadonnées
      user_agent TEXT,
      ip_address TEXT,
      location TEXT,
      device_type TEXT, -- desktop, mobile, tablet
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(recipient_id) REFERENCES campaign_recipients(id) ON DELETE CASCADE
    )
  `);

  // Table des groupes/tags de prospects
  db.run(`
    CREATE TABLE IF NOT EXISTS prospect_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6', -- Couleur pour l'affichage
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table de relation many-to-many entre prospects et groupes
  db.run(`
    CREATE TABLE IF NOT EXISTS prospect_group_members (
      prospect_group_id INTEGER,
      domain_id INTEGER,
      
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      PRIMARY KEY (prospect_group_id, domain_id),
      FOREIGN KEY(prospect_group_id) REFERENCES prospect_groups(id) ON DELETE CASCADE,
      FOREIGN KEY(domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `);

  // Table des séquences d'emails (pour l'automatisation future)
  db.run(`
    CREATE TABLE IF NOT EXISTS email_sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      template_id INTEGER,
      
      sequence_order INTEGER, -- Ordre dans la séquence (1, 2, 3...)
      delay_days INTEGER DEFAULT 0, -- Délai après l'email précédent
      
      -- Conditions de déclenchement
      trigger_conditions JSON, -- Ex: email précédent ouvert, pas de réponse, etc.
      
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(template_id) REFERENCES email_templates(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Tables de campagnes créées avec succès');
});

// Insérer des templates par défaut
db.serialize(() => {
  console.log('📧 Insertion des templates par défaut...');
  
  // Template Cold Email
  db.run(`
    INSERT OR IGNORE INTO email_templates (name, description, subject, body, variables, category, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'Cold Email - Introduction',
    'Template d\'introduction pour premiers contacts',
    'Collaboration possible entre {{company_name}} et votre entreprise',
    `Bonjour {{contact_name}},

J'espère que vous allez bien.

Je suis {{sender_name}} de {{sender_company}}. J'ai découvert {{company_name}} et je suis impressionné par {{company_description}}.

Nous aidons des entreprises comme la vôtre à {{value_proposition}}. 

Seriez-vous disponible pour un appel rapide de 15 minutes cette semaine pour discuter de comment nous pourrions collaborer ?

Cordialement,
{{sender_name}}
{{sender_title}}
{{sender_company}}`,
    JSON.stringify([
      'company_name', 'contact_name', 'sender_name', 'sender_company', 
      'company_description', 'value_proposition', 'sender_title'
    ]),
    'cold_email',
    1
  ]);

  // Template Follow-up
  db.run(`
    INSERT OR IGNORE INTO email_templates (name, description, subject, body, variables, category, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'Follow-up - Relance',
    'Template de relance après un premier contact',
    'Re: Collaboration entre {{company_name}} et {{sender_company}}',
    `Bonjour {{contact_name}},

J'espère que vous allez bien.

Je vous avais contacté la semaine dernière concernant une collaboration potentielle entre {{company_name}} et {{sender_company}}.

Je comprends que vous êtes probablement très occupé. J'aimerais simplement savoir si vous seriez intéressé par une discussion de 10 minutes sur {{value_proposition}}.

Si ce n'est pas le bon moment, n'hésitez pas à me le faire savoir.

Bonne journée,
{{sender_name}}`,
    JSON.stringify([
      'company_name', 'contact_name', 'sender_name', 'sender_company', 'value_proposition'
    ]),
    'follow_up',
    1
  ]);

  // Template Remerciement
  db.run(`
    INSERT OR IGNORE INTO email_templates (name, description, subject, body, variables, category, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'Remerciement - Après échange',
    'Template de remerciement après un premier échange',
    'Merci pour votre temps - Prochaines étapes',
    `Bonjour {{contact_name}},

Merci beaucoup pour le temps que vous m'avez accordé hier.

Comme convenu, voici {{next_steps}}.

Je reste à votre disposition pour toute question.

À bientôt,
{{sender_name}}`,
    JSON.stringify([
      'contact_name', 'sender_name', 'next_steps'
    ]),
    'thank_you',
    1
  ]);

  console.log('✅ Templates par défaut insérés');
});

// Créer un groupe par défaut
db.serialize(() => {
  console.log('👥 Création des groupes par défaut...');
  
  // Vérifier si la colonne 'color' existe, sinon l'ajouter
  db.all("PRAGMA table_info(prospect_groups)", (err, columns) => {
    if (err) {
      console.error('Erreur lors de la vérification de la table prospect_groups:', err);
      return;
    }
    const hasColor = columns.some(col => col.name === 'color');
    if (!hasColor) {
      db.run("ALTER TABLE prospect_groups ADD COLUMN color TEXT DEFAULT '#3B82F6'", (alterErr) => {
        if (alterErr) {
          console.error('Erreur lors de l\'ajout de la colonne color:', alterErr);
        } else {
          console.log('✅ Colonne color ajoutée à prospect_groups');
        }
        // Insérer le groupe par défaut après avoir ajouté la colonne
        db.run(`
          INSERT OR IGNORE INTO prospect_groups (id, name, description, color)
          VALUES (1, 'Tous les prospects', 'Groupe par défaut contenant tous les prospects', '#6B7280')
        `);
        console.log('✅ Groupes par défaut créés');
      });
    } else {
      // La colonne existe déjà, on peut insérer le groupe
      db.run(`
        INSERT OR IGNORE INTO prospect_groups (id, name, description, color)
        VALUES (1, 'Tous les prospects', 'Groupe par défaut contenant tous les prospects', '#6B7280')
      `);
      console.log('✅ Groupes par défaut créés');
    }
  });
});

