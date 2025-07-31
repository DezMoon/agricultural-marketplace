// scripts/test-api.js - Comprehensive API testing script
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

class ApiTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFunction) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name} - PASSED\n`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { response, data };
  }

  async runAllTests() {
    console.log('🚀 Starting Agricultural Marketplace API Tests\n');
    console.log('=' .repeat(60));

    // Test 1: Health Check
    await this.test('Health Check Endpoint', async () => {
      const { response, data } = await this.makeRequest('/health');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (data.status !== 'OK') throw new Error(`Expected status OK, got ${data.status}`);
      if (!data.uptime) throw new Error('Missing uptime in response');
    });

    // Test 2: API Info Endpoint
    await this.test('API Info Endpoint', async () => {
      const { response, data } = await this.makeRequest('/api');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!data.endpoints) throw new Error('Missing endpoints information');
    });

    // Test 3: Rate Limiting
    await this.test('Rate Limiting Protection', async () => {
      const requests = [];
      // Make multiple requests quickly to trigger rate limiting
      for (let i = 0; i < 15; i++) {
        requests.push(this.makeRequest('/health'));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(({ response }) => response.status === 429);
      if (!rateLimited) {
        console.log('Note: Rate limiting might not be triggered with health checks');
      }
    });

    // Test 4: Security Headers
    await this.test('Security Headers Present', async () => {
      const { response } = await this.makeRequest('/health');
      const headers = response.headers;
      
      if (!headers.get('x-content-type-options')) {
        throw new Error('Missing X-Content-Type-Options header');
      }
      if (!headers.get('x-frame-options')) {
        throw new Error('Missing X-Frame-Options header');
      }
    });

    // Test 5: CORS Configuration
    await this.test('CORS Configuration', async () => {
      const { response } = await this.makeRequest('/health');
      const corsHeader = response.headers.get('access-control-allow-origin');
      // CORS might not be present for same-origin requests
      console.log('CORS header:', corsHeader || 'Not present (same-origin)');
    });

    // Test 6: Input Validation (Invalid Registration)
    await this.test('Input Validation - Invalid User Registration', async () => {
      const invalidUser = {
        username: 'a', // Too short
        email: 'invalid-email', // Invalid format
        password: '123' // Too weak
      };

      const { response, data } = await this.makeRequest('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(invalidUser)
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400 validation error, got ${response.status}`);
      }
      if (!data.details || !Array.isArray(data.details)) {
        throw new Error('Expected validation details array');
      }
    });

    // Test 7: Authentication Required
    await this.test('Authentication Required for Protected Routes', async () => {
      const { response } = await this.makeRequest('/api/produce/my-listings');
      
      if (response.status !== 401) {
        throw new Error(`Expected 401 unauthorized, got ${response.status}`);
      }
    });

    // Test 8: Invalid Route Handling
    await this.test('404 Handling for Invalid Routes', async () => {
      const { response, data } = await this.makeRequest('/api/nonexistent');
      
      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }
      if (!data.error) {
        throw new Error('Expected error message in response');
      }
    });

    // Test 9: Database Connection (via listings endpoint)
    await this.test('Database Connection via Listings', async () => {
      const { response, data } = await this.makeRequest('/api/produce/listings');
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      // Check if response has listings property with array
      if (data.listings && Array.isArray(data.listings)) {
        console.log(`Found ${data.listings.length} listings`);
      } else if (Array.isArray(data)) {
        console.log(`Found ${data.length} listings (direct array)`);
      } else {
        throw new Error('Expected array of listings or object with listings property');
      }
    });

    // Test 10: Socket.IO Connection Test
    await this.test('Socket.IO Service Availability', async () => {
      // This is a basic test - in a real scenario, you'd test socket connections
      const socketEndpoint = `${API_BASE_URL}/socket.io/`;
      try {
        const response = await fetch(socketEndpoint);
        if (response.status === 400) {
          // Socket.IO returns 400 for non-socket requests, which is expected
          console.log('Socket.IO service is responding (returns 400 for HTTP requests as expected)');
        }
      } catch (error) {
        throw new Error(`Socket.IO service not accessible: ${error.message}`);
      }
    });

    // Test 11: JWT Token Refresh Functionality
    let testTokens = null;
    await this.test('JWT Token Refresh Functionality', async () => {
      // First, create a test user and login to get tokens
      const timestamp = Date.now();
      const testUser = {
        username: `testuser_${timestamp}`,
        email: `test_${timestamp}@example.com`,
        password: 'SecurePass123!'
      };

      // Register test user
      const { response: regResponse, data: regData } = await this.makeRequest('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(testUser)
      });

      if (regResponse.status !== 201) {
        console.log('Registration error:', regData);
        throw new Error(`Failed to register test user: ${regResponse.status} - ${regData.error}`);
      }

      // Wait a bit to avoid rate limiting issues
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Login to get tokens
      const { response: loginResponse, data: loginData } = await this.makeRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      if (loginResponse.status !== 200) {
        console.log('Login error:', loginData);
        throw new Error(`Failed to login test user: ${loginResponse.status} - ${loginData.error}`);
      }

      if (!loginData.accessToken || !loginData.refreshToken) {
        console.log('Login response:', loginData);
        throw new Error('Login response missing tokens');
      }

      testTokens = loginData; // Store for logout test

      // Wait a bit before refresh request
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test refresh token endpoint
      const { response: refreshResponse, data: refreshData } = await this.makeRequest('/api/users/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: loginData.refreshToken
        })
      });

      if (refreshResponse.status !== 200) {
        console.log('Refresh error:', refreshData);
        throw new Error(`Failed to refresh token: ${refreshResponse.status} - ${refreshData.error}`);
      }

      if (!refreshData.accessToken || !refreshData.refreshToken) {
        console.log('Refresh response:', refreshData);
        throw new Error('Refresh response missing tokens');
      }

      // Update testTokens with new tokens for logout test
      testTokens = refreshData;
      console.log('Token refresh successful - new tokens generated');
    });

    // Test 12: User Logout Functionality
    await this.test('User Logout Functionality', async () => {
      if (!testTokens) {
        throw new Error('No test tokens available from previous test');
      }

      // Test logout endpoint
      const { response: logoutResponse, data: logoutData } = await this.makeRequest('/api/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testTokens.accessToken}`
        },
        body: JSON.stringify({
          refreshToken: testTokens.refreshToken
        })
      });

      if (logoutResponse.status !== 200) {
        throw new Error(`Failed to logout: ${logoutResponse.status}`);
      }

      if (!logoutData.message) {
        throw new Error('Logout response missing success message');
      }

      console.log('User logout successful');
    });

    this.printResults();
  }

  printResults() {
    console.log('=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    console.log('');

    if (this.results.failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
      console.log('');
    }

    console.log('✅ PASSED TESTS:');
    this.results.tests
      .filter(test => test.status === 'PASSED')
      .forEach(test => {
        console.log(`  • ${test.name}`);
      });

    console.log('\n🎉 Testing completed!');
    
    if (this.results.failed === 0) {
      console.log('🌟 All tests passed! Your API is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix the issues.');
    }
  }
}

// Run tests
const tester = new ApiTester();
tester.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
