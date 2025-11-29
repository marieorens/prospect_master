# 🔍 Module Google Search - Documentation

## Vue d'ensemble

Le module Google Search permet de découvrir de nouvelles entreprises prospects en effectuant des recherches ciblées sur Google et Google Maps, puis d'extraire automatiquement les emails de contact.

## ✨ Fonctionnalités

### 🎯 Recherche Google Intelligente
- **Recherche par mots-clés** : Trouvez des entreprises avec des termes spécifiques
- **Géolocalisation** : Ciblez des entreprises par région/ville
- **Filtrage par secteur** : Recherchez par type d'entreprise (SARL, SAS, etc.)
- **Google Maps intégration** : Découvrez des entreprises locales
- **Déduplication automatique** : Évite les doublons par domaine

### 📧 Extraction d'emails automatisée
- **Scan de sites web** : Parcourt les sites trouvés pour extraire les emails
- **Pages contact intelligentes** : Recherche automatique des pages /contact, /about
- **Validation en temps réel** : Filtre les emails invalides et génériques
- **Validation MX** : Vérifie la validité des domaines email
- **Traitement parallèle** : Extraction rapide avec gestion de la concurrence

### 📊 Enrichissement des données
- **Détection de secteur** : Classification automatique par domaine d'activité
- **Informations LinkedIn** : Extraction de données depuis les profils entreprise
- **Métadonnées complètes** : URLs, descriptions, taille d'entreprise
- **Statut de traitement** : Suivi détaillé de chaque étape

## 🚀 Utilisation

### Interface Web

1. **Accédez à la page** : http://localhost:3000/google-search
2. **Choisissez votre mode** :
   - **Recherche manuelle** : Saisissez vos requêtes directement
   - **Import CSV** : Uploadez un fichier avec vos termes de recherche

3. **Configurez vos paramètres** :
   - Nombre de résultats max par requête (5-100)
   - Région (France, Belgique, Suisse, Canada)
   - Type d'entreprise (optionnel)
   - Localisation (optionnel)

4. **Options avancées** :
   - ✅ Extraction d'emails automatique
   - ✅ Inclure Google Maps (nécessite localisation)

5. **Lancez la recherche** et suivez le progrès en temps réel

### API REST

#### POST `/api/google-search`

**Recherche manuelle :**

```json
{
  "searchQueries": [
    "agence web Lyon",
    "cabinet comptable Paris"
  ],
  "options": {
    "maxResultsPerQuery": 25,
    "region": "fr",
    "language": "fr",
    "businessType": "SARL",
    "location": "France",
    "emailOptions": {
      "maxConcurrent": 2,
      "maxEmailsPerCompany": 3,
      "skipSocialMedia": true
    }
  },
  "includeEmailExtraction": true,
  "includeMapsSearch": false
}
```

#### POST `/api/google-search/batch`

**Import CSV :**

```bash
curl -X POST \
  -F "file=@recherches.csv" \
  -F "includeEmailExtraction=true" \
  -F "maxResultsPerQuery=25" \
  http://localhost:4000/api/google-search/batch
```

**Format CSV :**
```csv
terme_recherche,localisation
agence web,Lyon
cabinet comptable,Paris
consultant marketing,Marseille
```

#### GET `/api/google-search/process/:processId`

Récupère le statut d'un processus en cours.

## 📋 Format des résultats

```json
{
  "success": true,
  "processId": "uuid-process-id",
  "data": {
    "companies": [
      {
        "companyName": "Nom de l'entreprise",
        "domain": "exemple.com",
        "url": "https://exemple.com",
        "title": "Titre de la page",
        "snippet": "Description courte...",
        "contactInfo": {
          "emails": ["contact@exemple.com"],
          "phones": [],
          "addresses": [],
          "extractionStatus": "success",
          "mxValidated": true
        },
        "socialMedia": {
          "linkedin": "https://linkedin.com/company/...",
          "facebook": null,
          "twitter": null
        },
        "businessInfo": {
          "sector": "Technologie",
          "description": "Description de l'entreprise",
          "estimatedSize": "10-50 employés",
          "rating": "4.5"
        },
        "extractedAt": "2025-08-27T23:00:00.000Z",
        "status": "success",
        "source": "google_search"
      }
    ],
    "stats": {
      "totalCompanies": 15,
      "companiesWithEmails": 12,
      "companiesWithValidEmails": 10,
      "totalEmails": 18,
      "validEmails": 15,
      "averageEmailsPerCompany": "1.5",
      "bySource": {
        "google_search": 12,
        "google_maps": 3
      },
      "bySector": {
        "Technologie": 8,
        "Conseil": 4,
        "Marketing": 3
      }
    }
  }
}
```

