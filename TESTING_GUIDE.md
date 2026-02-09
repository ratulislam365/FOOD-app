# 🧪 Google OAuth Testing Guide

## Prerequisites

Before testing, you need:

1. ✅ Google OAuth credentials (Client ID & Secret)
2. ✅ Environment variables configured
3. ✅ MongoDB running
4. ✅ Server running on port 3000

---

## Step 1: Get Google OAuth Credentials

### A. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Project name: "EMDR Auth" (or your choice)

### B. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: `EMDR Application`
   - User support email: `your-email@example.com`
   - Developer contact: `your-email@example.com`
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email addresses)
6. Click **Save and Continue**

### C. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `EMDR Web Client`
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:3000/auth/callback
   http://localhost:5173/auth/callback
   ```
7. Click **Create**
8. **Copy Client ID and Client Secret** (you'll need these!)

---

## Step 2: Configure Environment Variables

Update your `.env` file:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/emdr

# Server
PORT=3000
NODE_ENV=development

# Google OAuth (REPLACE WITH YOUR CREDENTIALS)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here

# JWT Secrets (GENERATE STRONG SECRETS)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Security Settings
REQUIRE_PROVIDER_APPROVAL=true
ENABLE_STEP_UP_VERIFICATION=true
MAX_SESSIONS_PER_USER=5
ALLOW_PROVIDER_SIGNUPS=true

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=EMDR <noreply@emdr.com>
```

### Generate Strong JWT Secrets

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 3: Start Your Server

```bash
# Install dependencies (if not done)
npm install

# Start server
npm run dev
```

Expected output:
```
Server running on port 3000
MongoDB connected successfully
```

---

## Step 4: Get Google idToken for Testing

### Method 1: Using Google OAuth Playground (Easiest)

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

2. Click the **Settings** icon (⚙️) in top right

3. Check **"Use your own OAuth credentials"**

4. Enter your credentials:
   - OAuth Client ID: `YOUR_CLIENT_ID`
   - OAuth Client secret: `YOUR_CLIENT_SECRET`

5. In the left panel, select:
   - **Google OAuth2 API v2**
   - Check: `https://www.googleapis.com/auth/userinfo.email`
   - Check: `https://www.googleapis.com/auth/userinfo.profile`

6. Click **"Authorize APIs"**

7. Sign in with your Google account

8. Click **"Exchange authorization code for tokens"**

9. **Copy the `id_token`** value (this is your Google idToken!)

### Method 2: Using Frontend (React Example)

```bash
# Create a simple test page
npx create-react-app google-auth-test
cd google-auth-test
npm install @react-oauth/google
```

Create `src/App.js`:
```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <div style={{ padding: '50px' }}>
        <h1>Get Google idToken</h1>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            console.log('ID Token:', credentialResponse.credential);
            alert('Check console for idToken!');
          }}
          onError={() => console.log('Login Failed')}
        />
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
```

Run:
```bash
npm start
```

Click "Sign in with Google" and check the browser console for the idToken.

---

## Step 5: Test with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Select file: `postmanfile/Google_OAuth_System.postman_collection.json`
4. Collection imported!

### Configure Environment Variables

1. Click **Environments** in Postman
2. Create new environment: `EMDR Local`
3. Add variables:
   ```
   baseUrl: http://localhost:3000
   accessToken: (leave empty - will be auto-filled)
   refreshToken: (leave empty - will be auto-filled)
   sessionId: (leave empty - will be auto-filled)
   ```
4. Save and select this environment

### Test Endpoints

#### Test 1: Google OAuth - Customer Role

1. Select: **1. Authentication** > **Google OAuth - Customer**

2. Replace `PASTE_YOUR_GOOGLE_ID_TOKEN_HERE` with your actual idToken

3. Request body:
   ```json
   {
     "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTE1MmM4Y...",
     "requestedRole": "CUSTOMER"
   }
   ```

4. Click **Send**

