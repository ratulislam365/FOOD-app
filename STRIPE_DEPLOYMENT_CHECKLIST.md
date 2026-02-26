# 🚀 Stripe Integration - Production Deployment Checklist

## 📋 Pre-Deployment

### Environment Configuration
- [ ] All Stripe keys added to production `.env`
  - [ ] `STRIPE_SECRET_KEY` (starts with `sk_live_`)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
  - [ ] `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)
  - [ ] `STRIPE_API_VERSION=2024-11-20.acacia`
- [ ] Environment variables secured (not in version control)
- [ ] Secrets stored in secure vault (AWS Secrets Manager, etc.)

### Database
- [ ] Run migrations to add new fields:
  - [ ] `Order.stripePaymentIntentId`
  - [ ] `Order.idempotencyKey`
  - [ ] `Order.paymentStatus`
  - [ ] `Order.vendorAmount`
  - [ ] `Payment.stripePaymentIntentId`
  - [ ] `Payment.stripeChargeId`
  - [ ] `Payment.vendorAmount`
- [ ] Create indexes:
  - [ ] `Order.stripePaymentIntentId` (unique, sparse)
  - [ ] `Order.idempotencyKey` (unique, sparse)
  - [ ] `Order.paymentStatus`
  - [ ] `Payment.stripePaymentIntentId` (unique, sparse)
  - [ ] `WebhookEvent.eventId` (unique)
  - [ ] `WebhookEvent.processed`
- [ ] Test database backup and restore

### Code Review
- [ ] All Stripe integration code reviewed
- [ ] Security audit completed
- [ ] No hardcoded secrets
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting enabled

---

## 🔐 Security Checklist

### API Security
- [ ] Webhook signature verification enabled
- [ ] Raw body middleware configured correctly
- [ ] HTTPS enforced for all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting on payment endpoints
- [ ] Authentication required for all non-webhook endpoints
- [ ] Authorization checks (user can only access their own data)

### Data Security
- [ ] Never store card numbers
- [ ] Never log sensitive data (card details, full PAN)
- [ ] PCI DSS compliance (Stripe handles card data)
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS for all communications
- [ ] Implement request signing for internal APIs

### Webhook Security
- [ ] Signature verification mandatory
- [ ] Idempotency implemented
- [ ] Replay attack prevention
- [ ] Event deduplication
- [ ] Timeout handling (return 200 quickly)
- [ ] Async processing for long operations

### Price Integrity
- [ ] Backend always recalculates prices
- [ ] Never trust frontend amounts
- [ ] Verify PaymentIntent amount matches calculated total
- [ ] Food prices fetched from database
- [ ] Platform fee calculated server-side
- [ ] State tax calculated server-side

---

## 🌐 Stripe Dashboard Configuration

### API Keys
- [ ] Switch to live mode in Stripe dashboard
- [ ] Generate live API keys
- [ ] Restrict API key permissions (if possible)
- [ ] Rotate keys regularly (quarterly)

### Webhook Configuration
- [ ] Create webhook endpoint in live mode
- [ ] URL: `https://yourdomain.com/api/v1/stripe/webhook`
- [ ] Select events:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded` (optional)
  - [ ] `payment_intent.canceled` (optional)
- [ ] Copy webhook signing secret
- [ ] Test webhook delivery
- [ ] Enable webhook retry logic

### Business Settings
- [ ] Configure business name
- [ ] Add business logo
- [ ] Set up email receipts
- [ ] Configure statement descriptor
- [ ] Set up customer support email
- [ ] Configure refund policy

### Radar (Fraud Prevention)
- [ ] Enable Stripe Radar
- [ ] Configure fraud rules
- [ ] Set up 3D Secure
- [ ] Review blocked payments regularly
- [ ] Configure risk thresholds

---

## 🧪 Testing in Production

### Smoke Tests
- [ ] Create payment intent (small amount)
- [ ] Confirm payment with test card (in test mode)
- [ ] Verify webhook received
- [ ] Verify order created
- [ ] Verify payment record created
- [ ] Verify notifications sent
- [ ] Verify cart cleared

### End-to-End Test
- [ ] Complete full checkout flow
- [ ] Test with different states (CA vs non-CA)
- [ ] Test with multiple items
- [ ] Test payment failure scenario
- [ ] Test refund flow
- [ ] Test webhook retry

### Load Testing
- [ ] Test concurrent payment intents
- [ ] Test webhook processing under load
- [ ] Test database performance
- [ ] Monitor response times
- [ ] Check for race conditions

---

## 📊 Monitoring & Alerting

### Application Monitoring
- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Log all payment events
- [ ] Monitor webhook processing time
- [ ] Track order creation success rate
- [ ] Monitor payment failure rate
- [ ] Set up performance monitoring (New Relic, DataDog, etc.)

### Stripe Monitoring
- [ ] Enable Stripe email alerts
- [ ] Configure alerts for:
  - [ ] Failed payments
  - [ ] Webhook failures
  - [ ] Unusual activity
  - [ ] High refund rate
  - [ ] Disputed charges
- [ ] Set up Stripe dashboard monitoring
- [ ] Review Stripe logs daily

### Custom Alerts
- [ ] Alert on payment intent creation failures
- [ ] Alert on webhook signature verification failures
- [ ] Alert on order creation failures
- [ ] Alert on amount mismatch errors
- [ ] Alert on high refund rate
- [ ] Alert on webhook processing delays

### Metrics to Track
- [ ] Payment success rate (target: >95%)
- [ ] Average order value
- [ ] Platform fee collected
- [ ] Webhook processing time (target: <2s)
- [ ] Order creation latency (target: <5s)
- [ ] Refund rate (target: <5%)
- [ ] Failed payment rate (target: <5%)

---

## 🔄 Operational Procedures

### Daily Operations
- [ ] Review Stripe dashboard for anomalies
- [ ] Check webhook delivery success rate
- [ ] Monitor error logs
- [ ] Review failed payments
- [ ] Check for stuck orders (payment succeeded but no order)

### Weekly Operations
- [ ] Review payment analytics
- [ ] Analyze refund reasons
- [ ] Check for fraud patterns
- [ ] Review platform fee collection
- [ ] Reconcile payments with orders

### Monthly Operations
- [ ] Financial reconciliation
- [ ] Review and update fraud rules
- [ ] Analyze payment trends
- [ ] Review and optimize platform fees
- [ ] Security audit
- [ ] Update dependencies

### Incident Response
- [ ] Document incident response plan
- [ ] Define escalation procedures
- [ ] Set up on-call rotation
- [ ] Create runbooks for common issues
- [ ] Test incident response procedures

---

## 🐛 Common Production Issues

### Issue: Webhook not received
**Detection:** Order not created after successful payment

**Resolution:**
1. Check Stripe dashboard → Webhooks → Recent deliveries
2. Verify webhook URL is correct and accessible
3. Check server logs for errors
4. Verify HTTPS certificate is valid
5. Check firewall/security groups
6. Manually retry webhook from Stripe dashboard

**Prevention:**
- Set up webhook monitoring
- Alert on webhook failures
- Implement webhook retry logic

---

### Issue: Duplicate orders
**Detection:** Same payment creates multiple orders

**Resolution:**
1. Check `WebhookEvent` table for duplicate processing
2. Verify idempotency key is unique
3. Check for race conditions
4. Review webhook processing logs

**Prevention:**
- Ensure idempotency implementation is correct
- Add unique index on `idempotencyKey`
- Use database transactions

---

### Issue: Amount mismatch
**Detection:** Error: "Amount mismatch: expected X, got Y"

**Resolution:**
1. Check if food prices changed between intent creation and webhook
2. Verify rounding logic (use `toFixed(2)`)
3. Check state tax calculation
4. Verify platform fee calculation

**Prevention:**
- Lock prices when creating payment intent
- Store price snapshot in metadata
- Add price change alerts

---

### Issue: Payment succeeded but order not created
**Detection:** Customer paid but no order in system

**Resolution:**
1. Check webhook processing logs
2. Verify webhook event was received
3. Check for errors in order creation
4. Manually create order from payment intent metadata
5. Refund customer if order cannot be created

**Prevention:**
- Implement webhook retry logic
- Add order creation monitoring
- Set up alerts for stuck payments

---

## 📞 Support & Escalation

### Stripe Support
- **Email:** support@stripe.com
- **Phone:** Available in dashboard
- **Chat:** Available in dashboard (business hours)
- **Priority Support:** Available for high-volume merchants

### Internal Escalation
1. **Level 1:** On-call engineer
2. **Level 2:** Engineering lead
3. **Level 3:** CTO / Technical director

### Customer Support Scripts
- [ ] Create scripts for common payment issues
- [ ] Document refund procedures
- [ ] Create FAQ for payment failures
- [ ] Train support team on Stripe basics

---

## 📚 Documentation

### Internal Documentation
- [ ] API documentation updated
- [ ] Architecture diagrams created
- [ ] Runbooks written
- [ ] Troubleshooting guides created
- [ ] Code comments added

### External Documentation
- [ ] Customer-facing payment guide
- [ ] Refund policy published
- [ ] Privacy policy updated (payment data handling)
- [ ] Terms of service updated

---

## ✅ Go-Live Checklist

### Final Checks
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Documentation complete
- [ ] Team trained
- [ ] Rollback plan ready
- [ ] Customer support prepared

### Deployment
- [ ] Deploy to staging
- [ ] Run smoke tests in staging
- [ ] Deploy to production (off-peak hours)
- [ ] Run smoke tests in production
- [ ] Monitor for 1 hour post-deployment
- [ ] Announce to team

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check webhook delivery
- [ ] Verify orders being created
- [ ] Review first 10 production payments
- [ ] Send status update to stakeholders

---

## 🔄 Rollback Plan

### Rollback Triggers
- Payment success rate drops below 80%
- Webhook failure rate exceeds 10%
- Critical security vulnerability discovered
- Database corruption detected

### Rollback Procedure
1. Stop accepting new payments (maintenance mode)
2. Revert code to previous version
3. Verify old system is working
4. Process any stuck payments manually
5. Communicate with affected customers
6. Post-mortem and fix issues

---

## 📈 Success Metrics

### Week 1
- [ ] Payment success rate >90%
- [ ] No critical incidents
- [ ] Webhook delivery rate >95%
- [ ] Average order creation time <5s

### Month 1
- [ ] Payment success rate >95%
- [ ] Refund rate <5%
- [ ] Customer satisfaction >4.5/5
- [ ] Zero security incidents

### Quarter 1
- [ ] Payment success rate >98%
- [ ] Platform fee collection on target
- [ ] Fraud rate <0.5%
- [ ] System uptime >99.9%

---

**Last Updated:** February 2026  
**Version:** 1.0.0  
**Status:** Production Ready
