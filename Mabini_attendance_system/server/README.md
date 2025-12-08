# Mabini HS Attendance System - Server Documentation

Complete setup and deployment guide for the backend server and database.

---

## 🚀 Quick Start

### 1. Database Setup

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** → **New Query**
3. Copy and paste the entire contents of `DATABASE_SETUP.sql`
4. Click **Run** (or press F5)
5. Verify all steps completed successfully (check for ✅ messages in output)

### 2. Environment Variables

Create `.env` file in `/server` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com

# Server Configuration
PORT=3000
NODE_ENV=production
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Start Server (Local Development)

```bash
npm start
```

Server runs on `http://localhost:3000`

---

## 📁 Server Files Structure

```
server/
├── DATABASE_SETUP.sql          # Complete database setup (run this in Supabase)
├── README.md                   # This file
├── index.js                    # Express server with API endpoints
├── package.json                # Node dependencies
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
└── logs/                       # Server logs (local only)
```

---

## 📊 Database Schema Overview

### Core Tables

1. **students** - Student profiles with attendance tracking
   - Primary fields: `student_number`, `first_name`, `last_name`, `email`
   - Storage: `profile_picture_url`, `qr_code_url`
   - Auth: `username`, `password`

2. **teachers** - Teacher profiles and assignments
   - Primary fields: `employee_number`, `first_name`, `last_name`, `email`
   - Auth: `username`, `password`

3. **users** - Admin and staff accounts
   - Roles: `admin`, `staff`
   - Auth: `email`, `password`, `auth_id` (links to Supabase Auth)

4. **sections** - Class sections
   - Fields: `section_code`, `section_name`, `grade_level`

5. **subjects** - Subject catalog
   - Fields: `subject_code`, `subject_name`, `description`

6. **teaching_loads** - Teacher-Section-Subject assignments
   - Links: `teacher_id`, `section_id`, `subject_id`
   - Schedule: `day_of_week`, `start_time`, `end_time`

7. **attendance** - Student attendance records
   - Types: `present`, `absent`, `late`, `excused`
   - Methods: `qr_scan`, `manual`, `nfc`

8. **password_reset_tokens** - OTP tokens for password recovery
   - Fields: `email`, `token`, `expires_at`, `used`

### Storage Integration

- **Bucket**: `student-images` (public)
- **Folders**:
  - `profile-pictures/` - Student profile photos
  - `qr-codes/` - Student QR codes for login
- **URL Pattern**: `https://[project].supabase.co/storage/v1/object/public/student-images/[folder]/[file]`

---

## 🔐 Security (Row Level Security)

### Students Table

- **SELECT**: Public (for login verification)
- **UPDATE**: Students can update their own records
- **INSERT/DELETE**: Service role only

### Teachers Table

- **SELECT**: Public (for login verification)
- **UPDATE**: Teachers can update their own records

### Password Reset Tokens

- **ALL**: Permissive (application handles auth)

### Storage Policies

- **SELECT**: Public (anyone can view uploaded images)
- **INSERT/UPDATE/DELETE**: Authenticated users only

---

## 🔧 API Endpoints (Vercel Serverless)

Deployed to Vercel at `https://your-app.vercel.app/api/`

### Password Reset Flow

1. **POST** `/api/password-reset/send-otp`
   - Body: `{ email, userType }`
   - Sends 6-digit OTP via email
   - Returns: `{ success, message }`

2. **POST** `/api/password-reset/verify-otp`
   - Body: `{ email, token, userType }`
   - Verifies OTP code
   - Returns: `{ success, message, verified }`

3. **POST** `/api/password-reset/reset-password`
   - Body: `{ email, token, newPassword, userType }`
   - Updates password after OTP verification
   - Returns: `{ success, message }`

### Account Retrieval

- **POST** `/api/account/retrieve`
  - Body: `{ studentNumber, email }`
  - Returns student account info via email
  - Returns: `{ success, message }`

### Health Check

- **GET** `/api/health`
  - Returns API status
  - Returns: `{ status: "ok", timestamp }`

---

## 📦 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env`

### Database Migration (Supabase)

Run `DATABASE_MIGRATION.sql` to:
- ✅ Add Storage URL columns (`profile_picture_url`, `qr_code_url`)
- ✅ Create `password_reset_tokens` table
- ✅ Set up RLS policies
- ✅ Create indexes for performance
- ✅ Add cleanup functions

---

## 🧪 Testing

### Test Database Connection

```bash
node test-complete-system.js
```

Checks:
- ✅ Supabase connection
- ✅ Students table accessible
- ✅ Teachers table accessible
- ✅ RLS policies working

### Test Email (SendGrid)

```bash
node test-email-now.js
```

Sends test email to verify SendGrid configuration.

### Test Password Reset Flow

```bash
node test-sendgrid.js
```

Tests complete OTP password reset flow.

---

## 📁 File Structure

```
server/
├── api/                    # Vercel serverless functions
│   ├── account/
│   │   └── retrieve.js    # Account retrieval endpoint
│   ├── password-reset/
│   │   ├── send-otp.js    # Send OTP email
│   │   ├── verify-otp.js  # Verify OTP code
│   │   └── reset-password.js  # Reset password
│   ├── health.js          # Health check endpoint
│   └── [...path].js       # Catch-all route
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example          # Environment template
├── package.json          # Dependencies
├── DATABASE_MIGRATION.sql # Complete database setup
└── README.md             # This file
```

---

## 🛠️ Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: Run `DATABASE_MIGRATION.sql` to create missing tables/columns

### Issue: "permission denied for table"
**Solution**: Check RLS policies are created correctly

### Issue: Email not sending
**Solution**: 
- Verify SendGrid API key
- Check sender email is verified in SendGrid
- Review SendGrid dashboard for errors

### Issue: Profile pictures not loading
**Solution**:
- Verify Storage bucket `student-images` exists
- Check bucket is set to public
- Ensure RLS policies allow SELECT

### Issue: QR codes not generating
**Solution**:
- Check `qrcode.min.js` is loaded
- Verify canvas element exists in DOM
- Check browser console for errors

---

## 📝 Maintenance

### Clean up old password reset tokens

Run periodically (recommended: daily cron job):

```sql
SELECT cleanup_expired_password_reset_tokens();
```

Deletes tokens older than 24 hours.

### Backup Database

Use Supabase Dashboard:
1. Go to **Database** → **Backups**
2. Click **Create Backup**
3. Download backup file

### Update Dependencies

```bash
cd server
npm update
npm audit fix
```

---

## 🔗 Related Documentation

- Main system docs: `/docs`
- Frontend integration: `/public`
- Storage setup: `/docs/STORAGE_IMPLEMENTATION_GUIDE.md`
- Deployment guide: `/docs/DEPLOYMENT_GUIDE.md`

---

## 📞 Support

For issues or questions:
1. Check this README first
2. Review database migration logs
3. Check Supabase Dashboard logs
4. Review Vercel deployment logs

---

## ⚡ Performance Tips

1. **Indexes**: All foreign keys have indexes for fast lookups
2. **RLS**: Use service role key for bulk operations
3. **Storage**: Use CDN URLs for images (Supabase handles this)
4. **Queries**: Use `.select()` with specific columns instead of `*`
5. **Pagination**: Limit results with `.range(start, end)`

---

**Last Updated**: December 2, 2025  
**Version**: 1.0.0
