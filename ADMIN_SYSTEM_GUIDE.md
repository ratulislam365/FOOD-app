# 🔐 Admin System - Complete Guide

## Overview
Your food delivery platform has a comprehensive role-based admin system with three roles:
- **ADMIN**: Full system access, manage providers, customers, and platform
- **PROVIDER**: Restaurant owners, manage their own restaurants
- **CUSTOMER**: End users, place orders

## 🏗️ Architecture

### Role-Based Access Control (RBAC)

```
Request → authenticate middleware → requireRole middleware → Controller
```

**1. Authentication Middleware** (`src/middlewares/authenticate.ts`)
- Verifies JWT token from `Authorization: Bearer <token>` header
- Checks if token is blacklisted
- Extracts user ID and role from token
- Attaches `req.user` object

**2. Role Verification Middleware** (`src/middlewares/requireRole.ts`)
- Checks if user's role matches required roles
- Returns 403 Forbidden if role doesn't match
- Allows multiple roles: `requireRole(['ADMIN', 'PROVIDER'])`

### Admin Routes Protection

All admin routes are protected:
```typescript
router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));
```

## 📋 Admin Capabilities

### 1. Restaurant Management
- ✅ View all restaurants with filters (state, status, rating)
- ✅ View detailed restaurant information
- ✅ Approve pending restaurant applications
- ✅ Reject restaurant applications with reason
- ✅ Block restaurants (suspends all listings)
- ✅ Unblock restaurants (reactivates listings)
- ✅ View restaurant profile, compliance, location
- ✅ View pickup windows

### 2. User Management
- ✅ List all customers with pagination
- ✅ List all providers with pagination
- ✅ Filter by status (active, suspended)
- ✅ View user profiles and statistics

### 3. Orders & Reviews
- ✅ View provider order history
- ✅ View provider reviews with filters
- ✅ Track order status across platform

### 4. Dashboard & Analytics
- ✅ Platform overview metrics
- ✅ Revenue analytics with trends
- ✅ Order analytics with trends
- ✅ Recent orders and reviews
- ✅ Trending menu items
- ✅ Top performing restaurants
- ✅ Customer feedback distribution
- ✅ CO2 reduction metrics

## 🔑 API Endpoints

### Authentication
```
POST /api/v1/auth/login
```

### Restaurant Management
```
GET    /api/v1/admin/restaurants
GET    /api/v1/admin/restaurants/:providerId
POST   /api/v1/admin/restaurants/:restaurantId/approve
POST   /api/v1/admin/restaurants/:restaurantId/reject
POST   /api/v1/admin/restaurants/:restaurantId/block
POST   /api/v1/admin/restaurants/:restaurantId/unblock
GET    /api/v1/admin/restaurants/:restaurantId/profile
GET    /api/v1/admin/restaurants/:restaurantId/pickup-windows
GET    /api/v1/admin/restaurants/:restaurantId/compliance
GET    /api/v1/admin/restaurants/:restaurantId/location
GET    /api/v1/admin/dashboard/stats/:restaurantId
GET    /api/v1/admin/dashboard/activity-summary/:restaurantId
```

### User Management
```
GET    /api/v1/admin/users/customers
GET    /api/v1/admin/users/providers
```

### Orders & Reviews
```
GET    /api/v1/admin/providers/:providerId/orders
GET    /api/v1/admin/providers/:providerId/reviews
```

### Analytics
```
GET    /api/v1/admin/analytics?providerId=...
GET    /api/v1/admin/feedback?providerId=...
GET    /api/v1/admin/top-restaurants
GET    /api/v1/admin/analytics/overview
GET    /api/v1/admin/analytics/revenue
GET    /api/v1/admin/analytics/orders
GET    /api/v1/admin/analytics/recent-orders
GET    /api/v1/admin/analytics/recent-reviews
GET    /api/v1/admin/analytics/trending-menus
GET    /api/v1/admin/analytics/top-restaurants
GET    /api/v1/admin/analytics/master
GET    /api/v1/admin/analytics/reports
```

## 📝 Request/Response Examples

