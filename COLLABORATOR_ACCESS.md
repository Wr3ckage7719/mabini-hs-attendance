# How to Give Access to Collaborators

This guide explains how to add your workmate or team members as collaborators to this repository, giving them the ability to edit and contribute to the project.

## 📋 Overview

Adding collaborators to your GitHub repository allows team members to:
- Clone and pull the repository
- Push changes directly to the repository
- Create and merge pull requests
- Manage issues and discussions
- Access repository settings (depending on permission level)

## 🔐 Permission Levels

GitHub offers different access levels for collaborators:

| Permission Level | Access Rights |
|-----------------|---------------|
| **Read** | View and clone repository, open issues |
| **Triage** | Read access + manage issues and pull requests |
| **Write** | Triage access + push to repository, create branches, edit code, create pull requests |
| **Maintain** | Write access + manage webhooks, deploy keys, and some repository settings (cannot delete repository or manage security) |
| **Admin** | Full access including deleting repository and managing collaborators |

**For editing access, you need to grant at least "Write" permission.**

## 📝 Step-by-Step Instructions

### Method 1: Adding Collaborators via GitHub Web Interface

1. **Navigate to Repository Settings**
   - Go to your repository: `https://github.com/Wr3ckage7719/mabini-hs-attendance`
   - Click on **Settings** (gear icon) in the repository menu

2. **Access Collaborators Section**
   - In the left sidebar, click on **Collaborators and teams**
   - You may be asked to confirm your password for security

3. **Add New Collaborator**
   - Click the **Add people** button
   - Enter your workmate's GitHub username, full name, or email address
   - GitHub will show matching users - select the correct one

4. **Set Permission Level**
   - Choose the appropriate permission level (typically **Write** for editing)
   - Click **Add [username] to this repository**

5. **Collaborator Accepts Invitation**
   - Your workmate will receive an email invitation
   - They must accept the invitation to gain access
   - They can accept via email or by visiting the repository URL

### Method 2: Using GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
# Add collaborator with write access
gh api repos/Wr3ckage7719/mabini-hs-attendance/collaborators/USERNAME \
  --method PUT \
  --field permission=write

# Replace USERNAME with your workmate's GitHub username
```

### Method 3: For Organization Repositories

If this repository belongs to an organization:

1. Navigate to the organization's **Teams** page
2. Create a new team or select an existing team
3. Add your workmate to the team
4. Give the team access to the repository with appropriate permissions

## ✅ Verifying Access

After your workmate accepts the invitation, they can verify access by:

```bash
# Clone the repository
git clone https://github.com/Wr3ckage7719/mabini-hs-attendance.git

# Navigate to the project
cd mabini-hs-attendance

# Make sure they can pull
git pull origin main

# Test push access (after making a change)
git push origin branch-name
```

## 🚀 Getting Started for New Collaborators

Once your workmate has access, they should follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Wr3ckage7719/mabini-hs-attendance.git
   cd mabini-hs-attendance
   ```

2. **Set Up Development Environment**
   - Follow instructions in `Mabini_attendance_system/README.md`
   - Install dependencies: `cd Mabini_attendance_system/server && npm install`
   - Configure environment variables (`.env` file)

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to GitHub repository
   - Click "Compare & pull request"
   - Describe changes and submit for review

## 🔒 Security Best Practices

1. **Verify Identity**: Ensure you're adding the correct person before granting access
2. **Minimal Permissions**: Grant only the permissions needed for their role
3. **Regular Reviews**: Periodically review collaborator list and remove inactive members
4. **Use Branches**: Encourage collaborators to use feature branches instead of pushing directly to main
5. **Protect Main Branch**: Set up branch protection rules to require pull request reviews

### Setting Up Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add rule** for branch protection
3. Enter branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Require status checks to pass
5. Save changes

## 📞 Troubleshooting

### Collaborator Didn't Receive Invitation Email
- Check spam/junk folder
- Verify the email address in their GitHub profile is correct and current
- Send invitation again from Settings → Collaborators
- Collaborator can visit repository URL to see pending invitation

### Collaborator Can't Push Changes
- Verify they accepted the invitation
- Check their permission level (should be at least "Write")
- Ensure they're pushing to correct remote: `git remote -v`
- Check if branch protection rules are blocking push

### Permission Denied Error
```bash
# Update remote URL to use SSH (if they have SSH keys set up)
git remote set-url origin git@github.com:Wr3ckage7719/mabini-hs-attendance.git

# Or ensure HTTPS URL is correct
git remote set-url origin https://github.com/Wr3ckage7719/mabini-hs-attendance.git
```

## 📚 Additional Resources

- [GitHub Docs: Inviting Collaborators](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-access-to-your-personal-repositories/inviting-collaborators-to-a-personal-repository)
- [GitHub Docs: Permission Levels](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-user-account-settings/permission-levels-for-a-personal-account-repository)
- [Contributing Guidelines](Mabini_attendance_system/README.md#-contributing)

## 🆘 Need Help?

If you encounter issues adding collaborators or your workmate needs help getting started:

1. Check GitHub's official documentation
2. Verify repository ownership and admin access
3. Contact GitHub Support if technical issues persist
4. Review this project's README.md for development setup instructions

---

**Quick Summary:**
To give your workmate edit access:
1. Go to repository **Settings** → **Collaborators and teams**
2. Click **Add people**
3. Enter their GitHub username
4. Select **Write** permission
5. They accept the email invitation
6. Done! They can now clone, edit, and push to the repository.
