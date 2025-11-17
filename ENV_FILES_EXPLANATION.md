# Environment Files Explanation

## 📁 File Structure

Your project has these environment files:

1. **`backend/env.example`** - Template for development (safe to commit to Git)
2. **`backend/env.production`** - Template for production (safe to commit to Git)
3. **`backend/.env`** - Your actual credentials (NEVER commit to Git - should be in .gitignore)

## 🔧 Where to Add Dodo Payments Credentials

### For Local Development (Testing):

**Create `backend/.env` file:**
```bash
cd backend
touch .env  # Create the file
```

Add your Dodo Payments credentials:
```bash
# backend/.env
DODO_API_KEY=K8aZ4tj6UyB4iK1r.aQLqIZ4yR3qDB9f-UDC5J_-zTWB6I5YqSCCaSgPs6jk79wMv
DODO_API_URL=https://api.dodopayments.com/v1
DODO_WEBHOOK_SECRET=your_webhook_secret_here
```

**Why `.env`?**
- `load_dotenv()` automatically reads `.env` file
- `.env` is gitignored (your secrets stay private)
- Works for local development

### For Production:

**Option 1: Add to `env.production` template** (recommended)
- Update `env.production` with Dodo Payments section
- When deploying, copy `env.production` to `.env` on your server
- Or set environment variables directly in your hosting platform

**Option 2: Set in Hosting Platform** (best practice)
- Vercel: Project Settings → Environment Variables
- Railway: Variables tab
- Heroku: Config Vars
- AWS/DigitalOcean: Environment variables in deployment settings

## ✅ Recommended Setup

1. **Update `env.production`** - Add Dodo Payments section (template)
2. **Create `backend/.env`** - Add your actual keys for local development
3. **Set in hosting platform** - Add environment variables for production

## 🔒 Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] Never commit `.env` to Git
- [ ] `env.example` and `env.production` have placeholder values only
- [ ] Production credentials are set in hosting platform, not in code