### 1. Admin Login
**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@fooddelivery.com",
  "password": "Admin@123456"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "Admin User",
      "email": "admin@fooddelivery.com",
      "role": "ADMIN"
    }
  }
}
```

### 2. Get All Restaurants
**Request:**
```http
GET /api/v1/admin/restaurants?page=1&limit=20&state=NY&status=pending_approval
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRestaurants": 45,
    "totalPages": 3
  },
  "restaurants": [
    {
      "restaurantId": "507f1f77bcf86cd799439011",
      "restaurantName": "Joe's Pizza",
      "owner": "John Doe",
      "state": "NY",
      "totalListings": 25,
      "revenue": 15420.50,
      "ratings": 4.5,
      "status": "pending_approval",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Approve Restaurant
**Request:**
```http
POST /api/v1/admin/restaurants/507f1f77bcf86cd799439011/approve
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Restaurant approved successfully"
}
```

### 4. Block Restaurant
**Request:**
```http
POST /api/v1/admin/restaurants/507f1f77bcf86cd799439011/block
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Multiple customer complaints about food quality and hygiene violations."
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Restaurant blocked successfully"
}
```

### 5. Get All Customers
**Request:**
```http
GET /api/v1/admin/users/customers?page=1&limit=20&status=active
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "507f1f77bcf86cd799439012",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phoneNumber": "+1234567890",
      "profilePicture": "https://cloudinary.com/...",
      "address": "123 Main St, New York, NY",
      "reviews": {
        "averageRating": 4.2,
        "totalReviews": 15
      },
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  },
  "meta": {
    "timestamp": "2024-02-16T12:00:00.000Z"
  }
}
```

### 6. Get Analytics Overview
**Request:**
```http
GET /api/v1/admin/analytics?providerId=507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "OrdersOverview": {
    "totalOrders": 245,
    "pendingOrders": 12,
    "completedOrders": 220
  },
  "CO2Reduced(kg)": 110.0,
  "platformProfit": 2450.75
}
```

## ❌ Error Responses

### 401 Unauthorized - No Token
```json
{
  "status": "error",
  "message": "You are not logged in! Please log in to get access.",
  "errorCode": "AUTH_ERROR"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "status": "error",
  "message": "Invalid token. Please log in again!",
  "errorCode": "AUTH_ERROR"
}
```

### 403 Forbidden - Wrong Role
```json
{
  "status": "error",
  "message": "You do not have permission to perform this action",
  "errorCode": "ROLE_ERROR"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Restaurant not found"
}
```

### 400 Bad Request - Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "reason",
      "message": "Reason is required when rejecting a restaurant"
    }
  ]
}
```

## 🧪 Testing with Postman

### Setup
1. Import `postman/Admin_System_Complete.postman_collection.json`
2. Import `postman/Admin_System.postman_environment.json`
3. Select "Admin System - Development" environment

### Test Flow

**Step 1: Login as Admin**
```
POST /api/v1/auth/login
Body: { "email": "admin@fooddelivery.com", "password": "Admin@123456" }
```
Token is automatically saved to environment variable `admin_token`

**Step 2: Get All Restaurants**
```
GET /api/v1/admin/restaurants
```
Uses saved `admin_token` automatically

**Step 3: Approve a Restaurant**
```
POST /api/v1/admin/restaurants/:restaurantId/approve
```

**Step 4: Test Role-Based Access**
- Login as Provider
- Try to access admin route
- Should receive 403 Forbidden

### Role-Based Access Tests

**Test 1: Provider Cannot Access Admin Routes**
```bash
# Login as provider
POST /api/v1/auth/login
{ "email": "provider@restaurant.com", "password": "Provider@123" }

# Try to access admin route (should fail with 403)
GET /api/v1/admin/restaurants
Authorization: Bearer <provider_token>

# Expected: 403 Forbidden
```

**Test 2: Customer Cannot Access Admin Routes**
```bash
# Login as customer
POST /api/v1/auth/login
{ "email": "customer@example.com", "password": "Customer@123" }

# Try to access admin route (should fail with 403)
GET /api/v1/admin/restaurants
Authorization: Bearer <customer_token>

