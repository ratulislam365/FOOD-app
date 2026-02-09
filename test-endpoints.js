/**
 * Quick Endpoint Test
 * Tests if OAuth endpoints are registered correctly
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function testEndpoint(path, method = 'POST') {
    return new Promise((resolve) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    path,
                    status: res.statusCode,
                    exists: res.statusCode !== 404,
                });
            });
        });

        req.on('error', () => {
            resolve({ path, status: 'ERROR', exists: false });
        });

        if (method === 'POST') {
            req.write(JSON.stringify({ test: 'data' }));
        }

        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 Testing OAuth Endpoints...\n');

    const endpoints = [
        { path: '/api/auth/google', method: 'POST' },
        { path: '/api/auth/google/verify-stepup', method: 'POST' },
        { path: '/api/auth/refresh', method: 'POST' },
        { path: '/api/auth/sessions', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint.path, endpoint.method);
        
        if (result.exists) {
            console.log(`✅ ${endpoint.method} ${result.path} - EXISTS (Status: ${result.status})`);
        } else {
            console.log(`❌ ${endpoint.method} ${result.path} - NOT FOUND`);
        }
    }

    console.log('\n✨ Test complete!\n');
}

runTests();
