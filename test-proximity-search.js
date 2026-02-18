/**
 * Test script for proximity-based provider search
 * Run: node test-proximity-search.js
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test locations
const testLocations = {
    newYork: { lat: 40.7128, lng: -74.0060, name: 'New York City' },
    losAngeles: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
    chicago: { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
    houston: { lat: 29.7604, lng: -95.3698, name: 'Houston' },
    miami: { lat: 25.7617, lng: -80.1918, name: 'Miami' }
};

async function testNearbyProviders(location, options = {}) {
    const { radius = 3, cuisine, page = 1, limit = 20 } = options;
    
    console.log(`\n🔍 Testing: ${location.name}`);
    console.log(`📍 Coordinates: ${location.lat}, ${location.lng}`);
    console.log(`📏 Radius: ${radius} km`);
    if (cuisine) console.log(`🍽️  Cuisine: ${cuisine}`);
    
    const requestBody = {
        latitude: location.lat,
        longitude: location.lng,
        radius,
        page,
        limit
    };
    
    if (cuisine) {
        requestBody.cuisine = cuisine;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/provider/nearby`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Success: ${data.message}`);
            console.log(`📊 Found ${data.data.length} providers`);
            console.log(`📄 Pagination: Page ${data.pagination.page} of ${data.pagination.totalPages}`);
            
            if (data.data.length > 0) {
                console.log('\n🏪 Top 3 Nearest Providers:');
                data.data.slice(0, 3).forEach((provider, index) => {
                    console.log(`\n${index + 1}. ${provider.restaurantName}`);
                    console.log(`   📍 Distance: ${provider.distance} km`);
                    console.log(`   🍽️  Cuisine: ${provider.cuisine.join(', ')}`);
                    console.log(`   📍 Address: ${provider.restaurantAddress}, ${provider.city}, ${provider.state}`);
                    console.log(`   📞 Phone: ${provider.phoneNumber}`);
                    console.log(`   ✅ Verified: ${provider.isVerify ? 'Yes' : 'No'}`);
                    if (provider.availableFoods) {
                        console.log(`   🍔 Available Foods: ${provider.availableFoods}`);
                    }
                });
            } else {
                console.log('⚠️  No providers found in this area');
            }
        } else {
            console.log(`❌ Error: ${data.message}`);
            if (data.errors) {
                console.log('Validation errors:', data.errors);
            }
        }
    } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
    }
}

async function testInvalidInputs() {
    console.log('\n\n🧪 Testing Invalid Inputs\n');
    
    const invalidTests = [
        {
            name: 'Invalid latitude (> 90)',
            body: { latitude: 100, longitude: -74.0060, radius: 3 }
        },
        {
            name: 'Invalid longitude (< -180)',
            body: { latitude: 40.7128, longitude: -200, radius: 3 }
        },
        {
            name: 'Missing latitude',
            body: { longitude: -74.0060, radius: 3 }
        },
        {
            name: 'Negative radius',
            body: { latitude: 40.7128, longitude: -74.0060, radius: -5 }
        },
        {
            name: 'Radius too large',
            body: { latitude: 40.7128, longitude: -74.0060, radius: 150 }
        }
    ];
    
    for (const test of invalidTests) {
        console.log(`\n❌ Test: ${test.name}`);
        try {
            const response = await fetch(`${API_BASE_URL}/provider/nearby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.body)
            });
            
            const data = await response.json();
            console.log(`   Status: ${response.status}`);
            console.log(`   Message: ${data.message}`);
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
    }
}

async function testPagination() {
    console.log('\n\n📄 Testing Pagination\n');
    
    const location = testLocations.newYork;
    
    for (let page = 1; page <= 3; page++) {
        console.log(`\nPage ${page}:`);
        await testNearbyProviders(location, { radius: 10, page, limit: 5 });
    }
}

async function testCuisineFilter() {
    console.log('\n\n🍽️  Testing Cuisine Filters\n');
    
    const cuisines = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese'];
    const location = testLocations.newYork;
    
    for (const cuisine of cuisines) {
        await testNearbyProviders(location, { radius: 5, cuisine });
    }
}

async function testDifferentRadii() {
    console.log('\n\n📏 Testing Different Radii\n');
    
    const radii = [1, 3, 5, 10, 20];
    const location = testLocations.newYork;
    
    for (const radius of radii) {
        await testNearbyProviders(location, { radius });
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Proximity Search API Tests');
    console.log('=' .repeat(50));
    
    // Test 1: Basic search in different cities
    console.log('\n\n📍 Test 1: Basic Search in Different Cities');
    console.log('=' .repeat(50));
    for (const [key, location] of Object.entries(testLocations)) {
        await testNearbyProviders(location);
    }
    
    // Test 2: Different radii
    await testDifferentRadii();
    
    // Test 3: Cuisine filters
    await testCuisineFilter();
    
    // Test 4: Pagination
    await testPagination();
    
    // Test 5: Invalid inputs
    await testInvalidInputs();
    
    console.log('\n\n✅ All tests completed!');
    console.log('=' .repeat(50));
}

// Run tests
runAllTests().catch(console.error);
