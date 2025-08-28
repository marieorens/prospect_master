import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppMode, getNavigationForMode } from '../hooks/useAppMode';
import {
  FaHome, FaUpload, FaTable, FaDownload, FaPlay, FaCog,
  FaSearch, FaList, FaEnvelope, FaChartLine, FaExchangeAlt,
  FaRocket, FaBolt, FaGlobe, FaBars, FaTimes,
  FaChevronLeft, FaChevronRight, FaUsers, FaMap, FaFileAlt
} from 'react-icons/fa';

/**
 * Composant Sidebar adaptatif responsive avec animations fluides
 */
export default function FluidAdaptiveSidebar() {
  const router = useRouter();
  const currentMode = useAppMode();
  const navigationItems = getNavigationForMode(currentMode.type);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Détecter la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-collapse sur tablet/mobile
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mapping des icônes avec plus d'options
  const iconMap = {
    FaHome, FaUpload, FaTable, FaDownload, FaPlay, FaCog,
    FaSearch, FaList, FaEnvelope, FaChartLine, FaExchangeAlt,
    FaRocket, FaBolt, FaGlobe, FaUsers, FaMap, FaFileAlt
  };

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : <FaHome />;
  };

  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname === path || router.pathname.startsWith(path);
  };

  // Couleurs selon le mode
  const getModeColors = () => {
    switch (currentMode.type) {
      case 'semrush':
        return {
          gradient: 'from-orange-600 to-orange-700',
          hover: 'hover:bg-orange-100 hover:text-orange-700',
          active: 'bg-orange-200 text-orange-800 border-r-4 border-orange-600',
          accent: 'bg-orange-500',
          text: 'text-orange-600'
        };
      case 'google-search':
        return {
          gradient: 'from-blue-600 to-blue-700',
          hover: 'hover:bg-blue-100 hover:text-blue-700',
          active: 'bg-blue-200 text-blue-800 border-r-4 border-blue-600',
          accent: 'bg-blue-500',
          text: 'text-blue-600'
        };
      case 'common':
        return {
          gradient: 'from-green-600 to-green-700',
          hover: 'hover:bg-green-100 hover:text-green-700',
          active: 'bg-green-200 text-green-800 border-r-4 border-green-600',
          accent: 'bg-green-500',
          text: 'text-green-600'
        };
      default:
        return {
          gradient: 'from-indigo-600 to-indigo-700',
          hover: 'hover:bg-indigo-100 hover:text-indigo-700',
          active: 'bg-indigo-200 text-indigo-800 border-r-4 border-indigo-600',
          accent: 'bg-indigo-500',
          text: 'text-indigo-600'
        };
    }
  };

  const colors = getModeColors();

  // Bouton mobile toggle
  const MobileToggle = () => (
    <button
      onClick={() => setShowMobileMenu(!showMobileMenu)}
      className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg transition-all duration-300 ${
        showMobileMenu 
          ? 'bg-red-500 text-white transform rotate-180' 
          : `bg-white ${colors.text} shadow-md hover:shadow-lg`
      }`}
    >
      {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
    </button>
  );

  // Contenu de la sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header avec mode et toggle */}
      <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white relative`}>
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <h2 className="text-lg font-bold mb-1">
            {currentMode.name}
          </h2>
          <p className="text-sm opacity-90">
            {currentMode.description || 'Mode actuel'}
          </p>
        </div>
        
        {/* Toggle button pour desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute -right-3 top-6 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          {isCollapsed ? (
            <FaChevronRight className={`${colors.text} text-sm`} />
          ) : (
            <FaChevronLeft className={`${colors.text} text-sm`} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {navigationItems.map((item, index) => {
            // Skip dividers
            if (item.type === 'divider') {
              return (
                <li key={index} className="my-4">
                  <div className="border-t border-gray-200"></div>
                </li>
              );
            }

            // Skip items without href/path
            if (!item.href && !item.path) {
              return null;
            }

            const itemPath = item.href || item.path;
            const active = isActive(itemPath);
            
            return (
              <li key={index}>
                <Link
                  href={itemPath}
                  onClick={() => isMobile && setShowMobileMenu(false)}
                  className={`
                    flex items-center px-6 py-3 text-sm font-medium transition-all duration-300 transform
                    ${active 
                      ? colors.active 
                      : `text-gray-700 ${colors.hover} hover:translate-x-2`
                    }
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    group relative
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                    ${active ? colors.accent + ' text-white shadow-lg' : 'text-gray-500 group-hover:scale-110'}
                  `}>
                    {getIcon(item.icon)}
                  </div>
                  
                  <span className={`
                    ml-3 transition-all duration-300
                    ${isCollapsed && !isHovered ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
                  `}>
                    {item.label}
                  </span>
                  
                  {item.badge && (
                    <span className={`
                      ml-auto px-2 py-1 text-xs rounded-full transition-all duration-300
                      ${active ? 'bg-white text-gray-800' : colors.accent + ' text-white'}
                      ${isCollapsed && !isHovered ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip pour mode collapsed */}
                  {isCollapsed && !isHovered && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer avec statistiques */}
      <div className={`p-4 border-t transition-all duration-300 ${isCollapsed && !isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${colors.accent} animate-pulse`}></div>
            <span className="text-xs font-medium text-gray-600">
              Statut: Actif
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Mode {currentMode.name} • {navigationItems.length} options
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileToggle />
        
        {/* Overlay pour mobile */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setShowMobileMenu(false)}
          />
        )}
        
        {/* Sidebar mobile */}
        <div className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 md:hidden
          transform transition-transform duration-300 ease-in-out
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarContent />
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div 
      className={`
        relative bg-white shadow-xl border-r border-gray-200 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-80'}
        hidden md:block
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        transition-all duration-300
        ${isCollapsed && isHovered ? 'fixed left-0 top-0 w-80 h-full bg-white shadow-2xl z-30' : 'relative'}
      `}>
        <SidebarContent />
      </div>
    </div>
  );
}
