# SEMrush Email Scraper

Un outil complet pour extraire des données SEMrush et des emails à partir de domaines, avec validation MX et export Excel.

## Fonctionnalités

- Import de domaines via CSV ou saisie manuelle
- Scraping automatisé de SEMrush (trafic, backlinks, mots-clés)
- Extraction d'emails depuis les sites web
- Validation MX des emails
- Stockage en base de données SQLite
- Export Excel (.xlsx)
- Interface utilisateur intuitive avec Next.js et TailwindCSS

## Prérequis

- Node.js >= 18
- npm ou yarn
- Un compte SEMrush valide

## Installation

1. Clonez le dépôt :

```bash
git clone https://github.com/votre-utilisateur/semrush-email-scraper.git
cd semrush-email-scraper
```

2. Installez les dépendances du backend :

```bash
cd backend
npm install
```

3. Installez les dépendances du frontend :

```bash
cd ../frontend
npm install
```

4. Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example` :

```bash
cp .env.example .env
```

5. Modifiez le fichier `.env` avec vos informations :

```
SEMRUSH_EMAIL=votre_email@example.com
SEMRUSH_PASSWORD=votre_mot_de_passe
PORT=4000
NODE_ENV=development
SESSION_DIR=./sessions
DATABASE_FILE=./data/db.sqlite
CONCURRENCY=3
REQUEST_TIMEOUT_MS=60000
HEADLESS=true
```

## Initialisation de la base de données

Exécutez la migration pour créer les tables SQLite :

```bash
cd backend
npm run migrate
```

Vous pouvez également charger des domaines d'exemple :

```bash
npm run seed
```

## Démarrage de l'application

1. Démarrez le backend :

```bash
cd backend
npm run dev
```

2. Dans un autre terminal, démarrez le frontend :

```bash
cd frontend
npm run dev
```

3. Accédez à l'application dans votre navigateur : [http://localhost:3000](http://localhost:3000)

## Utilisation

### 1. Importer des domaines

- Utilisez la page "Import" pour télécharger un fichier CSV contenant des domaines
- Ou saisissez manuellement les domaines (un par ligne ou séparés par des virgules)

### 2. Lancer le scraping

- Accédez à la page "Scrape"
- Sélectionnez les domaines à scraper
- Choisissez le mode de traitement (séquentiel ou parallèle)
- Cliquez sur "Start Scraping"
- Suivez la progression du job

### 3. Consulter les résultats

- Accédez à la page "Domains" pour voir les données extraites
- Cliquez sur un domaine pour voir les détails et les emails associés

### 4. Exporter les données

- Accédez à la page "Export"
- Cliquez sur "Download Excel" pour télécharger toutes les données au format Excel

## Structure du projet

```
semrush-email-scraper/
├─ backend/
│  ├─ src/
│  │  ├─ app.js                 # Point d'entrée Express
│  │  ├─ routes/                # Routes API
│  │  ├─ services/              # Services métier
│  │  │  ├─ scrapers/           # Services de scraping
│  │  │  ├─ validators/         # Validation des emails
│  │  │  ├─ exporters/          # Export Excel
│  │  ├─ db/                    # Gestion de la base de données
│  ├─ data/                     # Fichier SQLite
│  ├─ sessions/                 # Sessions Puppeteer
│  ├─ logs/                     # Fichiers de logs
│  ├─ exports/                  # Fichiers exportés
├─ frontend/
│  ├─ pages/                    # Pages Next.js
│  ├─ components/               # Composants React
│  ├─ styles/                   # Styles CSS
├─ .env.example                 # Exemple de configuration
├─ README.md                    # Documentation
```

## Tests d'acceptation

Pour vérifier que l'application fonctionne correctement :

1. Importez les domaines d'exemple depuis `sample-input.csv`
2. Lancez un job de scraping pour ces domaines
3. Vérifiez que les données SEMrush sont extraites pour au moins 80% des domaines
4. Vérifiez que les emails sont extraits et validés
5. Exportez les données au format Excel et vérifiez le fichier

## Sécurité et légalité

- Cet outil est destiné à un usage interne uniquement
- Vérifiez les conditions d'utilisation de SEMrush avant d'utiliser cet outil
- Respectez le RGPD concernant la collecte et le stockage d'emails

## Dépannage

### Problèmes courants

- **Erreur de connexion à SEMrush** : Vérifiez vos identifiants dans le fichier `.env`
- **CAPTCHA détecté** : Essayez de réduire la concurrence ou utilisez un proxy
- **Erreurs de scraping** : Consultez les logs et les captures d'écran dans le dossier `sessions/errors`

### Logs

Les logs sont disponibles dans le dossier `backend/logs/` et peuvent être consultés via l'interface dans la section "Settings".

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.