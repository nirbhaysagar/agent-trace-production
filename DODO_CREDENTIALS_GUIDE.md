# How to Find Dodo Payments API URL and Webhook Secret

## 🔍 Where to Find Dodo Payments Credentials

Based on your Dodo Payments dashboard, here's where to find everything:

### 1. **API Key** ✅ (You Already Have This)
- **Location**: Dashboard → **Developer** → **Keys**
- **What you have**: `K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv`
- **Status**: ✅ Already found!

### 2. **API URL** (Base URL for API calls)

**Where to find it:**
1. Go to **Developer** section in Dodo Payments dashboard
2. Look for:
   - **API Documentation** link
   - **Base URL** or **API Endpoint**
   - **API Reference** section

**Common API URLs:**
- `https://api.dodopayments.com/v1` (most common)
- `https://api.dodopayments.com/api/v1`
- `https://dodopayments.com/api/v1`
- Check their documentation for the exact URL

**If you can't find it:**
- Look at the API documentation
- Check the "Getting Started" guide
- Contact Dodo Payments support
- Try the common URL: `https://api.dodopayments.com/v1`

### 3. **Webhook Secret** (For verifying webhook signatures)

**Where to find it:**
1. Go to **Developer** → **Webhooks** (you saw this in the sidebar)
2. Click on your webhook endpoint (or create one if you haven't)
3. Look for:
   - **Webhook Secret**
   - **Signing Secret**
   - **Secret Key**
   - **Verification Token**

**Steps to get webhook secret:**
1. Navigate to: **Developer** → **Webhooks** (in left sidebar)
2. If you have an existing webhook:
   - Click on it
   - Look for "Secret" or "Signing Secret" field
   - Copy the value
3. If you need to create a webhook:
   - Click "Add Webhook" or "Create Webhook"
   - Set webhook URL: `https://your-backend-url.com/api/webhooks/dodo`
   - Select events to listen for:
     - `payment.completed`
     - `checkout.completed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
   - After creating, the secret will be shown (copy it immediately!)

## 📋 Quick Checklist

- [ ] **API Key**: ✅ Already have it
- [ ] **API URL**: Check Developer → API Documentation
- [ ] **Webhook Secret**: Go to Developer → Webhooks → Create/View webhook

## 🔧 If You Can't Find API URL

**Option 1: Check API Documentation**
- Look for "API Reference" or "Developer Docs"
- Usually shows base URL like: `https://api.dodopayments.com/v1`

**Option 2: Test Common URLs**
Try these common patterns:
```bash
https://api.dodopayments.com/v1
https://api.dodopayments.com/api/v1
https://dodopayments.com/api/v1
```

**Option 3: Contact Support**
- Email Dodo Payments support
- Ask: "What is the API base URL for REST API calls?"

## 🔧 If You Can't Find Webhook Secret

**Option 1: Create a New Webhook**
1. Go to **Developer** → **Webhooks**
2. Click "Add Webhook" or "Create Webhook"
3. Set URL: `https://your-backend-url.com/api/webhooks/dodo`
4. Select events
5. Save - the secret will be generated

**Option 2: Check Existing Webhook**
1. Go to **Developer** → **Webhooks**
2. Click on your webhook
3. Look for "Secret" or "Signing Secret" field
4. If hidden, click "Reveal" or "Show Secret"

## 📝 What to Do Next

1. **Find API URL**: Check Developer → API Documentation
2. **Get Webhook Secret**: Go to Developer → Webhooks
3. **Add to `.env`**:
   ```bash
   DODO_API_KEY=K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv
   DODO_API_URL=https://api.dodopayments.com/v1  # Update with actual URL
   DODO_WEBHOOK_SECRET=your_webhook_secret_here  # Get from webhooks section
   ```

## 🆘 Still Can't Find It?

**Share with me:**
1. Screenshot of Developer → Keys section
2. Screenshot of Developer → Webhooks section
3. Any API documentation links you see

I can help identify where the values are located!

