# Parent Portal - Student Attendance Viewer

## 📋 Overview

The Parent Portal allows parents and guardians to view their child's attendance records through a secure, shareable link. This system is fully integrated with the Mabini HS Attendance System's Supabase database.

## 🎯 Features

### ✅ Real-time Data Integration
- **Direct Supabase Connection**: Pulls live data from `students` and `attendance` tables
- **Student Profile**: Displays complete student information including photo, grade, section, and contact details
- **Attendance History**: Shows all attendance records with date, time in/out, and status
- **Camera Snapshots**: View photos captured during check-in (if available in attendance remarks)

### 📊 Statistics Dashboard
- **Attendance Rate**: Percentage of days present
- **Days Present**: Total present days
- **Days Late**: Total late arrivals
- **Days Absent**: Total absent days
- **Monthly Filtering**: Filter attendance by specific month

### 🖨️ Export Features
- **Print/PDF**: Print-friendly layout for generating PDF reports
- **CSV Export**: Download attendance data as CSV file
- **Automatic Naming**: CSV files named with student number and date

### 🔒 Security
- **Signed URLs**: Support for time-limited, signed access links
- **Student ID Verification**: Ensures only authorized access to student data
- **Graceful Fallback**: Works with or without URL signatures for backward compatibility

## 🚀 How It Works

### URL Structure

#### Basic URL (Legacy)
```
/Parents/View.html?student_id=STUDENT_UUID
```

#### Signed URL (Recommended)
```
/Parents/View.html?student_id=STUDENT_UUID&expires=TIMESTAMP&sig=SIGNATURE
```

**Parameters:**
- `student_id`: UUID of the student from the `students` table
- `expires` (optional): Unix timestamp when the link expires
- `sig` (optional): HMAC signature for verification

### Database Integration

The page connects to these Supabase tables:

#### 1. Students Table
```javascript
.from('students')
.select(`
    *,
    sections (
        section_name,
        section_code,
        grade_level
    )
`)
.eq('id', studentId)
```

**Used Fields:**
- `id` - Student UUID
- `student_number` - Student ID number
- `first_name`, `middle_name`, `last_name`, `suffix` - Full name
- `grade_level` - Current grade
- `section_id` → `sections.section_name` - Section name
- `lrn` - Learner Reference Number
- `enrollment_status` - Active/inactive status
- `qr_code` - Student photo (base64)
- `parent_guardian_name` - Guardian name
- `parent_guardian_contact` - Guardian phone
- `parent_guardian_email` - Guardian email

#### 2. Attendance Table
```javascript
.from('attendance')
.select('*')
.eq('student_id', studentId)
.order('date', { ascending: false })
```

**Used Fields:**
- `date` - Attendance date
- `time_in` - Check-in time
- `time_out` - Check-out time  
- `status` - 'present', 'late', 'absent', 'excused'
- `remarks` - May contain photo URL

## 📱 Usage Examples

### 1. Send Link via SMS
```javascript
const studentId = '123e4567-e89b-12d3-a456-426614174000';
const baseUrl = 'https://yourdomain.com/Parents/View.html';
const link = `${baseUrl}?student_id=${studentId}`;

// Send via SMS
await sendSMS(parentPhone, `View your child's attendance: ${link}`);
```

### 2. Generate Signed Link (More Secure)
```javascript
import crypto from 'crypto';

function generateSignedLink(studentId, expiryHours = 168) {
    const secret = process.env.URL_SIGNING_SECRET;
    const expires = Date.now() + (expiryHours * 60 * 60 * 1000);
    const data = `${studentId}:${expires}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
    
    return `https://yourdomain.com/Parents/View.html?student_id=${studentId}&expires=${expires}&sig=${signature}`;
}

