import { useRouter } from 'next/router';
import { useAppMode } from '../hooks/useAppMode';
import Layout from '../components/Layout';

export default function ModeDebug() {
  const router = useRouter();
  const currentMode = useAppMode();

  return (
    <Layout title="Mode Debug">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug des Modes</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <strong>URL actuelle:</strong> {router.pathname}
          </div>
          <div>
            <strong>Mode détecté:</strong> {currentMode.type}
          </div>
          <div>
            <strong>Nom du mode:</strong> {currentMode.name}
          </div>
          <div>
            <strong>Couleur:</strong> {currentMode.color}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Test des URLs:</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/google-search')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              /google-search
            </button>
            <button 
              onClick={() => router.push('/keywords')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              /keywords
            </button>
            <button 
              onClick={() => router.push('/campaigns')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              /campaigns
            </button>
            <button 
              onClick={() => router.push('/test-campaigns')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              /test-campaigns
            </button>
            <button 
              onClick={() => router.push('/email-templates')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              /email-templates
            </button>
            <button 
              onClick={() => router.push('/email-test')}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              /email-test
            </button>
            <button 
              onClick={() => router.push('/domains')}
              className="p-3 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              /domains (SEMrush)
            </button>
            <button 
              onClick={() => router.push('/import')}
              className="p-3 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              /import (SEMrush)
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
