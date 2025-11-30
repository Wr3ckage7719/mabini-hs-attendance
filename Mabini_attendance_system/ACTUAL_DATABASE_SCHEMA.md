# Actual Database Schema Reference

This document shows the **actual columns** in each table, based on the working admin pages. All settings pages must use these exact field names.

## Students Table Schema

**Columns:**
- `id` - Primary key (auto-generated)
- `student_number` - Unique student ID
- `first_name` - Student's first name
- `last_name` - Student's last name
- `middle_name` - Student's middle name (optional)
- `suffix` - Name suffix (optional)
- `grade_level` - Grade level (e.g., "7", "10")
- `section` - Section name (nullable)
- `section_id` - Foreign key to sections table
- `email` - Student email for login/notifications
- `username` - Login username
- `password` - Hashed password
- `lrn` - Learner Reference Number (optional)
- `sex` - Gender ('Male', 'Female', 'Other')
- `nationality` - Nationality (optional)
- `birth_date` - Date of birth
- `birth_place` - Place of birth (optional)
- `strand` - Academic strand (optional)
- `parent_guardian_name` - Parent/guardian name
- `parent_guardian_contact` - Parent/guardian phone number
- `parent_guardian_email` - Parent/guardian email
- `emergency_contact` - Emergency contact number
- `address` - Home address
- `status` - Account status ('active', 'inactive', 'suspended')
- `enrollment_status` - Enrollment status ('enrolled', 'transferred', 'graduated', 'dropped')
- `qr_code` - Profile photo stored as base64 (optional)
- `profile_photo` - Alternative profile photo field (optional)
- `created_at` - Timestamp (auto-generated)
- `updated_at` - Timestamp (auto-updated)
- `created_by` - Foreign key to users table

**Fields that DO NOT exist:**
- ❌ `full_name` - Use `first_name` + `last_name` instead
- ❌ `phone` - Use `parent_guardian_contact` or `emergency_contact` instead
- ❌ `contact_email` - Use `email` instead

## Teachers Table Schema

**Columns:**
- `id` - Primary key (auto-generated)
- `first_name` - Teacher's first name
- `last_name` - Teacher's last name
- `email` - Teacher email for login/notifications
- `department` - Department/subject area (nullable)
- `position` - Job title/role (nullable)
- `phone` - Contact phone number (nullable)
- `employee_number` - Unique employee ID (optional)
- `status` - Account status ('active', 'inactive')
- `created_at` - Timestamp (auto-generated)
- `updated_at` - Timestamp (auto-updated)

**Fields that DO NOT exist:**
- ❌ `full_name` - Use `first_name` + `last_name` instead
- ❌ `contact_email` - Use `email` instead
- ❌ `address` - Not in schema
- ❌ `sex` - Not in schema
- ❌ `nationality` - Not in schema
- ❌ `birth_date` - Not in schema
- ❌ `birth_place` - Not in schema
- ❌ `profile_photo` - Not in schema

## Usage in Settings Pages

### Loading Profile
```javascript
// Correct way to load name
const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
document.getElementById('fullName').value = fullName;

// Students - load photo from qr_code
if (profile.qr_code) {
    photoPreview.src = profile.qr_code;
}
```

### Saving Profile
```javascript
// Correct way to save name
const fullName = document.getElementById('fullName').value.trim();
const nameParts = fullName.split(' ');
const firstName = nameParts[0] || '';
const lastName = nameParts.slice(1).join(' ') || '';

// Students
const profileData = {
    first_name: firstName,
    last_name: lastName,
    parent_guardian_contact: document.getElementById('phone').value.trim() || null,
    qr_code: profilePhotoBase64 // if photo exists
};

// Teachers
const profileData = {
    first_name: firstName,
    last_name: lastName,
    phone: document.getElementById('phone').value.trim() || null,
    department: document.getElementById('department').value.trim() || null,
    position: document.getElementById('position').value.trim() || null
};
```

## Notes

1. **Email is read-only** - Managed by admins, should not be editable in student/teacher settings
2. **Student numbers and employee numbers** - Managed by admins only
3. **Profile photos** - Only students have this feature (qr_code field)
4. **Editable fields for students**: Full name (split to first/last), phone, photo
5. **Editable fields for teachers**: Full name (split to first/last), phone, department, position

## Verification

These schemas were verified against:
- `public/admin/students.html` - Working student creation/management
- `public/admin/teachers.html` - Working teacher creation/management

Last updated: 2025
