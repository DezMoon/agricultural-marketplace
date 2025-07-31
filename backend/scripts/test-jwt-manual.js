// scripts/test-jwt-manual.js - Manual JWT refresh test
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function makeRequest(endpoint, options = {}) {
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

async function testJwtRefresh() {
  console.log('🧪 Manual JWT Refresh Test');
  
  try {
    // Use a unique identifier to avoid conflicts
    const timestamp = Date.now();
    const testUser = {
      username: `jwt_test_${timestamp}`,
      email: `jwt_test_${timestamp}@example.com`,
      password: 'TestPassword123!'
    };

    console.log('1. Registering test user...');
    const { response: regResponse, data: regData } = await makeRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    if (regResponse.status !== 201) {
      console.error('Registration failed:', regData);
      return;
    }
    console.log('✅ User registered successfully');

    console.log('2. Logging in...');
    const { response: loginResponse, data: loginData } = await makeRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (loginResponse.status !== 200) {
      console.error('Login failed:', loginData);
      return;
    }
    console.log('✅ Login successful, tokens received');
    console.log('   Access token length:', loginData.accessToken?.length);
    console.log('   Refresh token length:', loginData.refreshToken?.length);

    console.log('3. Testing token refresh...');
    const { response: refreshResponse, data: refreshData } = await makeRequest('/api/users/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: loginData.refreshToken
      })
    });

    if (refreshResponse.status !== 200) {
      console.error('Token refresh failed:', refreshData);
      return;
    }
    console.log('✅ Token refresh successful');
    console.log('   New access token length:', refreshData.accessToken?.length);
    console.log('   New refresh token length:', refreshData.refreshToken?.length);

    console.log('4. Testing logout...');
    const { response: logoutResponse, data: logoutData } = await makeRequest('/api/users/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshData.accessToken}`
      },
      body: JSON.stringify({
        refreshToken: refreshData.refreshToken
      })
    });

    if (logoutResponse.status !== 200) {
      console.error('Logout failed:', logoutData);
      return;
    }
    console.log('✅ Logout successful');

    console.log('\n🎉 All JWT tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJwtRefresh();
