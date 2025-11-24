# 🔧 DNS RECORDS TO ADD - FOR IT ADMIN

**Domain:** updates.mabinicolleges.edu.ph  
**Purpose:** Enable email sending from attendance system  
**Platform:** Resend (Email Service)

---

## 📋 EXACT DNS RECORDS TO ADD

Copy these EXACTLY as shown. Add them at your domain registrar (GoDaddy, Namecheap, etc.)

### 1. DKIM Record (Domain Authentication)
```
Type: TXT
Name: resend._domainkey.updates
Value: p=MIGfMA0GCSqGSIb3DQEB... (see Resend dashboard)
TTL: Auto (or 3600)
```

### 2. SPF Record (Sender Authentication)
```
Type: MX
Name: send.updates
Hostname: feedback-smtp.ap-northeast-1.amazonses.com
Priority: 10
TTL: Auto
```

```
Type: TXT
Name: send.updates
Value: v=spf1 include:amazonses.com ~all
TTL: Auto
```

### 3. DMARC Record (Email Policy)
```
Type: TXT
Name: _dmarc.updates
Value: v=DMARC1; p=none;
TTL: Auto
```

---

## 🎯 HOW TO ADD THESE RECORDS

### If using GoDaddy:
1. Login to GoDaddy
2. Go to **My Products** → **DNS**
3. Click **Add** for each record
4. Select record **Type** (TXT or MX)
5. Enter **Name** exactly as shown
6. Enter **Value** exactly as shown
7. Click **Save**
8. Repeat for all records

### If using Namecheap:
1. Login to Namecheap
2. Go to **Domain List** → **Manage**
3. Click **Advanced DNS**
4. Click **Add New Record**
5. Select **Type** (TXT or MX)
6. Enter **Host** (the Name field)
7. Enter **Value**
8. Click **Save**

### If using Cloudflare:
1. Login to Cloudflare
2. Select domain **mabinicolleges.edu.ph**
3. Go to **DNS** tab
4. Click **Add record**
5. Select **Type**
6. Enter **Name**
7. Enter **Content** (Value)
8. **Important:** Set Proxy status to **DNS only** (gray cloud)
9. Click **Save**

---

## ⏱️ WAIT TIME

After adding records:
- **Minimum:** 15 minutes
- **Average:** 1-4 hours  
- **Maximum:** 48 hours (DNS propagation)

Check verification in Resend dashboard after adding.

---

## ✅ HOW TO VERIFY

1. Go back to Resend: https://resend.com/domains
2. Find **updates.mabinicolleges.edu.ph**
3. Click **Verify** button
4. Wait for green checkmarks
5. Status should change from "Pending" → "Verified"

---

## 🆘 IF RECORDS DON'T VERIFY

**Common Issues:**

1. **Wrong Name field:**
   - Some providers need full domain in Name
   - Example: Instead of `send.updates`, use `send.updates.mabinicolleges.edu.ph`
   - Try both ways

2. **Extra dots:**
   - Remove trailing dots from Name field
   - `send.updates.` → `send.updates`

3. **Wrong subdomain:**
   - Make sure using `updates` subdomain
   - NOT the main domain `mabinicolleges.edu.ph`

4. **DNS cache:**
   - Wait longer (up to 48 hours)
   - Clear DNS cache on computer
   - Try verification again

---

## 📞 CONTACT INFO

If you need help adding these records, the school IT admin should contact:
- **Domain registrar support** (GoDaddy, Namecheap, etc.)
- Share this document with them
- Or send screenshot of Resend DNS records page

---

**Status:** Waiting for DNS records to be added  
**Next Step:** IT admin adds records → Wait for verification → Update Vercel env variable
