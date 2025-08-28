import '../styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import TutorialGuide from '../components/TutorialGuide';
import Joyride from 'react-joyride';
import tourSteps from '../components/GuidedTourSteps';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';

function MyApp({ Component, pageProps }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [theme, setTheme] = useState('light');
  const [runTour, setRunTour] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        setRunTour(true);
      }
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);
    }
  }, [router.pathname]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setRunTour(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    document.documentElement.className = newTheme;
  };

  // Détecte la page et charge les étapes du tour
  const pageKey = router.pathname.replace('/', '') || 'index';
  const steps = tourSteps[pageKey] || [];

  return (
    <div className={theme}>
      <button
        onClick={() => { setShowTutorial(true); setRunTour(true); }}
        style={{position: 'fixed', bottom: 70, right: 24, zIndex: 10000, padding: '10px 18px', borderRadius: 8, background: '#0070f3', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}
      >
        Aide
      </button>
      {isClient && (
        <Joyride
          steps={steps}
          run={runTour}
          continuous
          showSkipButton
          showProgress
          locale={{ back: 'Précédent', close: 'Fermer', last: 'Terminer', next: 'Suivant', skip: 'Passer' }}
          styles={{ options: { zIndex: 10001 } }}
          callback={handleCloseTutorial}
        />
      )}
      {showTutorial && <TutorialGuide onClose={handleCloseTutorial} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={router.route}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="min-h-screen w-full"
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

export default MyApp;