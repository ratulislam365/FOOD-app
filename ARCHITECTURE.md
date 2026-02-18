# 🏗️ Backend Architecture Documentation

## Project Overview
A scalable Node.js/Express/MongoDB backend for a food delivery platform with Provider (restaurants) and Customer roles.

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Google OAuth
- **Validation**: Zod
- **File Storage**: Cloudinary
- **Caching**: Redis (ioredis)
- **Real-time**: Socket.io
- **Email**: Nodemailer

## Architecture Pattern
**MVC (Model-View-Controller)** with additional layers:
- **Models**: Data schemas and database interaction
- **Controllers**: HTTP request/response handling
- **Services**: Business logic and orchestration
- **Repositories**: Complex data queries
- **Middlewares**: Cross-cutting concerns (auth, validation, errors)
- **Routes**: API endpoint definitions

## Folder Structure

```
src/
├── config/                 # Configuration files
│   ├── index.ts           # Central config export
│   ├── cloudinary.ts      # Cloudinary setup
│   └── redis.ts           # Redis connection
│
├── models/                # Mongoose schemas
│   ├── user.model.ts      # User authentication & roles
│   ├── profile.model.ts   # Customer profile data
│   ├── providerProfile.model.ts  # Restaurant/provider data
│   ├── order.model.ts     # Order management
│   ├── food.model.ts      # Menu items
│   ├── cart.model.ts      # Shopping cart
│   ├── payment.model.ts   # Payment records
│   └── ...
│
├── controllers/           # Request handlers
│   ├── auth.controller.ts
│   ├── provider.controller.ts
│   ├── order.controller.ts
│   └── ...
│
├── services/              # Business logic
│   ├── auth.service.ts
│   ├── provider.service.ts
│   ├── order.service.ts
│   └── ...
│
├── routes/                # API endpoints
│   ├── auth.routes.ts
│   ├── provider.routes.ts
│   ├── order.routes.ts
│   └── ...
│
├── middlewares/           # Cross-cutting concerns
│   ├── authenticate.ts    # JWT verification
│   ├── requireRole.ts     # Role-based access
│   ├── validate.ts        # Zod validation
│   └── errorMiddleware.ts # Global error handler
│
├── validations/           # Zod schemas
│   ├── auth.validation.ts
│   ├── order.validation.ts
│   └── ...
│
├── repositories/          # Complex queries
│   ├── analytics.repository.ts
│   └── payment.repository.ts
│
├── utils/                 # Helper functions
│   ├── AppError.ts        # Custom error class
│   ├── catchAsync.ts      # Async error wrapper
│   ├── authUtils.ts       # JWT helpers
│   └── emailService.ts    # Email sending
│
├── jobs/                  # Background tasks
│   └── cleanup.job.ts     # Scheduled cleanup
│
├── database/
│   └── db.ts             # MongoDB connection
│
├── app.ts                # Express app setup
└── server.ts             # Server initialization
```

## Data Models

### User Model (Authentication)
```typescript
{
  fullName: string
  email: string (unique)
  passwordHash?: string
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  authProvider: 'email' | 'google' | 'facebook'
  googleId?: string
  isEmailVerified: boolean
  isProviderApproved?: boolean
  isActive: boolean
  isSuspended: boolean
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
  cuisine: string[]
  pickupWindows: Array<{days, startTime, endTime}>
  status: 'ACTIVE' | 'BLOCKED'
}
```

### Customer Profile Model
```typescript
{
  userId: ObjectId (ref: User)
  name: string
  phone: string
  address: string
  city: string
  state: string
  profilePic: string
}
```

## API Flow Example: Provider Registration

### 1. Route Definition (`src/routes/provider.routes.ts`)
```typescript
router.post('/register', 
  validate(providerValidation), 
  providerController.register
);
```

### 2. Validation Middleware
- Zod schema validates request body
- Checks required fields (name, email, location)
- Returns 400 if validation fails

### 3. Controller (`src/controllers/provider.controller.ts`)
```typescript
export const register = catchAsync(async (req, res) => {
  const result = await providerService.register(req.body);
  res.status(201).json({
    status: 'success',
    data: result
  });
});
```

