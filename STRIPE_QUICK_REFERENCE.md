# 🎯 Stripe Payment System - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Add Stripe Keys to .env
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```
Get keys: https://dashboard.stripe.com/test/apikeys

### 2. Set Up Webhook (Local Testing)
```bash
# Option A: ngrok
ngrok http 5000
# Copy HTTPS URL → Stripe Dashboard → Webhooks

# Option B: Stripe CLI
stripe listen --forward-to localhost:5000/api/v1/stripe/webhook
# Copy webhook secret → .env
```

### 3. Test
```bash
npm run dev
# Import: postmanfile/postman_stripe_integration.json
# Test: Create Payment Intent
```

---

## 📡 API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/stripe/config` | GET | None | Get publishable key |
| `/api/v1/stripe/create-payment-intent` | POST | Customer | Create payment |
| `/api/v1/stripe/webhook` | POST | Signature | Stripe webhook |
| `/api/v1/stripe/payment-status/:id` | GET | Customer | Check status |
| `/api/v1/stripe/refund` | POST | Admin | Create refund |

---

## 💳 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 3D Secure |

Expiry: `12/34` | CVC: `123` | ZIP: `12345`

---

## 💰 Platform Fees

| State | Fee | Example |
|-------|-----|---------|
| California (CA) | 10% | $40 → $4 fee |
| All Others | 7% | $40 → $2.80 fee |

**Formula:**
```
Total = Subtotal + Platform Fee + State Tax
Vendor Gets = Subtotal - Platform Fee
```

---

## 🔄 Payment Flow

```
1. Frontend → Create Payment Intent
   POST /api/v1/stripe/create-payment-intent
   { providerId, items: [{foodId, quantity}] }

2. Backend → Returns clientSecret
   { clientSecret, amount, breakdown }

3. Frontend → Confirm Payment (Stripe.js)
   stripe.confirmPayment({ clientSecret })

4. Stripe → Sends Webhook
   payment_intent.succeeded

5. Backend → Creates Order
   Order + Payment records created
```

---

## 🔐 Security Checklist

- ✅ Webhook signature verified
- ✅ Idempotency prevents duplicates
- ✅ Backend validates all prices
- ✅ Amount verified on webhook
- ✅ No card data stored
- ✅ JWT authentication
- ✅ Role-based access

---

## 📁 Key Files

```
src/
├── config/stripe.ts              # Stripe SDK
├── models/webhookEvent.model.ts  # Idempotency
├── services/stripe.service.ts    # Core logic
├── controllers/stripe.controller.ts # API
├── routes/stripe.routes.ts       # Routes
└── validations/stripe.validation.ts # Validation

Documentation/
├── STRIPE_README.md              # Start here
├── STRIPE_QUICK_START.md         # 5-min setup
├── STRIPE_TESTING_GUIDE.md       # Testing
└── PAYMENT_SYSTEM_VERIFICATION.md # A-Z check
```

---

## 🐛 Common Issues

### Webhook not received
- Check Stripe Dashboard → Webhooks → Recent deliveries
- Verify URL is correct and accessible
- Use ngrok HTTPS URL (not HTTP)

### Signature verification fails
- Check STRIPE_WEBHOOK_SECRET in .env
- Ensure raw body middleware is before express.json()
- Verify webhook secret matches Stripe dashboard

### Order not created
- Check webhook is configured
- Verify events selected: payment_intent.succeeded
- Check server logs for errors

---

## 📊 Monitoring

**Key Metrics:**
- Payment success rate (target: >95%)
- Webhook delivery rate (target: >98%)
- Order creation latency (target: <5s)

**Alerts:**
- Payment intent creation failures
- Webhook signature failures
- Order creation failures
- Amount mismatch errors

---

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| `STRIPE_README.md` | Overview & navigation |
| `STRIPE_QUICK_START.md` | Get started in 5 minutes |
| `STRIPE_INTEGRATION_GUIDE.md` | Complete technical guide |
| `STRIPE_TESTING_GUIDE.md` | Testing procedures |
| `STRIPE_DEPLOYMENT_CHECKLIST.md` | Production deployment |
| `STRIPE_FRONTEND_GUIDE.md` | Frontend integration |
| `PAYMENT_SYSTEM_VERIFICATION.md` | A-Z verification |

---

## ✅ Status

**Implementation:** ✅ 100% Complete  
**Documentation:** ✅ 100% Complete  
**Security:** ✅ 100% Implemented  
**Testing:** ⏳ Needs Stripe keys

**Next:** Add Stripe keys → Test → Deploy

---

**Quick Help:**
- Stripe Docs: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com
- Support: support@stripe.com
