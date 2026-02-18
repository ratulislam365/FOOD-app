# 🚀 Admin System - Quick Reference Card

## ⚡ Quick Start (3 Commands)

```bash
# 1. Seed test data
npm run seed:admin

# 2. Start server
npm run dev

# 3. Import Postman collection and test!
```

## 🔑 Test Credentials

```
Admin:    admin@fooddelivery.com / Admin@123456
Provider: joe@test.com / Provider@123
Customer: john@test.com / Customer@123
```

## 📍 Base URL

```
http://localhost:5000/api/v1
```

## 🔐 Authentication Header

```
Authorization: Bearer <your_jwt_token>
```

## 📋 Most Used Endpoints

### Login
```http
POST /auth/login
Body: { "email": "admin@fooddelivery.com", "password": "Admin@123456" }
```

### Get All Restaurants
```http
GET /admin/restaurants?page=1&limit=20&status=all_status
```

### Approve Restaurant
```http
POST /admin/restaurants/:restaurantId/approve
```

### Block Restaurant
```http
POST /admin/restaurants/:restaurantId/block
Body: { "reason": "Violation reason here" }
```

### Get All Customers
```http
GET /admin/users/customers?page=1&limit=20
```

### Get All Providers
```http
GET /admin/users/providers?page=1&limit=20
```

### Get Analytics
```http
GET /admin/analytics?providerId=:providerId
```

### Get Top Restaurants
```http
GET /admin/top-restaurants?page=1&limit=10
```

## 🎯 Filter Options

### Restaurant Status
- `all_status` - All restaurants
- `approved` - Approved only
- `pending_approval` - Pending only
- `blocked` - Blocked only

### State Filter
- `all_states` - All states
- `NY`, `CA`, `IL`, etc. - Specific state

### Rating Filter
- `all_ratings` - All ratings
- `1`, `2`, `3`, `4`, `5` - Specific rating range

### User Status
- `all_status` - All users
- `active` - Active only
- `suspended` - Suspended only

## ✅ Expected Responses

### Success (200)
```json
{
  "success": true,
  "data": { ... }
}
```

### Unauthorized (401)
```json
{
  "status": "error",
  "message": "You are not logged in!",
  "errorCode": "AUTH_ERROR"
}
```

### Forbidden (403)
```json
{
  "status": "error",
  "message": "You do not have permission",
  "errorCode": "ROLE_ERROR"
}
```

### Not Found (404)
```json
{
  "status": "error",
  "message": "Restaurant not found"
}
```

## 🧪 Quick Test Sequence

1. **Login as Admin**
   ```
   POST /auth/login
   → Save token
   ```

2. **View Restaurants**
   ```
   GET /admin/restaurants
   → Get restaurant IDs
   ```

3. **Approve Restaurant**
   ```
   POST /admin/restaurants/:id/approve
   → Restaurant activated
   ```

4. **View Analytics**
   ```
   GET /admin/analytics?providerId=:id
   → See metrics
   ```

## 🔒 Role Access Matrix

| Endpoint | Admin | Provider | Customer |
|----------|-------|----------|----------|
| `/admin/*` | ✅ | ❌ | ❌ |
| `/provider/*` | ❌ | ✅ | ❌ |
| `/customer/*` | ❌ | ❌ | ✅ |
| `/auth/*` | ✅ | ✅ | ✅ |

## 📊 Admin Capabilities

✅ View all restaurants
✅ Approve/reject restaurants
✅ Block/unblock restaurants
✅ View all users (customers & providers)
✅ View orders and reviews
✅ Access analytics and reports
✅ Monitor platform performance
✅ Track compliance

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Login first, check token |
| 403 Forbidden | Use admin token, not provider/customer |
| 404 Not Found | Check ID format, run seed script |
| Connection refused | Start server: `npm run dev` |
| No data | Run: `npm run seed:admin` |

## 📁 Important Files

```
postman/
  ├── Admin_System_Complete.postman_collection.json
  └── Admin_System.postman_environment.json

Documentation/
  ├── ADMIN_SYSTEM_GUIDE.md (Complete API docs)
  ├── ADMIN_TESTING_GUIDE.md (Testing instructions)
  ├── ADMIN_SYSTEM_SUMMARY.md (Overview)
  └── ADMIN_QUICK_REFERENCE.md (This file)

Scripts/
  └── seed-admin-test-data.ts (Test data)
```

## 🎯 Common Tasks

### Task: Approve Pending Restaurant
```bash
# 1. Get pending restaurants
GET /admin/restaurants?status=pending_approval

# 2. Review details
GET /admin/restaurants/:id

# 3. Approve
POST /admin/restaurants/:id/approve
```

### Task: Handle Complaint
```bash
# 1. Get restaurant details
GET /admin/restaurants/:id

# 2. Check reviews
GET /admin/providers/:id/reviews

# 3. Block if needed
POST /admin/restaurants/:id/block
Body: { "reason": "Multiple complaints" }
```

### Task: View Platform Stats
```bash
# 1. Overview
GET /admin/analytics/overview

# 2. Revenue trends
GET /admin/analytics/revenue?filter=month

# 3. Top performers
GET /admin/top-restaurants
```

## 💡 Pro Tips

1. **Save tokens**: Postman auto-saves after login
2. **Use filters**: Narrow down results efficiently
3. **Check status**: Verify restaurant status before actions
4. **Monitor logs**: Watch server console for errors
5. **Test roles**: Verify access control works

## 📞 Need Help?

1. Check `ADMIN_TESTING_GUIDE.md` for detailed tests
2. Read `ADMIN_SYSTEM_GUIDE.md` for complete API docs
3. Review `ADMIN_SYSTEM_SUMMARY.md` for overview
4. Check server logs for error details

---

**Ready to manage your platform!** 🎉

Quick start: `npm run seed:admin && npm run dev`
