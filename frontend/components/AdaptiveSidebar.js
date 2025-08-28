import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaHome, 
  FaUpload, 
  FaTable, 
  FaDownload, 
  FaPlay, 
  FaCog,
  FaSearch,
  FaList,
  FaEnvelope,
  FaChartLine,
  FaExchangeAlt,
  FaRocket,
  FaBolt,
  FaGlobe
} from 'react-icons/fa';
import { useAppMode, getNavigationForMode } from '../hooks/useAppMode';

/**
 * Composant Sidebar adaptatif selon le mode
 */
export default function AdaptiveSidebar() {
  const router = useRouter();
  const currentMode = useAppMode();
  const navigationItems = getNavigationForMode(currentMode.type);

  // Mapping des icônes
  const iconMap = {
    FaHome: FaHome,
    FaUpload: FaUpload,
    FaTable: FaTable,
    FaDownload: FaDownload,
    FaPlay: FaPlay,
    FaCog: FaCog,
    FaSearch: FaSearch,
    FaList: FaList,
    FaEnvelope: FaEnvelope,
    FaChartLine: FaChartLine,
    FaExchangeAlt: FaExchangeAlt,
    FaRocket: FaRocket,
    FaBolt: FaBolt,
    FaGlobe: FaGlobe
  };

  // Couleurs selon le mode
  const getColorClasses = (variant = 'default') => {
    const baseColors = {
      semrush: {
        header: 'bg-orange-500',
        headerText: 'text-white',
        active: 'bg-orange-100 text-orange-900',
        activeIcon: 'text-orange-600',
        hover: 'hover:bg-orange-50',
        primary: 'bg-orange-50 border-l-4 border-orange-500',
        switch: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      },
      'google-search': {
        header: 'bg-blue-500',
        headerText: 'text-white',
        active: 'bg-blue-100 text-blue-900',
        activeIcon: 'text-blue-600',
        hover: 'hover:bg-blue-50',
        primary: 'bg-blue-50 border-l-4 border-blue-500',
        switch: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      },
      common: {
        header: 'bg-gray-500',
        headerText: 'text-white',
        active: 'bg-gray-100 text-gray-900',
        activeIcon: 'text-gray-600',
        hover: 'hover:bg-gray-50',
        primary: 'bg-gray-50 border-l-4 border-gray-500',
        switch: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
      },
      dashboard: {
        header: 'bg-indigo-500',
        headerText: 'text-white',
        active: 'bg-indigo-100 text-indigo-900',
        activeIcon: 'text-indigo-600',
        hover: 'hover:bg-indigo-50',
        primary: 'bg-indigo-50 border-l-4 border-indigo-500',
        switch: 'bg-green-100 text-green-700 hover:bg-green-200'
      }
    };

    return baseColors[currentMode.type] || baseColors.dashboard;
  };

  const colorClasses = getColorClasses();

  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="mr-3 w-5 h-5" /> : null;
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Header du mode actuel */}
      <div className={`${colorClasses.header} ${colorClasses.headerText} p-4`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            {currentMode.type === 'semrush' && <FaChartLine className="w-6 h-6" />}
            {currentMode.type === 'google-search' && <FaSearch className="w-6 h-6" />}
            {currentMode.type === 'common' && <FaCog className="w-6 h-6" />}
            {currentMode.type === 'dashboard' && <FaRocket className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="font-bold text-lg">{currentMode.name}</h2>
            <p className="text-xs opacity-90">{currentMode.description}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 px-2 pb-4">
        <div className="space-y-1">
          {navigationItems.map((item, index) => {
            // Divider
            if (item.type === 'divider') {
              return (
                <hr key={`divider-${index}`} className="my-3 border-gray-200" />
              );
            }

            const isActive = router.pathname === item.href;
            const IconComponent = iconMap[item.icon];
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  item.disabled 
                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                    : isActive
                      ? `${colorClasses.active} shadow-sm`
                      : item.variant === 'switch'
                        ? `${colorClasses.switch} border`
                        : item.primary
                          ? `${colorClasses.primary} text-gray-800`
                          : `text-gray-600 ${colorClasses.hover} hover:text-gray-900`
                }`}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <div className={`${
                  isActive 
                    ? colorClasses.activeIcon 
                    : item.variant === 'switch'
                      ? 'inherit'
                      : 'text-gray-400 group-hover:text-gray-600'
                } transition-colors duration-200`}>
                  {IconComponent ? <IconComponent className="w-5 h-5 mr-3" /> : renderIcon(item.icon)}
                </div>
                
                <span className="flex-1">
                  {item.label}
                </span>

                {/* Badges */}
                {item.disabled && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                    Bientôt
                  </span>
                )}

                {item.primary && !isActive && (
                  <div className="w-2 h-2 bg-current opacity-50 rounded-full ml-2" />
                )}

                {item.variant === 'switch' && (
                  <div className="ml-2">
                    <FaExchangeAlt className="w-3 h-3" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer avec stats du mode */}
      <div className="absolute bottom-4 left-2 right-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Mode actuel:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentMode.type === 'semrush' 
                ? 'bg-orange-100 text-orange-800'
                : currentMode.type === 'google-search'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentMode.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
