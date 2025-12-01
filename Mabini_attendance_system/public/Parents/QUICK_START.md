# Quick Start Guide - Parent Attendance Portal

## 🚀 Getting Started

### Step 1: Verify Your Setup

1. **Check Database Connection**
   - Open browser console (F12)
   - Navigate to: `http://localhost/Mabini_attendance_system/public/Parents/View.html`
   - You should see "No student ID provided" error (this is expected)

2. **Get a Student ID**
   - Go to Supabase Dashboard → Table Editor → `students`
   - Copy any student's `id` (UUID format)
   - Example: `550e8400-e29b-41d4-a716-446655440000`

### Step 2: Test the Portal

**Test URL Format:**
```
http://localhost/Mabini_attendance_system/public/Parents/View.html?student_id=YOUR_STUDENT_ID
```

**Example:**
```
http://localhost/Mabini_attendance_system/public/Parents/View.html?student_id=550e8400-e29b-41d4-a716-446655440000
```

Replace `YOUR_STUDENT_ID` with the actual UUID from your database.

### Step 3: What You Should See

✅ **Student Information Panel (Left)**
- Student photo/avatar
- Full name
- Student number
- Grade level
- Section
- Guardian contact information

✅ **Statistics Cards (Top)**
- Attendance rate percentage
- Days present
- Days late
- Days absent

✅ **Attendance Records Table (Center)**
- Date of attendance
- Time in
- Time out
- Status (present/late/absent/excused)
- View button (for photos)

✅ **Photo Viewer (Right)**
- Camera snapshots
- Only visible when "View" button is clicked

## 📊 Test Data Setup

If you don't have test data yet, here's how to create some:

### Create Test Student
```sql
-- In Supabase SQL Editor
INSERT INTO students (
    student_number,
    first_name,
    last_name,
    grade_level,
    section,
    parent_guardian_name,
    parent_guardian_contact,
    parent_guardian_email,
    email,
    enrollment_status,
    status
) VALUES (
    '2024-0001',
    'Juan',
    'Dela Cruz',
    '7',
    'Section A',
    'Maria Dela Cruz',
    '09171234567',
    'maria@example.com',
    'juan.delacruz@student.com',
    'enrolled',
    'active'
);
```

### Create Test Attendance Records
```sql
-- Get the student ID first
SELECT id FROM students WHERE student_number = '2024-0001';

-- Then insert attendance (replace STUDENT_ID_HERE)
INSERT INTO attendance (
    student_id,
    date,
    time_in,
    time_out,
    status
) VALUES 
    ('STUDENT_ID_HERE', CURRENT_DATE, '07:30:00', '15:00:00', 'present'),
    ('STUDENT_ID_HERE', CURRENT_DATE - 1, '07:45:00', '15:00:00', 'late'),
    ('STUDENT_ID_HERE', CURRENT_DATE - 2, '07:35:00', '15:00:00', 'present'),
    ('STUDENT_ID_HERE', CURRENT_DATE - 3, NULL, NULL, 'absent'),
    ('STUDENT_ID_HERE', CURRENT_DATE - 4, '07:30:00', '15:00:00', 'present');
```

## 🔧 Troubleshooting

### Problem: Page shows "Failed to load student information"

**Solutions:**
1. Check if student ID is valid UUID
2. Verify student exists in database
3. Check browser console for errors
4. Ensure Supabase credentials are correct

### Problem: No attendance records showing

**Solutions:**
1. Verify attendance data exists for this student:
   ```sql
   SELECT * FROM attendance WHERE student_id = 'YOUR_STUDENT_ID';
   ```
2. Check if RLS policies allow public read access
3. Look for JavaScript errors in console

### Problem: Student photo not showing

**Solutions:**
1. Check if `qr_code` field contains base64 image data
2. Verify data format starts with `data:image/`
3. If no photo, initials will show instead (this is normal)

### Problem: Camera snapshots not showing

**Solutions:**
1. Check `remarks` field in attendance table
2. Photos must be stored as URLs in remarks
3. Example: `"Photo: https://example.com/image.jpg"`

## 🎯 Integration with Admin Panel

### Option 1: Manual Copy-Paste

1. Open your admin students page
2. Find student ID
3. Build URL: `https://yourdomain.com/Parents/View.html?student_id={ID}`
4. Send to parent via SMS/email