# Expected: 403 Forbidden
```

**Test 3: No Token**
```bash
# Try to access admin route without token (should fail with 401)
GET /api/v1/admin/restaurants

# Expected: 401 Unauthorized
```

## 🔒 Security Features

### 1. JWT Authentication
- Tokens expire after 7 days (configurable)
- Tokens are blacklisted on logout
- Tokens verified on every request

### 2. Password Security
- Passwords hashed with bcrypt (12 rounds)
- Passwords never returned in responses
- Password field excluded from queries

### 3. Role-Based Access
- Middleware enforces role requirements
- Admin-only routes protected
- Clear error messages for unauthorized access

### 4. Input Validation
- Zod schemas validate all inputs
- MongoDB ObjectId validation
- Email format validation
- Required field validation

### 5. Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute force attacks
- Configurable limits

### 6. Audit Logging
- All admin actions can be logged
- Track who performed what action
- Timestamp all operations

## 📊 Database Models

### User Model
```typescript
{
  fullName: string
  email: string (unique)
  passwordHash: string (hashed)
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  isEmailVerified: boolean
  authProvider: 'email' | 'google'
  isActive: boolean
  isSuspended: boolean
  suspendedReason?: string
  roleAssignedAt: Date
  roleAssignedBy: string
}
```

### Provider Profile Model
```typescript
{
  providerId: ObjectId (ref: User)
  restaurantName: string
  contactEmail: string
  phoneNumber: string
  restaurantAddress: string
  city: string
  state: string
  location: { lat: number, lng: number }
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  verificationDocuments: string[]
  status: 'ACTIVE' | 'BLOCKED'
  blockReason?: string
  cuisine: string[]
  pickupWindows: Array<{days, startTime, endTime}>
  compliance: { alcoholNotice, tax }
}
```

## 🚀 Quick Start

### 1. Create Admin User
```bash
# Using MongoDB shell or script
db.users.insertOne({
  fullName: "Admin User",
  email: "admin@fooddelivery.com",
  passwordHash: "$2b$12$...", // bcrypt hash of "Admin@123456"
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

### 2. Start Server
```bash
npm run dev
```

### 3. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fooddelivery.com","password":"Admin@123456"}'
```

### 4. Use Token
```bash
curl -X GET http://localhost:5000/api/v1/admin/restaurants \
  -H "Authorization: Bearer <your_token>"
```

## 📚 Additional Resources

- **ARCHITECTURE.md** - System architecture overview
- **TESTING_GUIDE.md** - Comprehensive testing guide
- **Postman Collection** - Ready-to-use API tests
- **Environment File** - Pre-configured variables

## 🎯 Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT secrets regularly**
3. **Implement audit logging for all admin actions**
4. **Use strong passwords for admin accounts**
5. **Enable 2FA for admin accounts (future enhancement)**
6. **Monitor admin activity for suspicious behavior**
7. **Regularly review and update role permissions**
8. **Keep tokens short-lived and use refresh tokens**
9. **Implement IP whitelisting for admin access (optional)**
10. **Log all failed authentication attempts**

## 🔄 Workflow Examples

### Approve New Restaurant
1. Admin logs in
2. Views pending restaurants: `GET /admin/restaurants?status=pending_approval`
3. Reviews restaurant details: `GET /admin/restaurants/:id`
4. Checks documents and compliance
5. Approves: `POST /admin/restaurants/:id/approve`
6. Restaurant becomes active and can start listing food

### Handle Complaint
1. Admin receives complaint about restaurant
2. Views restaurant details and order history
3. Reviews customer feedback and ratings
4. Blocks restaurant: `POST /admin/restaurants/:id/block` with reason
5. All restaurant listings automatically suspended
6. Provider notified (via email/notification system)

### Monitor Platform Performance
1. Admin views dashboard: `GET /admin/analytics/overview`
2. Checks revenue trends: `GET /admin/analytics/revenue?filter=month`
3. Reviews top restaurants: `GET /admin/top-restaurants`
4. Identifies issues or opportunities
5. Takes action based on insights

---

**Your admin system is production-ready and secure!** 🎉
