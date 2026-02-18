# 📍 Location System - Quick Start Guide

## ⚡ 3-Step Setup

```bash
# 1. Seed test data
npm run seed:admin

# 2. Start server
npm run dev

# 3. Import to Postman
# - Location_System_Complete.postman_collection.json
# - Location_System.postman_environment.json
```

## 📦 What You Got

✅ **34 Postman requests** - Ready to test
✅ **8 US cities** - Pre-configured coordinates
✅ **7 cuisines** - Filter options
✅ **5 radii** - 1km to 20km
✅ **Complete docs** - Step-by-step guides

## 🔑 Test Credentials

```
Customer: john@test.com / Customer@123
Provider: joe@test.com / Provider@123
```

## 📍 API Endpoint

```
POST /api/v1/provider/nearby
```

## 📝 Basic Request

```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 3
}
```

## 🗺️ Test Cities

| City | Lat | Lng |
|------|-----|-----|
| New York | 40.7128 | -74.0060 |
| Los Angeles | 34.0522 | -118.2437 |
| Chicago | 41.8781 | -87.6298 |
| Houston | 29.7604 | -95.3698 |
| Miami | 25.7617 | -80.1918 |

## 🍽️ Cuisine Filters

- Italian
- Chinese
- Mexican
- Japanese
- American
- Indian
- Thai

## 📏 Search Radii

- 1 km - Walking distance
- 3 km - Neighborhood (default)
- 5 km - Extended area
- 10 km - City-wide
- 20 km - Metropolitan

## ✅ Expected Response

```json
{
  "success": true,
  "message": "Found 5 providers within 3 km",
  "data": [
    {
      "restaurantName": "Joe's Pizza",
      "distance": 0.12,
      "cuisine": ["Italian", "Pizza"],
      "location": { "lat": 40.7138, "lng": -74.0070 }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

## 🧪 Quick Tests

### Test 1: Basic Search
```
1. Login as customer
2. POST /provider/nearby with NYC coordinates
3. Check results sorted by distance
```

### Test 2: Cuisine Filter
```
1. Search with cuisine="Italian"
2. Verify only Italian restaurants returned
```

### Test 3: Different Radii
```
1. Search with radius=1
2. Search with radius=5
3. Search with radius=10
4. Compare result counts
```

## 📊 Collection Structure

```
Location System Collection (34 requests)
├── 1. Authentication (2)
├── 2. Proximity Search - Basic (6)
├── 3. Search by City (8)
├── 4. Cuisine Filters (7)
├── 5. Pagination Tests (3)
├── 6. Validation Tests (5)
└── 7. Advanced Scenarios (3)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No providers | Run `npm run seed:admin` |
| 401 Error | Login first |
| Invalid coords | Lat: -90 to 90, Lng: -180 to 180 |
| Server down | Run `npm run dev` |

## 📚 Full Documentation

- **LOCATION_SYSTEM_COMPLETE_GUIDE.md** - Complete guide
- **PROXIMITY_SEARCH_GUIDE.md** - API docs
- **QUICK_START_PROXIMITY.md** - Quick reference

## 🎯 Success Checklist

- [ ] Seed data created
- [ ] Server running
- [ ] Postman collection imported
- [ ] Environment selected
- [ ] Customer login successful
- [ ] Proximity search working
- [ ] Distance calculations correct
- [ ] Filters working
- [ ] Pagination working
- [ ] Validation tests failing correctly

## 🎉 You're Ready!

All location system features are ready to test with Postman!

---

**Quick command:** `npm run seed:admin && npm run dev`
