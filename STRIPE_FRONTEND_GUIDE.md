# 🎨 Stripe Frontend Integration Guide

## 📋 Overview

This guide helps frontend developers integrate Stripe payments with the EMDR backend API.

---

## 🚀 Quick Start

### 1. Install Stripe.js

```bash
npm install @stripe/stripe-js
```

### 2. Initialize Stripe

```javascript
import { loadStripe } from '@stripe/stripe-js';

// Get publishable key from backend
const response = await fetch('http://localhost:5000/api/v1/stripe/config');
const { data } = await response.json();
const stripe = await loadStripe(data.publishableKey);
```

---

## 💳 Payment Flow

### Step 1: Create Payment Intent

```javascript
async function createPaymentIntent(cartItems, providerId) {
  const response = await fetch('http://localhost:5000/api/v1/stripe/create-payment-intent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      providerId: providerId,
      items: cartItems.map(item => ({
        foodId: item.id,
        quantity: item.quantity
      }))
    })
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }

  return result.data;
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    clientSecret: "pi_3ABC123_secret_XYZ789",
    paymentIntentId: "pi_3ABC123",
    amount: 45.67,
    breakdown: {
      subtotal: 40.00,
      platformFee: 2.80,
      stateTax: 2.87,
      total: 45.67,
      vendorAmount: 37.20,
      state: "CA",
      items: [...]
    }
  }
}
```

---

### Step 2: Display Price Breakdown

```javascript
function OrderSummary({ breakdown }) {
  return (
    <div className="order-summary">
      <h3>Order Summary</h3>
      
      <div className="line-item">
        <span>Subtotal</span>
        <span>${breakdown.subtotal.toFixed(2)}</span>
      </div>
      
      <div className="line-item">
        <span>Platform Fee ({breakdown.state === 'CA' ? '10%' : '7%'})</span>
        <span>${breakdown.platformFee.toFixed(2)}</span>
      </div>
      
      {breakdown.stateTax > 0 && (
        <div className="line-item">
          <span>Tax ({breakdown.state})</span>
          <span>${breakdown.stateTax.toFixed(2)}</span>
        </div>
      )}
      
      <div className="line-item total">
        <strong>Total</strong>
        <strong>${breakdown.total.toFixed(2)}</strong>
      </div>
      
      <div className="vendor-info">
        <small>Vendor receives: ${breakdown.vendorAmount.toFixed(2)}</small>
      </div>
    </div>
  );
}
```

---

### Step 3: Collect Payment (Option A - Payment Element)

**Recommended for modern UI**

```javascript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

// Usage
function CheckoutPage({ clientSecret }) {
  const stripePromise = loadStripe('pk_test_...');

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
```

---

### Step 3: Collect Payment (Option B - Card Element)

**For custom card input UI**

```javascript
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm({ clientSecret, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer Name',
            email: 'customer@example.com'
          }
        }
      }
    );

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Payment successful - redirect to success page
      window.location.href = '/order-success?payment_intent=' + paymentIntent.id;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
```

---

### Step 4: Handle Success

```javascript
// On success page
function OrderSuccessPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    
    if (paymentIntentId) {
      checkPaymentStatus(paymentIntentId);
    }
  }, []);

  async function checkPaymentStatus(paymentIntentId) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/stripe/payment-status/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        }
      );
      
      const result = await response.json();
      
      if (result.data.status === 'succeeded' && result.data.orderId) {
        // Fetch full order details
        const orderResponse = await fetch(
          `http://localhost:5000/api/v1/orders/${result.data.orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          }
        );
        
        const orderData = await orderResponse.json();
        setOrder(orderData.data);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading order details...</div>;
  }

  if (!order) {
    return <div>Order not found. Please contact support.</div>;
  }

  return (
    <div className="success-page">
      <h1>✅ Payment Successful!</h1>
      <p>Order ID: {order.orderId}</p>
      <p>Total: ${order.totalPrice.toFixed(2)}</p>
      <p>Status: {order.status}</p>
      
      <div className="order-details">
        <h3>Order Items:</h3>
        {order.items.map(item => (
          <div key={item.foodId}>
            {item.quantity}x {item.foodId.name} - ${item.price.toFixed(2)}
          </div>
        ))}
      </div>
      
      <button onClick={() => window.location.href = '/orders'}>
        View All Orders
      </button>
    </div>
  );
}
```

---

## 🧪 Testing

### Test Cards

```javascript
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  requiresAuth: '4000002500003155',
  insufficientFunds: '4000000000009995'
};

