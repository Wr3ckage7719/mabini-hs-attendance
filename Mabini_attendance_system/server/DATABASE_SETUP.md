# 🗄️ Database Setup Guide

Complete guide for setting up and managing the Mabini HS Attendance System database.

---

## 📋 Quick Start

### Step 1: Run Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy and paste **`MASTER_DATABASE_RESET.sql`**
5. Click **Run**
6. Wait for "Success" message

### Step 2: Verify Setup

1. In SQL Editor, create **New Query**
2. Copy and paste **`VERIFY_DATABASE_SETUP.sql`**
3. Click **Run**
4. Check that all tests show ✅

---

## 📁 Essential Files

### `MASTER_DATABASE_RESET.sql` (Main Migration)
- Complete database setup
- Creates 11 tables
- Enables Row Level Security (RLS)
- Sets up authentication policies
- Creates indexes for performance
- **Run this first!**

### `VERIFY_DATABASE_SETUP.sql` (Verification)
- Tests all tables exist
- Checks RLS policies
- Validates foreign keys
- Tests sample data insertion
- **Run this after migration!**

---

## 🔑 Default Admin Account

After running the migration, create admin manually:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - Email: `admin@mabinihs.local`
   - Password: `admin123`
   - ✅ Check "Auto Confirm User"
4. Click **Create User**
5. **Copy the UUID** shown
6. Run this SQL (replace UUID):
   ```sql
   UPDATE users 
   SET auth_id = 'PASTE_UUID_HERE'
   WHERE email = 'admin@mabinihs.local';
   ```

### Option 2: Use SQL (Service Role Required)

Run this in SQL Editor:
```sql
-- Get auth user ID
SELECT id FROM auth.users WHERE email = 'admin@mabinihs.local';

-- Link to users table (replace UUID)
UPDATE users 
SET auth_id = 'PASTE_UUID_FROM_ABOVE'
WHERE email = 'admin@mabinihs.local';
```

---

## 📊 Database Schema

### Tables Created (11 total)

1. **users** - Admin and staff accounts
2. **teachers** - Teacher profiles
3. **students** - Student records
4. **sections** - Class sections
5. **subjects** - Subject catalog
6. **teaching_loads** - Teacher assignments
7. **attendance** - Attendance records
8. **iot_devices** - QR scanner devices
9. **entrance_logs** - Entry/exit logs
10. **account_retrievals** - Password resets
11. **sms_logs** - SMS notification history

### Key Features

✅ **Foreign Keys** - All relationships properly linked with CASCADE
✅ **RLS Enabled** - Row Level Security on all tables
✅ **Indexes** - Optimized for fast queries
✅ **Triggers** - Auto-update timestamps
✅ **Policies** - Secure access control

---

## 🔒 Security Policies

All tables have RLS policies for:
- **Authenticated users** - Full CRUD access
- **Service role** - Full administrative access
- **Anonymous** - No access (except login)

---

## 🧪 Testing After Setup

### Test Admin Login

1. Go to: `http://localhost:8080/admin/login.html`
2. Email: `admin@mabinihs.local`
3. Password: `admin123`
4. Should redirect to dashboard ✅

### Test Database Operations

1. Navigate to **Teachers** page
2. Click **Add New Teacher**
3. Fill in form and save
4. Should save without errors ✅

---

## ⚠️ Troubleshooting

### "Access Denied" on Login
- Admin user not created in Supabase Auth
- Run Option 1 above to create admin

### "Row-level security policy" errors
- RLS policies not applied
- Re-run `MASTER_DATABASE_RESET.sql`

### "Column not found" errors
- Old schema cached
- Hard refresh browser (Ctrl+Shift+R)
- Clear Vercel cache and redeploy

### "Violates foreign key constraint"
- Trying to reference non-existent records
- Ensure parent records exist first

---

## 📝 Making Schema Changes

If you need to modify the database:

1. **Edit** `MASTER_DATABASE_RESET.sql`
2. **Test locally** first
3. **Backup** production data
4. **Run migration** in Supabase
5. **Verify** with `VERIFY_DATABASE_SETUP.sql`
6. **Update frontend** if field names changed

---

## 🔄 Resetting Database

**⚠️ WARNING: This deletes ALL data!**

To completely reset:

1. Backup important data
2. Run `MASTER_DATABASE_RESET.sql`
3. Run `VERIFY_DATABASE_SETUP.sql`
4. Recreate admin account

---

## 📚 Additional Resources

- **Migration Guide**: `MIGRATION_GUIDE.md` - Detailed migration steps
- **Frontend Guide**: `FRONTEND_GUIDE.md` - Frontend adaptation
- **README**: `README.md` - Server configuration

---

## ✅ Checklist

After setup, you should have:

- [x] All 11 tables created
- [x] RLS enabled on all tables
- [x] Admin account created and linked
- [x] Can login to admin panel
- [x] Can create/edit/delete records
- [x] No security policy errors
- [x] All foreign keys working

---

**Need Help?** Check the troubleshooting section or review error logs in browser console (F12).
