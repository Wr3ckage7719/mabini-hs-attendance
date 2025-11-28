// =====================================================
// TEACHER DASHBOARD - Supabase Data Integration
// =====================================================

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';
import { attendanceClient } from '../../js/attendance-client.js';
import { protectPage, setupAutoLogout } from '../../js/session-guard.js';

let currentTeacher = null;

// Initialize the dashboard
async function initDashboard() {
    try {
        // Check if teacher is logged in via session
        const teacherData = sessionStorage.getItem('teacherData');
        const userRole = sessionStorage.getItem('userRole');
        
        if (!teacherData || userRole !== 'teacher') {
            window.location.href = 'login.html';
            return;
        }
        
        const teacher = JSON.parse(teacherData);
        
        // Verify teacher still exists and is active
        const teacherResult = await dataClient.getAll('teachers', [
            { field: 'id', operator: '==', value: teacher.id }
        ]);
        
        const currentTeacherData = teacherResult.data && teacherResult.data.length > 0 
            ? teacherResult.data[0] : null;
        
        if (!currentTeacherData || currentTeacherData.status !== 'active') {
            sessionStorage.removeItem('teacherData');
            sessionStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return;
        }
        
        currentTeacher = currentTeacherData;
        
        // Update profile
        await updateProfile(currentTeacher);

        // Load statistics
        await loadStats();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        sessionStorage.removeItem('teacherData');
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
}

// Update profile information
async function updateProfile(teacher) {
    try {
        if (teacher) {
            currentTeacher = teacher;
            
            // Update name and email
            const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Teacher';
            const teacherNameEl = document.getElementById('teacherName');
            if (teacherNameEl) teacherNameEl.textContent = fullName;
            
            const teacherEmailEl = document.getElementById('teacherEmail');
            if (teacherEmailEl) teacherEmailEl.textContent = teacher.email || '';
            
            // Update professional info
            const departmentEl = document.getElementById('department');
            if (departmentEl) departmentEl.textContent = teacher.department || 'General';
            
            const positionEl = document.getElementById('position');
            if (positionEl) positionEl.textContent = teacher.position || 'Professor';
            
            // Calculate years of service
            if (teacher.created_at) {
                const createdYear = new Date(teacher.created_at).getFullYear();
                const currentYear = new Date().getFullYear();
                const years = currentYear - createdYear;
                const yearsOfServiceEl = document.getElementById('yearsOfService');
                if (yearsOfServiceEl) yearsOfServiceEl.textContent = years > 0 ? years : '0';
            }
            
            // Update contact info
            const contactPhoneEl = document.getElementById('contactPhone');
            if (contactPhoneEl) contactPhoneEl.textContent = teacher.contact_number || '09xxxxxxxx';
            
            const contactEmailEl = document.getElementById('contactEmail');
            if (contactEmailEl) contactEmailEl.textContent = teacher.contact_email || teacher.email || '';
            
            const contactAddressEl = document.getElementById('contactAddress');
            if (contactAddressEl) contactAddressEl.textContent = teacher.address || 'Not provided';
            
            // Update personal info
            const teacherSexEl = document.getElementById('teacherSex');
            if (teacherSexEl) teacherSexEl.textContent = teacher.sex || 'Not specified';
            
            const teacherNationalityEl = document.getElementById('teacherNationality');
            if (teacherNationalityEl) teacherNationalityEl.textContent = teacher.nationality || 'Not specified';
            
            if (teacher.birth_date) {
                const birthDate = new Date(teacher.birth_date);
                const teacherBirthDateEl = document.getElementById('teacherBirthDate');
                if (teacherBirthDateEl) {
                    teacherBirthDateEl.textContent = birthDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                }
            }
            
            const teacherBirthPlaceEl = document.getElementById('teacherBirthPlace');
            if (teacherBirthPlaceEl) teacherBirthPlaceEl.textContent = teacher.birth_place || 'Not provided';
            
            // Set profile initials
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const profileInitialsEl = document.getElementById('profileInitials');
            if (profileInitialsEl) profileInitialsEl.textContent = initials;

            // Show profile photo if available
            const photoEl = document.getElementById('profilePhoto');
            const initialsEl = document.getElementById('profileInitials');
            if (teacher.profile_photo && photoEl && initialsEl) {
                photoEl.src = teacher.profile_photo;
                photoEl.style.display = 'block';
                initialsEl.style.display = 'none';
            }
        } else {
            // Fallback - might be admin viewing
            const teacherNameEl = document.getElementById('teacherName');
            if (teacherNameEl) teacherNameEl.textContent = user.email.split('@')[0];
            
            const teacherEmailEl = document.getElementById('teacherEmail');
            if (teacherEmailEl) teacherEmailEl.textContent = user.email;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        // Get all students
        const studentsResult = await dataClient.getAll('students');
        const students = studentsResult.data || studentsResult || [];
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) totalStudentsEl.textContent = students.length;

        // Get active sections
        const sectionsResult = await dataClient.getAll('sections');
        const allSections = sectionsResult.data || sectionsResult || [];
        const activeSections = allSections.filter(s => s.status === 'active' || !s.status);
        const activeClassesEl = document.getElementById('activeClasses');
        if (activeClassesEl) activeClassesEl.textContent = activeSections.length;

        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00').toISOString();
        const todayEnd = new Date(today + 'T23:59:59').toISOString();
        
        const attendanceResult = await dataClient.query('attendance', {
            filter: {
                date: today,
                status: { in: ['present', 'late'] }
            }
        });
        const todayAttendance = attendanceResult.data || attendanceResult || [];

        const presentToday = todayAttendance.length;
        const todayPresentEl = document.getElementById('todayPresent');
        if (todayPresentEl) todayPresentEl.textContent = presentToday;

        // Calculate average attendance rate
        const rate = students.length > 0 ? ((presentToday / students.length) * 100).toFixed(1) : 0;
        const avgAttendanceEl = document.getElementById('avgAttendance');
        if (avgAttendanceEl) avgAttendanceEl.textContent = rate + '%';

        // Load classes table if teacher has assigned sections
        if (currentTeacher) {
            await loadClassesTable(activeSections, students);
        }

        // Load recent attendance
        await loadRecentAttendance(todayAttendance, students);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load classes table
async function loadClassesTable(sections, students) {
    const tbody = document.querySelector('.class-details-table tbody');
    
    if (!tbody) return;

    // Filter sections assigned to this teacher (if applicable)
    let teacherSections = sections;
    if (currentTeacher) {
        const teachingLoads = await dataClient.query('teaching_loads', {
            filter: { teacher_id: currentTeacher.id }
        });
        const assignedSectionIds = teachingLoads.map(tl => tl.section_id);
        teacherSections = sections.filter(s => assignedSectionIds.includes(s.id));
    }

    if (teacherSections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No classes assigned</td></tr>';
        return;
    }

    tbody.innerHTML = teacherSections.map(section => {
        // Count students in this section
        const sectionStudents = students.filter(s => 
            s.grade_level === section.grade_level && s.section === section.section_name
        );
        
        return `
            <tr>
                <td>${section.section_code || '-'}</td>
                <td>${section.section_name || 'Unnamed Section'}</td>
                <td>${section.schedule || '-'}</td>
                <td>${section.room || '-'}</td>
                <td>${sectionStudents.length}</td>
            </tr>
        `;
    }).join('');
}

// Load recent attendance
async function loadRecentAttendance(attendanceRecords, students) {
    const tbody = document.querySelector('.attendance-history-table tbody');
    
    if (!tbody) return;

    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No attendance records for today</td></tr>';
        return;
    }

    // Get student details
    const studentMap = {};
    students.forEach(s => {
        studentMap[s.id] = `${s.first_name} ${s.last_name}`;
    });

    // Get recent 10 records
    const recentRecords = attendanceRecords.slice(-10).reverse();

    tbody.innerHTML = recentRecords.map(record => {
        const studentName = studentMap[record.student_id] || 'Unknown Student';
        const date = new Date(record.date).toLocaleDateString();
        const timeIn = record.time_in ? formatTime(record.time_in) : '-';
        
        let statusBadge = '';
        switch(record.status) {
            case 'present':
                statusBadge = '<span class="badge bg-success">Present</span>';
                break;
            case 'late':
                statusBadge = '<span class="badge bg-warning">Late</span>';
                break;
            case 'absent':
                statusBadge = '<span class="badge bg-danger">Absent</span>';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Unknown</span>';
        }

        return `
            <tr>
                <td>${date}</td>
                <td>${studentName}</td>
                <td>${timeIn}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// Format time from HH:MM:SS to readable format
function formatTime(timeString) {
    if (!timeString) return '-';
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return timeString;
    }
}

// Logout function
window.doLogout = async function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('teacherData');
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
};

// Initialize dashboard when DOM is ready
initDashboard();
