import { useState } from 'react';
import Link from 'next/link';
import { 
  FaSearch, 
  FaChartLine, 
  FaArrowRight, 
  FaGlobe,
  FaDatabase,
  FaEnvelope,
  FaRocket 
} from 'react-icons/fa';

/**
 * Sélecteur de mode de prospection
 * Permet de choisir entre l'analyse de domaines (SEMrush) et la prospection par mots-clés (Google)
 */
export default function ModeSelector() {
  const [hoveredMode, setHoveredMode] = useState(null);

  const modes = [
    {
      id: 'semrush',
      title: 'Analyse de Domaines',
      subtitle: 'Mode SEMrush',
      description: 'Analysez vos concurrents et extrayez des emails depuis des domaines spécifiques',
      color: 'orange',
      icon: FaChartLine,
      features: [
        'Import de domaines (CSV/Manuel)',
        'Données SEMrush (trafic, backlinks, mots-clés)', 
        'Extraction d\'emails ciblée',
        'Analyse concurrentielle approfondie'
      ],
      workflow: [
        'Import des domaines',
        'Analyse SEMrush',
        'Extraction emails', 
        'Validation MX/SMTP',
        'Campagne email'
      ],
      link: '/domains',
      badge: 'Existant'
    },
    {
      id: 'google',
      title: 'Prospection par Mots-clés',
      subtitle: 'Mode Google Search',
      description: 'Découvrez de nouveaux prospects via la recherche Google ciblée',
      color: 'blue',
      icon: FaSearch,
      features: [
        'Import de mots-clés (CSV/Manuel)',
        'Recherche Google pages 4-20',
        'Scraping automatisé des sites',
        'Découverte de nouveaux prospects'
      ],
      workflow: [
        'Import mots-clés',
        'Recherche Google',
        'Scraping sites',
        'Extraction emails',
        'Campagne email'
      ],
      link: '/google-search',
      badge: 'Nouveau'
    }
  ];

  const getColorClasses = (color, variant = 'primary') => {
    const colorMap = {
      orange: {
        primary: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500',
        secondary: 'bg-orange-50 text-orange-700 border-orange-200',
        accent: 'text-orange-500',
        gradient: 'from-orange-400 to-red-500'
      },
      blue: {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
        secondary: 'bg-blue-50 text-blue-700 border-blue-200', 
        accent: 'text-blue-500',
        gradient: 'from-blue-400 to-indigo-500'
      }
    };
    return colorMap[color][variant] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 mb-6">
            <FaRocket className="text-4xl text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Outil de Prospection Hybride
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choisissez votre stratégie de prospection : analysez des domaines concurrents 
            ou découvrez de nouveaux prospects via la recherche Google ciblée.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            const isHovered = hoveredMode === mode.id;
            
            return (
              <div 
                key={mode.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                  isHovered 
                    ? `border-${mode.color}-400 shadow-xl transform scale-[1.02]` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
              >
                
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    mode.badge === 'Nouveau' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {mode.badge}
                  </span>
                </div>

                {/* Header coloré */}
                <div className={`bg-gradient-to-r ${getColorClasses(mode.color, 'gradient')} p-6 text-white relative overflow-hidden`}>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <IconComponent className="text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{mode.title}</h2>
                        <p className="text-white/90 font-medium">{mode.subtitle}</p>
                      </div>
                    </div>
                    
                    <p className="text-white/95 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                  
                  {/* Effet de fond */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full"></div>
                </div>

                <div className="p-6">
                  
                  {/* Fonctionnalités */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FaDatabase className={`mr-2 ${getColorClasses(mode.color, 'accent')}`} />
                      Fonctionnalités clés
                    </h3>
                    <ul className="space-y-2">
                      {mode.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getColorClasses(mode.color, 'accent').replace('text-', 'bg-')}`}></div>
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Workflow */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FaArrowRight className={`mr-2 ${getColorClasses(mode.color, 'accent')}`} />
                      Processus
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {mode.workflow.map((step, index) => (
                        <div key={index} className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(mode.color, 'secondary')}`}>
                            {index + 1}. {step}
                          </span>
                          {index < mode.workflow.length - 1 && (
                            <FaArrowRight className="mx-2 text-gray-400 text-xs" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link href={mode.link}>
                    <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-3 ${getColorClasses(mode.color, 'primary')}`}>
                      <span>Démarrer avec {mode.subtitle}</span>
                      <FaArrowRight className={`transition-transform duration-200 ${isHovered ? 'translate-x-1' : ''}`} />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparaison rapide */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Comparaison des modes
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Critère</th>
                  <th className="text-center py-4 px-6 font-semibold text-orange-700">
                    <div className="flex items-center justify-center space-x-2">
                      <FaChartLine />
                      <span>SEMrush</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-blue-700">
                    <div className="flex items-center justify-center space-x-2">
                      <FaSearch />
                      <span>Google</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Type de source</td>
                  <td className="py-4 px-6 text-center text-gray-700">Domaines connus</td>
                  <td className="py-4 px-6 text-center text-gray-700">Découverte par mots-clés</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Données SEO</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-green-600 font-semibold">✓ Complètes</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-yellow-600 font-semibold">~ Basiques</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Volume de prospects</td>
                  <td className="py-4 px-6 text-center text-gray-700">Limité aux domaines</td>
                  <td className="py-4 px-6 text-center text-gray-700">Potentiellement illimité</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Qualité des données</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-green-600 font-semibold">✓ Très élevée</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-blue-600 font-semibold">✓ Variable</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Temps de traitement</td>
                  <td className="py-4 px-6 text-center text-gray-700">Rapide</td>
                  <td className="py-4 px-6 text-center text-gray-700">Plus long</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Besoin d'aide pour choisir ?
            </h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Les deux modes peuvent être utilisés de manière complémentaire. 
              Commencez par celui qui correspond le mieux à vos besoins actuels !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/help">
                <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Guide de démarrage
                </button>
              </Link>
              <Link href="/settings">
                <button className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-colors border border-indigo-400">
                  Configuration
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
