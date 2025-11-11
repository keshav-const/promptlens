#!/usr/bin/env node

/**
 * Quick test script to verify API configuration
 * This checks that the backend API URL is correctly set
 */

console.log('Testing API Configuration...\n');

// Simulate the environment variable
const NEXT_PUBLIC_BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// The logic from api.ts
const API_BASE_URL = NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

console.log('Environment Variables:');
console.log('  NEXT_PUBLIC_BACKEND_API_URL:', NEXT_PUBLIC_BACKEND_API_URL || '(not set)');
console.log('\nResolved API Base URL:');
console.log('  API_BASE_URL:', API_BASE_URL);

// Test endpoint construction
const testEndpoints = ['/usage', '/history', '/billing/checkout', '/billing/portal'];

console.log('\nExpected API Endpoints:');
testEndpoints.forEach((endpoint) => {
  console.log(`  ${API_BASE_URL}${endpoint}`);
});

// Verify correct port
const expectedPort = '5000';
const actualPort = new URL(API_BASE_URL).port;

console.log('\nPort Check:');
console.log(`  Expected Port: ${expectedPort}`);
console.log(`  Actual Port:   ${actualPort}`);
console.log(`  Status:        ${actualPort === expectedPort ? '✓ CORRECT' : '✗ INCORRECT'}`);

// Verify correct path
const expectedPath = '/api';
const actualPath = new URL(API_BASE_URL).pathname;

console.log('\nPath Check:');
console.log(`  Expected Path: ${expectedPath}`);
console.log(`  Actual Path:   ${actualPath}`);
console.log(`  Status:        ${actualPath === expectedPath ? '✓ CORRECT' : '✗ INCORRECT'}`);

console.log('\n' + '='.repeat(50));
if (actualPort === expectedPort && actualPath === expectedPath) {
  console.log('✓ API configuration is CORRECT!');
  console.log('  Frontend will call: http://localhost:5000/api/*');
} else {
  console.log('✗ API configuration needs adjustment');
}
console.log('='.repeat(50));
