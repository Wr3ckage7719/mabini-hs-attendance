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
        
        const students = studentResult.data || studentResult || [];\n        const currentStudentData = students.length > 0 ? students[0] : null;
        
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
        // Define date range - current school year or last 6 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Get attendance records from entrance_logs
        const logsResult = await attendanceClient.getAttendanceRange(
            studentId, 
            startDateStr,
            endDateStr
        );
        
        const logs = logsResult.data || logsResult || [];
        
        // Calculate statistics from entrance logs
        const uniqueDates = new Set();
        logs.forEach(log => {
            if (log.scan_time) {
                const date = log.scan_time.split('T')[0];
                uniqueDates.add(date);
            }
        });
        
        const daysPresent = uniqueDates.size;
        
        // Get total school days (approximate based on weekdays in range)
        const totalDays = calculateSchoolDays(startDate, endDate);
        const daysAbsent = Math.max(0, totalDays - daysPresent);
        const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
        
        // Update UI
        const daysPresentEl = document.getElementById('daysPresent');
        if (daysPresentEl) daysPresentEl.textContent = daysPresent;

        const totalDaysEl = document.getElementById('totalDays');
        if (totalDaysEl) totalDaysEl.textContent = totalDays;

        const daysAbsentEl = document.getElementById('daysAbsent');
        if (daysAbsentEl) daysAbsentEl.textContent = daysAbsent;

        const attendanceRateEl = document.getElementById('attendanceRate');
        if (attendanceRateEl) {
            attendanceRateEl.textContent = attendanceRate.toFixed(1) + '%';
        }

        // Load attendance records for table
        loadAttendanceTable(logs);
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

// Calculate school days (weekdays) between two dates
function calculateSchoolDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        // Count Monday (1) to Friday (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}

// Load attendance table
function loadAttendanceTable(logs) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No attendance records found</td></tr>';
        return;
    }

    // Group logs by date and get first entry per day
    const logsByDate = {};
    logs.forEach(log => {
        if (log.scan_time) {
            const date = log.scan_time.split('T')[0];
            if (!logsByDate[date] || log.scan_time < logsByDate[date].scan_time) {
                logsByDate[date] = log;
            }
        }
    });
    
    // Convert to array and sort by date descending
    const sortedLogs = Object.values(logsByDate)
        .sort((a, b) => new Date(b.scan_time) - new Date(a.scan_time))
        .slice(0, 15); // Take recent 15 records

    tbody.innerHTML = sortedLogs.map(log => {
        const scanDate = new Date(log.scan_time);
        const date = scanDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeIn = scanDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const timeOut = '-'; // Entrance logs don't track exit
        
        // Determine status based on time (before 8 AM = on time, after = late)
        const hour = scanDate.getHours();
        const status = hour < 8 ? 'present' : 'late';
        
        let statusBadge = '';
        switch(status) {
            case 'present':
                statusBadge = '<span class="badge bg-success">Present</span>';
                break;
            case 'late':
                statusBadge = '<span class="badge bg-warning">Late</span>';
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

// Initialize dashboard when DOM is ready
initDashboard();
