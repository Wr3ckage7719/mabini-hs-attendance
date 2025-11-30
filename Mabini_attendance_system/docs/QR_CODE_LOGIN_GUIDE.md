# QR Code Login System - Complete Guide

## Overview

The QR code login system allows students to authenticate quickly by scanning their personalized QR code using their device's camera. This provides a fast, secure, and password-free login experience.

## How It Works

### 1. QR Code Generation (Admin Side)

**Location:** `public/admin/students.html`

When creating or editing a student:
1. Admin enters the student's information including **student_number** (required)
2. Admin clicks "Generate QR Code" button
3. System generates a QR code containing the student_number
4. QR code is stored as base64 in the `qr_code` field in the students table
5. Admin can download the QR code as PNG for printing on ID cards

**QR Code Contents:**
```
Just the student_number (e.g., "2025001")
```

**Database Storage:**
- **Table:** `students`
- **Field:** `qr_code` (TEXT)
- **Format:** Base64-encoded PNG image
- **Content:** Student number encoded in QR format

### 2. QR Code Login Flow (Student Side)

**Location:** `public/student/login.html` and `public/student/js/student-login.js`

#### Step-by-Step Process:

1. **Student Opens Login Page**
   - Sees two tabs: "Email Login" and "QR Code"
   - Clicks on "QR Code" tab

2. **Camera Activation**
   - Browser requests camera permission
   - Once granted, camera feed appears in the QR reader area
   - Status shows: "Ready to scan - Point camera at QR code"

3. **QR Code Scanning**
   - Student points camera at their QR code (on ID card or device)
   - Html5-qrcode library continuously scans for QR codes
   - When detected, status shows: "QR Code detected! Authenticating..."

4. **Authentication Process**
   ```javascript
   // Extract student number from QR code
   const studentNumber = qrData.trim();
   
   // Query database for student
   const student = await dataClient.getAll('students', [
       { field: 'student_number', operator: '==', value: studentNumber }
   ]);
   
   // Validate student exists and is active
   if (student && student.status === 'active' && 
       student.enrollment_status === 'enrolled') {
       // Create session and login
       sessionStorage.setItem('studentData', JSON.stringify(student));
       sessionStorage.setItem('userRole', 'student');
       sessionStorage.setItem('loginMethod', 'qr');
       
       // Redirect to dashboard
       window.location.href = 'dashboard.html';
   }
   ```

5. **Session Creation**
   - Student data stored in sessionStorage
   - Login method tracked as 'qr'
   - Login timestamp recorded
   - Redirect to student dashboard

### 3. Security Validations

The system performs multiple security checks:

1. **QR Code Validation**
   - Checks if student_number exists in database
   - Validates student record is found

2. **Account Status Check**
   ```javascript
   if (student.status !== 'active') {
       // Reject login
   }
   ```

3. **Enrollment Status Check**
   ```javascript
   if (student.enrollment_status !== 'enrolled') {
       // Reject login
   }
   ```

4. **Session Validation**
   - On dashboard load, verifies student still exists
   - Checks if student is still active
   - Clears invalid sessions automatically

## Technical Implementation

### Frontend Components

**HTML Structure:** `public/student/login.html`
```html
<div id="qr-tab">
    <p class="scanner-message">Scan your student QR code to sign in</p>
    <div id="qr-reader"></div>
    <div id="qr-status">Ready to scan...</div>
</div>
```

**JavaScript Module:** `public/student/js/student-login.js`
- Uses ES6 modules
- Imports `dataClient` for database queries
- Uses Html5-qrcode library for scanning

**QR Scanner Configuration:**
```javascript
const config = {
    fps: 10,                          // 10 frames per second
    qrbox: { width: 250, height: 250 }, // Scan area
    aspectRatio: 1.0                   // Square aspect ratio
};
```

### Database Schema

**Students Table:**
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    enrollment_status VARCHAR(50) DEFAULT 'enrolled',
    qr_code TEXT,  -- Base64 encoded QR code image
    -- ... other fields
);
```

**Indexes for Performance:**
```sql
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_status ON students(status);
```

## Key Features

### 1. **Password-Free Authentication**
- Students don't need to remember passwords
- QR code serves as authentication token
- Faster login process

### 2. **Camera Management**
- Automatically starts when QR tab is selected
- Stops when switching to email tab
- Stops when page is hidden or unloaded
- Handles permissions gracefully

### 3. **Error Handling**
```javascript
// Camera permission denied
if (err.includes('NotAllowedError')) {
    qrStatus.textContent = 'Camera permission denied. Please allow camera access.';
}

