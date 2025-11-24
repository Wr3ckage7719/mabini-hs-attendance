# 🚀 Vercel Deployment Guide

## Prerequisites

✅ Node.js backend already configured in `server/`  
✅ Supabase database already set up  
✅ Frontend static files in `public/`  

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or use the Vercel web dashboard (easier for first-time deployment).

---

## Step 2: Push Code to Git (OR Deploy Directly)

### Option A: Using Git (Recommended for Automatic Updates)

Vercel deploys from Git repositories (GitHub, GitLab, Bitbucket).

**First, install Git if not already installed:**
- Download: https://git-scm.com/download/win
- Install and restart VS Code

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Mabini HS Attendance System"

# Push to GitHub (create repo first at github.com)
git remote add origin https://github.com/YOUR_USERNAME/mabini-hs-attendance.git
git push -u origin main
```

### Option B: Direct Upload via Vercel CLI (No Git Required)

If you don't have Git installed, you can deploy directly:

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy directly from folder:**
```bash
cd c:\xampp\htdocs\Mabini_HS_Attendance\Mabini_attendance_system
vercel
```

The CLI will upload your files directly to Vercel without needing Git!

### Option C: Zip & Upload via Dashboard (Easiest)

1. Compress the `Mabini_attendance_system` folder to ZIP
2. Go to vercel.com → Add New Project
3. Click "Import Third-Party Git Repository"
4. Upload your ZIP file

**Note:** Options B and C work, but you won't get automatic deployments when you update code.

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `Mabini_attendance_system`
   - **Build Command:** Leave empty (static + serverless)
   - **Output Directory:** `public`
5. Click **"Deploy"**

### Option B: Using CLI

```bash
cd Mabini_attendance_system
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name:** mabini-hs-attendance
- **Directory:** `./` (current)
- **Override settings?** No

---

## Step 4: Configure Environment Variables

In Vercel dashboard (Project → Settings → Environment Variables), add:

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ddblgwzylvwuucnpmtzi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYmxnd3p5bHZ3dXVjbnBtdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDM4MjIsImV4cCI6MjA3OTM3OTgyMn0.EL7xhE0SbgvJ_R8ZAlkawOqRMi3yYMGFbGkqBMWMaJI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYmxnd3p5bHZ3dXVjbnBtdHppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwMzgyMiwiZXhwIjoyMDc5Mzc5ODIyfQ.6vl2qD8ivLgHM_WCCvWdj61-peSQDNktxmjjEw34OrI

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT & Session
JWT_SECRET=mabini-hs-attendance-jwt-secret-2025
SESSION_SECRET=mabini-hs-attendance-session-secret-2025

# CORS (Update after deployment)
ALLOWED_ORIGINS=https://your-app.vercel.app

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=Mabini HS Attendance <noreply@mabinihs.local>

# SMS Configuration (Optional)
SMS_API_KEY=144df5399bbde6fc576995480daf2e24a229785fd4b74d9b
SMS_API_URL=https://api.smsmobileapi.com/sendsms/

# IoT Device
IOT_API_KEY=mabini_device_001_key_2025
```

**Note:** Copy these from your `server/.env` file.

---

## Step 5: Update Frontend URLs

After deployment, Vercel gives you a URL like `https://mabini-hs-attendance.vercel.app`

Update the `ALLOWED_ORIGINS` environment variable in Vercel:

1. Go to Project Settings → Environment Variables
2. Edit `ALLOWED_ORIGINS`
3. Set to: `https://your-actual-url.vercel.app`
4. Redeploy (Deployments → ... → Redeploy)

---

## Step 6: Test Deployment

Visit your deployed URLs:

### Admin Portal
```
https://your-app.vercel.app/admin/login.html
```
Login: `admin@mabinihs.local` / `admin123`

### Student Portal
```
https://your-app.vercel.app/student/login.html
```

### Teacher Portal
```
https://your-app.vercel.app/teacher/login.html
```

### API Health Check
```
https://your-app.vercel.app/health
```

---

## Troubleshooting

### Issue: "Module not found"
**Solution:** Make sure `server/package.json` has all dependencies listed and `vercel-build` script runs `npm install`.

### Issue: "API routes not working"
**Solution:** Check `vercel.json` routes configuration. API routes should go to `server/index.js`.

### Issue: "Environment variables not working"
**Solution:** Redeploy after adding environment variables. They only apply to new deployments.

### Issue: "CORS errors"
**Solution:** Update `ALLOWED_ORIGINS` in Vercel environment variables to match your deployment URL.

---

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `attendance.mabinihs.edu`)
3. Follow DNS configuration instructions
4. Update `ALLOWED_ORIGINS` to include your custom domain

---

## Automatic Deployments

Every push to `main` branch automatically deploys to production:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel automatically builds and deploys! ✅

---

## Production Checklist

Before going live:

- [ ] Test all login portals (admin, teacher, student)
- [ ] Test CRUD operations (students, sections, attendance)
- [ ] Verify Supabase RLS policies are enabled
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Enable error logging in Vercel dashboard
- [ ] Set up monitoring/alerts
- [ ] Create database backups in Supabase

---

## Cost

**Vercel Free Tier Includes:**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (100GB-hours)
- ✅ Custom domains
- ✅ SSL certificates

**Supabase Free Tier Includes:**
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**Total Cost: $0/month** for small to medium schools! 🎉

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** Report bugs in your repository

---

## Quick Deploy Button (Optional)

Add this to your `README.md` for one-click deployment:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/mabini-hs-attendance)
```

---

## Rollback Deployment

If something goes wrong:

1. Go to Deployments tab in Vercel
2. Find a previous working deployment
3. Click **... → Promote to Production**

Instant rollback! ✅
