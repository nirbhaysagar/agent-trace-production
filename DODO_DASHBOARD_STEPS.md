# Step-by-Step: Finding Dodo Payments Credentials

## 🔑 Step 1: Get Your API Key Value

**You're currently on:** Developer → API Keys

**To see the actual key value:**
1. Click on the "Secret_Key" row (the row with "15 Nov 25")
2. This should open a modal or expand to show the actual key value
3. Copy the full key (it should look like: `K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv`)
4. If there's a "Reveal" or "Show" button, click it to see the key

**Alternative:** Click the "Add API Key" button to create a new one and see the format

## 🌐 Step 2: Find API URL

**Where to look:**
1. In the Developer section, look for:
   - "API Documentation" link
   - "Getting Started" guide
   - "API Reference" section
2. Or check the "Others" submenu under Developer
3. The API URL is usually something like:
   - `https://api.dodopayments.com/v1`
   - `https://api.dodopayments.com/api/v1`

**If you can't find it:**
- Try the common URL: `https://api.dodopayments.com/v1`
- Check if there's a "Base URL" field in the API Keys page
- Look for any documentation links

## 🔐 Step 3: Get Webhook Secret

**Steps:**
1. In the left sidebar, click **Developer** → **Webhooks**
2. If you have an existing webhook:
   - Click on it to open details
   - Look for "Secret" or "Signing Secret" field
   - Copy the value
3. If you don't have a webhook yet:
   - Click "Add Webhook" or "Create Webhook"
   - Set URL: `https://your-backend-url.com/api/webhooks/dodo`
   - Select events to listen for
   - After creating, the secret will be shown

## 📋 Quick Checklist

- [ ] **API Key**: Click on "Secret_Key" row → Copy the actual key value
- [ ] **API URL**: Check Developer → API Documentation or try `https://api.dodopayments.com/v1`
- [ ] **Webhook Secret**: Go to Developer → Webhooks → Create/View webhook → Copy secret

## 💡 Pro Tips

1. **API Key**: The key you see in the table is just the name. Click it to see the actual value.
2. **API URL**: If not documented, try making a test API call to `https://api.dodopayments.com/v1/health` or similar
3. **Webhook Secret**: You'll only see this after creating a webhook endpoint