5. Expected Response (200 OK):
   ```json
   {
     "success": true,
     "message": "Authentication successful",
     "data": {
       "user": {
         "id": "507f1f77bcf86cd799439011",
         "email": "user@example.com",
         "fullName": "John Doe",
         "role": "CUSTOMER",
         "isEmailVerified": true,
         "authProvider": "google",
         "profilePic": "https://lh3.googleusercontent.com/..."
       },
       "session": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "expiresAt": "2024-03-22T10:00:00.000Z"
       }
     }
   }
   ```

6. ✅ Tokens are automatically saved to environment variables!

#### Test 2: Google OAuth - Provider Role (Step-Up Required)

1. Select: **1. Authentication** > **Google OAuth - Provider**

2. Replace idToken with a fresh one

3. Request body:
   ```json
   {
     "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTE1MmM4Y...",
     "requestedRole": "PROVIDER"
   }
   ```

4. Click **Send**

5. Expected Response (200 OK):
   ```json
   {
     "success": true,
     "requiresStepUp": true,
     "message": "Additional verification required for PROVIDER access",
     "data": {
       "user": {
         "id": "507f1f77bcf86cd799439011",
         "email": "user@example.com",
         "fullName": "John Doe",
         "role": "PROVIDER",
         "isEmailVerified": true,
         "authProvider": "google"
       }
     }
   }
   ```

6. ✅ Check your email for the 6-digit OTP!

#### Test 3: Verify Step-Up OTP

1. Check your email for the OTP (e.g., `123456`)

2. Select: **1. Authentication** > **Verify Step-Up OTP**

3. Request body:
   ```json
   {
     "email": "user@example.com",
     "otp": "123456"
   }
   ```

4. Click **Send**

5. Expected Response (200 OK):
   ```json
   {
     "success": true,
     "message": "Verification successful",
     "data": {
       "user": {
         "id": "507f1f77bcf86cd799439011",
         "email": "user@example.com",
         "fullName": "John Doe",
         "role": "PROVIDER",
         "isEmailVerified": true,
         "authProvider": "google"
       },
       "session": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "expiresAt": "2024-03-22T10:00:00.000Z"
       }
     }
   }
   ```

6. ✅ Tokens saved! You're now authenticated as PROVIDER!

#### Test 4: Get Active Sessions

1. Select: **2. Session Management** > **Get All Active Sessions**

2. Authorization header is automatically added from environment

3. Click **Send**

4. Expected Response (200 OK):
   ```json
   {
     "success": true,
     "data": {
       "sessions": [
         {
           "id": "507f1f77bcf86cd799439011",
           "deviceName": "Chrome on Windows",
           "deviceType": "web",
           "ipAddress": "192.168.1.100",
           "country": "United States",
           "city": "New York",
           "lastActivityAt": "2024-03-15T10:30:00.000Z",
           "createdAt": "2024-03-15T10:00:00.000Z"
         }
       ]
     }
   }
   ```

#### Test 5: Revoke Session

1. Select: **2. Session Management** > **Revoke Specific Session**

2. The sessionId is automatically used from the previous response

3. Click **Send**

4. Expected Response (200 OK):
   ```json
   {
     "success": true,
     "message": "Session revoked successfully"
   }
   ```

---

## Step 6: Verify in Database

### Check MongoDB

```bash
# Connect to MongoDB
mongosh

# Use your database
use emdr

# Check users
db.users.find().pretty()

# Check sessions
db.sessions.find().pretty()

# Check audit logs
db.auditlogs.find().sort({ timestamp: -1 }).limit(10).pretty()

# Check step-up verifications
db.stepupverifications.find().pretty()
```

Expected data:

