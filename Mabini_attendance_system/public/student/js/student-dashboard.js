// =====================================================
// STUDENT DASHBOARD - Supabase Data Integration
// =====================================================

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';
import { attendanceClient } from '../../js/attendance-client.js';
import { protectPage, setupAutoLogout } from '../../js/session-guard.js';

let currentStudent = null;

// Initialize the dashboard
async function initDashboard() {
    try {
        // Check if student is logged in via session
        const studentData = sessionStorage.getItem('studentData');
        const userRole = sessionStorage.getItem('userRole');
        
        if (!studentData || userRole !== 'student') {
            window.location.href = 'login.html';
            return;
        }
        
        const student = JSON.parse(studentData);
        
        // Verify student still exists and is active
        const studentResult = await dataClient.getAll('students', [
            { field: 'id', operator: '==', value: student.id }
        ]);
        
        const currentStudentData = studentResult.data && studentResult.data.length > 0 
            ? studentResult.data[0] : null;
        
        if (!currentStudentData || currentStudentData.status !== 'active') {
            sessionStorage.removeItem('studentData');
            sessionStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return;
        }
        
        currentStudent = currentStudentData;
        
        // Update profile
        await updateProfile(currentStudent);

        // Load student data
        if (currentStudent) {
            await loadStudentData();
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        sessionStorage.removeItem('studentData');
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
}

// Update profile information
async function updateProfile(student) {
    try {
        if (student) {
            currentStudent = student;
            
            // Update name and email
            const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
            const studentNameEl = document.getElementById('studentName');
            if (studentNameEl) studentNameEl.textContent = fullName;
            
            // Update student info
            const studentIdEl = document.getElementById('studentId');
            if (studentIdEl) studentIdEl.textContent = `Student ID: ${student.student_number || 'N/A'}`;
            
            // Update grade level, section, strand
            const gradeLevelEl = document.getElementById('gradeLevel');
            if (gradeLevelEl) gradeLevelEl.textContent = student.grade_level || 'Not assigned';
            
            const sectionEl = document.getElementById('section');
            if (sectionEl) sectionEl.textContent = student.section || 'Not assigned';
            
            const strandEl = document.getElementById('strand');
            if (strandEl) strandEl.textContent = student.strand || 'N/A';
            
            // Update contact info
            const contactPhoneEl = document.getElementById('contactPhone');
            if (contactPhoneEl) contactPhoneEl.textContent = student.contact_number || '09xxxxxxxx';
            
            const contactEmailEl = document.getElementById('contactEmail');
            if (contactEmailEl) contactEmailEl.textContent = student.contact_email || student.email || '';
            
            const contactAddressEl = document.getElementById('contactAddress');
            if (contactAddressEl) contactAddressEl.textContent = student.address || 'Not provided';
            
            // Update personal info
            const studentSexEl = document.getElementById('studentSex');
            if (studentSexEl) studentSexEl.textContent = student.sex || student.gender || 'Not specified';
            
            const studentNationalityEl = document.getElementById('studentNationality');
            if (studentNationalityEl) studentNationalityEl.textContent = student.nationality || 'Not specified';
            
            const studentBirthDateEl = document.getElementById('studentBirthDate');
            if (studentBirthDateEl && (student.birth_date || student.date_of_birth)) {
                const birthDate = new Date(student.birth_date || student.date_of_birth);
                studentBirthDateEl.textContent = birthDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
            
            const studentBirthPlaceEl = document.getElementById('studentBirthPlace');
            if (studentBirthPlaceEl) studentBirthPlaceEl.textContent = student.birth_place || student.place_of_birth || 'Not provided';
            
            // Set profile initials
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const profileInitialsEl = document.getElementById('profileInitials');
            if (profileInitialsEl) profileInitialsEl.textContent = initials || 'ST';

            // Show profile photo if available
            const photoEl = document.getElementById('profilePhoto');
            const initialsEl = document.getElementById('profileInitials');
            if (student.profile_photo && photoEl && initialsEl) {
                photoEl.src = student.profile_photo;
                photoEl.style.display = 'block';
                initialsEl.style.display = 'none';
            }
            
            // Update QR code if available
            const qrImg = document.querySelector('.qr-img');
            if (qrImg && student.qr_code) {
                qrImg.src = student.qr_code;
            }
        } else {
            // No student found - might be admin or teacher
            const studentNameEl = document.getElementById('studentName');
            if (studentNameEl) studentNameEl.textContent = user.email.split('@')[0];
            
            const studentIdEl = document.getElementById('studentId');
            if (studentIdEl) studentIdEl.textContent = `Email: ${user.email}`;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load student data
async function loadStudentData() {
    try {
        if (!currentStudent) return;
        
        // Load attendance statistics
        await loadAttendanceStats(currentStudent.id);
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// Load attendance statistics
async function loadAttendanceStats(studentId) {
    try {
        // Get attendance stats
        const stats = await attendanceClient.getAttendanceStats(studentId);
        
        const daysPresentEl = document.getElementById('daysPresent');
        if (daysPresentEl) daysPresentEl.textContent = stats.totalPresent || 0;

        const totalDaysEl = document.getElementById('totalDays');
        if (totalDaysEl) totalDaysEl.textContent = stats.totalDays || 0;

        const daysAbsentEl = document.getElementById('daysAbsent');
        if (daysAbsentEl) daysAbsentEl.textContent = stats.totalAbsent || 0;

        const attendanceRateEl = document.getElementById('attendanceRate');
        if (attendanceRateEl) {
            attendanceRateEl.textContent = (stats.attendanceRate || 0).toFixed(1) + '%';
        }

        // Load attendance records for table
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        
        const records = await attendanceClient.getAttendanceRange(
            studentId, 
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
        
        loadAttendanceTable(records);
    } catch (error) {
        console.error('Error loading attendance stats:', error);
        // Set defaults
        const daysPresentEl = document.getElementById('daysPresent');
        if (daysPresentEl) daysPresentEl.textContent = '0';
        
        const totalDaysEl = document.getElementById('totalDays');
        if (totalDaysEl) totalDaysEl.textContent = '0';
        
        const daysAbsentEl = document.getElementById('daysAbsent');
        if (daysAbsentEl) daysAbsentEl.textContent = '0';
        
        const attendanceRateEl = document.getElementById('attendanceRate');
        if (attendanceRateEl) attendanceRateEl.textContent = '0%';
    }
}

// Load attendance table
function loadAttendanceTable(records) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No attendance records found</td></tr>';
        return;
    }

    // Take recent 15 records
    const recentRecords = records.slice(-15).reverse();

    tbody.innerHTML = recentRecords.map(record => {
        const date = new Date(record.date).toLocaleDateString();
        const timeIn = record.time_in ? formatTime(record.time_in) : '-';
        const timeOut = record.time_out ? formatTime(record.time_out) : '-';
        
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
                <td>${timeIn}</td>
                <td>${timeOut}</td>
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
        sessionStorage.removeItem('studentData');
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
};

// Initialize dashboard when DOM is ready
initDashboard();
