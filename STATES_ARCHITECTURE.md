# USA States Master Data System - Architecture Documentation

## 📋 Overview
This document outlines the production-grade master data system for USA states in the EMDR Food Delivery application.

## 🗂️ System Architecture

### 1. Data Model Design

**File**: `src/models/state.model.ts`

```typescript
interface IState {
  _id: ObjectId;
  name: string;        // "California"
  code: string;        // "CA"
  country: string;     // "USA"
  isActive: boolean;   // true
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Decisions**:
- **Normalization**: States are stored in a separate collection, not embedded in user/provider documents
- **Immutability**: Once created, states are never deleted (soft-disable via `isActive`)
- **Referencing**: Other collections reference states by `ObjectId`, not by string values

### 2. Indexing Strategy

```typescript
// Unique indexes
{ name: 1 } unique
{ code: 1, country: 1 } unique compound

// Performance indexes
{ country: 1, isActive: 1 }
{ isActive: 1 }
```

**Why These Indexes?**
- **name unique**: Prevents duplicate state names
- **code + country compound**: Allows future expansion to other countries
- **country + isActive**: Optimizes filtering for active states in specific countries
- **Individual field indexes**: Supports efficient queries and sorting

### 3. Data Seeding Strategy

**Idempotent Seeding**: Safe to run multiple times without creating duplicates

```typescript
await State.findOneAndUpdate(
  { code: "CA", country: "USA" },  // Find criteria
  {
    $setOnInsert: {                // Only set if inserting new document
      name: "California",
      code: "CA",
      country: "USA",
      isActive: true
    }
  },
  { upsert: true, new: true }
);
```

**Benefits**:
- ✅ Zero duplicates even if run 100 times
- ✅ Safe for CI/CD pipelines
- ✅ Safe for production bootstrap
- ✅ Detailed logging (inserted vs skipped)

### 4. Usage Patterns

#### Pattern 1: Dropdown Population (Frontend)
```javascript
// GET /api/v1/states
{
  "success": true,
  "count": 51,
  "data": [
    { "_id": "...", "name": "Alabama", "code": "AL" },
    { "_id": "...", "name": "Alaska", "code": "AK" }
  ]
}
```

#### Pattern 2: Profile Storage (Backend)
```typescript
interface IProfile {
  userId: ObjectId;
  name: string;
  address: string;
  city: string;
  stateId: ObjectId;  // ← Reference to State collection
}
```

#### Pattern 3: Analytics Queries
```typescript
// Count users by state
await Profile.aggregate([
  {
    $lookup: {
      from: 'states',
      localField: 'stateId',
      foreignField: '_id',
      as: 'state'
    }
  },
  { $unwind: '$state' },
  {
    $group: {
      _id: '$state.name',
      count: { $sum: 1 }
    }
  }
]);
```

## 🚀 Deployment Steps

### Step 1: Run Seeder
```bash
npm run seed:states
```

**Expected Output**:
```
🌱 Starting state seeding process...
✅ Inserted: Alabama (AL)
✅ Inserted: Alaska (AK)
...
📊 Seeding Summary:
   ✅ Inserted: 51
   ⏭️  Skipped: 0
   ❌ Errors: 0
```

### Step 2: Verify Data
```bash
# MongoDB Shell
use emdr
db.states.countDocuments({ isActive: true })
# Should return: 51
```

### Step 3: Test API
```bash
curl http://localhost:5000/api/v1/states
```

## 🔒 Security & Performance

### Read-Only Pattern
- States are master data, not user-generated content
- No DELETE operations in normal application flow
- Updates only via admin tools or migrations

### Caching Strategy
```typescript
// Optional: Cache state list in Redis (1 hour TTL)
const cacheKey = 'master:states:usa';
await redis.setex(cacheKey, 3600, JSON.stringify(states));
```

### Rate Limiting
- Public endpoint limited to 200 req/15min
- Prevents abuse of master data queries

## 📊 Data Integrity Rules

1. **No Hard-Coded States**: Never use strings like "California" in business logic
2. **Always Reference by ID**: Store `stateId: ObjectId` in profiles
3. **Validate on Input**: When users select a state, validate the ObjectId exists
4. **Soft Deletes Only**: Never hard-delete states (use `isActive: false`)

## 🎯 Future Extensibility

### Adding Cities
```typescript
interface ICity {
  _id: ObjectId;
  name: string;
  stateId: ObjectId;  // References State collection
  country: string;
  isActive: boolean;
}
```

### Multi-Country Support
```typescript
// Already supported via code + country compound index
await State.create({
  name: "Ontario",
  code: "ON",
  country: "CANADA"
});
```

## ✅ Best Practices Checklist

- ✅ Master data in separate collection
- ✅ Unique constraints at database level
- ✅ Idempotent seeding
- ✅ Compound indexes for performance
- ✅ Public API for client consumption
- ✅ Reference by ObjectId, not strings
- ✅ Soft delete strategy
- ✅ Validated data source (official state codes)
- ✅ Rate limiting on public endpoints
- ✅ Extensible for future growth

## 📝 API Reference

### Get All States
```http
GET /api/v1/states
```

**Response**:
```json
{
  "success": true,
  "count": 51,
  "data": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
      "name": "California",
      "code": "CA"
    }
  ]
}
```

### Search States
```http
GET /api/v1/states/search?q=new
```

**Response**:
```json
{
  "success": true,
  "count": 4,
  "data": [
    { "_id": "...", "name": "New Hampshire", "code": "NH" },
    { "_id": "...", "name": "New Jersey", "code": "NJ" },
    { "_id": "...", "name": "New Mexico", "code": "NM" },
    { "_id": "...", "name": "New York", "code": "NY" }
  ]
}
```

## 🧪 Testing

```typescript
// Unit Test Example
describe('StateService', () => {
  it('should return 51 active states', async () => {
    const states = await stateService.getAllStates();
    expect(states).toHaveLength(51);
  });

  it('should find California by code', async () => {
    const state = await stateService.getStateByCode('CA');
    expect(state.name).toBe('California');
  });
});
```

---

**Architect**: Senior Backend Engineer  
**Date**: 2026-02-01  
**Status**: Production-Ready ✅
