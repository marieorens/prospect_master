import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaHome, FaUpload, FaTable, FaDownload, FaPlay, FaCog,
  FaSearch, FaList, FaEnvelope, FaChartLine, FaExchangeAlt,
  FaRocket, FaBolt, FaGlobe, FaBars, FaTimes,
  FaChevronLeft, FaChevronRight, FaUsers, FaMap, FaFileAlt,
  FaDatabase, FaEye, FaChartPie, FaFlask
} from 'react-icons/fa';

/**
 * Sidebar spécifique au mode SEMrush
 */
export default function SemrushSidebar() {
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

  // Navigation spécifique au mode SEMrush
  const semrushNavigation = [
    {
      label: 'Dashboard',
      path: '/',
      icon: 'FaHome',
      color: 'text-orange-600',
      description: 'Vue d\'ensemble'
    },
    {
      label: 'Analyse Domaines',
      path: '/domains',
      icon: 'FaSearch',
      color: 'text-orange-600',
      badge: 'SEMrush',
      description: 'Import et analyse SEMrush'
    },
    {
      label: 'Import CSV',
      path: '/import',
      icon: 'FaUpload',
      color: 'text-blue-600',
      description: 'Importer domaines'
    },
    {
      label: 'Lancer Scraping',
      path: '/scrape',
      icon: 'FaRocket',
      color: 'text-green-600',
      description: 'Start scraping process'
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: 'FaChartLine',
      color: 'text-pink-600',
      description: 'Analytics dashboard'
    },
    {
      label: 'A/B Testing',
      path: '/ab-testing',
      icon: 'FaFlask',
      color: 'text-cyan-600',
      badge: 'Beta',
      description: 'Test campaigns'
    },
    {
      label: 'Export Data',
      path: '/export',
      icon: 'FaDownload',
      color: 'text-indigo-600',
      description: 'Download Excel export'
    },
    {
      label: 'Performance',
      path: '/performance',
      icon: 'FaBolt',
      color: 'text-yellow-600',
      description: 'System performance'
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: 'FaEnvelope',
      color: 'text-red-600',
      description: 'Alert center'
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: 'FaCog',
      color: 'text-gray-600',
      description: 'Configuration'
    }
  ];

  const iconMap = {
    FaHome, FaUpload, FaTable, FaDownload, FaPlay, FaCog,
    FaSearch, FaList, FaEnvelope, FaChartLine, FaExchangeAlt,
    FaRocket, FaBolt, FaGlobe, FaUsers, FaMap, FaFileAlt,
    FaDatabase, FaEye, FaChartPie, FaFlask
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
            className="p-2 bg-orange-600 text-white rounded-lg shadow-lg hover:bg-orange-700 transition-colors"
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {showMobileMenu && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
            <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600">
                <h2 className="text-white font-bold text-lg">📊 Mode SEMrush</h2>
              </div>
              
              <nav className="p-4 space-y-2">
                {semrushNavigation.map((item, index) => {
                  const Icon = getIcon(item.icon);
                  const isActive = router.pathname === item.path;
                  
                  return (
                    <Link 
                      key={index} 
                      href={item.path}
                      onClick={toggleMobileMenu}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-orange-100 text-orange-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`${item.color} text-lg`} />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
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
      className={`sidebar-semrush fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-gray-200 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header avec toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-orange-100">
        {!isCollapsed && (
          <div>
            <h2 className="font-bold text-orange-800">📊 Mode SEMrush</h2>
            <p className="text-xs text-orange-600">Analyse & Prospection</p>
          </div>
        )}
        
        <button
          onClick={toggleCollapse}
          className="p-2 text-orange-600 hover:bg-orange-200 rounded-lg transition-colors"
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {semrushNavigation.map((item, index) => {
          const Icon = getIcon(item.icon);
          const isActive = router.pathname === item.path;
          
          return (
            <Link 
              key={index} 
              href={item.path}
              className={`group flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-orange-100 text-orange-700 shadow-sm border-l-4 border-orange-500'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
              }`}
              title={isCollapsed ? `${item.label} - ${item.description}` : ''}
            >
              <Icon className={`${item.color} text-lg flex-shrink-0 ${
                isActive ? 'text-orange-600' : ''
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
        <div className="p-4 border-t bg-orange-50">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-orange-700 font-medium">Mode SEMrush Actif</span>
          </div>
        </div>
      )}
    </div>
  );
}
