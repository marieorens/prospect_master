const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testSystem() {
  console.log('🚀 Testing completed system integration...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', health.data);

    // Test 2: Cache Stats
    console.log('\n2. Testing Cache Stats...');
    const cacheStats = await axios.get(`${BASE_URL}/cache/stats`);
    console.log('✅ Cache stats:', cacheStats.data);

    // Test 3: Cache Warm
    console.log('\n3. Testing Cache Warm...');
    const cacheWarm = await axios.post(`${BASE_URL}/cache/warm`);
    console.log('✅ Cache warming:', cacheWarm.data);

    // Test 4: Analytics Global Metrics
    console.log('\n4. Testing Analytics Global Metrics...');
    const analytics = await axios.get(`${BASE_URL}/analytics/global`);
    console.log('✅ Global analytics:', analytics.data);

    // Test 5: Template Performance
    console.log('\n5. Testing Template Performance...');
    const templates = await axios.get(`${BASE_URL}/analytics/templates/performance`);
    console.log('✅ Template performance:', templates.data);

    // Test 6: Notifications
    console.log('\n6. Testing Notifications...');
    const notifications = await axios.get(`${BASE_URL}/notifications`);
    console.log('✅ Notifications:', notifications.data);

    // Test 7: A/B Testing
    console.log('\n7. Testing A/B Testing...');
    const abTests = await axios.get(`${BASE_URL}/ab-testing/tests`);
    console.log('✅ A/B Testing:', abTests.data);

    console.log('\n🎉 All systems operational!');
    
  } catch (error) {
    console.error('❌ Error testing system:', error.response?.data || error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testSystem();
}

module.exports = { testSystem };
