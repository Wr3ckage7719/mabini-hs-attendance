# Mabini High School Attendance System

A comprehensive web-based attendance management system with QR code scanning, student authentication, and real-time monitoring.

---

## 🚀 Quick Start

### 1. Setup XAMPP
- Install XAMPP (Apache + MySQL + PHP)
- Start Apache and MySQL services

### 2. Import Database
**For new installation:**
```powershell
Get-Content DATABASE_CLEAN_IMPORT.sql | C:\xampp\mysql\bin\mysql.exe -u root
```

**Or use phpMyAdmin:**
1. Visit http://localhost/phpmyadmin
2. Import → Choose `DATABASE_CLEAN_IMPORT.sql`
3. Click "Go"

### 3. Access System
- **Admin Panel:** http://localhost/Mabini_HS_Attendance/Mabini_attendance_system/public/admin/login.html
- **Student Portal:** http://localhost/Mabini_HS_Attendance/Mabini_attendance_system/public/student/login.html

### 4. Default Login
```
Admin:
Email: admin@mabinihs.local
Password: admin123
```

---

## 🌐 Deploy to Vercel

This system is ready for Vercel deployment! See **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** for complete instructions.

**Quick Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**What gets deployed:**
- ✅ Frontend: Static files from `public/`
- ✅ Backend: Node.js serverless functions from `server/`
- ✅ Database: Supabase (already configured)

**Cost: $0/month** on free tier! 🎉

---
Password: admin123

⚠️ Change password after first login!
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | Fast setup guide |
| [DATABASE_IMPORT_GUIDE.md](DATABASE_IMPORT_GUIDE.md) | Detailed import instructions |
| [DATABASE_UPDATE_SUMMARY.md](DATABASE_UPDATE_SUMMARY.md) | Recent changes and testing |
| [QA_TEST_REPORT.md](QA_TEST_REPORT.md) | Complete test results |

---

## ✨ Features

### Student Features
- ✅ **One-time credential retrieval** via institutional email
- ✅ **Email & QR code login** methods
- ✅ **Attendance dashboard** with statistics
- ✅ **Class schedule** viewing
- ✅ **Attendance history** tracking
- ✅ **Profile management**

### Teacher Features
- ✅ **Class management**
- ✅ **Attendance marking** (manual & QR scan)
- ✅ **Student reports**
- ✅ **Teaching load management**
- ✅ **Real-time monitoring**

### Admin Features
- ✅ **Student management** (CRUD operations)
- ✅ **Teacher management**
- ✅ **Subject & section management**
- ✅ **Attendance reports**
- ✅ **User account management**
- ✅ **System configuration**

### Security Features
- ✅ **Bcrypt password hashing**
- ✅ **One-time account retrieval** (prevents abuse)
- ✅ **Role-based access control** (admin/teacher/student)
- ✅ **Session management**
- ✅ **IP address logging**
- ✅ **Email domain restriction** (@mabinicolleges.edu.ph)

---

## 🗄️ Database Structure

**12 Tables:**
- `users` - Admin & teacher accounts
- `students` - Student records & authentication
- `teachers` - Teacher information
- `subjects` - Course subjects
- `sections` - Class sections
- `section_enrollments` - Student enrollments
- `teaching_loads` - Teacher assignments
- `attendance` - Attendance records
- `entrance_logs` - QR scan logs
- `security_alerts` - Security notifications
- `iot_devices` - Scanner devices
- `account_retrievals` - Credential request tracking

---

## 🛠️ Technology Stack

### Backend
- **PHP 8.0+** - Server-side logic
- **MySQL 5.7+** - Database
- **PDO** - Database connectivity
- **SendGrid API** - Email delivery

### Frontend
- **HTML5 / CSS3** - Structure & styling
- **JavaScript ES6** - Client-side logic
- **Bootstrap 5.3** - UI framework
- **Html5Qrcode** - QR code scanning

### Infrastructure
- **XAMPP** - Development environment
- **Apache** - Web server
- **InnoDB** - Database engine

---

## 📋 Requirements

- **PHP:** 8.0 or higher
- **MySQL:** 5.7 or higher (or MariaDB 10.2+)
- **Apache:** 2.4 or higher
- **Browser:** Chrome, Firefox, Edge (latest versions)
- **SendGrid Account:** For email functionality

