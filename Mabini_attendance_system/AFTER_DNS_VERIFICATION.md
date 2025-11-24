# ⚡ STEPS AFTER DNS VERIFICATION

## 📅 Timeline

**Now:** DNS records pending (yellow "Pending" status)  
**Later:** DNS verified (green checkmarks) - can take 15 min to 48 hours  
**Then:** Follow steps below to activate email sending

---

## ✅ STEP 1: Confirm Verification in Resend

1. Go to: https://resend.com/domains
2. Check **updates.mabinicolleges.edu.ph**
3. Look for green checkmarks:
   - ✅ DKIM verified
   - ✅ SPF verified
   - ✅ DMARC verified
4. Status should show **"Verified"** instead of "Pending"

**If still pending:**
- Wait longer (DNS takes time)
- Check DNS records were added correctly
- Click "Verify" button again
- See DNS_RECORDS_FOR_IT_ADMIN.md for troubleshooting

---

## ✅ STEP 2: Update Server Environment Variable

Once verified, update the email sender:

### Option A: Update .env file locally

**File:** `server/.env`

**Change this line:**
```env
# OLD (Test domain - doesn't work in production)
RESEND_FROM_EMAIL=Mabini HS Attendance <onboarding@resend.dev>
```

**To this:**
```env
# NEW (Your verified domain)
RESEND_FROM_EMAIL=Mabini HS Attendance <noreply@updates.mabinicolleges.edu.ph>
```

---

## ✅ STEP 3: Update Vercel Environment Variable

**IMPORTANT:** Vercel needs the same update for production

1. Go to: https://vercel.com/login
2. Sign in
3. Click your project: **mabini-hs-attendance**
4. Click **Settings** (top menu)
5. Click **Environment Variables** (left sidebar)
6. Find: `RESEND_FROM_EMAIL`
7. Click **⋮** (three dots) → **Edit**
8. Change value to:
   ```
   Mabini HS Attendance <noreply@updates.mabinicolleges.edu.ph>
   ```
9. Click **Save**

---

## ✅ STEP 4: Redeploy Application

After updating environment variable:

1. Stay in Vercel dashboard
2. Click **Deployments** tab
3. Find the latest deployment (top of list)
4. Click **⋮** (three dots)
5. Click **Redeploy**
6. Wait 30-60 seconds for deployment to complete
7. Look for green checkmark ✅

---

## ✅ STEP 5: Test Email Sending

### Test 1: Account Retrieval

1. Go to your production site
2. Navigate to `/student/login.html`
3. Click "Don't have your account yet?"
4. Enter a test email: `test@mabinicolleges.edu.ph`
5. Click "Retrieve Account"
6. **Check email inbox** - should receive email!

### Test 2: Check Resend Logs

1. Go to: https://resend.com/emails
2. You should see sent emails
3. Status should be "Delivered" ✅
4. Click to view email details

---

## 🎉 SUCCESS INDICATORS

You'll know everything works when:

✅ Resend domain shows "Verified" (green checkmarks)  
✅ Vercel environment variable updated  
✅ Application redeployed  
✅ Test email received in inbox  
✅ Resend logs show "Delivered"  
✅ No errors in console

---

## 🔄 COMPLETE WORKFLOW

```
1. IT admin adds DNS records
   ↓
2. Wait for DNS propagation (15 min - 48 hours)
   ↓
3. Resend verifies domain (green checkmarks)
   ↓
4. Update RESEND_FROM_EMAIL in server/.env
   ↓
5. Update RESEND_FROM_EMAIL in Vercel
   ↓
6. Redeploy on Vercel
   ↓
7. Test account retrieval
   ↓
8. Email arrives successfully! 🎉
```

---

## 📧 EMAIL WILL COME FROM

**Sender name:** Mabini HS Attendance  
**Email address:** noreply@updates.mabinicolleges.edu.ph  
**Subject:** "Your Mabini HS Attendance System Credentials - Student"

Students will see this in their inbox!

---

## 🆘 TROUBLESHOOTING

### Email still not sending after verification?

**Check 1:** Verify environment variable updated
```bash
# In server directory
cat .env | grep RESEND_FROM_EMAIL
# Should show: ...@updates.mabinicolleges.edu.ph
```

**Check 2:** Verify Vercel has new variable
- Vercel → Settings → Environment Variables
- Check value matches

**Check 3:** Verify you redeployed
- Vercel → Deployments
- Latest deployment should be AFTER env change

**Check 4:** Check Resend logs
- https://resend.com/emails
- Look for error messages
- Common: "Domain not verified" = need to verify
- Common: "Rate limit" = too many emails, wait a bit

**Check 5:** Check spam folder
- Email might be in spam
- Mark as "Not Spam"
- Add to contacts

---

## 🎯 CURRENT STATUS

- ✅ Database: Working
- ✅ Login: Working  
- ✅ Duplicate prevention: Working
- ✅ Domain added to Resend
- ⏳ DNS verification: Pending
- ⏳ Email sending: Waiting for DNS

**Next:** Wait for IT admin to add DNS records, then follow steps above

---

**Last Updated:** November 23, 2025  
**Status:** DNS records pending verification
