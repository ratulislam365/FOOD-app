/**
 * Generate complete Location System Postman collection
 * Run: node generate-location-postman.js
 */

const fs = require('fs');
const path = require('path');

// Test locations
const testLocations = {
    newYork: { lat: 40.7128, lng: -74.0060, name: 'New York City', state: 'NY' },
    losAngeles: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', state: 'CA' },
    chicago: { lat: 41.8781, lng: -87.6298, name: 'Chicago', state: 'IL' },
    houston: { lat: 29.7604, lng: -95.3698, name: 'Houston', state: 'TX' },
    miami: { lat: 25.7617, lng: -80.1918, name: 'Miami', state: 'FL' },
    sanFrancisco: { lat: 37.7749, lng: -122.4194, name: 'San Francisco', state: 'CA' },
    seattle: { lat: 47.6062, lng: -122.3321, name: 'Seattle', state: 'WA' },
    boston: { lat: 42.3601, lng: -71.0589, name: 'Boston', state: 'MA' }
};

const cuisines = ['Italian', 'Chinese', 'Mexican', 'Japanese', 'American', 'Indian', 'Thai'];
const radii = [1, 3, 5, 10, 20];

const collection = {
    info: {
        _postman_id: 'location-system-complete-001',
        name: 'Location System - Complete API Collection',
        description: 'Complete location-based features: proximity search, geolocation, provider locations with 50+ test requests',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
        { key: 'base_url', value: 'http://localhost:5000/api/v1', type: 'string' },
        { key: 'customer_token', value: '', type: 'string' },
        { key: 'provider_token', value: '', type: 'string' },
        { key: 'provider_id', value: '', type: 'string' }
    ],
    item: []
};

// 1. Authentication
collection.item.push({
    name: '1. Authentication',
    item: [
        {
            name: 'Customer Login',
            event: [{
                listen: 'test',
                script: {
                    exec: [
                        'if (pm.response.code === 200) {',
                        '    const jsonData = pm.response.json();',
                        '    pm.collectionVariables.set("customer_token", jsonData.token);',
                        '    console.log("Customer token saved");',
                        '}'
                    ]
                }
            }],
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({ email: 'john@test.com', password: 'Customer@123' }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/auth/login',
                    host: ['{{base_url}}'],
                    path: ['auth', 'login']
                },
                description: 'Login as customer to test proximity search'
            }
        },
        {
            name: 'Provider Login',
            event: [{
                listen: 'test',
                script: {
                    exec: [
                        'if (pm.response.code === 200) {',
                        '    const jsonData = pm.response.json();',
                        '    pm.collectionVariables.set("provider_token", jsonData.token);',
                        '    console.log("Provider token saved");',
                        '}'
                    ]
                }
            }],
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({ email: 'joe@test.com', password: 'Provider@123' }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/auth/login',
                    host: ['{{base_url}}'],
                    path: ['auth', 'login']
                },
                description: 'Login as provider'
            }
        }
    ]
});

// 2. Proximity Search - Basic
const proximityBasic = {
    name: '2. Proximity Search - Basic',
    item: []
};

// Add basic proximity search
proximityBasic.item.push({
    name: 'Find Nearby Providers (Default 3km)',
    request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                latitude: testLocations.newYork.lat,
                longitude: testLocations.newYork.lng
            }, null, 2)
        },
        url: {
            raw: '{{base_url}}/provider/nearby',
            host: ['{{base_url}}'],
            path: ['provider', 'nearby']
        },
        description: `Find providers near ${testLocations.newYork.name} within default 3km radius`
    }
});

// Add requests for different radii
radii.forEach(radius => {
    proximityBasic.item.push({
        name: `Find Nearby Providers (${radius}km radius)`,
        request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    latitude: testLocations.newYork.lat,
                    longitude: testLocations.newYork.lng,
                    radius: radius
                }, null, 2)
            },
            url: {
                raw: '{{base_url}}/provider/nearby',
                host: ['{{base_url}}'],
                path: ['provider', 'nearby']
            },
            description: `Search within ${radius}km radius in ${testLocations.newYork.name}`
        }
    });
});

collection.item.push(proximityBasic);

// 3. Search by City
const searchByCity = {
    name: '3. Search by City',
    item: []
};

