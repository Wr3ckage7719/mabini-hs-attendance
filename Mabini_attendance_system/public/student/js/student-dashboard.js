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
            // Load notifications after student data is ready
            await loadNotifications();
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
            
            // Parse day_of_week - can be comma-separated (e.g., "Monday, Tuesday, Wednesday")
            let day = 'N/A';
            if (schedule.day_of_week) {
                // If it contains commas, it's a list of days - format it nicely
                if (schedule.day_of_week.includes(',')) {
                    const days = schedule.day_of_week.split(',').map(d => d.trim());
                    // Show abbreviated format for multiple days
                    day = days.map(d => d.substring(0, 3)).join(', ');
                } else {
                    day = schedule.day_of_week;
                }
            } else if (schedule.day) {
                day = schedule.day;
            }
            
            // Build time string from start_time and end_time
            let time = 'N/A';
            if (schedule.start_time && schedule.end_time) {
                const startTime = formatTime(schedule.start_time);
                const endTime = formatTime(schedule.end_time);
                time = `${startTime}-${endTime}`;
            } else if (schedule.start_time) {
                time = formatTime(schedule.start_time);
            } else if (schedule.schedule) {
                // Fallback to old schedule field
                time = schedule.schedule;
            }

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
        
        // Get student's section to find scheduled days
        const studentData = await dataClient.getStudent(studentId);
        const sectionId = studentData?.section_id;
        
        let scheduledDaysArray = [];
        
        if (sectionId) {
            // Get teaching loads for this section to determine scheduled class days
            const loadsResult = await dataClient.getTeachingLoads();
            const loads = Array.isArray(loadsResult?.data) ? loadsResult.data : 
                         Array.isArray(loadsResult) ? loadsResult : [];
            
            // Filter loads for this section
            const sectionLoads = loads.filter(load => load.section_id === sectionId);
            
            // Extract unique scheduled days
            const daysSet = new Set();
            sectionLoads.forEach(load => {
                if (load.day_of_week) {
                    // day_of_week might be comma-separated like "Monday, Tuesday, Wednesday"
                    const days = load.day_of_week.split(',').map(d => d.trim());
                    days.forEach(day => daysSet.add(day));
                }
            });
            
            scheduledDaysArray = Array.from(daysSet);
            console.log('Scheduled class days:', scheduledDaysArray);
        }
        
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
        
        // Calculate total scheduled class days based on student's actual schedule
        const totalDays = scheduledDaysArray.length > 0 
            ? calculateScheduledClassDays(startDate, endDate, scheduledDaysArray)
            : calculateSchoolDays(startDate, endDate);
            
        const daysAbsent = Math.max(0, totalDays - daysPresent);
        const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
        
        // Update all UI elements
        updateAttendanceSummary(daysPresent, daysAbsent, totalDays, attendanceRate);
        updateRecentActivity(logs);
        
        // Load attendance records for table
        loadAttendanceTable(logs);
    } catch (error) {
        console.error('Error loading attendance stats:', error);
        updateAttendanceSummary(0, 0, 0, 0);
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

// Calculate scheduled class days based on student's actual schedule
function calculateScheduledClassDays(startDate, endDate, scheduledDays) {
    // Map day names to numbers
    const dayMap = {
        'Sunday': 0, 'Sun': 0,
        'Monday': 1, 'Mon': 1,
        'Tuesday': 2, 'Tue': 2,
        'Wednesday': 3, 'Wed': 3,
        'Thursday': 4, 'Thu': 4,
        'Friday': 5, 'Fri': 5,
        'Saturday': 6, 'Sat': 6
    };
    
    // Convert scheduled day names to numbers
    const scheduledDayNumbers = scheduledDays.map(day => dayMap[day]).filter(n => n !== undefined);
    
    if (scheduledDayNumbers.length === 0) {
        // Fallback to weekdays if no scheduled days
        return calculateSchoolDays(startDate, endDate);
    }
    
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        // Count only if this day is in the scheduled days
        if (scheduledDayNumbers.includes(dayOfWeek)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}

// Update attendance summary UI with all the new elements
function updateAttendanceSummary(present, absent, total, rate) {
    // Update main stat cards
    const daysPresentEl = document.getElementById('daysPresent');
    if (daysPresentEl) daysPresentEl.textContent = present;

    const totalDaysEl = document.getElementById('totalDays');
    if (totalDaysEl) totalDaysEl.textContent = total;

    const daysAbsentEl = document.getElementById('daysAbsent');
    if (daysAbsentEl) daysAbsentEl.textContent = absent;

    const attendanceRateEl = document.getElementById('attendanceRate');
    if (attendanceRateEl) attendanceRateEl.textContent = rate.toFixed(1) + '%';
    
    // Update summary card
    const rateDisplay = document.getElementById('attendanceRateDisplay');
    if (rateDisplay) rateDisplay.textContent = rate.toFixed(1) + '%';
    
    const summaryPresent = document.getElementById('summaryPresent');
    if (summaryPresent) summaryPresent.textContent = present;
    
    const summaryAbsent = document.getElementById('summaryAbsent');
    if (summaryAbsent) summaryAbsent.textContent = absent;
    
    const summaryTotal = document.getElementById('summaryTotal');
    if (summaryTotal) summaryTotal.textContent = total;
    
    // Update progress bar
    const progressBar = document.getElementById('attendanceProgress');
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.width = Math.min(rate, 100) + '%';
            
            // Color coding based on rate
            if (rate >= 75) {
                progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
            } else if (rate >= 50) {
                progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
            }
        }, 100);
    }
    
    // Update status text
    const statusEl = document.getElementById('attendanceStatus');
    if (statusEl) {
        if (rate >= 75) {
            statusEl.textContent = '✅ Good Attendance';
            statusEl.style.color = '#10b981';
        } else if (rate >= 50) {
            statusEl.textContent = '⚠️ Needs Improvement';
            statusEl.style.color = '#f59e0b';
        } else {
            statusEl.textContent = '❌ Critical Attendance';
            statusEl.style.color = '#ef4444';
        }
    }
    
    // Show/hide warning
    const warningEl = document.getElementById('attendanceWarning');
    if (warningEl) {
        warningEl.style.display = rate < 75 ? 'block' : 'none';
    }
    
    // Update progress bars in stat cards
    const rateProgressBar = document.getElementById('rateProgressBar');
    if (rateProgressBar) {
        setTimeout(() => rateProgressBar.style.width = Math.min(rate, 100) + '%', 100);
    }
    
    const presentProgressBar = document.getElementById('presentProgressBar');
    if (presentProgressBar && total > 0) {
        setTimeout(() => presentProgressBar.style.width = (present / total * 100) + '%', 100);
    }
    
    const absentProgressBar = document.getElementById('absentProgressBar');
    if (absentProgressBar && total > 0) {
        setTimeout(() => absentProgressBar.style.width = (absent / total * 100) + '%', 100);
    }
}

