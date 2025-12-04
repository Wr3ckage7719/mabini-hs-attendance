// =====================================================
// STUDENT DASHBOARD - Supabase Data Integration
// =====================================================

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';
import { attendanceClient } from '../../js/attendance-client.js';
import { protectPage, setupAutoLogout } from '../../js/session-guard.js';
import { storageClient } from '../../js/storage-client.js';
import { supabase } from '../../js/supabase-client.js';

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
        
        // ALWAYS fetch fresh data from database to ensure we have latest profile picture
        console.log('[Dashboard] Fetching fresh student data from database...');
        const studentResult = await dataClient.getAll('students', [
            { field: 'id', operator: '==', value: student.id }
        ]);
        
        const students = studentResult.data || studentResult || [];
        const currentStudentData = students.length > 0 ? students[0] : null;
        
        console.log('Database fetch result:', {
            rawResult: studentResult,
            students: students,
            currentStudentData: currentStudentData,
            fields: currentStudentData ? Object.keys(currentStudentData) : [],
            profilePictureUrl: currentStudentData?.profile_picture_url,
            profilePicture: currentStudentData?.profile_picture
        });
        
        if (!currentStudentData || currentStudentData.status !== 'active') {
            sessionStorage.removeItem('studentData');
            sessionStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return;
        }
        
        currentStudent = currentStudentData;
        
        // Update sessionStorage with fresh data from database
        console.log('[Dashboard] Updating sessionStorage with fresh data');
        sessionStorage.setItem('studentData', JSON.stringify(currentStudentData));
        
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
            
            // Update name - use full_name if available, otherwise combine first_name + last_name
            const fullName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
            const studentNameEl = document.getElementById('studentName');
            if (studentNameEl) studentNameEl.textContent = fullName;
            
            // Update student info - use student_id as primary field
            const studentIdEl = document.getElementById('studentId');
            if (studentIdEl) studentIdEl.textContent = `Student ID: ${student.student_id || student.student_number || 'N/A'}`;
            
            // Update student number in profile card
            const studentNumberEl = document.getElementById('studentNumber');
            if (studentNumberEl) studentNumberEl.textContent = student.student_number || student.student_id || 'N/A';
            
            // Update grade level, section, strand
            const gradeLevelEl = document.getElementById('gradeLevel');
            if (gradeLevelEl) gradeLevelEl.textContent = student.grade_level ? `Grade ${student.grade_level}` : 'Not assigned';
            
            const sectionEl = document.getElementById('section');
            if (sectionEl) sectionEl.textContent = student.section || 'Not assigned';
            
            const strandEl = document.getElementById('strand');
            if (strandEl) strandEl.textContent = student.strand || 'N/A';
            
            // Update contact info
            const contactPhoneEl = document.getElementById('contactPhone');
            if (contactPhoneEl) contactPhoneEl.textContent = student.parent_guardian_contact || student.phone || student.contact_number || 'Not provided';
            
            const contactEmailEl = document.getElementById('contactEmail');
            if (contactEmailEl) contactEmailEl.textContent = student.email || student.contact_email || 'Not provided';
            
            const contactAddressEl = document.getElementById('contactAddress');
            if (contactAddressEl) contactAddressEl.textContent = student.address || 'Not provided';
            
            // Update personal info
            const studentSexEl = document.getElementById('studentSex');
            if (studentSexEl) studentSexEl.textContent = student.sex || student.gender || 'Not specified';
            
            const studentNationalityEl = document.getElementById('studentNationality');
            if (studentNationalityEl) studentNationalityEl.textContent = student.nationality || 'Not specified';
            
            const studentBirthDateEl = document.getElementById('studentBirthDate');
            if (studentBirthDateEl) {
                if (student.birth_date || student.date_of_birth) {
                    const birthDate = new Date(student.birth_date || student.date_of_birth);
                    studentBirthDateEl.textContent = birthDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                } else {
                    studentBirthDateEl.textContent = 'Not provided';
                }
            }
            
            const studentBirthPlaceEl = document.getElementById('studentBirthPlace');
            if (studentBirthPlaceEl) studentBirthPlaceEl.textContent = student.birth_place || student.place_of_birth || 'Not provided';
            
            // Update parent/guardian info
            const parentGuardianNameEl = document.getElementById('parentGuardianName');
            if (parentGuardianNameEl) parentGuardianNameEl.textContent = student.parent_guardian_name || 'Not provided';
            
            const parentGuardianContactEl = document.getElementById('parentGuardianContact');
            if (parentGuardianContactEl) parentGuardianContactEl.textContent = student.parent_guardian_contact || 'Not provided';
            
            const parentGuardianEmailEl = document.getElementById('parentGuardianEmail');
            if (parentGuardianEmailEl) parentGuardianEmailEl.textContent = student.parent_guardian_email || 'Not provided';
            
            // Set profile initials from full name
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const profileInitialsEl = document.getElementById('profileInitials');
            if (profileInitialsEl) profileInitialsEl.textContent = initials || 'ST';

            // Show profile photo if available - use Storage URL with fallback
            const photoEl = document.getElementById('profilePhoto');
            const initialsEl = document.getElementById('profileInitials');
            
            console.log('Profile Picture Debug:', {
                hasProfilePictureUrl: !!student.profile_picture_url,
                hasProfilePicture: !!student.profile_picture,
                hasQrCode: !!student.qr_code,
                profilePictureUrl: student.profile_picture_url,
                profilePicture: student.profile_picture,
                qrCode: student.qr_code ? 'base64 data present' : 'no data',
                studentId: student.student_id || student.student_number,
                studentObject: student
            });
            
            // Check multiple fields for profile picture
            const profilePictureUrl = student.profile_picture_url || student.profile_picture || student.qr_code;
            
            if (profilePictureUrl && photoEl && initialsEl) {
                console.log('Loading profile photo from:', profilePictureUrl.substring(0, 100) + '...');
                
                photoEl.src = profilePictureUrl;
                photoEl.style.display = 'block';
                initialsEl.style.display = 'none';
                
                photoEl.onerror = () => {
                    // Fallback to initials if image fails to load
                    console.error('Failed to load profile photo:', profilePictureUrl.substring(0, 100));
                    photoEl.style.display = 'none';
                    initialsEl.style.display = 'flex';
                };
                
                photoEl.onload = () => {
                    console.log('✅ Profile photo loaded successfully!');
                };
            } else {
                console.log('No profile picture found, showing initials');
                if (photoEl && initialsEl) {
                    photoEl.style.display = 'none';
                    initialsEl.style.display = 'flex';
                }
            }
            
            // Update QR code display - use Storage URL with fallback
            const qrImg = document.querySelector('.qr-img');
            if (qrImg) {
                const qrUrl = storageClient.getImageUrl(student, 'qr_code', 'img/QR.jpg');
                qrImg.src = qrUrl;
                qrImg.style.opacity = '1'; // Show QR code after loading
                qrImg.onerror = () => {
                    // Fallback to default QR image
                    qrImg.src = 'img/QR.jpg';
                };
            }
            
            // Show profile card after all data is loaded
            const profileCard = document.getElementById('profileCard');
            if (profileCard) {
                profileCard.style.opacity = '1';
            }
        } else {
            // No student found - might be admin or teacher
            const studentNameEl = document.getElementById('studentName');
            if (studentNameEl) studentNameEl.textContent = 'Student';
            
            const studentIdEl = document.getElementById('studentId');
            if (studentIdEl) studentIdEl.textContent = 'No ID';
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
        
        // Load class schedule
        await loadClassSchedule();
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// Load class schedule from teaching_loads table with subject and teacher info
async function loadClassSchedule() {
    try {
        if (!currentStudent || !currentStudent.section_id) {
            const tbody = document.getElementById('classScheduleBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr><td colspan="4" style="text-align:center; padding:2.5rem; color:#94a3b8; font-style:italic;">No section assigned</td></tr>
                `;
            }
            return;
        }

        const { data, error } = await supabase
            .from('teaching_loads')
            .select(`
                *,
                subject:subject_id (code, name),
                teacher:teacher_id (first_name, last_name),
                section:section_id (section_name, section_code)
            `)
            .eq('section_id', currentStudent.section_id);

        if (error) {
            console.error('Error loading schedule:', error);
            const tbody = document.getElementById('classScheduleBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr><td colspan="4" style="text-align:center; padding:2.5rem; color:#ef4444;">Error loading schedule</td></tr>
                `;
            }
            return;
        }

        const schedules = data || [];

        const tbody = document.getElementById('classScheduleBody');
        if (!tbody) return;

        if (schedules.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="4" style="text-align:center; padding:2.5rem; color:#94a3b8; font-style:italic;">No class schedule available</td></tr>
            `;
            return;
        }

        tbody.innerHTML = schedules.map(schedule => {
            const subjectName = schedule.subject?.name || 'N/A';
            const teacherName = schedule.teacher ? `${schedule.teacher.first_name} ${schedule.teacher.last_name}` : 'N/A';
            const day = schedule.day || 'N/A';
            const startTime = schedule.start_time ? formatTime(schedule.start_time) : '-';
            const endTime = schedule.end_time ? formatTime(schedule.end_time) : '-';
            const time = `${startTime} - ${endTime}`;

            return `
                <tr style="transition:background 0.2s;" onmouseover="this.style.background='rgba(102,126,234,0.05)'" onmouseout="this.style.background='transparent'">
                    <td data-label="Subject" style="font-weight:600;">${subjectName}</td>
                    <td data-label="Day">${day}</td>
                    <td data-label="Time">${time}</td>
                    <td data-label="Teacher">${teacherName}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error in loadClassSchedule:', error);
        const tbody = document.getElementById('classScheduleBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr><td colspan="4" style="text-align:center; padding:2.5rem; color:#ef4444;">Error loading schedule</td></tr>
            `;
        }
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
        
        // Ensure we have an array
        const logs = Array.isArray(logsResult.data) ? logsResult.data : 
                     Array.isArray(logsResult) ? logsResult : [];
        
        console.log('Attendance logs:', logs);
        
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

    // Ensure logs is an array
    const logsArray = Array.isArray(logs) ? logs : [];

    if (logsArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No attendance records found</td></tr>';
        return;
    }

    // Group logs by date and get first entry per day
    const logsByDate = {};
    logsArray.forEach(log => {
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
                <td data-label="Date">${date}</td>
                <td data-label="Time In">${timeIn}</td>
                <td data-label="Time Out">${timeOut}</td>
                <td data-label="Status">${statusBadge}</td>
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

// =====================================================
// NOTIFICATIONS SYSTEM
// =====================================================

async function loadNotifications() {
    try {
        if (!currentStudent) return;

        const { data, error} = await supabase
            .from('student_notifications')
            .select('*')
            .eq('student_id', currentStudent.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error loading notifications:', error);
            return;
        }

        const notifications = data || [];
        const unreadCount = notifications.filter(n => !n.is_read).length;

        // Update badge
        const badge = document.getElementById('notificationBadge');
        if (badge && unreadCount > 0) {
            badge.style.display = 'flex';
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        } else if (badge) {
            badge.style.display = 'none';
        }

        renderNotifications(notifications);
    } catch (error) {
        console.error('Error in loadNotifications:', error);
    }
}

function renderNotifications(notifications) {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:4rem 2rem; color:var(--text-secondary);">
                <div style="font-size:4rem; margin-bottom:1rem; opacity:0.5;">📭</div>
                <p style="font-size:1.2rem; font-weight:600; margin:0; color:var(--text-primary);">No notifications yet</p>
                <p style="margin-top:0.5rem; opacity:0.7;">You're all caught up!</p>
            </div>
        `;
        return;
    }

    const typeIcons = {
        info: '📢',
        warning: '⚠️',
        success: '✅',
        danger: '🚨'
    };

    const typeColors = {
        info: '#3b82f6',
        warning: '#f59e0b',
        success: '#10b981',
        danger: '#ef4444'
    };

    // Check if dark theme is active
    const isDark = document.documentElement.classList.contains('dark-theme');
    const hoverBg = isDark ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.12)';
    const unreadBg = isDark ? 'rgba(102,126,234,0.12)' : 'rgba(102,126,234,0.08)';

    list.innerHTML = notifications.map(notif => {
        const color = typeColors[notif.type] || typeColors.info;
        const icon = typeIcons[notif.type] || typeIcons.info;
        const date = new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="notification-card" style="padding:1.25rem; border-left:4px solid ${color}; background:${notif.is_read ? 'transparent' : unreadBg}; margin-bottom:1rem; border-radius:8px; transition:all 0.2s;" onmouseover="this.style.background='${hoverBg}'" onmouseout="this.style.background='${notif.is_read ? 'transparent' : unreadBg}'">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.75rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:1.5rem;">${icon}</span>
                        <h3 style="margin:0; font-size:1.1rem; color:var(--text-primary); font-weight:700;">${notif.title}</h3>
                    </div>
                    <span style="font-size:0.85rem; color:var(--text-tertiary); white-space:nowrap; margin-left:1rem;">${date}</span>
                </div>
                <p style="margin:0 0 0 2rem; color:var(--text-secondary); line-height:1.6;">${notif.message}</p>
                ${!notif.is_read ? `<span style="display:inline-block; margin-top:0.75rem; margin-left:2rem; padding:0.35rem 0.75rem; background:${color}; color:white; font-size:0.75rem; font-weight:600; border-radius:16px; box-shadow:0 2px 4px rgba(0,0,0,0.15);">NEW</span>` : ''}
            </div>
        `;
    }).join('');
}

function setupNotifications() {
    const notifBtn = document.getElementById('notificationsBtn');
    const modal = document.getElementById('notificationsModal');
    const closeBtn = document.getElementById('closeNotificationsBtn');

    if (notifBtn && modal) {
        notifBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            loadNotifications();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Load initial count
    loadNotifications();
}

// Initialize dashboard when DOM is ready
initDashboard();
setupNotifications();