**User Document:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  fullName: "John Doe",
  email: "user@example.com",
  role: "PROVIDER",
  isEmailVerified: true,
  authProvider: "google",
  googleId: "123456789012345678901",
  googleEmail: "user@example.com",
  googlePicture: "https://lh3.googleusercontent.com/...",
  roleAssignedAt: ISODate("2024-03-15T10:00:00.000Z"),
  roleAssignedBy: "system",
  isProviderApproved: true,
  isActive: true,
  isSuspended: false,
  lastLoginAt: ISODate("2024-03-15T10:30:00.000Z"),
  createdAt: ISODate("2024-03-15T10:00:00.000Z"),
  updatedAt: ISODate("2024-03-15T10:30:00.000Z")
}
```

**Session Document:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  refreshToken: "hashed_refresh_token_here",
  accessToken: "hashed_access_token_here",
  deviceId: "abc123def456",
  deviceName: "Chrome on Windows",
  deviceType: "web",
  userAgent: "Mozilla/5.0...",
  ipAddress: "192.168.1.100",
  tokenFamily: "uuid-token-family-id",
  issuedAt: ISODate("2024-03-15T10:00:00.000Z"),
  expiresAt: ISODate("2024-03-22T10:00:00.000Z"),
  isRevoked: false,
  lastActivityAt: ISODate("2024-03-15T10:30:00.000Z"),
  createdAt: ISODate("2024-03-15T10:00:00.000Z")
}
```

**Audit Log Document:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  eventType: "GOOGLE_AUTH_SUCCESS",
  userId: ObjectId("507f1f77bcf86cd799439011"),
  email: "user@example.com",
  action: "Google authentication successful",
  result: "success",
  ipAddress: "192.168.1.100",
  userAgent: "PostmanRuntime/7.32.3",
  deviceId: "abc123def456",
  riskLevel: "LOW",
  timestamp: ISODate("2024-03-15T10:00:00.000Z"),
  createdAt: ISODate("2024-03-15T10:00:00.000Z")
}
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module 'google-auth-library'"

**Solution:**
```bash
npm install google-auth-library --legacy-peer-deps
```

### Issue 2: "Invalid token signature"

**Causes:**
- idToken expired (tokens expire after 1 hour)
- Wrong GOOGLE_CLIENT_ID in .env
- idToken from different Google project

**Solution:**
- Get a fresh idToken from OAuth Playground
- Verify GOOGLE_CLIENT_ID matches your Google Cloud project
- Ensure you're using the correct Google account

### Issue 3: "Token audience mismatch"

**Solution:**
- Check that GOOGLE_CLIENT_ID in `.env` matches the one in Google Cloud Console
- Ensure frontend and backend use the same Client ID

### Issue 4: "Email not verified by Google"

**Solution:**
- Verify your email with Google first
- Or temporarily disable check (not recommended for production)

### Issue 5: "OTP not received"

**Causes:**
- Email service not configured
- Wrong email credentials in .env

**Solution:**
- Check EMAIL_* variables in .env
- For Gmail, use App Password (not regular password)
- Check spam folder
- Check server logs for email errors

### Issue 6: "Session not found"

**Solution:**
- Login again to create new session
- Check MongoDB connection
- Verify session hasn't expired

---

## Testing Checklist

- [ ] Google OAuth credentials configured
- [ ] Environment variables set
- [ ] MongoDB running
- [ ] Server running on port 3000
- [ ] Email service configured (for OTP)
- [ ] Postman collection imported
- [ ] Fresh Google idToken obtained
- [ ] Test 1: Customer login (success)
- [ ] Test 2: Provider login (step-up required)
- [ ] Test 3: OTP verification (success)
- [ ] Test 4: Get sessions (success)
- [ ] Test 5: Revoke session (success)
- [ ] Database verification (data exists)
- [ ] Audit logs created (events logged)

---

## Next Steps

After successful testing:

1. **Integrate with Frontend**
   - Add Google OAuth button
   - Handle step-up verification flow
   - Implement token refresh logic

2. **Production Deployment**
   - Use production Google OAuth credentials
   - Enable HTTPS
   - Configure production email service
   - Set up monitoring and alerts

3. **Security Hardening**
   - Enable rate limiting
   - Configure CORS properly
   - Set up IP geolocation
   - Implement CAPTCHA for OTP

---

**Happy Testing! 🚀**
