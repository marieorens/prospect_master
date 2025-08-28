import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import FluidAdaptiveSidebar from './FluidAdaptiveSidebar';
import SemrushSidebar from './SemrushSidebar';
import GoogleSearchSidebar from './GoogleSearchSidebar';
import { useAppMode } from '../hooks/useAppMode';

export default function Layout({ children, title }) {
  const router = useRouter();
  const currentMode = useAppMode();
  
  // Fonction pour choisir la bonne sidebar selon le mode
  const renderSidebar = () => {
    switch (currentMode.type) {
      case 'google-search':
        return <GoogleSearchSidebar />;
      default:
        return <SemrushSidebar />;
    }
  };
  
  // Titre adaptatif selon le mode
  const getPageTitle = () => {
    const baseTitle = title || (() => {
      switch (currentMode.type) {
        case 'google-search':
          return 'Prospection Google';
        default:
          return 'Analyse SEMrush';
      }
    })();
    
    // S'assurer que le titre est une chaîne
    return typeof baseTitle === 'string' ? baseTitle : 'PROSPECTION';
  };

  // Header adaptatif selon le mode
  const getHeaderTitle = () => {
    switch (currentMode.type) {
      case 'google-search':
        return '🔍 PROSPECTION - Mode Google Search';
      default:
        return '� PROSPECTION - Mode SEMrush';
    }
  };

  const getHeaderColor = () => {
    switch (currentMode.type) {
      case 'google-search':
        return 'text-blue-600';
      default:
        return 'text-orange-600';
    }
  };
  
  return (
    <div className={`min-h-screen flex flex-col ${
      currentMode.type === 'google-search' ? 'sidebar-google' : 'sidebar-semrush'
    }`}>
      <Head>
        <title>{String(getPageTitle())} | PROSPECTION</title>
        <meta name="description" content="Outil de prospection hybride - SEMrush & Google Search" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2">
                  <h1 className={`text-xl font-bold ${getHeaderColor()} hover:opacity-80 transition-opacity`}>
                    {getHeaderTitle()}
                  </h1>
                </Link>
              </div>
            </div>

            {/* Indicateur de mode et sélecteur */}
            <div className="flex items-center space-x-4">
              <select 
                value={currentMode.type}
                onChange={(e) => {
                  // Logique de changement de mode
                  const newMode = e.target.value;
                  if (newMode === 'google-search') {
                    router.push('/google-search');
                  } else {
                    router.push('/domains');
                  }
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                  currentMode.type === 'google-search'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-orange-100 text-orange-800 border-orange-200'
                } cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <option value="semrush">Mode SEMrush</option>
                <option value="google-search">Mode Google Search</option>
              </select>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentMode.type === 'google-search'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-orange-100 text-orange-800 border border-orange-200'
              }`}>
                {currentMode.name}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-grow flex relative">
        {/* Sidebar adaptative selon le mode */}
        {renderSidebar()}
        
        {/* Main content avec spacing approprié et compensation pour sidebar fixe */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 main-content">
          <div className="h-full p-6 max-w-full content-container">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <footer className="bg-white shadow-inner py-3 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} PROSPECTION - Outil de prospection hybride. Mode {currentMode.name} actif.
          </p>
        </div>
      </footer>
    </div>
  );
}