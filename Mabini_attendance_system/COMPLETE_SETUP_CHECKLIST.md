# 🚀 AUTOMATED SETUP CHECKLIST

## Step 1: Fix Database (Run SQL Files)

### 1.1 Run in Supabase SQL Editor (in this order):

✅ **Already done:**
- [x] FIX_USERS_AND_TEACHING_LOADS.sql
- [x] FIX_ACCOUNT_RETRIEVALS.sql
- [x] FIX_RLS_ACCOUNT_RETRIEVALS.sql
- [x] FIX_FK_CONSTRAINT.sql

🔲 **Still needed:**
```sql
-- Copy and paste each file into Supabase SQL Editor, then click Run

1. FIX_RLS_STUDENTS_TEACHERS.sql
   → Allows students to login (disables RLS)

2. CLEANUP_ACCOUNT_RETRIEVALS.sql
   → Removes invalid retrieval records

3. GET_STUDENT_PASSWORDS.sql
   → Shows all current passwords (share with students)
```

**How to run:**
1. Open Supabase → https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Copy entire file content
6. Paste and click "Run"
7. Check results show "✅ Success"

---

## Step 2: Share Passwords with Students (Temporary)

**Until email is fixed, manually share passwords:**

Run `GET_STUDENT_PASSWORDS.sql` in Supabase, then:

**Current Students:**
1. Anna Reyes → `Student3296@2025`
2. Niccolo Balon → `Student3294@2025`
3. John Paolo Gonzales → `Student1566@2025`

**How to share:**
- Send via SMS to parents
- Post in Google Classroom
- Share via Messenger
- Print and distribute

---

## Step 3: Update Vercel Environment Variables

### 3.1 Log into Vercel
1. Go to: https://vercel.com/login
2. Sign in

### 3.2 Update Environment Variable
1. Click on your project: `mabini-hs-attendance`
2. Go to **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Find `RESEND_FROM_EMAIL`
5. Click the **⋮** (three dots) → **Edit**
6. Change from: `Mabini HS Attendance <onboarding@resend.dev>`
7. Change to: `Mabini HS Attendance <noreply@mail.mabinicolleges.edu.ph>`
   (This is Resend's temporary domain that works for your account)
8. Click **Save**

### 3.3 Redeploy
1. Go to **Deployments** tab
2. Click **⋮** on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (30-60 seconds)

---

## Step 4: Test Everything

### 4.1 Test Login (Should work NOW)
1. Go to: https://mabini-hs-attendance.vercel.app/student/login.html
2. Email: `niccolobalon@mabinicolleges.edu.ph`
3. Password: `Student3294@2025`
4. Click "Sign In"
5. Should redirect to dashboard ✅

### 4.2 Test Account Retrieval
1. Create a NEW test student in admin panel
2. Email: `test@mabinicolleges.edu.ph`
3. Go to student login
4. Click "Don't have your account yet?"
5. Enter test email
6. Check if email arrives ✅

If email still fails:
- Check Resend dashboard → Logs for error
- Verify env variable updated on Vercel
- Make sure you redeployed

---

## Step 5: Domain Verification (Optional - Better Email)

### 5.1 Contact School IT Admin
**Send them this message:**

```
Hi,

We need to add DNS records to mabinicolleges.edu.ph for our attendance system emails.

Please add these DNS records:

1. TXT Record:
   Name: _resend
   Value: [Get from Resend dashboard after adding domain]

2. MX Records:
   Name: @
   Value: mx1.resend.com (Priority: 10)
   Value: mx2.resend.com (Priority: 20)

3. SPF Record (TXT):
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all

4. DKIM Record (TXT):
   Name: resend._domainkey
   Value: [Get from Resend dashboard]

These records allow us to send emails from @mabinicolleges.edu.ph

Thank you!
```

### 5.2 Add Domain in Resend
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `mabinicolleges.edu.ph`
4. Copy the DNS records shown
5. Send to IT admin (see message above)

### 5.3 Wait for Verification
- IT admin adds records
- Wait 15 minutes to 48 hours (DNS propagation)
- Check Resend dashboard → Click "Verify"
- Green checkmark = Success ✅

### 5.4 Update Environment Variable (After Verification)
1. Vercel → Settings → Environment Variables
2. Change `RESEND_FROM_EMAIL` to:
   `Mabini HS Attendance <noreply@mabinicolleges.edu.ph>`
3. Redeploy

---

## 🎯 Quick Commands Checklist

**Run these in order:**

```bash
# In Supabase SQL Editor:
1. ✅ FIX_RLS_STUDENTS_TEACHERS.sql
2. ✅ CLEANUP_ACCOUNT_RETRIEVALS.sql  
3. ✅ GET_STUDENT_PASSWORDS.sql (to share with students)

# In Vercel:
4. ✅ Update RESEND_FROM_EMAIL to use mail.mabinicolleges.edu.ph
5. ✅ Redeploy application

# Test:
6. ✅ Login with existing student
7. ✅ Try account retrieval
8. ✅ Check if email arrives
```

---

## ✅ Success Criteria

You'll know everything works when:

- ✅ Students can login with their emails
- ✅ Account retrieval sends email successfully
- ✅ Duplicate prevention blocks second retrieval
- ✅ New students receive credentials via email
- ✅ Dashboard loads after login

---

## 🆘 If Something Fails

**Login not working:**
- Run FIX_RLS_STUDENTS_TEACHERS.sql
- Check student has password in database
- Verify email matches exactly

**Email not sending:**
- Check Vercel env variable is updated
- Verify you redeployed after changing env
- Check Resend dashboard logs for error details
- Use temporary domain: `mail.mabinicolleges.edu.ph`

**Can't access Supabase:**
- Use service role key in scripts
- Check Supabase project is not paused

---

**Last Updated:** November 23, 2025
**Status:** Ready to execute - follow steps 1-4 first
