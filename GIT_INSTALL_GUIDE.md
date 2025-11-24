# Git Installation & Setup Guide for Windows

## 🚀 Install Git for Windows

### Step 1: Download Git
1. Go to: https://git-scm.com/download/win
2. Click **"Click here to download"** (64-bit recommended)
3. Save the installer file

### Step 2: Install Git
1. **Run the installer** (git-installer.exe)
2. Click **"Next"** through most screens
3. **Important settings:**
   - ✅ **Use Git from the Windows Command Prompt** (select this!)
   - ✅ **Checkout Windows-style, commit Unix-style** (default)
   - ✅ **Use MinTTY** (default terminal)
   - ✅ **Enable Git Credential Manager** (saves passwords)
4. Click **"Install"**
5. Click **"Finish"**

### Step 3: Verify Installation
Open **NEW** PowerShell terminal (close old ones):
```powershell
git --version
```
Should show: `git version 2.xx.x`

---

## ⚙️ Configure Git (First Time Setup)

```powershell
# Set your name
git config --global user.name "Your Name"

# Set your email (use your GitHub email)
git config --global user.email "your.email@example.com"

# Verify settings
git config --list
```

---

## 📦 Connect Your Project to Git

### If you already have a GitHub repository:

```powershell
# Navigate to your project
cd C:\xampp\htdocs\Mabini_HS_Attendance\Mabini_attendance_system

# Initialize git (if not already)
git init

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Check remote
git remote -v
```

### If you DON'T have a GitHub repository yet:

1. **Go to GitHub.com**
2. Click **"+"** → **"New repository"**
3. Name it: `mabini-attendance-system`
4. Click **"Create repository"**
5. Copy the repository URL
6. Run:
```powershell
cd C:\xampp\htdocs\Mabini_HS_Attendance\Mabini_attendance_system
git init
git remote add origin YOUR_COPIED_URL
```

---

## 🎯 Deploy Your Changes to Vercel

Once Git is installed and configured:

```powershell
# Navigate to project
cd C:\xampp\htdocs\Mabini_HS_Attendance\Mabini_attendance_system

# Check what changed
git status

# Add all changes
git add .

# Commit changes
git commit -m "Fix: Admin pages use direct Supabase authentication"

# Push to GitHub (triggers Vercel auto-deploy)
git push origin main
```

**Note:** Replace `main` with `master` if that's your branch name

---

## 🔐 GitHub Authentication

### Option 1: HTTPS (Easier)
- GitHub will ask for username/password
- Use **Personal Access Token** instead of password:
  1. GitHub → Settings → Developer settings → Personal access tokens
  2. Generate new token (classic)
  3. Select scopes: `repo`
  4. Copy the token
  5. Use as password when pushing

### Option 2: SSH (More Secure)
```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Press Enter 3 times (use defaults)

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key
# Paste the key and save

# Test connection
ssh -T git@github.com
```

---

## ✅ Quick Verification

After installing Git, restart PowerShell and run:
```powershell
git --version
git config --global user.name
git config --global user.email
```

All should show values!

---

## 🆘 Troubleshooting

### "git is not recognized"
- **Close and reopen** PowerShell/Terminal
- Restart VS Code
- Check Path: `echo $env:Path` should include `Git\cmd`

### Can't push to GitHub
- Check remote: `git remote -v`
- Verify credentials
- Try: `git push -u origin main` (sets upstream)

---

## 🎉 After Git is Installed

You can deploy to Vercel by just:
1. `git add .`
2. `git commit -m "message"`
3. `git push`

Vercel will automatically detect the push and redeploy! 🚀