### 4. Service (`src/services/provider.service.ts`)
```typescript
export const register = async (data) => {
  // Check if email exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new AppError('Email already registered', 400);
  
  // Create user with PROVIDER role
  const user = await User.create({
    fullName: data.name,
    email: data.email,
    role: UserRole.PROVIDER,
    passwordHash: await bcrypt.hash(data.password, 12)
  });
  
  // Create provider profile with location
  const profile = await ProviderProfile.create({
    providerId: user._id,
    restaurantName: data.restaurantName,
    location: {
      lat: data.latitude,
      lng: data.longitude
    }
  });
  
  return { user, profile };
};
```

### 5. Response
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "...",
      "fullName": "John's Restaurant",
      "email": "john@restaurant.com",
      "role": "PROVIDER"
    },
    "profile": {
      "_id": "...",
      "restaurantName": "John's Diner",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    }
  }
}
```

## Authentication Flow

### Email/Password Registration
1. User submits credentials
2. Password hashed with bcrypt
3. User created with `authProvider: 'email'`
4. JWT token generated
5. Email verification sent

### Google OAuth
1. Frontend gets Google token
2. Backend verifies with Google API
3. User created/found with `authProvider: 'google'`
4. JWT token generated
5. Auto-verified email

### Protected Routes
```typescript
router.get('/dashboard', 
  authenticate,              // Verify JWT
  requireRole(['PROVIDER']), // Check role
  dashboardController.get
);
```

## Error Handling

### Custom Error Class
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

### Global Error Handler
- Catches all errors
- Formats response consistently
- Logs errors in development
- Hides stack traces in production

### Async Error Wrapper
```typescript
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```

## Security Features

1. **Password Security**: bcrypt hashing (12 rounds)
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Access**: Middleware checks user roles
4. **Rate Limiting**: Prevents brute force attacks
5. **Input Validation**: Zod schemas prevent injection
6. **CORS**: Configured for allowed origins
7. **Helmet**: Security headers (if added)
8. **Session Management**: Track active sessions
9. **Audit Logging**: Track sensitive operations

## Database Indexes

### User Model
- `email` (unique)
- `googleId` (sparse, unique)
- `role + isActive` (compound)

### Provider Profile
- `providerId` (unique)
- `city` (for location queries)
- `state` (for location queries)

## Real-time Features (Socket.io)

- Chat messaging
- Order status updates
- Notifications
- Live dashboard updates

## Background Jobs

- Cleanup expired sessions
- Remove old OTPs
- Archive old orders
- Send scheduled notifications

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
REDIS_URL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USER=...
EMAIL_PASS=...
```

## API Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "stack": "..." // Only in development
}
```

## Best Practices Implemented

✅ TypeScript for type safety
✅ Async/await for asynchronous operations
✅ Environment-based configuration
✅ Centralized error handling
✅ Input validation with Zod
✅ Password hashing
✅ JWT authentication
✅ Role-based authorization
✅ Database indexing
✅ Clean code separation
✅ RESTful API design
✅ Proper HTTP status codes
✅ Logging (Morgan)
✅ CORS configuration
✅ Rate limiting

## Proximity Search Feature

### Overview
Customers can find nearby restaurants/providers based on their location using the Haversine formula.

### Endpoint
```
POST /api/v1/provider/nearby
```

### Request
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 3,
  "cuisine": "Italian",
  "page": 1,
  "limit": 20
}
```

### Response
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
      "availableFoods": 25
    }
  ],
  "pagination": { "total": 5, "page": 1, "totalPages": 1 }
}
```

### How It Works
1. Customer sends their coordinates (lat/lng)
2. System queries active & approved providers
3. Calculates distance using Haversine formula
4. Filters providers within specified radius
5. Sorts by distance (nearest first)
6. Returns paginated results

### Files
- `src/utils/distance.utils.ts` - Haversine formula implementation
- `src/validations/provider.validation.ts` - Input validation
- `src/services/provider.service.ts` - Business logic
- `src/controllers/provider.controller.ts` - Request handler
- `src/repositories/provider.repository.ts` - Geospatial queries

### Documentation
- See `PROXIMITY_SEARCH_GUIDE.md` for detailed API documentation
- See `GEOSPATIAL_MIGRATION.md` for MongoDB optimization guide

## Future Enhancements

- [x] Proximity-based provider search with Haversine formula
- [ ] Migrate to MongoDB geospatial indexes for better performance
- [ ] Add Redis caching for frequent location searches
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement refresh tokens
- [ ] Add unit and integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add Docker containerization
- [ ] Add monitoring (Sentry, DataDog)
- [ ] Implement webhooks
- [ ] Add GraphQL support (optional)
- [ ] Implement microservices (if needed)