### Option 2: Add Share Button (Recommended)

Add to your `admin/students.html`:

```html
<!-- Add this in the table row for each student -->
<button onclick="shareWithParent('STUDENT_ID', 'PARENT_PHONE')">
    📱 Share with Parent
</button>

<script type="module">
import { generateSignedParentLink } from '../Parents/parent-link-generator.js';

window.shareWithParent = async function(studentId, parentPhone) {
    const link = await generateSignedParentLink(studentId, 168); // 7 days
    
    // Option A: Copy to clipboard
    await navigator.clipboard.writeText(link);
    alert('Link copied! Send this to the parent:\n' + link);
    
    // Option B: Send via SMS (requires backend)
    // await sendSMS(parentPhone, `View attendance: ${link}`);
}
</script>
```

### Option 3: Full Integration

See `admin-integration-example.js` for complete implementation with:
- Share modal with multiple options
- SMS integration
- QR code generation
- Copy to clipboard

## 📱 Sending Links to Parents

### Via SMS
```javascript
const link = generateSignedParentLink(studentId, 168);
const message = `Mabini HS: View your child's attendance: ${link}`;
await sendSMS(parentPhone, message);
```

### Via Email
```javascript
const link = generateSignedParentLink(studentId, 168);
const subject = 'Your Child\'s Attendance Report';
const body = `
Dear Parent,

You can view your child's attendance records here:
${link}

This link is valid for 7 days.

Best regards,
Mabini High School
`;
await sendEmail(parentEmail, subject, body);
```

### Via QR Code
```javascript
import QRCode from 'qrcode';

const link = generateSignedParentLink(studentId, 168);
const canvas = document.getElementById('qr-canvas');
await QRCode.toCanvas(canvas, link);
// Print and give to parent at enrollment
```

## 🔒 Security Setup (Production)

### Enable RLS Policies

Run in Supabase SQL Editor:

```sql
-- Allow public read for students
CREATE POLICY "Public can view student basic info"
ON students FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read for attendance
CREATE POLICY "Public can view attendance"
ON attendance FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read for sections
CREATE POLICY "Public can view sections"
ON sections FOR SELECT
TO anon, authenticated
USING (true);
```

### Add URL Signing (Recommended)

1. Set secret key in environment:
   ```bash
   URL_SIGNING_SECRET=your-random-secret-key-here
   ```

2. Use signed links:
   ```javascript
   const link = await generateSignedParentLink(studentId, 168);
   // Link will have: ?student_id=...&expires=...&sig=...
   ```

## 📊 Monitoring Usage

Track who's accessing the portal:

```javascript
// Add to View.html
async function logAccess() {
    await supabase.from('parent_portal_access').insert({
        student_id: studentId,
        accessed_at: new Date().toISOString(),
        ip_address: '...' // Get from request
    });
}
```

## 🎨 Customization

### Change Colors

Edit CSS variables in `View.html`:
```css
:root {
    --accent: #6c5ce7;    /* Change to school colors */
    --success: #22c55e;   /* Present status */
    --danger: #ef4444;    /* Absent status */
}
```

### Add School Logo

```html
<div style="text-align:center;margin-bottom:20px">
    <img src="/path/to/logo.png" alt="School Logo" style="height:60px">
</div>
```

### Modify Date Format

```javascript
// In renderAttendance function
const date = new Date(rec.date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',  // Full month name
    day: 'numeric'
});
```

## ✅ Checklist Before Going Live

- [ ] Test with multiple students
- [ ] Verify attendance data shows correctly
- [ ] Test on mobile devices
- [ ] Set up RLS policies
- [ ] Implement URL signing
- [ ] Test SMS/email delivery
- [ ] Set up error logging
- [ ] Create backup plan for data
- [ ] Document parent instructions
- [ ] Train staff on link sharing

## 📞 Support

Common parent questions:

**Q: Link not working**
- Check if link has expired (default 7 days)
- Request new link from school

**Q: No attendance records**
- Student may be newly enrolled
- Contact school to verify

**Q: Wrong student showing**
- Link may be for different student
- Request correct link from school

---

**Need Help?**
- Check browser console for errors
- Verify Supabase connection
- Review database RLS policies
- Contact system administrator

Last Updated: December 2025