// Use in development
<input 
  type="text" 
  placeholder="Card Number"
  defaultValue={process.env.NODE_ENV === 'development' ? TEST_CARDS.success : ''}
/>
```

---

## 🎨 Complete React Example

```javascript
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
let stripePromise = null;

async function getStripe() {
  if (!stripePromise) {
    const response = await fetch('http://localhost:5000/api/v1/stripe/config');
    const { data } = await response.json();
    stripePromise = loadStripe(data.publishableKey);
  }
  return stripePromise;
}

// Checkout Component
function CheckoutPage({ cart, providerId, userToken }) {
  const [clientSecret, setClientSecret] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  async function createPaymentIntent() {
    try {
      const response = await fetch('http://localhost:5000/api/v1/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId,
          items: cart.map(item => ({
            foodId: item.id,
            quantity: item.quantity
          }))
        })
      });

      const result = await response.json();

      if (result.success) {
        setClientSecret(result.data.clientSecret);
        setBreakdown(result.data.breakdown);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to initialize payment');
    }
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!clientSecret) {
    return <div>Loading...</div>;
  }

  return (
    <div className="checkout-page">
      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="line-item">
          <span>Subtotal</span>
          <span>${breakdown.subtotal.toFixed(2)}</span>
        </div>
        <div className="line-item">
          <span>Platform Fee</span>
          <span>${breakdown.platformFee.toFixed(2)}</span>
        </div>
        {breakdown.stateTax > 0 && (
          <div className="line-item">
            <span>Tax</span>
            <span>${breakdown.stateTax.toFixed(2)}</span>
          </div>
        )}
        <div className="line-item total">
          <strong>Total</strong>
          <strong>${breakdown.total.toFixed(2)}</strong>
        </div>
      </div>

      <Elements stripe={getStripe()} options={{ clientSecret }}>
        <PaymentForm />
      </Elements>
    </div>
  );
}

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default CheckoutPage;
```

---

## 🎨 Styling

```css
/* Payment Form Styles */
.checkout-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.order-summary {
  background: #f7f7f7;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.line-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.line-item.total {
  border-top: 2px solid #ddd;
  padding-top: 10px;
  margin-top: 10px;
  font-size: 1.2em;
}

.payment-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.payment-form button {
  width: 100%;
  padding: 15px;
  background: #5469d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
}

.payment-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  padding: 10px;
  background: #fee;
  border-radius: 4px;
  margin-top: 10px;
}
```

---

## 🐛 Error Handling

```javascript
function handlePaymentError(error) {
  const errorMessages = {
    'card_declined': 'Your card was declined. Please try another card.',
    'insufficient_funds': 'Insufficient funds. Please try another card.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'incorrect_cvc': 'Incorrect CVC. Please check and try again.',
    'processing_error': 'An error occurred while processing your card. Please try again.',
    'rate_limit': 'Too many requests. Please wait a moment and try again.'
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
}

// Usage
const { error } = await stripe.confirmPayment(...);
if (error) {
  const userFriendlyMessage = handlePaymentError(error);
  setError(userFriendlyMessage);
}
```

---

## 📱 Mobile Considerations

```javascript
// Detect mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Use appropriate return URL
const returnUrl = isMobile 
  ? 'myapp://order-success' // Deep link for mobile app
  : `${window.location.origin}/order-success`; // Web URL

await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: returnUrl,
  },
});
```

---

## 🔐 Security Best Practices

1. **Never expose secret keys** - Only use publishable key in frontend
2. **Always use HTTPS** - Stripe requires HTTPS in production
3. **Validate on backend** - Never trust frontend calculations
4. **Use CSP headers** - Content Security Policy for XSS protection
5. **Implement rate limiting** - Prevent abuse
6. **Log errors securely** - Don't log sensitive data

---

## 📞 Support

- **Stripe Docs:** https://stripe.com/docs/stripe-js
- **React Stripe:** https://stripe.com/docs/stripe-js/react
- **Backend API:** See `STRIPE_INTEGRATION_GUIDE.md`

---

**Last Updated:** February 2026  
**Version:** 1.0.0
