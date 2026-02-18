# 🧪 Admin System Testing Guide

## Prerequisites

1. **MongoDB** running locally or remotely
2. **Node.js** and npm installed
3. **Postman** installed
4. **Server** running on `http://localhost:5000`

## 🌱 Step 1: Seed Test Data

### Option A: Using Seed Script (Recommended)

```bash
# Run the seed script
ts-node seed-admin-test-data.ts
```

This creates:
- 1 Admin user
- 5 Providers (various statuses: pending, approved, rejected)
- 5 Customers
- Multiple food items
- Sample orders
- Sample reviews

### Option B: Manual Creation

Create admin user manually in MongoDB:

```javascript
db.users.insertOne({
  fullName: "Admin User",
  email: "admin@fooddelivery.com",
  passwordHash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ86jm", // Admin@123456
  role: "ADMIN",
  isEmailVerified: true,
  authProvider: "email",
  isActive: true,
  isSuspended: false,
  roleAssignedAt: new Date(),
  roleAssignedBy: "system",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 📦 Step 2: Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `postman/Admin_System_Complete.postman_collection.json`
4. Select `postman/Admin_System.postman_environment.json`
5. Choose **Admin System - Development** environment

## 🧪 Step 3: Run Tests

### Test Suite 1: Authentication & Authorization

#### Test 1.1: Admin Login ✅
```
Request: POST /api/v1/auth/login
Body: {
  "email": "admin@fooddelivery.com",
  "password": "Admin@123456"
}

Expected: 200 OK
Response includes JWT token
Token automatically saved to environment
```

#### Test 1.2: Provider Login ✅
```
Request: POST /api/v1/auth/login
Body: {
  "email": "joe@test.com",
  "password": "Provider@123"
}

Expected: 200 OK
Provider token saved
```

#### Test 1.3: Customer Login ✅
```
Request: POST /api/v1/auth/login
Body: {
  "email": "john@test.com",
  "password": "Customer@123"
}

Expected: 200 OK
Customer token saved
```

### Test Suite 2: Role-Based Access Control

#### Test 2.1: Admin Access ✅
```
Request: GET /api/v1/admin/restaurants
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns list of restaurants
```

#### Test 2.2: Provider Access (Should Fail) ❌
```
Request: GET /api/v1/admin/restaurants
Authorization: Bearer {{provider_token}}

Expected: 403 Forbidden
Error: "You do not have permission to perform this action"
```

#### Test 2.3: Customer Access (Should Fail) ❌
```
Request: GET /api/v1/admin/restaurants
Authorization: Bearer {{customer_token}}

Expected: 403 Forbidden
Error: "You do not have permission to perform this action"
```

#### Test 2.4: No Token (Should Fail) ❌
```
Request: GET /api/v1/admin/restaurants
Authorization: None

Expected: 401 Unauthorized
Error: "You are not logged in! Please log in to get access."
```

### Test Suite 3: Restaurant Management

#### Test 3.1: Get All Restaurants ✅
```
Request: GET /api/v1/admin/restaurants?page=1&limit=20
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns paginated list of restaurants
Includes: restaurantId, name, owner, state, status, ratings, revenue
```

#### Test 3.2: Filter by Status ✅
```
Request: GET /api/v1/admin/restaurants?status=pending_approval
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns only pending restaurants
```

#### Test 3.3: Filter by State ✅
```
Request: GET /api/v1/admin/restaurants?state=NY
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns only NY restaurants
```

#### Test 3.4: Filter by Rating ✅
```
Request: GET /api/v1/admin/restaurants?rating=4
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns restaurants with 4-5 star ratings
```

#### Test 3.5: Get Restaurant Details ✅
```
Request: GET /api/v1/admin/restaurants/:providerId
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns detailed restaurant information
Includes: owner info, documents, compliance, location
```

#### Test 3.6: Approve Restaurant ✅
```
Request: POST /api/v1/admin/restaurants/:restaurantId/approve
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Message: "Restaurant approved successfully"
Restaurant status changes to APPROVED
```

#### Test 3.7: Reject Restaurant ✅
```
Request: POST /api/v1/admin/restaurants/:restaurantId/reject
Authorization: Bearer {{admin_token}}
Body: {
  "reason": "Incomplete documentation"
}

Expected: 200 OK
Message: "Restaurant rejected successfully"
Restaurant status changes to REJECTED
```

#### Test 3.8: Block Restaurant ✅
```
Request: POST /api/v1/admin/restaurants/:restaurantId/block
Authorization: Bearer {{admin_token}}
Body: {
  "reason": "Multiple customer complaints"
}

