# Supabase Storage Setup Guide

This guide explains how to set up Supabase Storage buckets for storing student images (profile pictures and QR codes) instead of base64 in the database.

## Why Use Supabase Storage?

**Current Problem:**
- Storing base64 images in database fields (`qr_code`, profile pictures)
- Makes database bloated and slow
- Inefficient for large images
- Harder to serve/optimize images

**Solution:**
- Store images in Supabase Storage buckets
- Store only the image URLs in database
- Better performance, scalability, and CDN support
- Automatic image optimization available

---

## Step 1: Create Storage Bucket

### Via Supabase Dashboard:

1. **Login to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `ddblgwzylvwuucnpmtzi`

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "New bucket" button

3. **Create `student-images` Bucket**
   ```
   Bucket Name: student-images
   Public bucket: ✅ YES (checked)
   File size limit: 5 MB (recommended)
   Allowed MIME types: image/jpeg, image/png, image/jpg
   ```

4. **Click "Create bucket"**

### Why Public Bucket?
- Student images need to be viewable by parents and teachers
- QR codes need to be scannable
- Profile pictures displayed on dashboards
- Public bucket means: anyone with the URL can view (which is what we want)

---

## Step 2: Set Up Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

### 2.1 Allow Public Read Access

```sql
-- Allow anyone to READ (download) files from student-images bucket
CREATE POLICY "Public read access for student images"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-images');
```

### 2.2 Allow Authenticated Upload

```sql
-- Allow authenticated users to UPLOAD files to student-images bucket
CREATE POLICY "Authenticated users can upload student images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-images' 
  AND auth.role() = 'authenticated'
);
```

### 2.3 Allow Authenticated Update

```sql
-- Allow authenticated users to UPDATE files in student-images bucket
CREATE POLICY "Authenticated users can update student images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-images')
WITH CHECK (auth.role() = 'authenticated');
```

### 2.4 Allow Authenticated Delete

```sql
-- Allow authenticated users to DELETE files from student-images bucket
CREATE POLICY "Authenticated users can delete student images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-images' 
  AND auth.role() = 'authenticated'
);
```

### Apply Policies via Supabase Dashboard:

1. Go to: **Storage** → **Policies** tab
2. Select your bucket: `student-images`
3. Click "New Policy"
4. For each policy above:
   - Choose the operation (SELECT, INSERT, UPDATE, DELETE)
   - Enter the policy name
   - Paste the SQL condition
   - Click "Review" → "Save policy"

---

## Step 3: Update Database Schema

Add new columns to store image URLs instead of base64:

```sql
-- Add columns for image URLs in students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN students.profile_picture_url IS 'URL to profile picture in Supabase Storage';
COMMENT ON COLUMN students.qr_code_url IS 'URL to QR code image in Supabase Storage';
```

### Migration Strategy (Backward Compatible):

Keep the old `qr_code` column for now to maintain backward compatibility:
- New uploads use `qr_code_url` (URL to Storage)
- Old data remains in `qr_code` (base64)
- Frontend checks both fields: use `qr_code_url` if available, else `qr_code`

---

## Step 4: JavaScript Implementation

### 4.1 Upload Function

```javascript
/**
 * Upload image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - Folder within bucket (e.g., 'qr-codes', 'profile-pictures')
 * @param {string} fileName - Custom filename (e.g., 'student-2025001-qr.png')
 * @returns {Promise<string>} - Public URL of uploaded image
 */
async function uploadImageToStorage(file, folder, fileName) {
    try {
        const filePath = `${folder}/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabaseClient
            .storage
            .from('student-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true // Overwrite if exists
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from('student-images')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}
```

### 4.2 Upload from Blob/Canvas (for QR Codes)

```javascript
/**
 * Upload QR code canvas as PNG to storage
 * @param {HTMLCanvasElement} canvas - Canvas with QR code
 * @param {string} studentNumber - Student number for filename
 * @returns {Promise<string>} - Public URL of uploaded QR code
 */
async function uploadQRCodeToStorage(canvas, studentNumber) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            try {
                const fileName = `student-${studentNumber}-qr.png`;
                const file = new File([blob], fileName, { type: 'image/png' });
                
                const url = await uploadImageToStorage(file, 'qr-codes', fileName);
                resolve(url);
            } catch (error) {
                reject(error);
            }
        }, 'image/png');
    });
}
```

### 4.3 Upload Profile Picture from Input

```javascript
/**
 * Handle profile picture upload from file input
 * @param {Event} event - Change event from file input
 * @param {string} studentNumber - Student number for filename
 * @returns {Promise<string>} - Public URL of uploaded image
 */