// Generate 7-day valid link
const link = generateSignedLink(studentId, 168);
```

### 3. Integrate with Admin Panel

Add a "Share with Parent" button in the admin students page:

```javascript
// In public/admin/students.html
async function shareAttendanceWithParent(studentId, parentPhone) {
    const link = generateParentLink(studentId);
    
    const message = `Mabini HS: View your child's attendance records here: ${link}`;
    
    await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phone: parentPhone,
            message: message
        })
    });
    
    alert('Link sent to parent via SMS!');
}
```

## 🎨 UI Features

### Responsive Design
- **Desktop**: 3-column layout (student info, attendance table, photo viewer)
- **Tablet**: 2-column layout (stacked sections)
- **Mobile**: Single column (optimized for small screens)

### Status Badges
- **Present**: Green badge
- **Late**: Yellow badge
- **Absent**: Red badge
- **Excused**: Blue badge

### Photo Viewer
- Right sidebar shows camera snapshots from attendance check-ins
- Click "View" button on any attendance row to display photo
- Photos are extracted from the `remarks` field (URL format)

## 🔧 Customization

### Change Colors
Edit the CSS variables in the `<style>` section:
```css
:root {
    --bg: #071027;           /* Background */
    --panel: #0c1726;        /* Panel background */
    --muted: #9aa9bf;        /* Muted text */
    --accent: #6c5ce7;       /* Primary accent */
    --success: #22c55e;      /* Success/present */
    --danger: #ef4444;       /* Danger/absent */
    --warning: #f59e0b;      /* Warning/late */
}
```

### Add Custom Fields
To display additional student information:

1. Query the field from Supabase:
```javascript
const { data } = await supabase
    .from('students')
    .select('*, your_custom_field')
    .eq('id', studentId)
    .single();
```

2. Add to UI:
```javascript
document.getElementById('customField').textContent = data.your_custom_field;
```

### Modify Attendance Display
To show subject-based attendance:

```javascript
const { data } = await supabase
    .from('attendance')
    .select(`
        *,
        subjects (name),
        teaching_loads (room)
    `)
    .eq('student_id', studentId);
```

## 🚨 Troubleshooting

### Link Not Loading
- **Check student_id**: Must be valid UUID from `students` table
- **Verify CORS**: Supabase must allow your domain
- **Check RLS**: Row Level Security policies must allow anonymous reads

### No Attendance Records
- **Verify data exists**: Check `attendance` table for student_id
- **Check filters**: Month filter might be hiding records
- **RLS policies**: Ensure public read access to attendance table

### Photos Not Showing
- **Check remarks field**: Photo URLs must be in `attendance.remarks`
- **URL format**: Must be valid HTTP/HTTPS URL
- **CORS**: Image host must allow cross-origin requests

## 📊 Database Requirements

### Row Level Security (RLS) Policies

For public access to work, you need these RLS policies:

```sql
-- Allow public to read students (limited fields)
CREATE POLICY "Allow public to view student basic info"
ON students FOR SELECT
TO anon
USING (true);

-- Allow public to read attendance for students
CREATE POLICY "Allow public to view attendance"
ON attendance FOR SELECT
TO anon
USING (true);

-- Allow public to read sections for join
CREATE POLICY "Allow public to view sections"
ON sections FOR SELECT
TO anon
USING (true);
```

**⚠️ Security Note:** These policies allow anyone with the link to view data. For production, implement proper signature verification.

## 🔐 Recommended Security Setup

1. **Implement signature verification** on backend
2. **Store secret key** in environment variables
3. **Set reasonable expiry times** (7-30 days)
4. **Log access attempts** for audit trail
5. **Add rate limiting** to prevent abuse

## 📝 Future Enhancements

- [ ] Parent login system (instead of links)
- [ ] Email delivery option
- [ ] SMS notifications for new records
- [ ] Grade reports integration
- [ ] Behavioral records
- [ ] Calendar view of attendance
- [ ] Comparison with class average
- [ ] Downloadable report cards

## 🤝 Integration Points

### SMS Integration
```javascript
// Send link when parent requests via SMS
router.post('/api/parent/request-link', async (req, res) => {
    const { phone } = req.body;
    
    // Find student by parent phone
    const { data: student } = await supabase
        .from('students')
        .select('id, student_number, first_name')
        .eq('parent_guardian_contact', phone)
        .single();
    
    if (!student) {
        return res.json({ error: 'No student found' });
    }
    
    const link = generateSignedLink(student.id);
    await sendSMS(phone, `Hi! View ${student.first_name}'s attendance: ${link}`);
    
    res.json({ success: true });
});
```

### Admin Panel Button
```html
<!-- Add to admin/students.html -->
<button onclick="shareWithParent('${student.id}', '${student.parent_guardian_contact}')">
    📱 Send to Parent
</button>
```

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase connection
3. Test with a known student ID
4. Review RLS policies in Supabase dashboard

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**Compatible with:** Mabini HS Attendance System v2.0+
