# 🎯 Stripe Payment Integration - Complete Guide

## 📋 Executive Summary

This document outlines the production-ready Stripe payment integration for the EMDR food delivery platform with webhook-driven order creation, platform fee distribution, and marketplace capabilities.

---

## 🚨 CRITICAL SECURITY AUDIT FINDINGS

### ❌ Current Implementation Issues:

1. **PRICE MANIPULATION RISK** - Orders created BEFORE payment confirmation
   - `createOrder()` in `order.service.ts` creates orders immediately
   - No payment verification before order creation
   - Frontend can submit any price

2. **MISSING WEBHOOK VERIFICATION** - No Stripe webhook handler exists
   - Orders not tied to payment confirmation
   - No payment_intent.succeeded handler

3. **NO IDEMPOTENCY** - Duplicate order risk
   - No idempotency keys in order creation
   - Webhook replay attacks possible

4. **TRUST FRONTEND AMOUNTS** - Backend recalculates but order created before payment
   - Current flow: Calculate → Create Order → (Payment happens elsewhere?)
   - Should be: Calculate → Create PaymentIntent → Webhook → Create Order

5. **NO STRIPE INTEGRATION** - Payment tracking exists but no actual payment processing
   - Payment model tracks status but no Stripe PaymentIntent ID
   - No client_secret returned to frontend

---

## 🏗️ Proposed Architecture

### Secure Payment Flow:

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. POST /api/v1/stripe/create-payment-intent
       │    { cartItems, providerId }
       ▼
┌─────────────────────────────────────────────────────┐
│  Backend: Calculate & Create PaymentIntent          │
│  - Fetch cart items from DB (trust backend prices)  │
│  - Calculate: subtotal + platformFee + stateTax     │
│  - Create Stripe PaymentIntent                      │
│  - Store metadata: userId, providerId, state        │
│  - Return: { clientSecret, amount, breakdown }      │
└──────┬──────────────────────────────────────────────┘
       │ 2. Returns clientSecret
       ▼
┌─────────────┐
│  Frontend   │ 3. Stripe SDK: confirmPayment(clientSecret)
└──────┬──────┘
       │ 4. Payment processed by Stripe
       ▼
┌─────────────┐
│   Stripe    │ 5. Webhook: payment_intent.succeeded
└──────┬──────┘
       │ 6. POST /api/v1/stripe/webhook (with signature)
       ▼
┌─────────────────────────────────────────────────────┐
│  Backend Webhook Handler                            │
│  - Verify Stripe signature                          │
│  - Check idempotency (prevent replay)               │
│  - Extract metadata                                 │
│  - Create Order in DB (status: PAID)                │
│  - Create Payment record                            │
│  - Send notifications                               │
│  - Clear cart                                       │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### Enhanced Order Model:
```typescript
{
  // Existing fields...
  stripePaymentIntentId: string;  // NEW
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';  // NEW
  idempotencyKey: string;  // NEW (prevent duplicate orders)
}
```

### Enhanced Payment Model:
```typescript
{
  // Existing fields...
  stripePaymentIntentId: string;  // NEW
  stripeChargeId: string;  // NEW
  vendorAmount: number;  // NEW (amount after platform fee)
  stripeTransferId: string;  // NEW (for marketplace)
}
```

---

## 💰 Platform Fee Distribution

### Fee Calculation Logic:

```typescript
// State-based platform fee
const platformFeeRate = state === "CA" ? 0.10 : 0.07;  // 10% CA, 7% others

// Calculation
subtotal = Σ(item.price × item.quantity)
stateTax = subtotal × stateTaxRate  // From State model
platformFee = subtotal × platformFeeRate
total = subtotal + stateTax + platformFee

// Vendor receives
vendorAmount = subtotal - platformFee
```

### Stripe Implementation Options:

**Option 1: Direct Charges (Current - Simpler)**
- Platform receives full payment
- Platform manually transfers to vendors
- Easier to implement
- More control over payouts

**Option 2: Stripe Connect (Marketplace - Advanced)**
- Use `application_fee_amount` in PaymentIntent
- Automatic transfers to vendor Stripe accounts
- Requires vendor onboarding to Stripe
- Better for true marketplace

**Recommendation**: Start with Option 1, migrate to Option 2 later

---

## 🔐 Security Implementation

### 1. Webhook Signature Verification:
```typescript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  rawBody,  // MUST be raw buffer, not parsed JSON
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 2. Idempotency:
```typescript
// Store processed webhook events
const processed = await WebhookEvent.findOne({ 
  eventId: event.id 
});
if (processed) return; // Already processed

