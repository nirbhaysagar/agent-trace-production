# AgentTrace Database Schema

## 📋 Overview

This directory contains the complete database schema for AgentTrace. Choose the appropriate file based on your situation.

## 🗂️ Files

### 1. `complete_schema.sql` (Fresh Install)
**Use this if:**
- You're setting up a new database
- You don't have any existing data
- You want a clean slate

**⚠️ WARNING:** This file uses `DROP TABLE CASCADE` which will **DELETE ALL EXISTING DATA**.

### 2. `complete_schema_safe.sql` (Existing Database)
**Use this if:**
- You already have data in your database
- You want to update/add missing tables/columns
- You want to preserve existing data

**✅ SAFE:** This file uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` to preserve your data.

## 🚀 Quick Start

### For New Installations:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `complete_schema.sql`
3. Click "Run" or press `Ctrl+Enter`
4. Done! ✅

### For Existing Databases:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `complete_schema_safe.sql`
3. Click "Run" or press `Ctrl+Enter`
4. Your existing data will be preserved! ✅

## 📊 What Gets Created

### Tables:
1. **`traces`** - Stores all agent execution traces
2. **`saved_filters`** - User's saved filter presets
3. **`subscriptions`** - User subscription information
4. **`usage_limits`** - Tracks usage and AI credits

### Key Features:
- ✅ All foreign key relationships to `auth.users`
- ✅ Automatic `updated_at` timestamp triggers
- ✅ Performance indexes on all key columns
- ✅ AI credits column (`ai_credits`) with default value of 10
- ✅ Support for all plan types: `free`, `mini`, `pro`, `team`
- ✅ Unique constraint: one active subscription per user

## 🔍 Verification

After running the schema, verify it worked:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check subscriptions table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check usage_limits has ai_credits
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'usage_limits' AND column_name = 'ai_credits';
```

## 📝 Notes

- **Row Level Security (RLS):** Disabled - backend handles access control via service role key
- **Foreign Keys:** All user-related tables cascade delete when a user is deleted
- **Timestamps:** All timestamps use UTC timezone
- **AI Credits:** Default is 10 for free users, will be updated to 1000/5000 on subscription

## 🆘 Troubleshooting

### Error: "relation already exists"
- You're using `complete_schema.sql` on an existing database
- **Solution:** Use `complete_schema_safe.sql` instead

### Error: "column already exists"
- The column was already added in a previous migration
- **Solution:** This is normal with the safe version - it's idempotent

### Error: "permission denied"
- Make sure you're using the SQL Editor in Supabase Dashboard
- You need admin/service role permissions

## 📚 Related Files

- `schema.sql` - Original traces schema (legacy)
- `subscription_schema.sql` - Original subscription schema (legacy)
- `auth_schema.sql` - Reference for auth schema (managed by Supabase)

**Note:** The legacy files are kept for reference. Use the complete schema files for new installations.

