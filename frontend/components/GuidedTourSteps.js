const tourSteps = {
  index: [
    {
      target: '.dashboard-container',
      content: 'Bienvenue sur le dashboard ! Retrouvez ici la synthèse de votre prospection.'
    },
    {
      target: '.actions-rapides',
      content: 'Utilisez ces actions rapides pour démarrer une analyse, une prospection ou une campagne.'
    },
    {
      target: '.sidebar-semrush, .sidebar-google',
      content: 'Changez de mode ici : SEMrush ou Google Search.'
    }
  ],
  import: [
    {
      target: 'input[type="file"]',
      content: 'Importez votre fichier CSV de domaines ici.'
    },
    {
      target: '.btn-upload',
      content: 'Cliquez pour lancer l’import.'
    }
  ],
  scrape: [
    {
      target: '.btn-scrape',
      content: 'Lancez le scraping sur les domaines sélectionnés.'
    },
    {
      target: '.job-progress',
      content: 'Suivez l’avancement du scraping ici.'
    }
  ],
  export: [
    {
      target: '.btn-export',
      content: 'Exportez vos résultats en Excel ou CSV.'
    }
  ],
  domains: [
    {
      target: '.domain-table',
      content: 'Consultez et filtrez vos domaines et emails extraits.'
    }
  ],
  analytics: [
    {
      target: '.analytics-global',
      content: 'Analysez les performances globales de vos campagnes.'
    },
    {
      target: '.analytics-campaigns',
      content: 'Détail des campagnes email.'
    }
  ],
  campaigns: [
    {
      target: '.campaign-manager',
      content: 'Créez et gérez vos campagnes email ici.'
    }
  ],
  'google-search': [
    {
      target: '.search-form',
      content: 'Lancez une recherche Google personnalisée.'
    },
    {
      target: '.domain-table',
      content: 'Consultez les résultats et extrayez les emails.'
    }
  ]
};

export default tourSteps;
