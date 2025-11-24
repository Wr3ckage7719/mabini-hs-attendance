# Frontend Adaptation Guide

Complete guide for updating all frontend pages to work with the new database schema.

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Schema Changes Summary](#2-schema-changes-summary)
3. [Code Pattern Changes](#3-code-pattern-changes)
4. [Files to Update](#4-files-to-update)
5. [Phase-by-Phase Implementation](#5-phase-by-phase-implementation)
6. [Testing Checklist](#6-testing-checklist)
7. [Common Issues](#7-common-issues)

---

## 1. Overview

### What This Guide Covers

After running the database migration, you need to update **~35 frontend files** to work with the new schema. This guide provides:

✅ Complete list of schema changes
✅ Before/after code examples
✅ File-by-file update instructions
✅ Phase-by-phase implementation plan
✅ Testing checklist for each phase

### Time Estimate

- **Total:** 30-40 hours (4-5 days)
- **Phase 1:** 2-3 hours (Core clients)
- **Phase 2:** 8-10 hours (Admin pages)
- **Phase 3:** 6-8 hours (Teacher pages)
- **Phase 4:** 4-6 hours (Student pages)
- **Phase 5:** 4-6 hours (Backend + testing)
- **Phase 6:** 6-8 hours (Final testing)

### Prerequisites

- ✅ Database migration completed (MASTER_DATABASE_RESET.sql executed)
- ✅ Verification passed (VERIFY_DATABASE_SETUP.sql shows all ✅)
- ✅ Admin login works
- ✅ Backup of current frontend files

---

## 2. Schema Changes Summary

### Major Changes

#### Change 1: Section String → Section ID (FK)

**Before:**
```javascript
const student = {
    section: "Grade 7-A"  // String
};
```

**After:**
```javascript
const student = {
    section_id: "uuid-here"  // Foreign key to sections table
};

// Need to join with sections to get name
const { data } = await supabase
    .from('students')
    .select(`
        *,
        section:sections(section_code, section_name)
    `)
    .eq('id', studentId);
```

#### Change 2: school_year → academic_year

**Before:**
```javascript
const teachingLoad = {
    school_year: "2024-2025"
};
```

**After:**
```javascript
const teachingLoad = {
    academic_year: "2024-2025",  // Renamed field
    semester: 1  // New required field
};
```

#### Change 3: Separate Authentication Tables

**Before:**
```javascript
// All users in one table
const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', 'student');
```

**After:**
```javascript
// Students in separate table
const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('student_number', studentNumber)
    .eq('status', 'active')
    .single();

// Teachers in separate table
const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('employee_number', employeeNumber)
    .eq('status', 'active')
    .single();
```

#### Change 4: New Required Fields

**Students:**
- `lrn` - Learner Reference Number
- `middle_name` - Middle name
- `section_id` - FK instead of string
- `parent_guardian_name` - Parent/guardian name
- `parent_guardian_contact` - Contact number
- `parent_guardian_email` - Parent email

**Teachers:**
- `employee_number` - Unique identifier
- `middle_name` - Middle name
- `suffix` - Name suffix (Jr., Sr., etc.)
- `specialization` - Teaching specialization
- `employment_status` - Employment type
- `hire_date` - Date hired

**Sections:**
- `section_code` - Unique code (e.g., "GR7-A")
- `section_name` - Full name
- `adviser_id` - FK to teachers
- `capacity` - Max students
- `academic_year` - Year
- `semester` - Semester number

**Teaching Loads:**
- `academic_year` - Renamed from school_year
- `semester` - Semester number
- `day_of_week` - Day of week
- `start_time` - Class start time
- `end_time` - Class end time

---

## 3. Code Pattern Changes

### Pattern 1: Student CRUD Operations

#### OLD CODE (Delete This):
```javascript
// Create student
const newStudent = {
    student_number: '2024001',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    email: 'juan@example.com',
    section: 'Grade 7-A',  // ❌ String
    status: 'active'
};
```

#### NEW CODE (Use This):
```javascript
// Create student
const newStudent = {
    student_number: '2024001',
    first_name: 'Juan',
    middle_name: 'Santos',  // ✅ New field
    last_name: 'Dela Cruz',
    email: 'juan@example.com',
    lrn: 'LRN-123456789012',  // ✅ New field
    section_id: selectedSectionId,  // ✅ FK instead of string
    parent_guardian_name: 'Maria Dela Cruz',  // ✅ New field
    parent_guardian_contact: '09123456789',  // ✅ New field
    parent_guardian_email: 'parent@example.com',  // ✅ New field
    status: 'active'
};

// When displaying, join with sections
const { data: students } = await supabase
    .from('students')
    .select(`
        *,
        section:sections(section_code, section_name)
    `);

// Display: students[0].section.section_name
```

### Pattern 2: Teacher CRUD Operations

#### OLD CODE (Delete This):
```javascript
// Create teacher
const newTeacher = {
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria@mabinihs.edu.ph',
    department: 'Mathematics',
    status: 'active'
};
```

#### NEW CODE (Use This):
```javascript
// Create teacher
const newTeacher = {
    employee_number: 'EMP-2024001',  // ✅ New required field
    first_name: 'Maria',
    middle_name: 'Santos',  // ✅ New field
    last_name: 'Garcia',
    suffix: null,  // ✅ New field (optional)
    email: 'maria@mabinihs.edu.ph',
    department: 'Mathematics',
    specialization: 'Algebra',  // ✅ New field
    employment_status: 'full-time',  // ✅ New field
    hire_date: '2024-06-01',  // ✅ New field
    status: 'active'
};
```

### Pattern 3: Section Management

#### OLD CODE (Delete This):
```javascript
// Create section
const newSection = {
    name: 'Grade 7 - Section A',  // ❌ Just name
    grade_level: 7,
    status: 'active'
};
```

#### NEW CODE (Use This):
```javascript
// Create section
const newSection = {
    section_code: 'GR7-A',  // ✅ New unique code
    section_name: 'Grade 7 - Section A',  // ✅ Renamed from 'name'
    grade_level: 7,
    adviser_id: selectedTeacherId,  // ✅ New FK to teachers
    capacity: 40,  // ✅ New field
    current_enrollment: 0,  // ✅ Auto-managed
    academic_year: '2024-2025',  // ✅ New field
    semester: 1,  // ✅ New field
    status: 'active'
};
```

### Pattern 4: Teaching Load Management

#### OLD CODE (Delete This):
```javascript
// Create teaching load
const newLoad = {
    teacher_id: teacherId,
    subject_id: subjectId,
    section_id: sectionId,
    school_year: '2024-2025',  // ❌ Old field name
    status: 'active'
};
```

#### NEW CODE (Use This):
```javascript
// Create teaching load
const newLoad = {
    teacher_id: teacherId,
    subject_id: subjectId,
    section_id: sectionId,
    academic_year: '2024-2025',  // ✅ Renamed
    semester: 1,  // ✅ New required field
    day_of_week: 'Monday',  // ✅ New field
    start_time: '08:00:00',  // ✅ New field
    end_time: '09:00:00',  // ✅ New field
    status: 'active'
};
```

### Pattern 5: Student Login

#### OLD CODE (Delete This):
```javascript
// Student login via users table
async function loginStudent(email, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'student')  // ❌ No longer in users table
        .single();
    
    if (data && data.password === password) {
        return { success: true, user: data };
    }
    return { success: false };
}
```

#### NEW CODE (Use This):
```javascript
// Student login via students table
async function loginStudent(studentNumber, password) {
    const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_number', studentNumber)  // ✅ Use student_number
        .eq('status', 'active')
        .single();
    
    if (error || !student) {
        return { success: false, message: 'Student not found' };
    }
    
    if (student.password === password) {
        return { success: true, user: student };
    }
    return { success: false, message: 'Invalid password' };
}
```

### Pattern 6: Teacher Login

#### OLD CODE (Delete This):
```javascript
// Teacher login via users table
async function loginTeacher(email, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'teacher')  // ❌ No longer in users table
        .single();
    
    if (data && data.password === password) {
        return { success: true, user: data };
    }
    return { success: false };
}
```

#### NEW CODE (Use This):
```javascript
// Teacher login via teachers table
async function loginTeacher(employeeNumber, password) {
    const { data: teacher, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('employee_number', employeeNumber)  // ✅ Use employee_number
        .eq('status', 'active')
        .single();
    
    if (error || !teacher) {
        return { success: false, message: 'Teacher not found' };
    }
    
    if (teacher.password === password) {
        return { success: true, user: teacher };
    }
    return { success: false, message: 'Invalid password' };
}
```

---

## 4. Files to Update

### Complete File List (~35 files)

#### Priority 1: Core Infrastructure (3 files)

**Must update FIRST - everything depends on these:**

1. **`public/js/auth-client.js`**
   - Add `loginTeacher(employeeNumber, password)`
   - Add `loginStudent(studentNumber, password)`
   - Update `loginAdmin(email, password)` if needed
   - Add `getCurrentUser()` for each user type

2. **`public/js/data-client.js`**
   - Add `enrollStudent(studentId, sectionId, academicYear)`
   - Add `getStudentWithSection(studentId)`
   - Add `getTeacherWithLoads(teacherId)`
   - Add `getSectionWithStudents(sectionId)`
   - Update all query methods for new schema

3. **`public/shared/js/db-helpers.js`**
   - Update any hardcoded table/column references
   - Update query builders for new schema
   - Add helper for section lookups

---

#### Priority 2: Admin Pages - HTML (6 files)

4. **`public/admin/students.html`**
   - Add LRN input field
   - Add middle_name input field
   - Change section dropdown to use section_id (FK)
   - Add parent_guardian_name input
   - Add parent_guardian_contact input
   - Add parent_guardian_email input

5. **`public/admin/teachers.html`**
   - Add employee_number field (auto-generate button)
   - Add middle_name input
   - Add suffix input
   - Add specialization input
   - Add employment_status dropdown
   - Add hire_date date picker

6. **`public/admin/sections.html`**
   - Add section_code field (auto-generate)
   - Rename "name" to "section_name"
   - Add adviser_id dropdown (teachers)
   - Add capacity input (default 40)
   - Add academic_year input
   - Add semester dropdown

7. **`public/admin/teaching-loads.html`**
   - Change school_year → academic_year
   - Add semester dropdown
   - Add day_of_week dropdown
   - Add start_time time picker
   - Add end_time time picker

8. **`public/admin/users.html`**
   - Remove 'teacher' from role dropdown
   - Remove 'student' from role dropdown
   - Keep only 'admin' and 'staff'

9. **`public/admin/subjects.html`**
   - Verify existing fields work
   - No major changes needed

---

#### Priority 2: Admin Pages - JavaScript (9 files)

10. **`public/admin/js/students.js`** (may need creation)
    - Load sections for dropdown (section_id FK)
    - Update createStudent() with new fields
    - Update editStudent() with new fields
    - Handle section display via join
    - Validate LRN format

11. **`public/admin/js/teachers.js`** (may need creation)
    - Auto-generate employee_number function
    - Update createTeacher() with new fields
    - Update editTeacher() with new fields
    - Handle employment_status

12. **`public/admin/js/sections.js`** (verify exists)
    - Auto-generate section_code function
    - Load teachers for adviser dropdown
    - Update createSection() with new fields
    - Handle capacity validation
    - Update enrollment count

13. **`public/admin/js/teaching-loads.js`**
    - Change school_year → academic_year
    - Add semester handling
    - Add schedule fields (day, start, end)
    - Validate time ranges

14. **`public/admin/js/users.js`**
    - Update role validation (admin/staff only)
    - Remove teacher/student options

15. **`public/admin/js/admin-dashboard.js`**
    - Update student count query (if uses section filter)
    - Update teacher stats
    - Update section enrollment stats

16. **`public/admin/js/admin-login.js`**
    - Verify uses users table
    - Should still work as-is

17. **`public/admin/js/admin-common.js`**
    - Update any shared query functions

18. **`public/admin/js/admin-sidebar.js`**
    - No changes needed

---

#### Priority 3: Teacher Pages - HTML (6 files)

19. **`public/teacher/dashboard.html`**
    - Update section display (join with sections)
    - Update teaching loads display

20. **`public/teacher/sections.html`**
    - Display section_code and section_name
    - Show capacity and enrollment

21. **`public/teacher/students.html`**
    - Join students with sections
    - Display section_name instead of string

22. **`public/teacher/subjects.html`**
    - No major changes needed

23. **`public/teacher/teaching-loads.html`**
    - Display academic_year instead of school_year
    - Show schedule (day, start_time, end_time)

24. **`public/teacher/login.html`**
    - Change from email to employee_number
    - Update form field labels

---

#### Priority 3: Teacher Pages - JavaScript (6 files)

25. **`public/teacher/js/teacher-dashboard.js`**
    - Update queries for academic_year
    - Join sections properly
    - Display schedule information

26. **`public/teacher/js/teacher-login.js`**
    - Use loginTeacher(employeeNumber, password)
    - Update validation

27. **`public/teacher/js/sections.js`**
    - Update section display logic

28. **`public/teacher/js/students.js`**
    - Join with sections table
    - Display section_name

29. **`public/teacher/js/subjects.js`**
    - Verify works with new schema

30. **`public/teacher/js/teaching-loads.js`**
    - Update for academic_year
    - Display schedule

---

#### Priority 4: Student Pages - HTML (3 files)

31. **`public/student/dashboard.html`**
    - Display section via join
    - Show section_name

32. **`public/student/login.html`**
    - Change from email to student_number
    - Update form labels

33. **`public/student/settings.html`**
    - No major changes

---

#### Priority 4: Student Pages - JavaScript (3 files)

34. **`public/student/js/student-dashboard.js`**
    - Join with sections table
    - Display section info

35. **`public/student/js/student-login.js`**
    - Use loginStudent(studentNumber, password)
    - Update validation

36. **`public/student/js/settings.js`**
    - Verify compatibility

---

#### Priority 5: Backend (1 file)

37. **`server/index.js`**
    - Update any hardcoded queries
    - Verify endpoints work with new schema
    - Update validation logic

---

## 5. Phase-by-Phase Implementation

### Phase 1: Core Infrastructure (Day 1 - 2-3 hours)

**Goal:** Update authentication and data access foundations

**Files:**
- `public/js/auth-client.js`
- `public/js/data-client.js`
- `public/shared/js/db-helpers.js`

**Tasks:**
- [ ] Update auth-client.js with separate login methods
- [ ] Add loginTeacher(employeeNumber, password)
- [ ] Add loginStudent(studentNumber, password)
- [ ] Keep loginAdmin(email, password) as-is
- [ ] Update data-client.js with new query methods
- [ ] Add section join helpers
- [ ] Update db-helpers.js references
- [ ] Test all authentication methods
- [ ] Test all query methods

**Testing:**
- [ ] Admin login works
- [ ] Can query all tables
- [ ] No console errors

---

### Phase 2: Admin Pages (Day 2-3 - 8-10 hours)

**Goal:** Update all admin CRUD operations

#### Phase 2A: Students Management
**Files:** `students.html`, `students.js`

**Tasks:**
- [ ] Add LRN field to form
- [ ] Add middle_name field
- [ ] Change section to dropdown (section_id FK)
- [ ] Add parent fields (3 new inputs)
- [ ] Update createStudent() function
- [ ] Update editStudent() function
- [ ] Update deleteStudent() function
- [ ] Update table display (join sections)
- [ ] Test create, edit, delete operations

---

#### Phase 2B: Teachers Management
**Files:** `teachers.html`, `teachers.js`

**Tasks:**
- [ ] Add employee_number with auto-generate
- [ ] Add middle_name, suffix fields
- [ ] Add specialization field
- [ ] Add employment_status dropdown
- [ ] Add hire_date picker
- [ ] Update createTeacher() function
- [ ] Update editTeacher() function
- [ ] Test all operations

---

#### Phase 2C: Sections Management
**Files:** `sections.html`, `sections.js`

**Tasks:**
- [ ] Add section_code with auto-generate
- [ ] Rename name → section_name
- [ ] Add adviser_id dropdown
- [ ] Add capacity, academic_year, semester
- [ ] Update createSection() function
- [ ] Update editSection() function
- [ ] Test all operations

---

#### Phase 2D: Teaching Loads Management
**Files:** `teaching-loads.html`, `teaching-loads.js`

**Tasks:**
- [ ] Change school_year → academic_year
- [ ] Add semester dropdown
- [ ] Add day_of_week dropdown
- [ ] Add start_time, end_time pickers
- [ ] Update create/edit functions
- [ ] Test all operations

---

#### Phase 2E: Users Management
**Files:** `users.html`, `users.js`

**Tasks:**
- [ ] Remove 'teacher' from role options
- [ ] Remove 'student' from role options
- [ ] Update validation logic
- [ ] Test create/edit operations

---

### Phase 3: Teacher Pages (Day 4 - 6-8 hours)

**Goal:** Update teacher dashboard and management pages

**Files:**
- All 6 teacher HTML files
- All 6 teacher JS files

**Tasks:**
- [ ] Update teacher login (employee_number)
- [ ] Update dashboard queries (academic_year)
- [ ] Update sections display (join properly)
- [ ] Update students list (join sections)
- [ ] Update teaching loads (show schedule)
- [ ] Test all teacher pages
- [ ] Test teacher workflows

**Testing:**
- [ ] Teacher can login with employee_number
- [ ] Dashboard displays correctly
- [ ] All pages load without errors
- [ ] Teaching loads show schedule

---

### Phase 4: Student Pages (Day 5 - 4-6 hours)

**Goal:** Update student dashboard and login

**Files:**
- All 3 student HTML files
- All 3 student JS files

**Tasks:**
- [ ] Update student login (student_number)
- [ ] Update dashboard (join sections)
- [ ] Update settings page
- [ ] Test all student pages
- [ ] Test student workflows

**Testing:**
- [ ] Student can login with student_number
- [ ] Dashboard shows section correctly
- [ ] All pages load without errors

---

### Phase 5: Backend & Testing (Day 6-7 - 4-6 hours)

**Goal:** Update backend and comprehensive testing

**Files:**
- `server/index.js`

**Tasks:**
- [ ] Review all API endpoints
- [ ] Update any hardcoded queries
- [ ] Update validation logic
- [ ] Test all endpoints
- [ ] Run full system test

**Testing:**
- [ ] All endpoints return correct data
- [ ] No errors in server logs
- [ ] RLS policies work correctly

---

## 6. Testing Checklist

### After Phase 1: Core Infrastructure
- [ ] Admin login works
- [ ] Can query students table
- [ ] Can query teachers table
- [ ] Can query sections table
- [ ] No console errors

### After Phase 2: Admin Pages
- [ ] Can create student with all new fields
- [ ] Can edit student
- [ ] Can delete student
- [ ] Can create teacher with employee_number
- [ ] Can edit teacher
- [ ] Can create section with section_code
- [ ] Can assign adviser to section
- [ ] Can create teaching load with academic_year
- [ ] Can create admin user
- [ ] Cannot create teacher user (removed)
- [ ] Cannot create student user (removed)

### After Phase 3: Teacher Pages
- [ ] Teacher can login with employee_number
- [ ] Teacher dashboard displays
- [ ] Teaching loads show schedule
- [ ] Can view assigned sections
- [ ] Can view students in sections
- [ ] All navigation works

### After Phase 4: Student Pages
- [ ] Student can login with student_number
- [ ] Student dashboard displays
- [ ] Section name displays correctly
- [ ] Can view attendance
- [ ] All navigation works

### After Phase 5: Backend
- [ ] All API endpoints work
- [ ] No server errors
- [ ] RLS policies enforced
- [ ] Data integrity maintained

### Final System Test
- [ ] Admin login → dashboard → all CRUD pages
- [ ] Teacher login → dashboard → all pages
- [ ] Student login → dashboard → all pages
- [ ] Create student → assign section → view in teacher page
- [ ] Create teacher → assign teaching load → view schedule
- [ ] Create section → assign students → view enrollment
- [ ] No console errors anywhere
- [ ] No RLS violations
- [ ] All joins work correctly
- [ ] All foreign keys valid

---

## 7. Common Issues

### Issue 1: Section Not Displaying

**Problem:** Student section shows as UUID instead of name
**Cause:** Not joining with sections table
**Solution:**
```javascript
// Wrong
const { data } = await supabase
    .from('students')
    .select('*');
console.log(data[0].section_id); // Shows UUID

// Correct
const { data } = await supabase
    .from('students')
    .select(`
        *,
        section:sections(section_code, section_name)
    `);
console.log(data[0].section.section_name); // Shows "Grade 7 - Section A"
```

### Issue 2: Teacher/Student Login Fails

**Problem:** Login returns no user
**Cause:** Using old users table or wrong identifier
**Solution:**
```javascript
// Wrong - old method
loginStudent(email, password)

// Correct - new method
loginStudent(studentNumber, password)
loginTeacher(employeeNumber, password)
```

### Issue 3: Teaching Load Create Fails

**Problem:** "school_year column doesn't exist"
**Cause:** Field renamed to academic_year
**Solution:**
```javascript
// Wrong
const load = { school_year: '2024-2025' };

// Correct
const load = { 
    academic_year: '2024-2025',
    semester: 1
};
```

### Issue 4: Cannot Create User with Teacher Role

**Problem:** Constraint violation when creating teacher user
**Cause:** Users table now only allows admin/staff
**Solution:**
- Create teacher in `teachers` table, not `users` table
- Admin creates teachers via admin/teachers.html page
- Teachers login via teacher/login.html with employee_number

### Issue 5: RLS Policy Blocks Operation

**Problem:** "new row violates row-level security policy"
**Cause:** Frontend using anon key, which has limited access
**Solution:**
- Use backend API (service_role) for write operations
- Or create appropriate RLS policy
- Verify user is authenticated

### Issue 6: Foreign Key Constraint Error

**Problem:** "violates foreign key constraint"
**Cause:** Trying to assign invalid section_id or adviser_id
**Solution:**
```javascript
// Load valid sections first
const { data: sections } = await supabase
    .from('sections')
    .select('id, section_name')
    .eq('status', 'active');

// Then use valid ID
const student = {
    section_id: sections[0].id  // Valid FK
};
```

### Issue 7: Employee Number Not Unique

**Problem:** "duplicate key value violates unique constraint"
**Cause:** Trying to create teacher with existing employee_number
**Solution:**
```javascript
// Auto-generate unique employee number
async function generateEmployeeNumber() {
    const { data } = await supabase
        .from('teachers')
        .select('employee_number')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (!data || data.length === 0) {
        return 'EMP-2024001';
    }
    
    const lastNumber = parseInt(data[0].employee_number.split('-')[1]);
    return `EMP-${(lastNumber + 1).toString().padStart(7, '0')}`;
}
```

---

## 🎉 Adaptation Complete!

When all phases are done and all tests pass:

✅ All pages work with new database
✅ Authentication functional for all user types
✅ CRUD operations working correctly
✅ Foreign keys properly handled
✅ Joins displaying correct data
✅ No console errors
✅ No RLS violations
✅ System fully functional

**You're done!** System is ready for production use.

---

**Last Updated:** November 24, 2025
**Version:** 1.0
**Status:** Production Ready
