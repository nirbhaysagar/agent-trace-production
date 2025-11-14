# Authentication Setup Guide

## ✅ Fixed Issues

### 1. Session Persistence
- **Problem**: Sessions were lost on page refresh
- **Solution**: 
  - Improved session initialization in `AuthContext`
  - Added proper session restoration from localStorage
  - Enhanced auth state change listener to handle all events
  - Added automatic token refresh

### 2. Signup Error Handling
- **Problem**: Generic 400 errors without clear messages
- **Solution**:
  - Added email and password validation before API calls
  - User-friendly error messages for common issues
  - Better handling of duplicate email errors
  - Clear messaging for email confirmation requirements

### 3. Login/Signup Synchronization
- **Problem**: Inconsistent behavior between signup and login
- **Solution**:
  - Unified error handling
  - Consistent email normalization (trim + lowercase)
  - Proper session management for both flows

## 🔧 Configuration

### Supabase Settings

1. **Email Confirmation (Optional for Development)**
   - Go to Supabase Dashboard → Authentication → Settings
   - Find "Enable email confirmations"
   - For development: Turn OFF (allows immediate signup)
   - For production: Turn ON (requires email confirmation)

2. **Password Requirements**
   - Minimum 8 characters (enforced in frontend)
   - Can be customized in Supabase Dashboard → Authentication → Settings

3. **Email Templates**
   - Customize in Supabase Dashboard → Authentication → Email Templates
   - Confirmation email template
   - Password reset template

## 📋 SQL Schema

Supabase automatically manages authentication tables in the `auth` schema. You don't need to create these manually.

**Reference**: See `database/auth_schema.sql` for complete schema documentation.

### Key Tables (Auto-managed by Supabase):
- `auth.users` - User accounts
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - Token refresh
- `auth.identities` - OAuth identities

### Your Application Tables:
- `public.traces` - Links to `auth.users` via `user_id`
- `public.saved_filters` - Links to `auth.users` via `user_id`
- `public.subscriptions` - Links to `auth.users` via `user_id`
- `public.usage_limits` - Links to `auth.users` via `user_id`

## 🧪 Testing

### Test Signup Flow:
1. Go to `/login?mode=signup`
2. Enter email and password (min 8 chars)
3. If email confirmation is OFF: Should sign in immediately
4. If email confirmation is ON: Should show "check email" message

### Test Login Flow:
1. Go to `/login?mode=signin`
2. Enter existing email and password
3. Should sign in and redirect to dashboard

### Test Session Persistence:
1. Sign in
2. Refresh the page (F5)
3. Should remain signed in
4. Close browser and reopen
5. Should remain signed in (session in localStorage)

### Test Error Handling:
1. Try signing up with existing email → Should show friendly error
2. Try signing in with wrong password → Should show friendly error
3. Try signing up with short password → Should show validation error

## 🐛 Troubleshooting

### Session Lost on Refresh
- **Check**: Browser localStorage is enabled
- **Check**: Supabase client config has `persistSession: true`
- **Check**: No browser extensions blocking localStorage

### 400 Error on Signup
- **Check**: Email already exists → Use sign in instead
- **Check**: Password too short → Must be 8+ characters
- **Check**: Invalid email format → Check email syntax
- **Check**: Supabase email confirmation settings

### Token Not Sent with API Requests
- **Check**: Session exists in AuthContext
- **Check**: Token is set in API client (`setAuthToken`)
- **Check**: Backend expects `Authorization: Bearer <token>` header

## 📝 Environment Variables

Make sure these are set in `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔐 Security Notes

1. **Never expose service role key** in frontend code
2. **Use anon key** for client-side operations
3. **Use service role key** only in backend/server-side code
4. **Enable RLS** on production tables for additional security
5. **Validate all inputs** on both frontend and backend

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Session Management](https://supabase.com/docs/reference/javascript/auth-getsession)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

