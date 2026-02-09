#!/bin/bash

# Test OAuth Endpoints with curl
# This tests if the endpoints are registered correctly

echo "🧪 Testing OAuth Endpoints..."
echo ""

# Test 1: Google OAuth endpoint
echo "Test 1: POST /api/auth/google"
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test-token","requestedRole":"CUSTOMER"}' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo "Expected: 401 (Invalid token) or 400 (Validation error)"
echo "If you see 404, the route is not registered!"
echo ""

# Test 2: Step-up verification endpoint
echo "Test 2: POST /api/auth/google/verify-stepup"
curl -X POST http://localhost:3000/api/auth/google/verify-stepup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}' \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo "Expected: 404 (No verification found) or 400 (Validation error)"
echo "If you see 404 with 'Can't find', the route is not registered!"
echo ""

# Test 3: Sessions endpoint (should require auth)
echo "Test 3: GET /api/auth/sessions"
curl -X GET http://localhost:3000/api/auth/sessions \
  -w "\nStatus: %{http_code}\n" \
  -s
echo ""
echo "Expected: 401 (Unauthorized - no token)"
echo "If you see 404, the route is not registered!"
echo ""

echo "✨ Tests complete!"
