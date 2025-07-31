// Test script to verify login functionality with both email and username
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    // First, let's register a test user
    console.log('Creating test user...');
    const registerResponse = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
    });

    const registerResult = await registerResponse.json();
    console.log('Registration result:', registerResult);

    if (!registerResponse.ok && !registerResult.error?.includes('already exists')) {
      throw new Error(`Registration failed: ${registerResult.error}`);
    }

    // Test login with email
    console.log('\n--- Testing login with email ---');
    const emailLoginResponse = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'TestPassword123!'
      })
    });

    const emailLoginResult = await emailLoginResponse.json();
    console.log('Email login result:', emailLoginResult);

    // Test login with username
    console.log('\n--- Testing login with username ---');
    const usernameLoginResponse = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'testuser',
        password: 'TestPassword123!'
      })
    });

    const usernameLoginResult = await usernameLoginResponse.json();
    console.log('Username login result:', usernameLoginResult);

    // Test with wrong credentials
    console.log('\n--- Testing with wrong credentials ---');
    const wrongLoginResponse = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'WrongPassword123!'
      })
    });

    const wrongLoginResult = await wrongLoginResponse.json();
    console.log('Wrong credentials result:', wrongLoginResult);

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLogin();
