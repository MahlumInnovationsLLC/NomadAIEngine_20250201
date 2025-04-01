#!/usr/bin/env node

/**
 * Test script for custom domain configuration
 * This script can be run to verify that your server can handle requests from custom domains
 * 
 * Usage: node scripts/test-custom-domain.js [domain]
 * Example: node scripts/test-custom-domain.js myapp.example.com
 */

import fetch from 'node-fetch';
import http from 'http';
import https from 'https';

// Configuration
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Set long timeout for requests
const httpAgent = new http.Agent({ timeout: 30000 });
const httpsAgent = new https.Agent({ timeout: 30000 });

// Helper for sending HTTP requests
async function sendRequest(url, options = {}) {
  console.log(`Testing: ${url}`);
  try {
    const response = await fetch(url, {
      ...options,
      agent: url.startsWith('https') ? httpsAgent : httpAgent,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Custom-Domain-Test-Script/1.0',
        ...(options.headers || {})
      }
    });
    
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const content = isJson ? await response.json() : await response.text();
    
    console.log(`Status: ${response.status}`);
    if (isJson) {
      console.log('Response:', JSON.stringify(content, null, 2));
    } else {
      console.log(`Response: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`);
    }
    
    return { success: response.status >= 200 && response.status < 300, response, content };
  } catch (error) {
    console.error(`Error accessing ${url}:`, error.message);
    return { success: false, error };
  }
}

async function runTests() {
  // Get domain from command line args or use localhost
  const domain = process.argv[2] || `localhost:${PORT}`;
  const isCustomDomain = !domain.includes('localhost') && !domain.includes('127.0.0.1');
  const baseUrl = isCustomDomain ? `https://${domain}` : `http://${domain}`;
  
  console.log('==================================');
  console.log(`Testing domain: ${domain}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('==================================\n');
  
  // Test endpoints
  const endpoints = [
    '/',
    '/api/status',
    '/api/health',
    '/healthz',
    '/ping',
    '/api/health/frontend'
  ];
  
  let failures = 0;
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    const { success } = await sendRequest(url);
    
    if (!success) {
      failures++;
    }
    console.log('---------------------------------\n');
  }
  
  // Test with different Accept headers
  console.log('\nTesting root with different Accept headers:');
  
  // HTML request
  await sendRequest(`${baseUrl}/`, {
    headers: { 'Accept': 'text/html' }
  });
  console.log('---------------------------------\n');
  
  // JSON request
  await sendRequest(`${baseUrl}/`, {
    headers: { 'Accept': 'application/json' }
  });
  console.log('---------------------------------\n');
  
  // Report summary
  console.log('==================================');
  console.log('Test Summary:');
  console.log(`Total endpoints tested: ${endpoints.length + 2}`);
  console.log(`Failures: ${failures}`);
  console.log('==================================');
  
  if (failures > 0) {
    console.log('\n⚠️ Some tests failed. Review the output above for details.');
    console.log('Common issues:');
    console.log('1. Server not running on the expected port');
    console.log('2. Custom domain not properly configured');
    console.log('3. Missing health check endpoints');
    console.log('4. CORS issues blocking requests');
    console.log('5. SSL/TLS certificate problems');
  } else {
    console.log('\n✅ All tests passed! Your server appears to be configured correctly for custom domains.');
  }
}

runTests().catch(err => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});