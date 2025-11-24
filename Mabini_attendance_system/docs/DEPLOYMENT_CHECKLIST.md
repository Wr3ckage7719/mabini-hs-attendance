# ✅ Pre-Deployment Checklist

Before deploying to Vercel, ensure these items are complete:

## 🔧 Code Preparation

- [x] Login/logout loop fixed (dashboard.html auth check removed)
- [x] Auto-polling disabled (prevents auth conflicts)
- [x] Supabase credentials configured in server/.env
- [x] All module imports using correct paths
- [x] Admin account exists: admin@mabinihs.local

## 📁 Deployment Files

- [x] `vercel.json` - Vercel configuration
- [x] `.vercelignore` - Files to exclude from deployment
- [x] `package.json` - Root package.json for Vercel
- [x] `.gitignore` - Updated for Vercel
- [x] `VERCEL_DEPLOYMENT_GUIDE.md` - Step-by-step guide

## 🔐 Environment Variables Ready

Copy these to Vercel dashboard after deployment:

```env
VITE_SUPABASE_URL=https://ddblgwzylvwuucnpmtzi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYmxnd3p5bHZ3dXVjbnBtdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDM4MjIsImV4cCI6MjA3OTM3OTgyMn0.EL7xhE0SbgvJ_R8ZAlkawOqRMi3yYMGFbGkqBMWMaJI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYmxnd3p5bHZ3dXVjbnBtdHppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwMzgyMiwiZXhwIjoyMDc5Mzc5ODIyfQ.6vl2qD8ivLgHM_WCCvWdj61-peSQDNktxmjjEw34OrI
NODE_ENV=production
PORT=3000
JWT_SECRET=mabini-hs-attendance-jwt-secret-2025
SESSION_SECRET=mabini-hs-attendance-session-secret-2025
ALLOWED_ORIGINS=https://your-app.vercel.app
```

## 📝 Git Repository

- [ ] Initialize git repository
- [ ] Create .gitignore (already exists ✓)
- [ ] Commit all files
- [ ] Push to GitHub/GitLab

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

## 🚀 Deployment Steps

1. [ ] Sign in to [vercel.com](https://vercel.com)
2. [ ] Click "Add New Project"
3. [ ] Import your Git repository
4. [ ] Configure build settings:
   - Framework: Other
   - Root Directory: `Mabini_attendance_system`
   - Build Command: (leave empty)
   - Output Directory: `public`
5. [ ] Add environment variables (copy from above)
6. [ ] Click "Deploy"
7. [ ] Wait for deployment to complete
8. [ ] Copy deployment URL
9. [ ] Update `ALLOWED_ORIGINS` with deployment URL
10. [ ] Redeploy (click Redeploy in Vercel dashboard)

## ✅ Post-Deployment Testing

After deployment, test these:

### Admin Portal
- [ ] Navigate to `https://your-app.vercel.app/admin/login.html`
- [ ] Login with admin@mabinihs.local / admin123
- [ ] Verify dashboard loads (no login loop!)
- [ ] Test Students CRUD
- [ ] Test Sections CRUD
- [ ] Check Reports page

### Teacher Portal
- [ ] Navigate to `https://your-app.vercel.app/teacher/login.html`
- [ ] Login with teacher credentials
- [ ] Verify dashboard loads
- [ ] Check teaching loads

### Student Portal
- [ ] Navigate to `https://your-app.vercel.app/student/login.html`
- [ ] Login with student credentials
- [ ] Verify dashboard loads
- [ ] Check attendance history

### API Health
- [ ] Visit `https://your-app.vercel.app/health`
- [ ] Should return: `{"status":"healthy"}`

## 🐛 Troubleshooting

If anything fails:

1. **Check Vercel Logs**
   - Deployments → Select deployment → View Function Logs

2. **Check Browser Console**
   - F12 → Console tab
   - Look for errors

3. **Verify Environment Variables**
   - Settings → Environment Variables
   - Make sure all are set

4. **Test Backend**
   - Visit /health endpoint
   - Should return healthy status

5. **CORS Issues**
   - Verify ALLOWED_ORIGINS matches your URL
   - Redeploy after changing env vars

## 📊 Success Criteria

Deployment is successful when:

- ✅ All 3 portals accessible
- ✅ Login works without loops
- ✅ CRUD operations work
- ✅ Data persists in Supabase
- ✅ No console errors
- ✅ Mobile responsive
- ✅ /health endpoint returns healthy

## 🎉 You're Live!

Once all checks pass, share your URLs:

- **Admin:** `https://your-app.vercel.app/admin/login.html`
- **Teacher:** `https://your-app.vercel.app/teacher/login.html`
- **Student:** `https://your-app.vercel.app/student/login.html`

Congratulations! 🚀