// No camera found
if (err.includes('NotFoundError')) {
    qrStatus.textContent = 'No camera found on this device';
}

// Invalid QR code
if (!student) {
    showAlert('Student not found. Invalid QR code.');
    // Restart scanner after 2 seconds
    setTimeout(() => startQRScanner(), 2000);
}
```

### 4. **Mobile Optimization**
- Uses `facingMode: "environment"` to prefer back camera
- Responsive QR reader area
- Handles visibility changes (app switching)

### 5. **Session Management**
```javascript
// Session data stored
sessionStorage.setItem('studentData', JSON.stringify(student));
sessionStorage.setItem('userRole', 'student');
sessionStorage.setItem('loginMethod', 'qr');
sessionStorage.setItem('loginTime', new Date().toISOString());
```

## Best Practices

### For Administrators:

1. **Generate QR codes for all students**
   - Use the "Generate QR Code" button in student management
   - Download and print QR codes
   - Attach to student ID cards

2. **QR Code Distribution**
   - Print on durable material
   - Consider laminating for protection
   - Alternative: Email QR code to students (they can save to phone)

3. **Security Considerations**
   - QR codes should be kept private
   - Lost QR codes should trigger student_number change
   - Monitor login attempts for suspicious activity

### For Students:

1. **Protect Your QR Code**
   - Keep ID card secure
   - Don't share QR code images
   - Report lost ID cards immediately

2. **Login Tips**
   - Ensure good lighting when scanning
   - Hold QR code steady
   - Allow camera permissions when prompted
   - Use email login as backup

## Browser Compatibility

**Required Browser Features:**
- Camera access (getUserMedia API)
- ES6 module support
- SessionStorage

**Tested Browsers:**
- Chrome/Edge (Desktop & Mobile) ✅
- Firefox (Desktop & Mobile) ✅
- Safari (Desktop & Mobile) ✅

**Fallback:**
- Email/password login always available
- Works without camera access

## Troubleshooting

### Scanner Won't Start
**Issue:** "Camera access denied or unavailable"
**Solutions:**
1. Check browser permissions
2. Ensure HTTPS or localhost (required for camera access)
3. Try different browser
4. Use email login instead

### QR Code Not Detected
**Issue:** Scanner running but not detecting QR
**Solutions:**
1. Ensure good lighting
2. Hold QR code closer/further
3. Check if QR code is clear (not damaged)
4. Try regenerating QR code in admin panel

### "Student Not Found" Error
**Issue:** QR scans but student not found
**Solutions:**
1. Verify student_number in database
2. Check if student account is active
3. Regenerate QR code for student
4. Contact administrator

### Multiple Scans
**Issue:** QR code scans multiple times
**Solution:** Scanner now automatically stops after successful scan and restarts on failed attempts

## Performance Optimizations

1. **Scanner Auto-Stop**
   - Stops after successful login
   - Prevents multiple authentication attempts
   - Reduces battery/CPU usage

2. **Database Query Optimization**
   - Indexed student_number field
   - Single query with filters
   - Immediate session creation

3. **Error Recovery**
   - Auto-restart scanner after errors
   - 2-second delay before restart
   - Clears error messages automatically

4. **Memory Management**
   - Proper cleanup on page unload
   - Scanner state tracking
   - Session validation on load

## Future Enhancements

1. **QR Code Expiry**
   - Generate temporary QR codes
   - Add timestamp validation
   - Rotate QR codes periodically

2. **Multi-Factor Authentication**
   - Combine QR + PIN
   - Add biometric verification
   - Device fingerprinting

3. **Offline Support**
   - Cache student data
   - Queue authentication requests
   - Sync when online

4. **Analytics**
   - Track login methods
   - Monitor failed attempts
   - Generate usage reports

## Code Reference

**Main Files:**
- `public/student/login.html` - Login UI
- `public/student/js/student-login.js` - Login logic
- `public/admin/students.html` - QR code generation
- `public/js/data-client.js` - Database queries

**Dependencies:**
- `html5-qrcode@2.3.8` - QR scanning
- `qrcode@1.5.3` - QR generation (admin)
- `@supabase/supabase-js` - Database

**Session Keys:**
- `studentData` - Full student record
- `userRole` - Always "student"
- `loginMethod` - "qr" or "email"
- `loginTime` - ISO timestamp

---

**Last Updated:** December 2025  
**Version:** 1.0  
**Author:** Mabini HS Development Team
