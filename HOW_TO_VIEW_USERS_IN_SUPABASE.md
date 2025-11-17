# How to View Users in Supabase

## 🔍 Where User Data is Stored

When users sign up, Supabase **automatically** stores their data in the `auth.users` table. This table is managed by Supabase and is in the `auth` schema (not the `public` schema).

## 📍 Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users** (in the left sidebar)
4. You should see all registered users with:
   - Email
   - User ID (UUID)
   - Created at
   - Last sign in
   - Email confirmed status

## 📍 Method 2: SQL Editor (For Advanced Users)

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query to see all users:

```sql
-- View all users with key information
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;
```

3. To see a specific user by email:

```sql
-- Find user by email
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

## 📍 Method 3: Check Your Application Tables

Your application also stores user-related data in `public` schema tables:

```sql
-- View all users with their subscription info
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  s.plan_type,
  s.status as subscription_status,
  ul.trace_count,
  ul.trace_limit,
  ul.ai_credits
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.usage_limits ul ON u.id = ul.user_id
ORDER BY u.created_at DESC;
```

## ⚠️ Important Notes

1. **`auth.users` table is read-only** - Don't try to manually insert/update users here
2. **Admin access required** - You need admin/service role key to query `auth.users` directly
3. **Email confirmation** - If email confirmation is enabled, users won't appear until they confirm their email
4. **Check Authentication Settings** - Go to Authentication → Settings to see if email confirmation is required

## 🐛 Troubleshooting

### If you don't see users in the Dashboard:

1. **Check Authentication Settings**:
   - Go to Authentication → Settings
   - Check if "Enable email confirmations" is ON
   - If ON, users must confirm email before appearing

2. **Check if signup actually succeeded**:
   - Open browser console (F12)
   - Look for any errors during signup
   - Check if session was created

3. **Verify Supabase connection**:
   - Check your `.env.local` file has correct:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - These should match your Supabase project

4. **Check browser console**:
   - After signup, check for any errors
   - Look for successful auth responses

### If users exist but you can't query them:

- You might be using the **anon key** instead of **service role key**
- The anon key has limited permissions
- Use the **service role key** (keep it secret!) for admin queries

## 🔐 Security Note

- **Never expose your service role key** in frontend code
- Only use it in backend/server-side code
- The anon key is safe for frontend use

## 📊 Quick Check Query

Run this in SQL Editor to see everything at once:

```sql
-- Complete user overview
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at,
  u.last_sign_in_at,
  COALESCE(s.plan_type, 'free') as plan,
  COALESCE(ul.ai_credits, 10) as ai_credits,
  COALESCE(ul.trace_count, 0) as traces_uploaded
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.usage_limits ul ON u.id = ul.user_id
ORDER BY u.created_at DESC
LIMIT 20;
```

