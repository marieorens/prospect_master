import { useRouter } from 'next/router';
import { useMemo } from 'react';

/**
 * Hook pour détecter le mode actuel de l'application
 * @returns {Object} - Mode détecté et informations associées
 */
export function useAppMode() {
  const router = useRouter();
  
  const mode = useMemo(() => {
    const path = router.pathname;
    
    // Mode Google Search - Prospection et campagnes
    if (path.includes('google-search') || 
        path.includes('keywords') || 
        path.includes('campaigns') ||
        path.includes('email-templates') ||
        path.includes('email-test') ||
        path.includes('test-campaigns') ||
        path === '/feedback-test') {
      return {
        type: 'google-search',
        name: 'Prospection Google',
        color: 'blue',
        description: 'Recherche et prospection via Google'
      };
    }
    
    // Mode SEMrush - Analyse, scraping et données
    if (path.includes('domains') || 
        path.includes('import') || 
        path.includes('scrape') ||
        path.includes('analytics') ||
        path.includes('ab-testing') ||
        path.includes('export') ||
        path.includes('performance') ||
        path.includes('notifications') ||
        path.includes('settings') ||
        path === '/') {
      return {
        type: 'semrush',
        name: 'Analyse SEMrush',
        color: 'orange',
        description: 'Analyse de domaines et extraction d\'emails'
      };
    }
    
    // Mode par défaut (SEMrush)
    return {
      type: 'semrush',
      name: 'Analyse SEMrush',
      color: 'orange',
      description: 'Analyse de domaines et extraction d\'emails'
    };
  }, [router.pathname]);
  
  return mode;
}

/**
 * Configuration des menus selon le mode
 */
export const navigationConfig = {
  dashboard: [
    { href: '/', label: 'Sélection du Mode', icon: 'FaHome', primary: true }
  ],
  
  semrush: [
    { href: '/', label: 'Dashboard', icon: 'FaHome' },
    { href: '/import', label: 'Import Domaines', icon: 'FaUpload', primary: true },
    { href: '/domains', label: 'Mes Domaines', icon: 'FaTable', primary: true },
    { href: '/scrape', label: 'Scraper', icon: 'FaPlay', primary: true },
    { href: '/campaigns', label: 'Campagnes', icon: 'FaEnvelope', primary: true },
    { href: '/email-templates', label: 'Templates', icon: 'FaFileAlt', primary: true },
    { href: '/email-test', label: 'Test Email', icon: 'FaRocket' },
    { href: '/analytics', label: 'Analytics', icon: 'FaChartLine', primary: true },
    { href: '/ab-testing', label: 'A/B Testing', icon: 'FaBolt', primary: true },
    { href: '/performance', label: 'Performance', icon: 'FaTachometerAlt' },
    { href: '/notifications', label: 'Notifications', icon: 'FaBell' },
    { type: 'divider' },
    { href: '/export', label: 'Export', icon: 'FaDownload' },
    { href: '/settings', label: 'Paramètres', icon: 'FaCog' },
    { type: 'divider' },
    { href: '/google-search', label: '🔄 Mode Google', icon: 'FaExchangeAlt', variant: 'switch' }
  ],
  
  'google-search': [
    { href: '/', label: 'Dashboard', icon: 'FaHome' },
    { href: '/google-search', label: 'Recherche Google', icon: 'FaSearch', primary: true },
    { href: '/keywords', label: 'Mes Recherches', icon: 'FaList', primary: true },
    { href: '/campaigns', label: 'Campagnes', icon: 'FaEnvelope', primary: true },
    { href: '/email-templates', label: 'Templates', icon: 'FaFileAlt', primary: true },
    { href: '/email-test', label: 'Test Email', icon: 'FaRocket' },
    { href: '/analytics', label: 'Analytics', icon: 'FaChartLine', primary: true },
    { href: '/ab-testing', label: 'A/B Testing', icon: 'FaBolt', primary: true },
    { href: '/performance', label: 'Performance', icon: 'FaTachometerAlt' },
    { href: '/notifications', label: 'Notifications', icon: 'FaBell' },
    { type: 'divider' },
    { href: '/export', label: 'Export', icon: 'FaDownload' },
    { href: '/settings', label: 'Paramètres', icon: 'FaCog' },
    { type: 'divider' },
    { href: '/domains', label: '🔄 Mode SEMrush', icon: 'FaExchangeAlt', variant: 'switch' }
  ],
  
  common: [
    { href: '/', label: 'Dashboard', icon: 'FaHome' },
    { href: '/export', label: 'Export', icon: 'FaDownload', primary: true },
    { href: '/settings', label: 'Paramètres', icon: 'FaCog', primary: true },
    { type: 'divider' },
    { href: '/domains', label: 'Mode SEMrush', icon: 'FaChartLine' },
    { href: '/google-search', label: 'Mode Google', icon: 'FaSearch' }
  ]
};

/**
 * Obtient la configuration de navigation pour un mode donné
 */
export function getNavigationForMode(modeType) {
  return navigationConfig[modeType] || navigationConfig.dashboard;
}
