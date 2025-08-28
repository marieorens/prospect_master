/**
 * Script de test pour l'API Google Search
 * Usage: node examples/test_google_search.js
 */

const fetch = require('node-fetch');

async function testGoogleSearchAPI() {
  console.log('🔍 Test de l\'API Google Search...\n');

  const testData = {
    searchQueries: [
      'agence web Lyon',
      'cabinet comptable Paris'
    ],
    options: {
      maxResultsPerQuery: 5,
      region: 'fr',
      language: 'fr',
      businessType: '',
      location: 'France',
      emailOptions: {
        maxConcurrent: 2,
        maxEmailsPerCompany: 3,
        skipSocialMedia: true
      }
    },
    includeEmailExtraction: true,
    includeMapsSearch: false
  };

  try {
    console.log('Requête de test:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n📡 Envoi de la requête...\n');

    const response = await fetch('http://localhost:4000/api/google-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Succès !');
      console.log(`📊 Process ID: ${result.processId}`);
      
      if (result.data) {
        console.log(`🏢 Entreprises trouvées: ${result.data.companies.length}`);
        console.log(`📧 Emails totaux: ${result.data.stats.totalEmails}`);
        console.log(`✅ Emails valides: ${result.data.stats.validEmails}`);

        // Afficher quelques exemples
        console.log('\n📋 Exemples d\'entreprises:');
        result.data.companies.slice(0, 3).forEach((company, index) => {
          console.log(`\n${index + 1}. ${company.companyName}`);
          console.log(`   🌐 Domaine: ${company.domain}`);
          console.log(`   📧 Emails: ${company.contactInfo?.emails?.join(', ') || 'Aucun'}`);
          console.log(`   🏷️ Secteur: ${company.businessInfo?.sector}`);
          console.log(`   📍 Source: ${company.source}`);
        });
      }

      // Suivi du processus en temps réel
      if (result.processId) {
        console.log('\n🔄 Suivi du processus...');
        await trackProcess(result.processId);
      }

    } else {
      console.log('❌ Erreur:', result.error);
    }

  } catch (error) {
    console.error('💥 Erreur de test:', error.message);
  }
}

async function trackProcess(processId) {
  let attempts = 0;
  const maxAttempts = 30; // 30 secondes max

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:4000/api/google-search/process/${processId}`);
      const data = await response.json();

      if (data.success && data.process) {
        const process = data.process;
        
        console.log(`\n📊 Statut: ${process.status} (${process.progress}%)`);
        console.log(`⏱️ Étape: ${process.currentStep}/${process.totalSteps}`);
        
        if (process.recentSteps && process.recentSteps.length > 0) {
          const lastStep = process.recentSteps[process.recentSteps.length - 1];
          console.log(`🔧 Dernière action: ${lastStep.description}`);
        }

        if (process.status === 'completed') {
          console.log('\n🎉 Processus terminé avec succès !');
          if (process.results) {
            console.log(`📊 Résultats finaux: ${process.results.totalCompanies} entreprises`);
          }
          break;
        }

        if (process.status === 'error') {
          console.log('\n❌ Processus échoué');
          break;
        }

        // Attendre 2 secondes avant le prochain check
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

      } else {
        console.log('❌ Impossible de récupérer le statut du processus');
        break;
      }
    } catch (error) {
      console.log('⚠️ Erreur lors du suivi:', error.message);
      break;
    }
  }
}

// Fonction utilitaire
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lancer le test
if (require.main === module) {
  console.log('🚀 Démarrage du test Google Search API\n');
  testGoogleSearchAPI()
    .then(() => {
      console.log('\n✨ Test terminé !');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erreur du test:', error);
      process.exit(1);
    });
}

module.exports = { testGoogleSearchAPI };
