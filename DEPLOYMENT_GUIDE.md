# 🚀 Deployment Guide

Complete guide for deploying Mabini HS Attendance System to production.

---

## 🎯 Deployment Overview

Your system is deployed on:
- **Frontend & Backend**: Vercel
- **Database**: Supabase
- **Version Control**: GitHub

---

## 📦 GitHub Setup (Already Complete!)

✅ Repository created: `https://github.com/Wr3ckage7719/mabini-hs-attendance`

### Making Changes

When you update code locally:

```powershell
# Stage changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

---

## 🌐 Vercel Deployment

### Option 1: Connect Existing Vercel Project to GitHub

1. Go to: https://vercel.com/dashboard
2. Find your project: **mabini-hs-attendance**
3. Click **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select: **Wr3ckage7719/mabini-hs-attendance**
6. Confirm connection

**✨ After this**: Every `git push` automatically deploys to Vercel!

### Option 2: Fresh Import from GitHub

1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. Find: **Wr3ckage7719/mabini-hs-attendance**
4. Click **Import**
5. Configure:
   - **Root Directory**: `Mabini_attendance_system`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: `public`
6. Click **Deploy**

---

## ⚙️ Vercel Configuration

### Project Settings

The `vercel.json` file is already configured:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### Environment Variables

Make sure these are set in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add (if missing):
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key (for backend)

---

## 🗄️ Database (Supabase)

### Already Configured

Your database is on Supabase and connected via:
- URL: `https://ddblgwzylvwuucnpmtzi.supabase.co`
- Frontend uses: Anon key
- Backend uses: Service role key

### Making Database Changes

1. Update `server/MASTER_DATABASE_RESET.sql`
2. Run in Supabase SQL Editor
3. Verify with `server/VERIFY_DATABASE_SETUP.sql`
4. Update frontend code if schema changed
5. Push to GitHub → Auto-deploys

---

## 🔄 Deployment Workflow

### Standard Update Process

```mermaid
Local Changes → Git Commit → Git Push → GitHub → Vercel Auto-Deploy → Live
```

### Step by Step

1. **Make changes locally**
   - Edit files in VS Code
   - Test on localhost:8080

2. **Commit to Git**
   ```powershell
   git add .
   git commit -m "Fix: Description of change"
   ```

3. **Push to GitHub**
   ```powershell
   git push origin main
   ```

4. **Auto-Deploy** (if connected to GitHub)
   - Vercel detects push
   - Automatically builds and deploys
   - Live in ~30 seconds

5. **Manual Deploy** (if not auto)
   - Go to Vercel Dashboard
   - Click project → Deployments
   - Click "Redeploy" on latest

---

## 🧪 Testing Deployment

### After Deploying

1. **Check deployment status**
   - Go to Vercel Dashboard
   - Look for green "Ready" status

2. **Test live site**
   - Visit your Vercel URL
   - Try admin login
   - Test CRUD operations
   - Check browser console (F12) for errors

3. **Common post-deploy checks**
   - ✅ Admin login works
   - ✅ Can view teachers/students/subjects
   - ✅ Can create/edit/delete records
   - ✅ No console errors
   - ✅ Database queries working

---

## 🔧 Troubleshooting Deployments

### Build Fails

**Check build logs in Vercel:**
1. Go to Deployments
2. Click failed deployment
3. View logs for errors
4. Fix errors locally
5. Push again

### Old Code Still Showing

**Clear Vercel cache:**
1. Go to Deployments
2. Click latest deployment
3. Click ⋮ menu
4. Click "Redeploy"
5. Check "Clear Build Cache"
6. Confirm

### Environment Variables Missing

1. Settings → Environment Variables
2. Add missing variables
3. Redeploy

### Database Connection Issues

1. Check Supabase URL/keys in Vercel
2. Verify Supabase project is active
3. Check browser console for auth errors

---

## 🚨 Emergency Rollback

If deployment breaks production:

1. Go to **Vercel Dashboard** → **Deployments**
2. Find last working deployment
3. Click ⋮ menu → **Promote to Production**
4. Confirms rollback
5. Fix issue locally
6. Deploy again when ready

---

## 📊 Monitoring

### Check Deployment Health

**Vercel Dashboard:**
- View deployment history
- Check build times
- Monitor errors
- View logs

**Supabase Dashboard:**
- Database usage
- API requests
- Error logs
- Performance metrics

---

## 🔐 Security Best Practices

### Production Checklist

- [ ] Environment variables set (not hardcoded)
- [ ] Service role key not exposed to frontend
- [ ] RLS enabled on all database tables
- [ ] HTTPS only (Vercel does this automatically)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Error logging active

---

## 🎉 Auto-Deploy Benefits

Once connected to GitHub:

✅ **Automatic deployments** - Push → Live in 30 seconds
✅ **Preview deployments** - Test branches before merging
✅ **Rollback ready** - Instant rollback to any previous version
✅ **Git history** - Full change tracking
✅ **Collaboration** - Team can contribute via pull requests

---

## 📝 Deployment Checklist

Before going live:

- [ ] Database migration complete
- [ ] Admin account created
- [ ] All tests passing locally
- [ ] Environment variables set in Vercel
- [ ] GitHub repository connected to Vercel
- [ ] Test deployment on staging URL
- [ ] Admin login works on live site
- [ ] CRUD operations work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Custom domain configured (if applicable)

---

**Your System URLs:**

- **GitHub**: https://github.com/Wr3ckage7719/mabini-hs-attendance
- **Vercel**: (Your Vercel project URL)
- **Supabase**: https://supabase.com/dashboard

---

**Need Help?** Check Vercel logs or Supabase logs for specific error messages.
