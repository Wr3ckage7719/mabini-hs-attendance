# Admin Login Fix - Step by Step

## Problem
The admin login fails with "Access denied" because the system requires **TWO separate user records**:

1. **Supabase Auth User** - Created in Supabase Authentication (for login)
2. **Users Table Record** - Created in your custom `users` table (for profile/role)

Currently, the migration (`MASTER_DATABASE_RESET.sql`) only creates #2, not #1.

## Why This Happens
- The login system (`auth-client.js`) uses `supabase.auth.signInWithPassword()` which checks **Supabase Auth**, not your `users` table
- After successful auth, it queries the `users` table to get the profile and role
- Both must exist and be linked for login to work

---

## Solution (Choose One)

### ✅ **OPTION 1: Create Admin Manually (Fastest - 2 minutes)**

#### Step 1: Create in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click **Authentication** → **Users** (left sidebar)
3. Click **"Add User"** or **"Invite User"**
4. Fill in:
   - **Email**: `admin@mabinihs.local`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ Check this box
5. Click **"Create User"** or **"Send Invite"**

#### Step 2: Link to Users Table
1. In the same Users page, find the newly created admin user
2. **Copy the UUID** (long string like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. Go to **SQL Editor** in Supabase
4. Run this query (replace `<PASTE_UUID_HERE>` with the copied UUID):

```sql
UPDATE users 
SET auth_id = '<PASTE_UUID_HERE>'
WHERE email = 'admin@mabinihs.local';
```

#### Step 3: Verify
Run this verification query:
```sql
SELECT 
    u.email,
    u.role,
    u.status,
    u.auth_id,
    au.id as auth_user_id,
    CASE 
        WHEN u.auth_id = au.id THEN '✅ LINKED - Ready to login'
        ELSE '❌ NOT LINKED - Check auth_id'
    END as status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.email = 'admin@mabinihs.local';
```

You should see `✅ LINKED - Ready to login`

#### Step 4: Test Login
1. Go to: http://localhost:5500/public/admin/login.html
2. Login with:
   - Email: `admin@mabinihs.local`
   - Password: `admin123`
3. Should redirect to admin dashboard

---

### 🔧 **OPTION 2: Automated Script (Requires Backend)**

If you want to automate this for future migrations, you'd need to:

1. Use Supabase Admin API to create auth users programmatically
2. Requires `service_role` key (keep secret!)
3. Example backend endpoint:

```javascript
// server/create-admin.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Admin key!
);

async function createAdmin() {
  // Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@mabinihs.local',
    password: 'admin123',
    email_confirm: true
  });
  
  if (authError) throw authError;
  
  // Update users table with auth_id
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({ auth_id: authUser.user.id })
    .eq('email', 'admin@mabinihs.local');
    
  if (dbError) throw dbError;
  
  console.log('✅ Admin created successfully!');
}

createAdmin();
```

**Not recommended for now** - just use Option 1.

---

## Current System Status

### ✅ Working
- Database migration runs successfully
- All 11 tables created correctly
- RLS policies enabled
- Users table has admin record
- All verification tests pass

### ❌ Blocking Issue
- Admin cannot login (no Supabase Auth user)

### 🎯 After Fix
Once you complete Option 1 above, the admin login will work and you can:
- Access admin dashboard
- Manage students, teachers, sections
- View attendance reports
- Configure SMS notifications
- Full system access

---

## Quick Reference

**Admin Credentials:**
- Email: `admin@mabinihs.local`
- Password: `admin123`

**Login URL:**
- http://localhost:5500/public/admin/login.html

**Verification Query:**
```sql
SELECT email, role, status, auth_id 
FROM users 
WHERE email = 'admin@mabinihs.local';
```

**Check Auth User:**
```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@mabinihs.local';
```

---

## Why We Can't Create Auth Users in SQL

Supabase Auth uses special encryption and security measures that cannot be replicated with simple SQL INSERT statements. You must use:
- Supabase Dashboard UI
- Supabase Admin API
- Supabase CLI

Standard SQL can only create records in **your custom tables** (`users`, `teachers`, etc.), not in the protected `auth.users` table.

---

## Next Steps

1. **Follow Option 1 above** (takes 2 minutes)
2. Test admin login
3. If successful, mark this issue as ✅ RESOLVED
4. Continue testing the rest of the system

Need help? Check the output of the verification queries above to diagnose any issues.
