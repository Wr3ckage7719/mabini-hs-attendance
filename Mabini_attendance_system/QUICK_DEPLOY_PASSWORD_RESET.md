# 🚀 Quick Deployment Guide - Password Reset Feature

## Prerequisites
- [ ] Supabase account with project access
- [ ] Vercel deployment configured
- [ ] SendGrid API key and verified sender email

---

## Step 1: Database Migration (5 minutes)

### Run SQL Script in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ddblgwzylvwuucnpmtzi`
3. Go to **SQL Editor** → **New Query**
4. Copy contents of `server/ADD_PASSWORD_RESET_TABLE.sql`
5. Paste and click **Run**
6. Verify success message appears

### Verify Table Created

```sql
-- Quick verification
SELECT * FROM password_reset_tokens LIMIT 1;

-- Should show table structure with 0 rows
```

---

## Step 2: Environment Variables (2 minutes)

### Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Verify these exist (add if missing):

```env
VITE_SUPABASE_URL=https://ddblgwzylvwuucnpmtzi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@mabinicolleges.edu.ph
```

---

## Step 3: Deploy Code (3 minutes)

### Git Commit & Push

```powershell
# In your terminal, navigate to project root
cd C:\xampp\htdocs\Mabini_HS_Attendance\Mabini_attendance_system

# Add all new files
git add .

# Commit with descriptive message
git commit -m "feat: Implement complete forgot password functionality with OTP"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

### Monitor Deployment

1. Open [Vercel Dashboard](https://vercel.com)
2. Watch deployment progress (usually 1-2 minutes)
3. Wait for "Deployment Complete" status
4. Note the deployment URL

---

## Step 4: Test the Feature (5 minutes)

### Manual Testing Checklist

```
□ Navigate to: https://your-app.vercel.app/student/forgot-password.html
□ Enter a valid student email from database
□ Click "Send OTP Code"
□ Check email inbox for OTP (should arrive in 1-2 minutes)
□ Enter 6-digit OTP code
□ Click "Verify OTP"
□ Enter new password (min 6 characters)
□ Confirm password matches
□ Click "Reset Password"
□ See success message: "Password Reset Complete!"
□ Click "Go to Login"
□ Login with email and NEW password
□ Verify login works ✅
```

### Test Teacher Portal Too

```
□ Navigate to: https://your-app.vercel.app/teacher/forgot-password.html
□ Repeat same steps with teacher email
□ Verify teacher password reset works ✅
```

---

## Step 5: Verify API Endpoints (Optional)

### Test with cURL

```bash
# 1. Send OTP
curl -X POST https://your-app.vercel.app/api/password-reset/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"role\":\"student\"}"

# Expected: {"success":true,"message":"OTP sent successfully..."}
```

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Database table `password_reset_tokens` exists
- [ ] Environment variables set in Vercel
- [ ] Code deployed successfully (no errors in Vercel logs)
- [ ] Student forgot password page loads
- [ ] Teacher forgot password page loads
- [ ] OTP email is received (check spam folder if not in inbox)
- [ ] OTP verification works
- [ ] Password reset completes successfully
- [ ] Can login with new password
- [ ] Old password no longer works

---

## 🐛 Common Issues & Quick Fixes

### Issue: OTP Email Not Received

**Quick Fix:**
1. Check SendGrid dashboard for delivery status
2. Verify `SENDGRID_FROM_EMAIL` is verified in SendGrid
3. Check user's spam/junk folder
4. Verify email exists in students/teachers table

### Issue: API Returns 404

**Quick Fix:**
1. Redeploy to Vercel (sometimes routes need refresh)
2. Check `api/password-reset/` folder exists in deployment
3. Verify Vercel build logs for errors

### Issue: Database Error

**Quick Fix:**
1. Re-run `ADD_PASSWORD_RESET_TABLE.sql` script
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check RLS policies are enabled

### Issue: OTP Verification Fails

**Quick Fix:**
1. Ensure OTP hasn't expired (10-minute limit)
2. Request new OTP (click Resend)
3. Check database for token status:
   ```sql
   SELECT * FROM password_reset_tokens 
   WHERE email = 'user@example.com' 
   ORDER BY created_at DESC LIMIT 1;
   ```

---

## 📊 Monitor After Deployment

### Check Usage Statistics

```sql
-- In Supabase SQL Editor:

-- Recent password resets
SELECT 
    user_type,
    email,
    created_at,
    used
FROM password_reset_tokens
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Success rate today
SELECT 
    COUNT(*) AS total_otps,
    COUNT(*) FILTER (WHERE used = true) AS successful_resets,
    ROUND(100.0 * COUNT(*) FILTER (WHERE used = true) / COUNT(*), 2) AS success_rate
FROM password_reset_tokens
WHERE created_at > CURRENT_DATE;
```

### Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Logs** tab
3. Filter by function: `api/password-reset/*`
4. Look for errors or warnings

---

## 🔧 Maintenance Tasks

### Daily (Optional)
- Monitor OTP delivery success rate
- Check for failed password reset attempts

### Weekly
- Clean up expired tokens:
  ```sql
  SELECT cleanup_expired_password_reset_tokens();
  ```
- Review error logs in Vercel
- Verify SendGrid email delivery metrics

### Monthly
- Analyze password reset patterns
- Update documentation if needed
- Review security logs

---

## 📞 Support Resources

**Documentation:**
- Full Guide: `PASSWORD_RESET_GUIDE.md`
- Summary: `PASSWORD_RESET_SUMMARY.md`
- Action Plan: `COMPREHENSIVE_ACTION_PLAN.md`

**External Links:**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com)
- [SendGrid Dashboard](https://app.sendgrid.com)

**Database Access:**
- Supabase URL: `https://ddblgwzylvwuucnpmtzi.supabase.co`
- Project: Mabini HS Attendance

---

## ✅ Completion Checklist

Final verification before marking as complete:

- [ ] Database migration completed successfully
- [ ] Environment variables configured in Vercel
- [ ] Code deployed to production
- [ ] Student password reset tested and working
- [ ] Teacher password reset tested and working
- [ ] OTP emails being delivered
- [ ] No errors in Vercel logs
- [ ] Documentation reviewed
- [ ] Team notified of new feature

---

## 🎉 Success!

Once all steps are complete, the forgot password feature is **LIVE** and ready for users!

**Estimated Time:** 15-20 minutes total  
**Difficulty:** Easy (follow steps carefully)  
**Status:** Production Ready

---

**Quick Reference Version:** 1.0  
**Last Updated:** November 25, 2025
