# 📍 Location System - Postman Collection Guide

## Collection Contents

This Postman collection includes all location-based API endpoints with real test data.

## Import Instructions

1. Open Postman
2. Click **Import**
3. Select `Location_System_Complete.postman_collection.json`
4. Select `Location_System.postman_environment.json`
5. Choose **Location System - Development** environment

## Collection Structure

### 1. Authentication (2 requests)
- Customer Login
- Provider Login

### 2. Proximity Search (10 requests)
- Find Nearby Providers (Basic)
- Find Nearby Providers (New York)
- Find Nearby Providers (Los Angeles)
- Find Nearby Providers (Chicago)
- Find Nearby Providers with Cuisine Filter
- Find Nearby Providers with Pagination
- Find Nearby Providers (1km radius)
- Find Nearby Providers (5km radius)
- Find Nearby Providers (10km radius)
- Find Nearby Providers (20km radius)

### 3. Test Different Cities (5 requests)
- Search in New York City
- Search in Los Angeles
- Search in Chicago
- Search in Houston
- Search in Miami

### 4. Cuisine Filters (5 requests)
- Find Italian Restaurants
- Find Chinese Restaurants
- Find Mexican Restaurants
- Find Japanese Restaurants
- Find American Restaurants

### 5. Validation Tests (5 requests)
- Invalid Latitude (should fail)
- Invalid Longitude (should fail)
- Missing Latitude (should fail)
- Negative Radius (should fail)
- Excessive Radius (should fail)

### 6. Provider Location Management (4 requests)
- Get Provider Profile Location
- Update Provider Location
- Get Provider Pickup Windows
- Get Provider Compliance

## Test Data Locations

### Major US Cities
```javascript
New York City:    { lat: 40.7128, lng: -74.0060 }
Los Angeles:      { lat: 34.0522, lng: -118.2437 }
Chicago:          { lat: 41.8781, lng: -87.6298 }
Houston:          { lat: 29.7604, lng: -95.3698 }
Miami:            { lat: 25.7617, lng: -80.1918 }
San Francisco:    { lat: 37.7749, lng: -122.4194 }
Seattle:          { lat: 47.6062, lng: -122.3321 }
Boston:           { lat: 42.3601, lng: -71.0589 }
Denver:           { lat: 39.7392, lng: -104.9903 }
Atlanta:          { lat: 33.7490, lng: -84.3880 }
```

### Test Radii
- 1 km - Very close (walking distance)
- 3 km - Default (neighborhood)
- 5 km - Extended area
- 10 km - City-wide
- 20 km - Metropolitan area

### Cuisine Types
- Italian
- Chinese
- Mexican
- Japanese
- American
- Indian
- Thai
- Vietnamese
- Korean
- Mediterranean

## Request Examples

### Basic Proximity Search
```json
POST /api/v1/provider/nearby
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 3
}
```

### With Filters
```json
POST /api/v1/provider/nearby
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 5,
  "cuisine": "Italian",
  "page": 1,
  "limit": 20,
  "sortBy": "distance"
}
```

### With Pagination
```json
POST /api/v1/provider/nearby
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 10,
  "page": 2,
  "limit": 10
}
```

## Expected Responses

### Success Response
```json
{
  "success": true,
  "message": "Found 5 providers within 3 km",
  "data": [
    {
      "providerId": "507f1f77bcf86cd799439011",
      "restaurantName": "Joe's Pizza",
      "location": {
        "lat": 40.7138,
        "lng": -74.0070
      },
      "distance": 0.12,
      "cuisine": ["Italian", "Pizza"],
      "restaurantAddress": "123 Main St",
      "city": "New York",
      "state": "NY",
      "phoneNumber": "+1234567890",
      "contactEmail": "joe@pizza.com",
      "profile": "https://cloudinary.com/...",
      "isVerify": true,
      "verificationStatus": "APPROVED",
      "availableFoods": 25
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "filters": {
    "radius": "3 km",
    "cuisine": "all",
    "sortBy": "distance"
  }
}
```

### Error Responses

**Invalid Coordinates (400)**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "latitude",
      "message": "Latitude must be between -90 and 90"
    }
  ]
}
```

**No Providers Found (200)**
```json
{
  "success": true,
  "message": "Found 0 providers within 3 km",
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

## Variables

The collection uses these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| base_url | API base URL | http://localhost:5000/api/v1 |
| customer_token | Customer JWT token | Auto-saved after login |
| provider_token | Provider JWT token | Auto-saved after login |
| provider_id | Provider ID for testing | Auto-saved |
| customer_lat | Customer latitude | 40.7128 |
| customer_lng | Customer longitude | -74.0060 |

## Test Scenarios

### Scenario 1: Find Nearby Pizza Places
1. Login as customer
2. Use proximity search with cuisine="Pizza"
3. Set radius to 5km
4. Review results sorted by distance

### Scenario 2: Compare Different Radii
1. Search with radius=1km
2. Search with radius=3km
3. Search with radius=5km
4. Search with radius=10km
5. Compare number of results

### Scenario 3: Test Multiple Cities
1. Search in New York
2. Search in Los Angeles
3. Search in Chicago
4. Compare provider availability

### Scenario 4: Pagination Test
1. Search with limit=5
2. Get page 1
3. Get page 2
4. Get page 3
5. Verify pagination metadata

### Scenario 5: Validation Testing
1. Try invalid latitude (>90)
2. Try invalid longitude (<-180)
3. Try negative radius
4. Try excessive radius (>100km)
5. Verify all return proper errors

## Tips

1. **Auto-save tokens**: Login requests automatically save tokens
2. **Use variables**: Leverage collection variables for reusability
3. **Test in sequence**: Run authentication first, then other requests
4. **Check console**: View detailed request/response in Postman console
5. **Export results**: Use Postman's test runner to export results

## Troubleshooting

### No providers found
- Run seed script: `npm run seed:admin`
- Check if providers have location data
- Increase search radius

### 401 Unauthorized
- Run login request first
- Check if token is saved in variables
- Token may have expired (7 days)

### Invalid coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180
- Use decimal degrees format

### Server not responding
- Check if server is running: `npm run dev`
- Verify base_url is correct
- Check MongoDB connection

## Performance Testing

Use Postman's Collection Runner to:
1. Run all requests sequentially
2. Test with different data sets
3. Measure response times
4. Generate test reports

## Next Steps

1. Import collection and environment
2. Run seed script to create test data
3. Start server
4. Run authentication requests
5. Test proximity search with different parameters
6. Explore all test scenarios

---

**Happy Testing!** 🚀
