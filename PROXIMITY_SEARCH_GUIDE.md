# 📍 Proximity-Based Provider Search Guide

## Overview
This feature allows customers to find nearby restaurants/providers based on their current location using the Haversine formula for distance calculation.

## API Endpoint

### Find Nearby Providers
**Endpoint**: `POST /api/v1/provider/nearby`

**Authentication**: Not required (public endpoint)

**Request Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 3,
  "page": 1,
  "limit": 20,
  "cuisine": "Italian",
  "sortBy": "distance"
}
```

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| latitude | number | Yes | - | Customer's latitude (-90 to 90) |
| longitude | number | Yes | - | Customer's longitude (-180 to 180) |
| radius | number | No | 3 | Search radius in kilometers (max 100) |
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Results per page (max 100) |
| cuisine | string | No | - | Filter by cuisine type |
| sortBy | string | No | distance | Sort by: distance, rating, name |

**Success Response** (200 OK):
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
      "rating": 4.5,
      "totalReviews": 120,
      "availableFoods": 25
    },
    {
      "providerId": "507f1f77bcf86cd799439012",
      "restaurantName": "Pasta House",
      "location": {
        "lat": 40.7150,
        "lng": -74.0080
      },
      "distance": 0.28,
      "cuisine": ["Italian", "Pasta"],
      "restaurantAddress": "456 Broadway",
      "city": "New York",
      "state": "NY",
      "phoneNumber": "+1234567891",
      "contactEmail": "info@pastahouse.com",
      "profile": "https://cloudinary.com/...",
      "isVerify": true,
      "verificationStatus": "APPROVED",
      "availableFoods": 18
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
    "cuisine": "Italian",
    "sortBy": "distance"
  }
}
```

**Error Responses**:

400 Bad Request - Invalid coordinates:
```json
{
  "status": "error",
  "message": "Invalid coordinates provided",
  "errorCode": "INVALID_COORDINATES"
}
```

400 Bad Request - Validation error:
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

## How It Works

### 1. Haversine Formula
The system uses the Haversine formula to calculate the great-circle distance between two points on Earth:

```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2(√a, √(1−a))
d = R ⋅ c
```

Where:
- φ = latitude in radians
- λ = longitude in radians
- R = Earth's radius (6371 km)
- d = distance in kilometers

### 2. Algorithm Flow

```
1. Validate customer coordinates
   ↓
2. Query active & approved providers with valid locations
   ↓
3. For each provider:
   - Calculate distance using Haversine formula
   - Filter by radius (e.g., within 3 km)
   ↓
4. Sort results by distance (nearest first)
   ↓
5. Apply pagination
   ↓
6. Return formatted results
```

### 3. Code Implementation

**Distance Calculation** (`src/utils/distance.utils.ts`):
```typescript
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    
    const lat1Rad = toRadians(coord1.lat);
    const lat2Rad = toRadians(coord2.lat);
    const deltaLat = toRadians(coord2.lat - coord1.lat);
    const deltaLng = toRadians(coord2.lng - coord1.lng);

    const a = 
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in km
}
```

**Service Layer** (`src/services/provider.service.ts`):
```typescript
async getNearbyProviders(input: NearbyProvidersInput) {
    // 1. Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
        throw new AppError('Invalid coordinates', 400);
    }

    // 2. Query providers with valid locations
    const providers = await ProviderProfile.find({
        isActive: true,
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        'location.lat': { $exists: true, $ne: null },
        'location.lng': { $exists: true, $ne: null }
    });

    // 3. Calculate distances and filter by radius
    const providersWithDistance = [];
    for (const provider of providers) {
        const distance = calculateDistance(
            { lat: latitude, lng: longitude },
            { lat: provider.location.lat, lng: provider.location.lng }
        );
        
        if (distance <= radius) {
            providersWithDistance.push({ ...provider, distance });
        }
    }

    // 4. Sort by distance
    providersWithDistance.sort((a, b) => a.distance - b.distance);

    // 5. Paginate results
    return paginatedResults;
}
```

## Testing Examples

### Example 1: Find Pizza Places Within 5km
```bash
curl -X POST http://localhost:5000/api/v1/provider/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 5,
    "cuisine": "Pizza"
  }'
```

### Example 2: Find All Restaurants Within 3km (Default)
```bash
curl -X POST http://localhost:5000/api/v1/provider/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Example 3: With Pagination
```bash
curl -X POST http://localhost:5000/api/v1/provider/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 10,
    "page": 2,
    "limit": 10
  }'
```

## Performance Optimization

### Current Implementation
- Fetches all providers from database
- Calculates distance in-memory
- Suitable for small to medium datasets (< 10,000 providers)

### MongoDB Geospatial Optimization (Recommended for Production)

For large datasets, use MongoDB's built-in geospatial queries:

#### 1. Update Provider Model
```typescript
// Add 2dsphere index to location field
providerProfileSchema.index({ location: '2dsphere' });
```

#### 2. Optimized Query
```typescript
const providers = await ProviderProfile.find({
    location: {
        $near: {
            $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude] // [lng, lat] order!
            },
            $maxDistance: radius * 1000 // Convert km to meters
        }
    },
    isActive: true,
    status: 'ACTIVE',
    verificationStatus: 'APPROVED'
}).limit(limit);
```

#### 3. Benefits
- Database-level filtering (faster)
- Automatic distance calculation
- Built-in sorting by distance
- Scales to millions of records

### Migration Script
```typescript
// Run this to add geospatial index
db.providerprofiles.createIndex({ location: "2dsphere" });
```

## Frontend Integration

### React Example
```typescript
const findNearbyRestaurants = async () => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        const response = await fetch('/api/v1/provider/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude,
                longitude,
                radius: 5
            })
        });
        
        const data = await response.json();
        setRestaurants(data.data);
    });
};
```

### React Native Example
```typescript
import Geolocation from '@react-native-community/geolocation';

Geolocation.getCurrentPosition(
    async (position) => {
        const { latitude, longitude } = position.coords;
        
        const response = await fetch('/api/v1/provider/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, radius: 3 })
        });
        
        const data = await response.json();
        console.log(`Found ${data.data.length} restaurants nearby`);
    },
    (error) => console.error(error),
    { enableHighAccuracy: true }
);
```

## Security Considerations

1. **Rate Limiting**: Already implemented (100 requests per 15 minutes)
2. **Input Validation**: Zod schema validates all inputs
3. **Coordinate Validation**: Ensures valid lat/lng ranges
4. **Radius Limit**: Maximum 100 km to prevent abuse
5. **Public Endpoint**: No authentication required for discovery

## Future Enhancements

- [ ] Add caching layer (Redis) for frequently searched locations
- [ ] Implement MongoDB geospatial indexes for better performance
- [ ] Add real-time availability status
- [ ] Include estimated delivery time
- [ ] Add provider ratings and reviews in response
- [ ] Support polygon-based search areas
- [ ] Add "open now" filter based on pickup windows
- [ ] Implement favorite providers feature
- [ ] Add search history for logged-in users

## Troubleshooting

### No providers found
- Check if providers have valid location data (lat/lng)
- Verify providers are ACTIVE and APPROVED
- Increase search radius
- Check if providers exist in the database

### Incorrect distances
- Verify coordinate order (latitude, longitude)
- Check if coordinates are in decimal degrees (not DMS)
- Ensure Earth's radius constant is correct (6371 km)

### Performance issues
- Implement MongoDB geospatial indexes
- Add Redis caching for popular locations
- Reduce query result set with better filters
- Consider pagination with smaller page sizes
