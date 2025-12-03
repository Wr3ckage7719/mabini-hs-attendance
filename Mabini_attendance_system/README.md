# Mabini High School Attendance System

Modern web-based attendance management system with IoT integration for Mabini High School.

## 🚀 Features

- **Multi-Portal Authentication**
  - Admin Dashboard - Full system management
  - Teacher Portal - View classes, students, and attendance
  - Student Portal - View personal attendance and change password
  
- **Complete CRUD Operations**
  - Students Management
  - Teachers Management
  - Subjects & Sections
  - Teaching Loads
  - Attendance Records

- **IoT Integration**
  - Raspberry Pi face recognition scanner
  - QR code verification
  - Real-time attendance logging
  - SMS notifications to parents

- **Security Features**
  - Role-based access control (Admin, Teacher, Student)
  - Password recovery with OTP
  - Secure session management
  - Row-level security on database

## 📁 Project Structure

```
Mabini_attendance_system/
├── api/                    # Vercel serverless functions
│   ├── account/           # Account retrieval
│   └── password-reset/    # OTP & password reset
├── public/                # Frontend files
│   ├── admin/            # Admin dashboard
│   ├── teacher/          # Teacher portal
│   ├── student/          # Student portal
│   ├── js/               # Shared JavaScript modules
│   └── assets/           # CSS, images
├── server/               # Backend API (Node.js)
├── iot_device/           # Raspberry Pi scanner
├── docs/                 # Documentation
└── vercel.json          # Deployment config
```

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5
- Theme system (Light/Dark mode)

**Backend:**
- Node.js + Express
- Vercel Serverless Functions
- Supabase (PostgreSQL)

**IoT Device:**
- Python 3
- Raspberry Pi with Camera
- Face recognition (OpenCV)
- QR code scanning

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Local Development

1. **Clone repository**
   ```bash
   git clone https://github.com/Wr3ckage7719/mabini-hs-attendance.git
   cd mabini-hs-attendance/Mabini_attendance_system
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your Supabase credentials
   ```

4. **Setup database**
   - Run SQL scripts in `server/MASTER_DATABASE_RESET.sql` in Supabase
   - Verify with `server/VERIFY_DATABASE_SETUP.sql`

5. **Run locally**
   ```bash
   # Start backend server
   cd server
   npm start

   # Serve frontend (use any HTTP server)
   # Example: python -m http.server 8080 in public/
   ```

## 🌐 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Import GitHub repository to Vercel
   - Set root directory: `Mabini_attendance_system`
   - Framework: Other

2. **Environment Variables**
   Set in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy**
   ```bash
   git push origin main  # Auto-deploys if connected
   ```

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 Database Schema

### Main Tables
- `students` - Student records
- `teachers` - Teacher records  
- `users` - Admin users
- `sections` - Class sections
- `subjects` - Subject list
- `teaching_loads` - Teacher assignments
- `entrance_logs` - Attendance records
- `password_reset_tokens` - OTP for password recovery

See [ACTUAL_DATABASE_SCHEMA.md](ACTUAL_DATABASE_SCHEMA.md) for complete schema reference.

## 🔐 Default Credentials

**Admin Login:**
- Email: admin@mabinihs.edu.ph
- Password: (set during database setup)

**Test Student:**
- Email: student@test.com
- Password: (created via admin)

**Test Teacher:**
- Email: teacher@test.com
- Password: (created via admin)

## 📱 IoT Device Setup

See [iot_device/README.md](iot_device/README.md) for Raspberry Pi scanner setup.

External repository: [IoT-Attendance-System](https://github.com/Cerjho/IoT-Attendance-System)

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Check system status
node test-complete-system.js
```

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Database Schemas](docs/DATABASE_SCHEMAS_COMPLETE.md)
- [Database Setup Reference](ACTUAL_DATABASE_SCHEMA.md)
- [Archived Docs](docs/archived/) - Historical documentation

## 🤝 Contributing

### For Team Members / Collaborators

If you need to add a team member or give edit access to someone, see the [Collaborator Access Guide](../COLLABORATOR_ACCESS.md) for detailed instructions on how to add people to this repository.

### For Contributors

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is for Mabini High School. All rights reserved.

## 👥 Team

- Developer: Wr3ckage7719
- Institution: Mabini High School

## 🐛 Issues & Support

Report issues: [GitHub Issues](https://github.com/Wr3ckage7719/mabini-hs-attendance/issues)

---

**Live System:** [Your Vercel URL]  
**Database:** Supabase  
**Version:** 2.0.0  
**Last Updated:** November 2025
