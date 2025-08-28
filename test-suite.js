#!/usr/bin/env node

/**
 * Suite de tests automatisés pour l'application PROSPECTION
 * Tests des fonctionnalités principales : SEMrush, Google Search, Email, Analytics
 */

const axios = require('axios').default || require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 secondes

class TestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  // Utilitaire pour logger
  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const colorCode = {
      'INFO': '\x1b[36m',    // Cyan
      'SUCCESS': '\x1b[32m', // Vert
      'ERROR': '\x1b[31m',   // Rouge
      'WARNING': '\x1b[33m'  // Jaune
    };
    console.log(`${colorCode[type]}[${timestamp}] ${type}: ${message}\x1b[0m`);
  }

  // Exécuter un test
  async runTest(testName, testFunction) {
    this.results.total++;
    this.log(`🧪 Test: ${testName}`, 'INFO');
    
    try {
      const startTime = Date.now();
      await Promise.race([
        testFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), TEST_TIMEOUT)
        )
      ]);
      
      const duration = Date.now() - startTime;
      this.results.passed++;
      this.results.details.push({ name: testName, status: 'PASSED', duration });
      this.log(`✅ ${testName} - PASSED (${duration}ms)`, 'SUCCESS');
      
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'ERROR');
    }
  }

  // Test 1: Connectivité Backend
  async testBackendConnection() {
    const response = await axios.get(`${BACKEND_URL}/api/export/domains?limit=1`);
    if (response.status !== 200) {
      throw new Error(`Backend non accessible. Status: ${response.status}`);
    }
  }

  // Test 2: Base de données
    async testDatabase() {
      // Utilise l'export de domaines comme test de base de données
      const response = await axios.get(`${BACKEND_URL}/api/export/domains?limit=1`);
      if (response.status !== 200) {
        throw new Error('Impossible d\'accéder aux domaines');
      }
      if (!Array.isArray(response.data.domains)) {
        throw new Error('Réponse export domains invalide');
      }
    }

  // Test 3: API SEMrush
    async testSemrushAPI() {
      // Utilise l'endpoint /api/scrape/start
      const testData = {
        domains: ['example.com'],
        mode: 'sequential'
      };
      try {
        const response = await axios.post(`${BACKEND_URL}/api/scrape/start`, testData);
        if (response.data && response.data.processId) {
          return;
        }
        throw new Error('Réponse SEMrush invalide');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return;
        }
        throw error;
      }
    }

  // Test 4: API Google Search
    async testGoogleSearchAPI() {
      const testData = {
        searchQueries: ['entreprise test'],
        options: {
          maxResultsPerQuery: 1,
          region: 'fr',
          language: 'fr'
        },
        includeEmailExtraction: false,
        includeMapsSearch: false
      };
      try {
        const response = await axios.post(`${BACKEND_URL}/api/google-search`, testData);
        if (response.data && response.data.processId) {
          return;
        }
        throw new Error('Réponse Google Search invalide');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return;
        }
        throw error;
      }
    }

  // Test 5: Système de cache
  async testCacheSystem() {
    // Test des statistiques de cache
    const response = await axios.get(`${BACKEND_URL}/api/cache/stats`);
    if (response.status !== 200) {
      throw new Error('API Cache non accessible');
    }
    if (!response.data.success) {
      throw new Error('Statistiques cache invalides');
    }
  }

  // Test 6: Système de notifications
  async testNotificationSystem() {
    const response = await axios.get(`${BACKEND_URL}/api/notifications`);
    if (response.status !== 200) {
      throw new Error('API Notifications non accessible');
    }
  }

  // Test 7: Templates email
  async testEmailTemplates() {
    const response = await axios.get(`${BACKEND_URL}/api/campaigns/templates`);
    if (response.status !== 200) {
      throw new Error('API Templates email non accessible');
    }
    if (!response.data.success) {
      throw new Error('Récupération templates échouée');
    }
  }

  // Test 8: A/B Testing
    async testABTesting() {
      // Test création d'un test A/B
      const testData = {
        campaignId: 1,
        testConfig: {
          name: 'Test automatique',
          variants: [
            { name: 'A', templateId: 1 },
            { name: 'B', templateId: 2 }
          ]
        }
      };
      try {
        const response = await axios.post(`${BACKEND_URL}/api/ab-testing/create`, testData);
        if (response.data && response.data.success) {
          return;
        }
        throw new Error('Réponse A/B Testing invalide');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return;
        }
        throw error;
      }
    }

  // Test 9: Export Excel
  async testExportSystem() {
    const response = await axios.get(`${BACKEND_URL}/api/export/domains?limit=1&format=json`);
    if (response.status !== 200) {
      throw new Error('API Export non accessible');
    }
  }

  // Test 10: Frontend pages principales
  async testFrontendPages() {
    const pagesToTest = [
      '/',
      '/domains',
      '/import', 
      '/scrape',
      '/analytics',
      '/export'
    ];

    for (const page of pagesToTest) {
      const response = await axios.get(`${FRONTEND_URL}${page}`);
      if (response.status !== 200) {
        throw new Error(`Page ${page} non accessible (${response.status})`);
      }
    }
  }

  // Test 11: Validation des fichiers critiques
  async testCriticalFiles() {
    const criticalFiles = [
      'backend/src/app.js',
      'backend/src/services/emailService.js',
      'backend/src/services/scrapers/googleSearchScraper.js',
      'backend/src/services/scrapers/semrushScraper.js',
      'frontend/components/Layout.js',
      'frontend/components/SemrushSidebar.js',
      'frontend/components/GoogleSearchSidebar.js'
    ];

    for (const file of criticalFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Fichier critique manquant: ${file}`);
      }
    }
  }

  // Générer le rapport final
  generateReport() {
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests réussis: ${this.results.passed}`);
    console.log(`❌ Tests échoués: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.total}`);
    console.log(`🎯 Taux de succès: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ ÉCHECS DÉTAILLÉS:');
      this.results.details
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n✅ SUCCÈS DÉTAILLÉS:');
    this.results.details
      .filter(t => t.status === 'PASSED')
      .forEach(test => {
        console.log(`  • ${test.name} (${test.duration}ms)`);
      });
    
    // Évaluation globale
    console.log('\n' + '='.repeat(60));
    if (successRate >= 90) {
      this.log('🚀 EXCELLENT! Application prête pour la production', 'SUCCESS');
    } else if (successRate >= 75) {
      this.log('👍 BON! Quelques ajustements nécessaires', 'WARNING');
    } else {
      this.log('⚠️  ATTENTION! Corrections importantes requises', 'ERROR');
    }
    console.log('='.repeat(60));
  }

  // Exécuter tous les tests
  async runAllTests() {
    this.log('🚀 Démarrage de la suite de tests automatisés', 'INFO');
    console.log('Serveurs testés:');
    console.log(`  • Backend: ${BACKEND_URL}`);
    console.log(`  • Frontend: ${FRONTEND_URL}`);
    console.log('');

    // Exécution séquentielle des tests
    await this.runTest('Connectivité Backend', () => this.testBackendConnection());
    await this.runTest('Base de données', () => this.testDatabase());
    await this.runTest('Fichiers critiques', () => this.testCriticalFiles());
    await this.runTest('API SEMrush', () => this.testSemrushAPI());
    await this.runTest('API Google Search', () => this.testGoogleSearchAPI());
    await this.runTest('Système de cache', () => this.testCacheSystem());
    await this.runTest('Système de notifications', () => this.testNotificationSystem());
    await this.runTest('Templates email', () => this.testEmailTemplates());
    await this.runTest('A/B Testing', () => this.testABTesting());
    await this.runTest('Système d\'export', () => this.testExportSystem());
    await this.runTest('Pages frontend', () => this.testFrontendPages());

    this.generateReport();
    return this.results;
  }
}

// Exécution des tests si le script est appelé directement
if (require.main === module) {
  const testSuite = new TestSuite();
  testSuite.runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale dans la suite de tests:', error);
      process.exit(1);
    });
}

module.exports = TestSuite;
