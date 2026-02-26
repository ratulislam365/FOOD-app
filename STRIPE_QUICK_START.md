# ⚡ Stripe Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (Already Done ✅)
```bash
npm install stripe @types/stripe --legacy-peer-deps
```

### Step 2: Get Stripe Keys
1. Go to https://dashboard.stripe.com/register
2. Create account and activate test mode
3. Get your keys from: https://dashboard.stripe.com/test/apikeys
   - Copy **Publishable key**: `pk_test_...`
   - Copy **Secret key**: `sk_test_...`

### Step 3: Update .env File
```env
# Add these to your .env file
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
STRIPE_API_VERSION=2024-11-20.acacia
```

### Step 4: Set Up Webhook (For Local Testing)

**Option A: Using ngrok (Recommended)**
```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Option B: Using Stripe CLI**
```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:5000/api/v1/stripe/webhook

# Copy the webhook signing secret from output
```

### Step 5: Configure Webhook in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-ngrok-url.ngrok.io/api/v1/stripe/webhook`
4. Select events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Step 6: Test the Integration

**Test API Endpoint:**
```bash
# Get Stripe config
curl http://localhost:5000/api/v1/stripe/config

# Should return:
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_..."
  }
}
```

**Test Payment Flow:**
1. Import Postman collection: `postmanfile/postman_stripe_integration.json`
2. Set your JWT token in collection variables
3. Run "Create Payment Intent" request
4. Copy the `clientSecret` from response
5. Use Stripe test card: `4242 4242 4242 4242`
6. Confirm payment (use frontend or Stripe dashboard)
7. Check webhook logs - order should be created!

---

## 🧪 Quick Test Checklist

- [ ] Server starts without errors
- [ ] `/api/v1/stripe/config` returns publishable key
- [ ] Create payment intent returns `clientSecret`
- [ ] Webhook endpoint is accessible
- [ ] Test payment with `4242 4242 4242 4242` succeeds
- [ ] Order is created in database after payment
- [ ] Payment record is created
- [ ] Cart is cleared

---

## 🎯 API Endpoints

### 1. Get Config (Public)
```
GET /api/v1/stripe/config
```

### 2. Create Payment Intent (Customer)
```
POST /api/v1/stripe/create-payment-intent
Authorization: Bearer <token>

{
  "providerId": "65f1234567890abcdef12345",
  "items": [
    { "foodId": "65f9876543210fedcba98765", "quantity": 2 }
  ]
}
```

### 3. Webhook (Stripe)
```
POST /api/v1/stripe/webhook
stripe-signature: <signature>
```

### 4. Get Payment Status (Customer)
```
GET /api/v1/stripe/payment-status/:paymentIntentId
Authorization: Bearer <token>
```

### 5. Create Refund (Admin/Provider)
```
POST /api/v1/stripe/refund
Authorization: Bearer <token>

{
  "orderId": "ORD-123",
  "reason": "Customer requested"
}
```

---

## 🧪 Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 3D Secure |

**Card Details:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

---

## 🐛 Troubleshooting

### Issue: "STRIPE_SECRET_KEY is not defined"
**Fix:** Add Stripe keys to `.env` file and restart server

### Issue: Webhook signature verification fails
**Fix:** 
1. Check `STRIPE_WEBHOOK_SECRET` in `.env`
2. Ensure webhook URL is correct in Stripe dashboard
3. Use ngrok HTTPS URL (not HTTP)

### Issue: Order not created after payment
**Fix:**
1. Check webhook is configured in Stripe dashboard
2. Verify webhook URL is accessible
3. Check server logs for errors
4. Use Stripe dashboard → Webhooks → Recent deliveries to debug

### Issue: "Amount mismatch" error
**Fix:**
1. Ensure food items exist in database
2. Check food prices are set correctly
3. Verify customer has state set in profile

---

## 📚 Documentation

- **Complete Guide:** `STRIPE_INTEGRATION_GUIDE.md`
- **Testing Guide:** `STRIPE_TESTING_GUIDE.md`
- **Frontend Guide:** `STRIPE_FRONTEND_GUIDE.md`
- **Deployment:** `STRIPE_DEPLOYMENT_CHECKLIST.md`
- **Summary:** `STRIPE_IMPLEMENTATION_SUMMARY.md`

---

## 🎉 You're Ready!

Your Stripe integration is complete and ready to use. Follow the testing guide to verify everything works correctly.

**Next Steps:**
1. Test payment flow end-to-end
2. Review security checklist
3. Deploy to staging
4. Test in staging environment
5. Deploy to production

---

**Need Help?**
- Check documentation files
- Review Stripe docs: https://stripe.com/docs
- Contact support: support@stripe.com

**Last Updated:** February 2026