Expected: 200 OK
Message: "Restaurant blocked successfully"
All restaurant listings suspended
```

#### Test 3.9: Unblock Restaurant ✅
```
Request: POST /api/v1/admin/restaurants/:restaurantId/unblock
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Message: "Restaurant unblocked successfully"
Restaurant listings reactivated
```

### Test Suite 4: User Management

#### Test 4.1: Get All Customers ✅
```
Request: GET /api/v1/admin/users/customers?page=1&limit=20
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns paginated list of customers
Includes: profile, reviews, orders
```

#### Test 4.2: Get All Providers ✅
```
Request: GET /api/v1/admin/users/providers?page=1&limit=20
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns paginated list of providers
Includes: restaurant info, listings, revenue
```

#### Test 4.3: Filter Active Users ✅
```
Request: GET /api/v1/admin/users/customers?status=active
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns only active customers
```

### Test Suite 5: Orders & Reviews

#### Test 5.1: Get Provider Orders ✅
```
Request: GET /api/v1/admin/providers/:providerId/orders
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns order history for provider
Includes: orderId, customer, status, amount
```

#### Test 5.2: Get Provider Reviews ✅
```
Request: GET /api/v1/admin/providers/:providerId/reviews
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns reviews for provider
Includes: customer, rating, comment
```

#### Test 5.3: Filter Reviews by Rating ✅
```
Request: GET /api/v1/admin/providers/:providerId/reviews?rating=5
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns only 5-star reviews
```

### Test Suite 6: Dashboard & Analytics

#### Test 6.1: Get Dashboard Stats ✅
```
Request: GET /api/v1/admin/dashboard/stats/:restaurantId
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: totalSales, totalOrders, platformFee, nextPayout
```

#### Test 6.2: Get Activity Summary ✅
```
Request: GET /api/v1/admin/dashboard/activity-summary/:restaurantId
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: listings count, orders count, reviews count
```

#### Test 6.3: Get Analytics Overview ✅
```
Request: GET /api/v1/admin/analytics?providerId=:providerId
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: OrdersOverview, CO2Reduced, platformProfit
```

#### Test 6.4: Get Customer Feedback ✅
```
Request: GET /api/v1/admin/feedback?providerId=:providerId
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: Rating distribution (1-5 stars)
```

#### Test 6.5: Get Top Restaurants ✅
```
Request: GET /api/v1/admin/top-restaurants?page=1&limit=10
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: Top performing restaurants by revenue
```

### Test Suite 7: Advanced Analytics

#### Test 7.1: Get Overview Metrics ✅
```
Request: GET /api/v1/admin/analytics/overview?filter=today
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: Platform-wide metrics
```

#### Test 7.2: Get Revenue Analytics ✅
```
Request: GET /api/v1/admin/analytics/revenue?filter=month
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: Revenue trends with labels and values
```

#### Test 7.3: Get Order Analytics ✅
```
Request: GET /api/v1/admin/analytics/orders?filter=week
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: Order trends
```

#### Test 7.4: Get Trending Menus ✅
```
Request: GET /api/v1/admin/analytics/trending-menus?filter=week
Authorization: Bearer {{admin_token}}

Expected: 200 OK
Returns: Most ordered menu items
```

## 🔍 Validation Tests

### Test Invalid Inputs

#### Test V1: Invalid Provider ID
```
Request: GET /api/v1/admin/restaurants/invalid-id
Authorization: Bearer {{admin_token}}

Expected: 400 Bad Request
Error: "Invalid Provider ID"
```

#### Test V2: Missing Required Field
```
Request: POST /api/v1/admin/restaurants/:id/reject
Authorization: Bearer {{admin_token}}
Body: {} // Missing reason

Expected: 400 Bad Request
Error: Validation error
```

#### Test V3: Invalid Token
```
Request: GET /api/v1/admin/restaurants
Authorization: Bearer invalid-token

Expected: 401 Unauthorized
Error: "Invalid token. Please log in again!"
```

## 📊 Expected Results Summary

| Test Category | Total Tests | Expected Pass | Expected Fail |
|---------------|-------------|---------------|---------------|
| Authentication | 3 | 3 | 0 |
| Authorization | 4 | 1 | 3 |
| Restaurant Mgmt | 9 | 9 | 0 |
| User Mgmt | 3 | 3 | 0 |
| Orders & Reviews | 3 | 3 | 0 |
| Dashboard | 5 | 5 | 0 |
| Analytics | 4 | 4 | 0 |
| Validation | 3 | 0 | 3 |
| **TOTAL** | **34** | **28** | **6** |

## 🎯 Success Criteria

✅ All authentication tests pass
✅ Role-based access control works correctly
✅ Admin can view all restaurants
✅ Admin can approve/reject/block restaurants
✅ Admin can view users (customers & providers)
✅ Admin can access analytics
✅ Non-admin users cannot access admin routes
✅ Invalid tokens are rejected
✅ Input validation works

## 🐛 Troubleshooting

### Issue: "You are not logged in"
**Solution**: Make sure you've run the login request first and the token is saved

### Issue: "403 Forbidden"
**Solution**: Check that you're using the admin token, not provider/customer token

### Issue: "Restaurant not found"
**Solution**: Make sure you've run the seed script to create test data

### Issue: "Invalid Provider ID"
**Solution**: Use a valid MongoDB ObjectId format (24 hex characters)

### Issue: Connection refused
**Solution**: Make sure your server is running on port 5000

## 📝 Test Checklist

- [ ] Seed test data
- [ ] Import Postman collection
- [ ] Import Postman environment
- [ ] Test admin login
- [ ] Test role-based access (admin, provider, customer)
- [ ] Test restaurant management (view, approve, reject, block)
- [ ] Test user management (customers, providers)
- [ ] Test orders and reviews
- [ ] Test dashboard and analytics
- [ ] Test validation and error handling
- [ ] Verify all expected failures occur correctly

## 🎉 Completion

Once all tests pass, your admin system is fully functional and ready for production!

**Next Steps:**
1. Add audit logging for admin actions
2. Implement email notifications
3. Add 2FA for admin accounts
4. Set up monitoring and alerts
5. Deploy to production environment

---

**Happy Testing!** 🚀