Object.values(testLocations).forEach(location => {
    searchByCity.item.push({
        name: `Search in ${location.name}`,
        request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    latitude: location.lat,
                    longitude: location.lng,
                    radius: 5
                }, null, 2)
            },
            url: {
                raw: '{{base_url}}/provider/nearby',
                host: ['{{base_url}}'],
                path: ['provider', 'nearby']
            },
            description: `Find providers in ${location.name}, ${location.state} within 5km`
        }
    });
});

collection.item.push(searchByCity);

// 4. Cuisine Filters
const cuisineFilters = {
    name: '4. Cuisine Filters',
    item: []
};

cuisines.forEach(cuisine => {
    cuisineFilters.item.push({
        name: `Find ${cuisine} Restaurants`,
        request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    latitude: testLocations.newYork.lat,
                    longitude: testLocations.newYork.lng,
                    radius: 5,
                    cuisine: cuisine
                }, null, 2)
            },
            url: {
                raw: '{{base_url}}/provider/nearby',
                host: ['{{base_url}}'],
                path: ['provider', 'nearby']
            },
            description: `Find ${cuisine} restaurants within 5km`
        }
    });
});

collection.item.push(cuisineFilters);

// 5. Pagination Tests
collection.item.push({
    name: '5. Pagination Tests',
    item: [
        {
            name: 'Page 1 (Limit 5)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: testLocations.newYork.lat,
                        longitude: testLocations.newYork.lng,
                        radius: 10,
                        page: 1,
                        limit: 5
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                }
            }
        },
        {
            name: 'Page 2 (Limit 5)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: testLocations.newYork.lat,
                        longitude: testLocations.newYork.lng,
                        radius: 10,
                        page: 2,
                        limit: 5
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                }
            }
        },
        {
            name: 'Page 1 (Limit 20)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: testLocations.newYork.lat,
                        longitude: testLocations.newYork.lng,
                        radius: 10,
                        page: 1,
                        limit: 20
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                }
            }
        }
    ]
});

// 6. Validation Tests (Should Fail)
collection.item.push({
    name: '6. Validation Tests (Should Fail)',
    item: [
        {
            name: 'Invalid Latitude (>90)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: 100,
                        longitude: -74.0060,
                        radius: 3
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                },
                description: 'Should return 400 - Latitude must be between -90 and 90'
            }
        },
        {
            name: 'Invalid Longitude (<-180)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: 40.7128,
                        longitude: -200,
                        radius: 3
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                },
                description: 'Should return 400 - Longitude must be between -180 and 180'
            }
        },
        {
            name: 'Missing Latitude',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        longitude: -74.0060,
                        radius: 3
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                },
                description: 'Should return 400 - Latitude is required'
            }
        },
        {
            name: 'Negative Radius',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: 40.7128,
                        longitude: -74.0060,
                        radius: -5
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                },
                description: 'Should return 400 - Radius must be positive'
            }
        },
        {
            name: 'Excessive Radius (>100km)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: 40.7128,
                        longitude: -74.0060,
                        radius: 150
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                },
                description: 'Should return 400 - Radius cannot exceed 100 km'
            }
        }
    ]
});

// 7. Advanced Scenarios
collection.item.push({
    name: '7. Advanced Scenarios',
    item: [
        {
            name: 'Find Italian Restaurants in NYC (5km)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: testLocations.newYork.lat,
                        longitude: testLocations.newYork.lng,
                        radius: 5,
                        cuisine: 'Italian',
                        sortBy: 'distance',
                        limit: 10
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                }
            }
        },
        {
            name: 'Find Sushi in San Francisco (3km)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: testLocations.sanFrancisco.lat,
                        longitude: testLocations.sanFrancisco.lng,
                        radius: 3,
                        cuisine: 'Japanese',
                        sortBy: 'distance'
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                }
            }
        },
        {
            name: 'Find Tacos in Los Angeles (10km)',
            request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        latitude: testLocations.losAngeles.lat,
                        longitude: testLocations.losAngeles.lng,
                        radius: 10,
                        cuisine: 'Mexican',
                        sortBy: 'distance'
                    }, null, 2)
                },
                url: {
                    raw: '{{base_url}}/provider/nearby',
                    host: ['{{base_url}}'],
                    path: ['provider', 'nearby']
                }
            }
        }
    ]
});

// Write to file
const outputPath = path.join(__dirname, 'postman', 'Location_System_Complete.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log('✅ Location System Postman collection generated successfully!');
console.log(`📁 File: ${outputPath}`);
console.log(`📊 Total requests: ${collection.item.reduce((sum, folder) => sum + folder.item.length, 0)}`);
console.log('\n🚀 Import this file into Postman to start testing!');