## 🔧 Configuration

### Variables d'environnement

```bash
# Paramètres généraux
HEADLESS=false                # Mode navigateur (true/false)
CONCURRENCY=2                 # Nb de processus parallèles
REQUEST_TIMEOUT_MS=30000      # Timeout par requête
SESSION_DIR=./sessions        # Répertoire sessions navigateur

# Optimisation
GOOGLE_DELAY_MIN=2000         # Délai min entre requêtes (ms)
GOOGLE_DELAY_MAX=5000         # Délai max entre requêtes (ms)
MAX_PAGES_PER_QUERY=5         # Pages Google max par requête
```

### Optimisation des performances

1. **Concurrence** : Ajustez `CONCURRENCY` selon votre serveur
2. **Délais** : Augmentez les délais pour éviter la détection
3. **Filtres** : Utilisez des requêtes précises pour de meilleurs résultats
4. **Batch size** : Traitez par lots de 50-100 entreprises max

## 🚦 Statuts de traitement

| Statut | Description |
|--------|-------------|
| `pending` | En attente de traitement |
| `pending_email_extraction` | Entreprise trouvée, emails en cours d'extraction |
| `success` | Traitement réussi avec emails trouvés |
| `no_emails_found` | Entreprise trouvée mais aucun email |
| `skipped` | Entreprise ignorée (réseaux sociaux, etc.) |
| `failed` | Erreur lors du traitement |
| `error` | Erreur critique |

## 🎯 Secteurs détectés automatiquement

- **Technologie** : Software, IT, développement web
- **Conseil** : Consulting, expertise, advisory
- **Marketing** : Communication, publicité, SEO
- **Finance** : Banque, assurance, comptabilité
- **Santé** : Médical, pharmaceutique, cliniques
- **Industrie** : Manufacturing, production
- **Commerce** : Retail, vente, distribution
- **Services** : Prestations, maintenance
- **Immobilier** : Construction, architecture
- **Transport** : Logistique, livraison

## 🔍 Conseils d'utilisation

### Requêtes efficaces
```bash
✅ Bonnes pratiques :
- "agence web Paris"
- "cabinet comptable Lyon + SARL"
- "consultant marketing digital France"

❌ À éviter :
- "entreprise" (trop générique)
- "contact email" (pas spécifique)
- "société française" (trop large)
```

### Géolocalisation
- Utilisez des noms de villes précis : "Lyon", "Marseille"
- Combinez avec régions : "Rhône-Alpes", "PACA"
- Ajoutez le pays pour l'international : "Québec Canada"

### Optimisation emails
- Activez la validation MX pour une meilleure qualité
- Limitez à 3-5 emails par entreprise
- Ignorez les réseaux sociaux pour éviter les emails personnels

## 📊 Exemple de workflow complet

```javascript
// 1. Configuration de la recherche
const searchConfig = {
  searchQueries: [
    "agence communication Lyon",
    "startup fintech Paris"
  ],
  options: {
    maxResultsPerQuery: 50,
    location: "France",
    businessType: "SAS"
  },
  includeEmailExtraction: true
};

// 2. Lancement via API
const response = await fetch('/api/google-search', {
  method: 'POST',
  body: JSON.stringify(searchConfig)
});

// 3. Suivi temps réel
const { processId } = await response.json();

// 4. Export des résultats
// Via interface web : bouton "Exporter"
// Via API : /api/export avec processId
```

## 🔒 Sécurité et bonnes pratiques

- **Rate Limiting** : Respecte les limites de Google
- **User-Agent rotation** : Évite la détection automatique  
- **Délais aléatoires** : Simule un comportement humain
- **Session persistence** : Maintient les cookies entre requêtes
- **Error handling** : Gestion robuste des erreurs réseau

## 🐛 Dépannage

### Erreurs communes

1. **"No results found"** :
   - Vérifiez la connectivité internet
   - Essayez des requêtes moins spécifiques
   - Changez la région/langue

2. **"Email extraction failed"** :
   - Le site bloque probablement les bots
   - Augmentez les délais dans la config
   - Vérifiez que le site est accessible

3. **"Process timeout"** :
   - Réduisez le nombre de résultats par requête
   - Augmentez `REQUEST_TIMEOUT_MS`
   - Vérifiez les logs serveur

### Logs utiles

```bash
# Logs Google Search
tail -f logs/google-search.log

# Logs extraction emails  
tail -f logs/google-email.log

# Logs erreurs
tail -f logs/google-search-error.log
```

---

**🎉 Le module Google Search vous permet de découvrir de nouveaux prospects automatiquement !**

**Prochaines étapes** : Utilisez les emails extraits pour créer vos campagnes de prospection dans la section "Export".