async function handleProfilePictureUpload(event, studentNumber) {
    const file = event.target.files[0];
    if (!file) throw new Error('No file selected');
    
    // Validate file type
    if (!file.type.match('image.*')) {
        throw new Error('Please select an image file');
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
    }
    
    const fileName = `student-${studentNumber}-profile.${file.name.split('.').pop()}`;
    return await uploadImageToStorage(file, 'profile-pictures', fileName);
}
```

### 4.4 Delete Image from Storage

```javascript
/**
 * Delete image from Supabase Storage
 * @param {string} filePath - Path to file in bucket (e.g., 'qr-codes/student-2025001-qr.png')
 * @returns {Promise<void>}
 */
async function deleteImageFromStorage(filePath) {
    try {
        const { error } = await supabaseClient
            .storage
            .from('student-images')
            .remove([filePath]);
        
        if (error) throw error;
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
}
```

---

## Step 5: Update Student CRUD Operations

### 5.1 Create Student (with images)

```javascript
async function createStudentWithImages() {
    const studentNumber = document.getElementById('studentNumber').value.trim();
    
    // ... validate fields ...
    
    let qrCodeUrl = null;
    let profilePictureUrl = null;
    
    try {
        // 1. Generate and upload QR code
        if (qrCanvas) {
            qrCodeUrl = await uploadQRCodeToStorage(qrCanvas, studentNumber);
        }
        
        // 2. Upload profile picture (if selected)
        const profileInput = document.getElementById('profilePicture');
        if (profileInput.files[0]) {
            profilePictureUrl = await uploadImageToStorage(
                profileInput.files[0],
                'profile-pictures',
                `student-${studentNumber}-profile.png`
            );
        }
        
        // 3. Save to database with URLs
        const studentData = {
            student_number: studentNumber,
            first_name: firstName,
            last_name: lastName,
            grade_level: gradeLevel,
            section: section || null,
            email: email,
            qr_code_url: qrCodeUrl, // Store URL instead of base64
            profile_picture_url: profilePictureUrl,
            status: 'active'
        };
        
        const result = await window.createDocument('students', studentData);
        
        if (result.success) {
            alert('Student created successfully!');
            // Refresh list...
        }
    } catch (error) {
        console.error('Error creating student:', error);
        alert('Error creating student: ' + error.message);
    }
}
```

### 5.2 Update Student (with images)

```javascript
async function updateStudentWithImages(studentId) {
    const studentNumber = document.getElementById('studentNumber').value.trim();
    
    const updateData = {
        student_number: studentNumber,
        first_name: firstName,
        last_name: lastName,
        // ... other fields ...
    };
    
    try {
        // Upload new QR code if generated
        if (newQRCanvas) {
            // Delete old QR code
            if (existingQRUrl) {
                const oldPath = existingQRUrl.split('/student-images/')[1];
                await deleteImageFromStorage(oldPath);
            }
            
            // Upload new QR code
            updateData.qr_code_url = await uploadQRCodeToStorage(newQRCanvas, studentNumber);
        }
        
        // Upload new profile picture if selected
        const profileInput = document.getElementById('profilePicture');
        if (profileInput.files[0]) {
            // Delete old profile picture
            if (existingProfileUrl) {
                const oldPath = existingProfileUrl.split('/student-images/')[1];
                await deleteImageFromStorage(oldPath);
            }
            
            // Upload new profile picture
            updateData.profile_picture_url = await uploadImageToStorage(
                profileInput.files[0],
                'profile-pictures',
                `student-${studentNumber}-profile.png`
            );
        }
        
        const result = await window.updateDocument('students', studentId, updateData);
        
        if (result.success) {
            alert('Student updated successfully!');
        }
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Error updating student: ' + error.message);
    }
}
```

### 5.3 Delete Student (cleanup images)

```javascript
async function deleteStudentWithImages(studentId, student) {
    if (!confirm(`Delete ${student.first_name} ${student.last_name}?\n\nThis will also delete their images.`)) {
        return;
    }
    
    try {
        // 1. Delete images from storage first
        const deletePromises = [];
        
        if (student.qr_code_url) {
            const qrPath = student.qr_code_url.split('/student-images/')[1];
            deletePromises.push(deleteImageFromStorage(qrPath));
        }
        
        if (student.profile_picture_url) {
            const profilePath = student.profile_picture_url.split('/student-images/')[1];
            deletePromises.push(deleteImageFromStorage(profilePath));
        }
        
        await Promise.all(deletePromises);
        
        // 2. Delete student record from database
        const result = await window.deleteDocument('students', studentId);
        
        if (result.success) {
            alert('Student and images deleted successfully!');
            // Refresh list...
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student: ' + error.message);
    }
}
```

---

## Step 6: Display Images (Frontend)

### 6.1 Display QR Code

```javascript
// Check if URL exists, else fallback to base64
const qrImageSrc = student.qr_code_url || student.qr_code || 'default-qr.png';

document.getElementById('qrImage').src = qrImageSrc;
```

### 6.2 Display Profile Picture

```javascript
const profileImageSrc = student.profile_picture_url || 'default-avatar.png';

document.getElementById('profilePic').src = profileImageSrc;
```

### 6.3 Responsive Image Loading

```html
<!-- QR Code with fallback -->
<img 
    id="qrImage" 
    src="" 
    alt="Student QR Code"
    onerror="this.src='../assets/img/default-qr.png'"
    style="width: 200px; height: 200px;">

<!-- Profile Picture with fallback -->
<img 
    id="profilePic" 
    src="" 
    alt="Student Photo"
    onerror="this.src='../assets/img/default-avatar.png'"
    class="student-photo">
```

---

## Step 7: Testing Checklist

- [ ] Bucket `student-images` created and public
- [ ] All 4 storage policies applied (SELECT, INSERT, UPDATE, DELETE)
- [ ] Database columns added: `profile_picture_url`, `qr_code_url`
- [ ] Upload QR code → verify file appears in Storage bucket
- [ ] Upload profile picture → verify file appears in Storage bucket
- [ ] Check public URL works (open in browser)
- [ ] Update student with new images → old images deleted from bucket
- [ ] Delete student → images removed from bucket
- [ ] Test image display in student dashboard
- [ ] Test QR code scanning with uploaded image
- [ ] Verify parent portal shows profile pictures correctly

---

## Bucket Structure

```
student-images/
├── qr-codes/
│   ├── student-2025001-qr.png
│   ├── student-2025002-qr.png
│   └── ...
└── profile-pictures/
    ├── student-2025001-profile.png
    ├── student-2025002-profile.jpg
    └── ...
```

---

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Cause:** Storage policies not set up correctly
- **Solution:** Apply all 4 policies from Step 2

### Error: "Failed to upload: 413 Payload Too Large"
- **Cause:** File size exceeds 5MB limit
- **Solution:** Compress image before upload or increase bucket limit

### Image URL returns 404
- **Cause:** File not uploaded or wrong bucket name
- **Solution:** Check Storage dashboard, verify file exists

### Old base64 images not showing
- **Cause:** Backward compatibility not implemented
- **Solution:** Use fallback: `student.qr_code_url || student.qr_code`

---

## Security Best Practices

1. **Never store sensitive data in public buckets**
   - Student images are OK (already public on ID cards)
   - Don't store medical records, addresses, etc.

2. **Validate file types on upload**
   - Only allow: image/png, image/jpeg, image/jpg
   - Block: executables, scripts, etc.

3. **Limit file sizes**
   - Prevent abuse by setting max 5MB per file

4. **Use authenticated uploads only**
   - Only logged-in admins can upload
   - Public can only view

5. **Clean up orphaned files**
   - When deleting student, delete their images too
   - Prevent storage bloat

---

## Migration Plan (Optional)

To migrate existing base64 images to Storage:

```javascript
async function migrateImagesToStorage() {
    const { data: students } = await supabaseClient
        .from('students')
        .select('*')
        .not('qr_code', 'is', null);
    
    for (const student of students) {
        try {
            // Convert base64 to blob
            const base64 = student.qr_code.split(',')[1];
            const blob = b64toBlob(base64, 'image/png');
            const file = new File([blob], `student-${student.student_number}-qr.png`, { type: 'image/png' });
            
            // Upload to storage
            const url = await uploadImageToStorage(file, 'qr-codes', file.name);
            
            // Update database
            await supabaseClient
                .from('students')
                .update({ qr_code_url: url })
                .eq('id', student.id);
            
            console.log(`Migrated QR for ${student.student_number}`);
        } catch (error) {
            console.error(`Failed to migrate ${student.student_number}:`, error);
        }
    }
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
}
```

---

## Summary

**Before (Current):**
```javascript
studentData = {
    qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." // Huge string
};
```

**After (With Storage):**
```javascript
studentData = {
    qr_code_url: "https://ddblgwzylvwuucnpmtzi.supabase.co/storage/v1/object/public/student-images/qr-codes/student-2025001-qr.png"
};
```

**Benefits:**
- ✅ Faster database queries
- ✅ Smaller database size
- ✅ CDN-optimized image delivery
- ✅ Easier to manage files
- ✅ Better scalability

---

**Last Updated:** December 2025  
**Version:** 1.0  
**Status:** Ready for Implementation
