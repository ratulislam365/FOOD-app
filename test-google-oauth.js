/**
 * Google OAuth Test Script
 * 
 * This script tests the Google OAuth endpoints without needing a real Google idToken.
 * It helps verify that your server is set up correctly.
 * 
 * Usage: node test-google-oauth.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body),
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body,
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testServerConnection() {
    log('\n📡 Testing server connection...', 'blue');
    
    try {
        const response = await makeRequest('GET', '/');
        if (response.status === 200 || response.status === 404) {
            log('✅ Server is running!', 'green');
            return true;
        } else {
            log(`❌ Server returned status ${response.status}`, 'red');
            return false;
        }
    } catch (error) {
        log('❌ Cannot connect to server. Is it running on port 3000?', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

async function testGoogleOAuthEndpoint() {
    log('\n🔐 Testing Google OAuth endpoint...', 'blue');
    
    try {
        const response = await makeRequest('POST', '/api/auth/google', {
            idToken: 'fake-token-for-testing',
            requestedRole: 'CUSTOMER',
        });

        // We expect this to fail with 401 (invalid token)
        // But if the endpoint exists, we'll get a proper error response
        if (response.status === 401 || response.status === 400) {
            if (response.data.success === false) {
                log('✅ Google OAuth endpoint is working!', 'green');
                log(`   Response: ${response.data.message || 'Invalid token (expected)'}`, 'yellow');
                return true;
            }
        }

        log(`⚠️  Unexpected response: ${response.status}`, 'yellow');
        log(`   Data: ${JSON.stringify(response.data)}`, 'yellow');
        return false;
    } catch (error) {
        log('❌ Error testing Google OAuth endpoint', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

async function testSessionsEndpoint() {
    log('\n📋 Testing sessions endpoint...', 'blue');
    
    try {
        const response = await makeRequest('GET', '/api/auth/sessions');

        // We expect 401 (no auth token)
        if (response.status === 401) {
            log('✅ Sessions endpoint is working!', 'green');
            log('   (Requires authentication as expected)', 'yellow');
            return true;
        }

        log(`⚠️  Unexpected response: ${response.status}`, 'yellow');
        return false;
    } catch (error) {
        log('❌ Error testing sessions endpoint', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

async function checkEnvironmentVariables() {
    log('\n⚙️  Checking environment setup...', 'blue');
    
    const requiredVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
    ];

    log('\n   Please verify these are set in your .env file:', 'yellow');
    requiredVars.forEach(varName => {
        log(`   - ${varName}`, 'yellow');
    });
    
    log('\n   ⚠️  This script cannot check .env files directly', 'yellow');
    log('   Please manually verify your .env configuration', 'yellow');
}

async function runTests() {
    log('═══════════════════════════════════════════════', 'blue');
    log('   Google OAuth System - Connection Test', 'blue');
    log('═══════════════════════════════════════════════', 'blue');

    const serverOk = await testServerConnection();
    
    if (!serverOk) {
        log('\n❌ Server is not running. Please start your server first:', 'red');
        log('   npm run dev', 'yellow');
        process.exit(1);
    }

    const oauthOk = await testGoogleOAuthEndpoint();
    const sessionsOk = await testSessionsEndpoint();
    
    await checkEnvironmentVariables();

    log('\n═══════════════════════════════════════════════', 'blue');
    log('   Test Summary', 'blue');
    log('═══════════════════════════════════════════════', 'blue');
    log(`   Server Connection: ${serverOk ? '✅ PASS' : '❌ FAIL'}`, serverOk ? 'green' : 'red');
    log(`   OAuth Endpoint: ${oauthOk ? '✅ PASS' : '❌ FAIL'}`, oauthOk ? 'green' : 'red');
    log(`   Sessions Endpoint: ${sessionsOk ? '✅ PASS' : '❌ FAIL'}`, sessionsOk ? 'green' : 'red');
    log('═══════════════════════════════════════════════\n', 'blue');

    if (serverOk && oauthOk && sessionsOk) {
        log('🎉 All tests passed! Your server is ready for Google OAuth.', 'green');
        log('\n📝 Next steps:', 'blue');
        log('   1. Get a real Google idToken from OAuth Playground', 'yellow');
        log('   2. Import Postman collection from postmanfile/', 'yellow');
        log('   3. Test with real Google authentication', 'yellow');
        log('\n📖 See TESTING_GUIDE.md for detailed instructions', 'blue');
    } else {
        log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
    }
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