// Update recent activity feed
function updateRecentActivity(logs) {
    const feedEl = document.getElementById('recentActivityFeed');
    if (!feedEl) return;
    
    const logsArray = Array.isArray(logs) ? logs : [];
    
    if (logsArray.length === 0) {
        feedEl.innerHTML = `
            <div style="text-align: center; padding: 2rem; opacity: 0.5;">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style="opacity: 0.3;">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">No recent activity</p>
            </div>
        `;
        return;
    }
    
    // Sort by date descending and take last 5
    const sortedLogs = logsArray
        .sort((a, b) => new Date(b.scan_time) - new Date(a.scan_time))
        .slice(0, 5);
    
    feedEl.innerHTML = sortedLogs.map(log => {
        const date = new Date(log.scan_time);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div style="padding: 0.75rem; background: rgba(79, 172, 254, 0.05); border-radius: 8px; border-left: 3px solid #10b981;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;">
                            ✅ Attended Class
                        </div>
                        <div style="font-size: 0.75rem; opacity: 0.7;">
                            ${dateStr} at ${timeStr}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
        console.log('🔔 Loading notifications...');
        console.log('Current student:', currentStudent);
        
        if (!currentStudent) {
            console.warn('⚠️ No current student, cannot load notifications');
            return;
        }

        console.log('Querying notifications for student_id:', currentStudent.id);
        console.log('Student ID type:', typeof currentStudent.id);
        
        // First, let's try to get ALL notifications to see if RLS is blocking us
        console.log('Testing: Getting all notifications (no filter)...');
        const { data: allData, error: allError } = await supabase
            .from('student_notifications')
            .select('*')
            .limit(5);
            
        console.log('All notifications test:', { allData, allError });
        
        // Now get notifications for this specific student
        const { data, error } = await supabase
            .from('student_notifications')
            .select('*')
            .eq('student_id', currentStudent.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('❌ Error loading notifications:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            
            // Show error in UI
            renderNotifications([]);
            return;
        }
        
        console.log('✅ Notifications query successful!');
        console.log('Notifications data:', data);
        console.log('Number of notifications:', data ? data.length : 0);
        
        if (data && data.length > 0) {
            console.log('First notification:', data[0]);
        }

        const notifications = data || [];
        updateNotificationBadge(notifications);
        renderNotifications(notifications);
    } catch (error) {
        console.error('Error in loadNotifications:', error);
    }
}

// Update notification badge count
function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (badge && unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else if (badge) {
        badge.style.display = 'none';
    }
}

// Mark all unread notifications as read
async function markNotificationsAsRead() {
    try {
        if (!currentStudent) {
            console.warn('No current student, cannot mark as read');
            return false;
        }
        
        console.log('📖 Marking notifications as read...');
        console.log('Student ID:', currentStudent.id);
        
        // First check how many unread notifications exist
        const { data: unreadCheck, error: checkError } = await supabase
            .from('student_notifications')
            .select('id, title, is_read')
            .eq('student_id', currentStudent.id)
            .eq('is_read', false);
        
        console.log('Unread notifications before update:', unreadCheck);
        
        if (!unreadCheck || unreadCheck.length === 0) {
            console.log('✅ No unread notifications to mark');
            return true;
        }
        
        const { data, error } = await supabase
            .from('student_notifications')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq('student_id', currentStudent.id)
            .eq('is_read', false)
            .select();

        if (error) {
            console.error('❌ Error marking notifications as read:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return false;
        }

        console.log('✅ Successfully marked as read:', data?.length || 0, 'notifications');
        console.log('Updated notifications:', data);
        return true;
        
    } catch (error) {
        console.error('💥 Exception in markNotificationsAsRead:', error);
        return false;
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
        notifBtn.addEventListener('click', async () => {
            console.log('🔔 Opening notifications modal...');
            modal.style.display = 'flex';
            
            // Load notifications first to show current state
            await loadNotifications();
            
            // Mark all as read after 1.5 seconds so user can see the unread state
            setTimeout(async () => {
                console.log('⏰ Delay complete, marking as read now...');
                const marked = await markNotificationsAsRead();
                if (marked) {
                    console.log('🔄 Reloading notifications to show updated state...');
                    // Reload notifications to show updated read state
                    await loadNotifications();
                    console.log('✅ Notifications marked as read and UI updated');
                } else {
                    console.warn('⚠️ Mark as read returned false');
                }
            }, 1500);
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.style.display = 'none';
        });
    }

    if (modal) {
        // Close modal when clicking backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Load initial count will be called from initDashboard after student is loaded
}

// Initialize dashboard when DOM is ready
initDashboard().then(() => {
    // Setup notifications after dashboard is initialized
    setupNotifications();
}).catch(error => {
    console.error('Failed to initialize dashboard:', error);
});
