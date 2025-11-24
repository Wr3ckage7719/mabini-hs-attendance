# 🚀 QUICK DATABASE IMPORT

## For New Device Setup

### Step 1: Start XAMPP
- Open XAMPP Control Panel
- Start **Apache** and **MySQL**

### Step 2: Import Database
Open Command Prompt in project folder and run:
```bash
C:\xampp\mysql\bin\mysql.exe -u root < DATABASE_CLEAN_IMPORT.sql
```

### Step 3: Done! ✅
Access the system:
- **Admin:** http://localhost/Mabini_HS_Attendance/Mabini_attendance_system/public/admin/login.html
- **Student:** http://localhost/Mabini_HS_Attendance/Mabini_attendance_system/public/student/login.html

### Default Admin Login
```
Email: admin@mabinihs.local
Password: admin123
```

---

## Alternative: phpMyAdmin

1. Go to: http://localhost/phpmyadmin
2. Click "Import" tab
3. Choose file: `DATABASE_CLEAN_IMPORT.sql`
4. Click "Go"

---

## Files in This Project

| File | Purpose | When to Use |
|------|---------|-------------|
| `DATABASE_CLEAN_IMPORT.sql` | **Clean database setup** | ✅ New device, fresh install |
| `COMPLETE_DATABASE_SETUP.sql` | Migration-safe setup | When updating existing database |
| `DATABASE_IMPORT_GUIDE.md` | Full documentation | Need detailed instructions |
| `QA_TEST_REPORT.md` | Testing documentation | Verify system functionality |

---

## What's Included

✅ All 12 database tables  
✅ Sample students (3)  
✅ Sample teachers (3)  
✅ Sample subjects (6)  
✅ Default admin account  
✅ Proper foreign keys  
✅ Optimized indexes  

---

## Need Help?

See `DATABASE_IMPORT_GUIDE.md` for:
- Detailed troubleshooting
- Multiple import methods
- Post-import configuration
- Verification steps
