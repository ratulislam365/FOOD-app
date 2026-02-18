# 🚀 Quick Start - Proximity Search

## 1️⃣ Start Your Server
```bash
npm run dev
```

## 2️⃣ Test the API

### Using cURL (Bash/Linux/Mac)
```bash
curl -X POST http://localhost:5000/api/v1/provider/nearby \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7128, "longitude": -74.0060, "radius": 3}'
```

### Using PowerShell (Windows)
```powershell
$body = @{
    latitude = 40.7128
    longitude = -74.0060
    radius = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/provider/nearby" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Using Test Scripts
```bash
# Node.js
node test-proximity-search.js

# PowerShell
.\test-proximity-search.ps1
```

## 3️⃣ API Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| latitude | ✅ Yes | - | Your latitude (-90 to 90) |
| longitude | ✅ Yes | - | Your longitude (-180 to 180) |
| radius | No | 3 | Search radius in km (max 100) |
| page | No | 1 | Page number |
| limit | No | 20 | Results per page (max 100) |
| cuisine | No | - | Filter by cuisine type |
| sortBy | No | distance | Sort: distance, rating, name |

## 4️⃣ Example Requests

### Basic Search
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### With Filters
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 5,
  "cuisine": "Italian",
  "limit": 10
}
```

### With Pagination
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 10,
  "page": 2,
  "limit": 20
}
```

## 5️⃣ Response Format

```json
{
  "success": true,
  "message": "Found 5 providers within 3 km",
  "data": [
    {
      "providerId": "...",
      "restaurantName": "Joe's Pizza",
      "location": { "lat": 40.7138, "lng": -74.0070 },
      "distance": 0.12,
      "cuisine": ["Italian", "Pizza"],
      "restaurantAddress": "123 Main St",
      "city": "New York",
      "state": "NY",
      "phoneNumber": "+1234567890",
      "availableFoods": 25
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

## 6️⃣ Common Test Locations

```javascript
// New York City
{ "latitude": 40.7128, "longitude": -74.0060 }

// Los Angeles
{ "latitude": 34.0522, "longitude": -118.2437 }

// Chicago
{ "latitude": 41.8781, "longitude": -87.6298 }

// Houston
{ "latitude": 29.7604, "longitude": -95.3698 }

// Miami
{ "latitude": 25.7617, "longitude": -80.1918 }
```

## 7️⃣ Frontend Integration

### JavaScript/React
```javascript
const response = await fetch('/api/v1/provider/nearby', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 5
  })
});

const data = await response.json();
console.log(`Found ${data.data.length} restaurants`);
```

### Get User Location
```javascript
navigator.geolocation.getCurrentPosition((position) => {
  const { latitude, longitude } = position.coords;
  // Use latitude and longitude in API call
});
```

## 8️⃣ Troubleshooting

### No providers found?
- Check if providers have location data (lat/lng)
- Verify providers are ACTIVE and APPROVED
- Increase search radius
- Check database has provider data

### Invalid coordinates error?
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Use decimal degrees format (not DMS)

### Slow performance?
- Current implementation is for <10,000 providers
- For larger datasets, see `GEOSPATIAL_MIGRATION.md`
- Consider adding Redis caching

## 📚 Full Documentation

- **PROXIMITY_FEATURE_SUMMARY.md** - Complete feature overview
- **PROXIMITY_SEARCH_GUIDE.md** - Detailed API documentation
- **GEOSPATIAL_MIGRATION.md** - Performance optimization guide
- **ARCHITECTURE.md** - System architecture

## 🎯 Next Steps

1. Test with your existing provider data
2. Integrate with your frontend
3. Monitor performance
4. Add caching if needed
5. Migrate to geospatial indexes for scale

---

**Need Help?** Check the full documentation files or review the test scripts for more examples!
