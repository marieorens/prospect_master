import React, { useState } from 'react';

const steps = [
  {
    title: 'Bienvenue !',
    description: 'Ce guide vous accompagne pour découvrir les principales étapes de la prospection.'
  },
  {
    title: 'Étape 1 : Importer ou Rechercher',
    description: 'Importez un fichier de domaines ou lancez une recherche Google selon votre besoin.'
  },
  {
    title: 'Étape 2 : Scraper ou Extraire',
    description: 'Lancez le scraping SEMrush ou l’extraction d’emails sur les résultats obtenus.'
  },
  {
    title: 'Étape 3 : Campagne Email',
    description: 'Créez et envoyez une campagne email personnalisée à vos prospects.'
  },
  {
    title: 'Étape 4 : Analyse & Export',
    description: 'Consultez les statistiques et exportez vos résultats pour exploitation.'
  },
  {
    title: 'Fin du tutoriel',
    description: 'Vous pouvez relancer ce guide à tout moment depuis le menu Aide.'
  }
];

export default function TutorialGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const isDark = typeof document !== 'undefined' && document.documentElement.className === 'dark';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: isDark ? 'rgba(20,20,20,0.7)' : 'rgba(0,0,0,0.4)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: isDark ? '#222' : '#fff',
        color: isDark ? '#fff' : '#222',
        borderRadius: 12,
        padding: 32,
        maxWidth: 400,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ marginBottom: 12 }}>{steps[step].title}</h2>
        <p style={{ marginBottom: 24 }}>{steps[step].description}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ padding: '8px 16px' }}>
              Précédent
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} style={{ padding: '8px 16px', marginLeft: 8 }}>
              Suivant
            </button>
          ) : (
            <button onClick={onClose} style={{ padding: '8px 16px', marginLeft: 8 }}>
              Terminer
            </button>
          )}
          <button onClick={onClose} style={{ padding: '8px 16px', marginLeft: 8 }}>
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}
