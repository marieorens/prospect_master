import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaHome, FaUpload, FaTable, FaDownload, FaPlay, FaCog,
  FaSearch, FaList, FaEnvelope, FaChartLine, FaExchangeAlt,
  FaRocket, FaBolt, FaGlobe, FaBars, FaTimes,
  FaChevronLeft, FaChevronRight, FaUsers, FaMap, FaFileAlt,
  FaGoogle, FaEye, FaFilter, FaHistory, FaFlask
} from 'react-icons/fa';

/**
 * Sidebar spécifique au mode Google Search
 */
export default function GoogleSearchSidebar() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Navigation spécifique au mode Google Search
  const googleSearchNavigation = [
    {
      label: 'Dashboard',
      path: '/',
      icon: 'FaHome',
      color: 'text-blue-600',
      description: 'Vue d\'ensemble'
    },
    {
      label: 'Recherche Google',
      path: '/google-search',
      icon: 'FaGoogle',
      color: 'text-blue-600',
      badge: 'Google',
      description: 'Moteur de recherche'
    },
    {
      label: 'Mots-clés',
      path: '/keywords',
      icon: 'FaSearch',
      color: 'text-green-600',
      description: 'Recherche par mots-clés'
    },
    {
      label: 'Feedback Test',
      path: '/feedback-test',
      icon: 'FaHistory',
      color: 'text-orange-600',
      description: 'Test de feedback'
    },
    {
      label: 'Campagnes',
      path: '/campaigns',
      icon: 'FaEnvelope',
      color: 'text-purple-600',
      description: 'Gestion des campagnes'
    },
    {
      label: 'Test Campagnes',
      path: '/test-campaigns',
      icon: 'FaFlask',
      color: 'text-cyan-600',
      badge: 'Test',
      description: 'Test des campagnes'
    },
    {
      label: 'Templates Email',
      path: '/email-templates',
      icon: 'FaFileAlt',
      color: 'text-pink-600',
      description: 'Templates d\'email'
    },
    {
      label: 'Test Email',
      path: '/email-test',
      icon: 'FaRocket',
      color: 'text-indigo-600',
      description: 'Test d\'envoi email'
    }
  ];

  const iconMap = {
    FaHome, FaUpload, FaTable, FaDownload, FaPlay, FaCog,
    FaSearch, FaList, FaEnvelope, FaChartLine, FaExchangeAlt,
    FaRocket, FaBolt, FaGlobe, FaUsers, FaMap, FaFileAlt,
    FaGoogle, FaEye, FaFilter, FaHistory, FaFlask
  };

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent || FaHome;
  };

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Desktop collapse toggle
  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={toggleMobileMenu}
            className="p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {showMobileMenu && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
            <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
                <h2 className="text-white font-bold text-lg">🔍 Mode Google Search</h2>
              </div>
              
              <nav className="p-4 space-y-2">
                {googleSearchNavigation.map((item, index) => {
                  const Icon = getIcon(item.icon);
                  const isActive = router.pathname === item.path;
                  
                  return (
                    <Link 
                      key={index} 
                      href={item.path}
                      onClick={toggleMobileMenu}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`${item.color} text-lg`} />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div 
      className={`sidebar-google fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-gray-200 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header avec toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
        {!isCollapsed && (
          <div>
            <h2 className="font-bold text-blue-800">🔍 Mode Google Search</h2>
            <p className="text-xs text-blue-600">Recherche & Prospection</p>
          </div>
        )}
        
        <button
          onClick={toggleCollapse}
          className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {googleSearchNavigation.map((item, index) => {
          const Icon = getIcon(item.icon);
          const isActive = router.pathname === item.path;
          
          return (
            <Link 
              key={index} 
              href={item.path}
              className={`group flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 shadow-sm border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
              title={isCollapsed ? `${item.label} - ${item.description}` : ''}
            >
              <Icon className={`${item.color} text-lg flex-shrink-0 ${
                isActive ? 'text-blue-600' : ''
              }`} />
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{item.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer avec mode indicator */}
      {!isCollapsed && (
        <div className="p-4 border-t bg-blue-50">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700 font-medium">Mode Google Actif</span>
          </div>
        </div>
      )}
    </div>
  );
}