// Create order with idempotency key
const order = await Order.create({
  idempotencyKey: event.id,
  // ... other fields
});
```

### 3. Price Validation:
```typescript
// NEVER trust frontend prices
const items = await Food.find({ 
  _id: { $in: cartItemIds } 
});
const calculatedTotal = calculateTotal(items);

// Verify against PaymentIntent amount
if (paymentIntent.amount !== calculatedTotal * 100) {
  throw new Error('Amount mismatch');
}
```

---

## 📡 API Endpoints

### 1. Create Payment Intent
```
POST /api/v1/stripe/create-payment-intent
Auth: Required (Customer)
Body: {
  providerId: string;
  items: { foodId: string; quantity: number }[];
}
Response: {
  clientSecret: string;
  amount: number;
  breakdown: {
    subtotal: number;
    platformFee: number;
    stateTax: number;
    total: number;
  }
}
```

### 2. Webhook Handler
```
POST /api/v1/stripe/webhook
Auth: None (Stripe signature verification)
Headers: { stripe-signature: string }
Body: Stripe Event (raw)
Response: { received: true }
```

### 3. Get Payment Status
```
GET /api/v1/stripe/payment-status/:paymentIntentId
Auth: Required
Response: {
  status: string;
  orderId?: string;
}
```

---

## 🧪 Testing Checklist

### Stripe Test Cards:
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔄 3D Secure: `4000 0025 0000 3155`
- ⏱️ Slow: `4000 0000 0000 0259`

### Test Scenarios:
1. ✅ Successful payment → Order created
2. ❌ Failed payment → No order created
3. 🔄 Webhook replay → Only one order created
4. 💰 Price manipulation → Backend recalculates
5. 🌐 Different states → Correct tax applied
6. 📦 Multiple items → Correct totals
7. 🔐 Invalid signature → Webhook rejected
8. ⏱️ Webhook timeout → Retry handling

---

## 🚀 Deployment Checklist

### Environment Variables:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2024-11-20.acacia
```

### Stripe Dashboard Setup:
1. Create Stripe account
2. Get API keys (test & live)
3. Configure webhook endpoint: `https://yourdomain.com/api/v1/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook secret

### Production Considerations:
- ✅ Use HTTPS for webhook endpoint
- ✅ Set up webhook retry logic
- ✅ Monitor webhook failures in Stripe dashboard
- ✅ Set up Stripe alerts for failed payments
- ✅ Implement refund handling
- ✅ Add payment reconciliation reports
- ✅ Set up error logging (Sentry, etc.)

---

## 🐛 Common Issues & Fixes

### Issue 1: Webhook not receiving events
**Fix**: Check Stripe dashboard → Webhooks → Recent deliveries

### Issue 2: Signature verification fails
**Fix**: Ensure raw body is passed to `constructEvent`, not parsed JSON

### Issue 3: Duplicate orders created
**Fix**: Implement idempotency key checking

### Issue 4: Amount mismatch errors
**Fix**: Stripe uses cents (multiply by 100)

### Issue 5: Webhook timeout
**Fix**: Return 200 immediately, process async

---

## 📚 Frontend Integration Example

```typescript
// 1. Create PaymentIntent
const response = await fetch('/api/v1/stripe/create-payment-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    providerId: 'provider123',
    items: cartItems
  })
});

const { clientSecret, breakdown } = await response.json();

// 2. Confirm payment with Stripe SDK
const { error } = await stripe.confirmPayment({
  clientSecret,
  confirmParams: {
    return_url: 'https://yourapp.com/order-success'
  }
});

// 3. Handle result
if (error) {
  // Show error to customer
} else {
  // Redirect to success page
  // Poll for order status or use webhook notification
}
```

---

## 🎯 Implementation Priority

### Phase 1: Core Payment (Week 1)
- ✅ Install Stripe SDK
- ✅ Create payment intent endpoint
- ✅ Implement webhook handler
- ✅ Update Order model
- ✅ Basic testing

### Phase 2: Security & Validation (Week 2)
- ✅ Idempotency implementation
- ✅ Price validation
- ✅ Webhook signature verification
- ✅ Error handling

### Phase 3: Advanced Features (Week 3)
- ✅ Refund handling
- ✅ Payment status polling
- ✅ Admin payment dashboard
- ✅ Reconciliation reports

### Phase 4: Marketplace (Future)
- ⏳ Stripe Connect integration
- ⏳ Vendor onboarding
- ⏳ Automatic transfers
- ⏳ Split payments

---

## 📞 Support Resources

- Stripe Docs: https://stripe.com/docs/payments/payment-intents
- Webhook Guide: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing
- Node.js SDK: https://github.com/stripe/stripe-node

---

**Status**: Ready for Implementation  
**Last Updated**: February 2026  
**Version**: 1.0.0
