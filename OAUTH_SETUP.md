# OAuth Provider Configuration Guide

This guide will help you configure Google and GitHub OAuth providers in your Supabase dashboard.

## Step 2: Configure Google OAuth

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application** as the application type
6. Configure:
   - **Name**: `AgentTrace` (or your preferred name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:3001`
     - Your production domain (if applicable)
   - **Authorized redirect URIs**:
     - `https://wumjxpmduklhpjrxecqo.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3001/auth/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### 2.2 Enable Google Provider in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle **Enable Google provider**
4. Enter your **Client ID** and **Client Secret** from Google Cloud Console
5. Click **Save**

## Step 3: Configure GitHub OAuth

### 3.1 Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:
   - **Application name**: `AgentTrace` (or your preferred name)
   - **Homepage URL**: 
     - `http://localhost:3000` (for development)
     - Your production URL (for production)
   - **Authorization callback URL**:
     - `https://wumjxpmduklhpjrxecqo.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret**
7. Copy the **Client Secret** (you'll only see it once!)

### 3.2 Enable GitHub Provider in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** in the list
3. Toggle **Enable GitHub provider**
4. Enter your **Client ID** and **Client Secret** from GitHub
5. Click **Save**

## Step 4: Configure Site URL

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   - `http://localhost:3000` (for development)
   - Your production URL (for production)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3001/auth/callback`
   - Your production callback URL (if applicable)
4. Click **Save**

## Step 5: Test Authentication

1. Start your frontend: `cd frontend && npm run dev`
2. Navigate to `http://localhost:3000`
3. Click **Sign in with Google** or **Sign in with GitHub**
4. Complete the OAuth flow
5. Verify you're redirected back to the dashboard and signed in

## Troubleshooting

### Common Issues

**Issue**: "Redirect URI mismatch"
- **Solution**: Ensure the redirect URI in your OAuth provider matches exactly: `https://wumjxpmduklhpjrxecqo.supabase.co/auth/v1/callback`

**Issue**: "Invalid client credentials"
- **Solution**: Double-check that you copied the Client ID and Client Secret correctly (no extra spaces)

**Issue**: "OAuth provider not enabled"
- **Solution**: Make sure you toggled the provider to "Enabled" in Supabase dashboard

**Issue**: "Site URL not configured"
- **Solution**: Set the Site URL in Supabase Authentication → URL Configuration

### Verification Checklist

- [ ] Google OAuth app created with correct redirect URI
- [ ] Google provider enabled in Supabase with correct credentials
- [ ] GitHub OAuth app created with correct callback URL
- [ ] GitHub provider enabled in Supabase with correct credentials
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs added in Supabase
- [ ] Tested Google sign-in flow
- [ ] Tested GitHub sign-in flow

## Production Deployment

When deploying to production:

1. Update OAuth app redirect URIs to include your production domain
2. Update Supabase Site URL to your production domain
3. Add production redirect URLs in Supabase
4. Update `NEXT_PUBLIC_SUPABASE_URL` in your production environment variables

## Security Notes

- Never commit OAuth client secrets to version control
- Use environment variables for all sensitive credentials
- Regularly rotate OAuth client secrets
- Monitor OAuth usage in your Supabase dashboard