---

## 🔧 Configuration

### Database Connection
Edit `public/config/database.php`:
```php
$host = 'localhost';
$dbname = 'mabini_attendance';
$username = 'root';
$password = '';
```

### Email Settings
Edit `public/config/email_config.php`:
```php
define('SENDGRID_API_KEY', 'your_api_key_here');
define('SENDGRID_FROM_EMAIL', 'verified@yourdomain.com');
define('SENDGRID_FROM_NAME', 'Mabini High School');
```

---

## 📱 Student Account Setup

Students receive credentials through a one-time retrieval process:

1. Student visits login page
2. Clicks "Don't have your account yet?"
3. Enters institutional email (@mabinicolleges.edu.ph)
4. System sends credentials via email
5. Student logs in with received credentials

**Format:**
- Username: Institutional email
- Password: `Student[last4digits]@2025`

---

## 🧪 Testing

### Run Complete Test Suite
```bash
php test_complete_journey.php
```

### Test Individual Components
```bash
php test_auth_flow.php        # Authentication
php test_login_endpoint.php   # Login API
php test_data_endpoint.php    # Data fetching
php test_retrieval_endpoint.php # Account retrieval
```

See [QA_TEST_REPORT.md](QA_TEST_REPORT.md) for detailed test results.

---

## 📦 Sample Data

The database import includes sample data for testing:

**Students:**
- Maria Santos (233294) - Grade 7-A
- Juan Dela Cruz (233295) - Grade 7-A  
- Anna Reyes (233296) - Grade 8-B

**Teachers:**
- Pedro Garcia (T001) - Mathematics
- Rosa Martinez (T002) - Science
- Jose Fernandez (T003) - English

**Subjects:**
- Math 7, Science 7, English 7, Filipino 7, Math 8, Science 8

---

## 🔐 Security Best Practices

1. **Change default admin password** immediately after installation
2. **Configure SendGrid** with verified sender email
3. **Enable HTTPS** in production environment
4. **Set strong database passwords**
5. **Regular backups** of database
6. **Keep PHP/MySQL updated**
7. **Review security alerts** regularly

---

## 🐛 Troubleshooting

### Database Import Fails
- Check MySQL is running in XAMPP
- Verify user has CREATE DATABASE permission
- Ensure MySQL version is 5.7 or higher

### Student Can't Login
- Verify credentials retrieved via email
- Check students table has username and password set
- Confirm email matches exactly (case-sensitive)

### Email Not Sending
- Verify SendGrid API key is valid
- Check sender email is verified in SendGrid
- Review PHP error logs for details

### Admin Can't Access Dashboard
- Check users table has admin record
- Verify password hash is correct
- Clear browser cache and cookies

See [DATABASE_IMPORT_GUIDE.md](DATABASE_IMPORT_GUIDE.md) for detailed troubleshooting.

---

## 📁 Project Structure

```
Mabini_attendance_system/
├── public/
│   ├── admin/          # Admin interface
│   ├── student/        # Student portal
│   ├── teacher/        # Teacher interface
│   ├── api/            # API endpoints
│   ├── config/         # Configuration files
│   ├── assets/         # CSS, JS, images
│   └── shared/         # Shared components
├── DATABASE_CLEAN_IMPORT.sql     # Clean database import
├── COMPLETE_DATABASE_SETUP.sql   # Migration-safe setup
├── DATABASE_IMPORT_GUIDE.md      # Import documentation
├── QUICK_START.md                # Quick reference
├── QA_TEST_REPORT.md             # Test results
└── README.md                      # This file
```

---

## 🤝 Contributing

1. Follow existing code style
2. Test changes thoroughly
3. Update documentation
4. Run QA tests before committing

---

## 📄 License

This project is developed for Mabini High School.

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review QA test report
3. Check troubleshooting guides
4. Contact system administrator

---

## 🎉 Acknowledgments

- SendGrid for email API
- Html5Qrcode library for QR scanning
- Bootstrap for UI framework
- All contributors to this project

---

**Version:** 2.0  
**Last Updated:** November 19, 2025  
**Status:** Production Ready ✅
