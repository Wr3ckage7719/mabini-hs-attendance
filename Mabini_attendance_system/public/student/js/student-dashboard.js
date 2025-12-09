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
        
        // ALWAYS fetch fresh data from database to get latest updates from settings
        console.log('[Dashboard] Fetching fresh student data from database...');
        console.log('[Dashboard] Student ID:', student.id);
        
        const { data: freshDataArray, error: fetchError } = await supabase
            .from('students')
            .select('*')
            .eq('id', student.id);
        
        console.log('[Dashboard] Fresh data fetch result:', { freshDataArray, fetchError });
        
        if (fetchError) {
            console.error('[Dashboard] Error fetching fresh data:', fetchError);
            // Fallback to sessionStorage data if fetch fails
            currentStudent = student;
        } else if (!freshDataArray || freshDataArray.length === 0) {
            console.error('[Dashboard] No student data found');
            sessionStorage.removeItem('studentData');
            sessionStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return;
        } else {
            const freshData = freshDataArray[0];
            if (!freshData || freshData.status !== 'active') {
                sessionStorage.removeItem('studentData');
                sessionStorage.removeItem('userRole');
                window.location.href = 'login.html';
                return;
            }
            currentStudent = freshData;
            console.log('[Dashboard] Fresh data loaded:', {
                name: `${freshData.first_name} ${freshData.last_name}`,
                phone: freshData.phone,
                parent_name: freshData.parent_guardian_name,
                parent_contact: freshData.parent_guardian_contact,
                parent_email: freshData.parent_guardian_email
            });
        }
        
        // Update sessionStorage with fresh data from database
        console.log('[Dashboard] Updating sessionStorage with fresh data');
        sessionStorage.setItem('studentData', JSON.stringify(currentStudent));
        
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
        if (!currentStudent) {
            console.warn('[Student Data] No current student - cannot load data');
            // Show empty states
            loadAttendanceTable([]);
            return;
        }
        
        console.log('[Student Data] Loading data for student:', currentStudent.id);
        
        // Load attendance statistics
        await loadAttendanceStats(currentStudent.id);
        
        // Load class schedule
        await loadClassSchedule();
    } catch (error) {
        console.error('[Student Data] Error loading student data:', error);
        // On error, show empty state for attendance table
        loadAttendanceTable([]);
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
        console.log('[Attendance Stats] Starting to load for student:', studentId);
        
        // Define date range - current school year (starting from previous June)
        // Or use a very wide range to catch all attendance records
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-11
        
        // If we're in Jan-May, school year started in previous year's June
        // If we're in Jun-Dec, school year started in current year's June
        const schoolYearStart = currentMonth < 5 
            ? new Date(currentYear - 1, 5, 1)  // Previous June
            : new Date(currentYear, 5, 1);      // Current June
        
        const startDateStr = schoolYearStart.toISOString().split('T')[0];
        // Add 1 day to today to ensure we include today's records
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endDateStr = tomorrow.toISOString().split('T')[0];
        
        console.log('[Attendance Stats] Date range:', { startDateStr, endDateStr, currentDate: today.toISOString().split('T')[0] });
        
        // Get student's section from currentStudent (already loaded)
        const sectionId = currentStudent?.section_id;
        
        let scheduledDaysArray = [];
        
        if (sectionId) {
            // Get teaching loads for this section to determine scheduled class days
            try {
                const { data: loads, error: loadsError } = await supabase
                    .from('teaching_loads')
                    .select('*')
                    .eq('section_id', sectionId);
                
                if (!loadsError && loads) {
                    // Extract unique scheduled days
                    const daysSet = new Set();
                    loads.forEach(load => {
                        if (load.day_of_week) {
                            // day_of_week might be comma-separated like "Monday, Tuesday, Wednesday"
                            const days = load.day_of_week.split(',').map(d => d.trim());
                            days.forEach(day => daysSet.add(day));
                        }
                    });
                    
                    scheduledDaysArray = Array.from(daysSet);
                    console.log('[Attendance Stats] Scheduled class days:', scheduledDaysArray);
                }
            } catch (err) {
                console.warn('[Attendance Stats] Could not load teaching loads:', err);
            }
        }
        
        // Try to get attendance records from the 'attendance' table first
        let logs = [];
        try {
            console.log('[Attendance Stats] Querying attendance with:', {
                student_id: studentId,
                student_id_type: typeof studentId,
                date_gte: startDateStr,
                date_lte: endDateStr
            });
            
            // First, let's check if ANY records exist for this student (without date filter)
            const { data: allStudentRecords, error: checkError } = await supabase
                .from('attendance')
                .select('*')
                .eq('student_id', studentId)
                .limit(5);
            
            console.log('[Attendance Stats] All-time check:', {
                found: allStudentRecords?.length || 0,
                sample: allStudentRecords?.[0]
            });
            
            // Now query with date range
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('student_id', studentId)
                .gte('date', startDateStr)
                .lte('date', endDateStr)
                .order('date', { ascending: false });
            
            if (attendanceError) {
                console.error('[Attendance Stats] Could not fetch from attendance table:', attendanceError);
            } else {
                console.log('[Attendance Stats] Query result:', { 
                    recordsFound: attendanceData?.length || 0,
                    sample: attendanceData?.[0] 
                });
                
                if (attendanceData && attendanceData.length > 0) {
                    logs = attendanceData;
                } else {
                    console.log('[Attendance Stats] No records in attendance table, trying entrance_logs...');
                    // Fallback to entrance_logs
                    try {
                        const logsResult = await attendanceClient.getAttendanceRange(
                            studentId, 
                            startDateStr,
                            endDateStr
                        );
                        logs = Array.isArray(logsResult.data) ? logsResult.data : 
                               Array.isArray(logsResult) ? logsResult : [];
                        console.log('[Attendance Stats] Entrance logs result:', logs.length, 'records');
                    } catch (entranceErr) {
                        console.warn('[Attendance Stats] Entrance logs also failed:', entranceErr);
                    }
                }
            }
        } catch (err) {
            console.error('[Attendance Stats] Error fetching attendance:', err);
            logs = [];
        }
        
        console.log('[Attendance Stats] Total logs retrieved:', logs.length);
        
        // If no data at all, show "no data yet" state
        if (logs.length === 0) {
            console.log('[Attendance Stats] No attendance data found - showing empty state');
            updateAttendanceSummary(0, 0, 0, 0, true); // true = no data
            updateRecentActivity([]);
            loadAttendanceTable([]);
            console.log('[Attendance Stats] ✅ Empty state displayed for all components');
            return;
        }
        
        // Calculate statistics from attendance records
        const uniqueDates = new Set();
        logs.forEach(log => {
            const dateField = log.date || log.scan_time;
            if (dateField) {
                const date = typeof dateField === 'string' ? dateField.split('T')[0] : dateField;
                uniqueDates.add(date);
            }
        });
        
        const daysPresent = uniqueDates.size;
        console.log('[Attendance Stats] Days present:', daysPresent);
        
        // Calculate total scheduled class days based on student's actual schedule
        const totalDays = scheduledDaysArray.length > 0 
            ? calculateScheduledClassDays(schoolYearStart, tomorrow, scheduledDaysArray)
            : calculateSchoolDays(schoolYearStart, tomorrow);
            
        console.log('[Attendance Stats] Total scheduled days:', totalDays);
        
        const daysAbsent = Math.max(0, totalDays - daysPresent);
        const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
        
        console.log('[Attendance Stats] Calculated:', { daysPresent, daysAbsent, totalDays, attendanceRate: attendanceRate.toFixed(1) + '%' });
        
        // Update all UI elements
        updateAttendanceSummary(daysPresent, daysAbsent, totalDays, attendanceRate, false);
        updateRecentActivity(logs);
        
        // Load attendance records for table
        loadAttendanceTable(logs);
    } catch (error) {
        console.warn('[Attendance Stats] Error loading attendance stats:', error.message);
        updateAttendanceSummary(0, 0, 0, 0, true); // true = error/no data
        updateRecentActivity([]);
        loadAttendanceTable([]);
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
function updateAttendanceSummary(present, absent, total, rate, noData = false) {
    console.log('[Update Summary] Updating UI:', { present, absent, total, rate, noData });
    
    // If no data, show "No Data Yet" state
    if (noData || total === 0) {
        // Update summary card
        const rateDisplay = document.getElementById('attendanceRateDisplay');
        if (rateDisplay) rateDisplay.textContent = '--';
        
        const summaryPresent = document.getElementById('summaryPresent');
        if (summaryPresent) summaryPresent.textContent = '--';
        
        const summaryAbsent = document.getElementById('summaryAbsent');
        if (summaryAbsent) summaryAbsent.textContent = '--';
        
        const summaryTotal = document.getElementById('summaryTotal');
        if (summaryTotal) summaryTotal.textContent = '--';
        
        // Update progress bar to 0
        const progressBar = document.getElementById('attendanceProgress');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.background = 'rgba(128, 128, 128, 0.3)';
        }
        
        // Update status text
        const statusEl = document.getElementById('attendanceStatus');
        if (statusEl) {
            statusEl.textContent = 'No Attendance Data Yet';
            statusEl.style.color = '#9ca3af';
        }
        
        // Hide warning
        const warningEl = document.getElementById('attendanceWarning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }
        
        // Update performance insights
        const monthlyRateEl = document.getElementById('monthlyRate');
        if (monthlyRateEl) monthlyRateEl.textContent = '--';
        
        const streakEl = document.getElementById('presentStreak');
        if (streakEl) streakEl.textContent = '--';
        
        const classesNeededEl = document.getElementById('classesNeeded');
        if (classesNeededEl) classesNeededEl.textContent = '--';
        
        return;
    }
    
    // Update summary card with actual data
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
            statusEl.textContent = '✅ Excellent Attendance';
            statusEl.style.color = '#10b981';
        } else if (rate >= 50) {
            statusEl.textContent = '⚠️ Needs Improvement';
            statusEl.style.color = '#f59e0b';
        } else {
            statusEl.textContent = '❌ Critical - Action Required';
            statusEl.style.color = '#ef4444';
        }
    }
    
    // Show/hide warning
    const warningEl = document.getElementById('attendanceWarning');
    if (warningEl) {
        warningEl.style.display = rate < 75 ? 'block' : 'none';
    }
    
    // Calculate and update performance insights
    const classesNeeded = Math.max(0, Math.ceil((0.75 * total - present) / 0.25));
    const classesNeededEl = document.getElementById('classesNeeded');
    if (classesNeededEl) {
        if (rate >= 75) {
            classesNeededEl.textContent = '0';
            const parentCard = classesNeededEl.parentElement?.parentElement;
            if (parentCard) {
                parentCard.style.borderLeftColor = '#10b981';
            }
            classesNeededEl.style.color = '#10b981';
        } else {
            classesNeededEl.textContent = classesNeeded;
        }
    }
    
    // Update monthly rate (simplified - using overall rate for now)
    const monthlyRateEl = document.getElementById('monthlyRate');
    if (monthlyRateEl) {
        monthlyRateEl.textContent = rate.toFixed(1) + '%';
    }
}

// Update recent activity feed
function updateRecentActivity(logs) {
    const feedEl = document.getElementById('recentActivityFeed');
    if (!feedEl) return;
    
    const logsArray = Array.isArray(logs) ? logs : [];
    
    if (logsArray.length === 0) {
        feedEl.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; opacity: 0.5; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor" style="opacity: 0.2;">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <p style="margin: 0.75rem 0 0 0; font-size: 0.875rem; font-weight: 500;">No attendance records yet</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; opacity: 0.7;">Your attendance history will appear here</p>
            </div>
        `;
        
        // Set streak to 0 when no data
        const streakEl = document.getElementById('presentStreak');
        if (streakEl) streakEl.textContent = '0';
        
        return;
    }
    
    // Sort by date descending and take last 5
    const sortedLogs = logsArray
        .sort((a, b) => {
            const dateA = new Date(a.date || a.scan_time);
            const dateB = new Date(b.date || b.scan_time);
            return dateB - dateA;
        })
        .slice(0, 5);
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    const sortedByDateAsc = [...logsArray].sort((a, b) => {
        const dateA = new Date(a.date || a.scan_time);
        const dateB = new Date(b.date || b.scan_time);
        return dateA - dateB;
    });
    
    for (let i = sortedByDateAsc.length - 1; i >= 0; i--) {
        const logDate = new Date(sortedByDateAsc[i].date || sortedByDateAsc[i].scan_time);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);
        
        if (logDate.toDateString() === expectedDate.toDateString()) {
            streak++;
        } else {
            break;
        }
    }
    
    const streakEl = document.getElementById('presentStreak');
    if (streakEl) {
        streakEl.textContent = streak;
    }
    
    feedEl.innerHTML = sortedLogs.map(log => {
        const logDate = new Date(log.date || log.scan_time);
        const dateStr = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = log.time_in || (log.scan_time ? logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--');
        
        const isToday = logDate.toDateString() === new Date().toDateString();
        const isYesterday = logDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
        
        let displayDate = dateStr;
        if (isToday) displayDate = 'Today';
        else if (isYesterday) displayDate = 'Yesterday';
        
        return `
            <div style="padding: 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%); border-radius: 10px; border-left: 3px solid #10b981; transition: transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.15)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="flex-shrink: 0; width: 36px; height: 36px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; color: #10b981;">
                            Class Attended
                        </div>
                        <div style="font-size: 0.8rem; opacity: 0.7; display: flex; align-items: center; gap: 0.5rem;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="opacity: 0.5;">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            <span>${displayDate} • ${timeStr}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load attendance table
function loadAttendanceTable(logs) {
    console.log('[Attendance Table] Loading table with logs:', logs?.length || 0);
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) {
        console.error('[Attendance Table] Table body element not found!');
        return;
    }

    // Ensure logs is an array
    const logsArray = Array.isArray(logs) ? logs : [];
    console.log('[Attendance Table] Logs array length:', logsArray.length);

    if (logsArray.length === 0) {
        console.log('[Attendance Table] No logs - showing empty state');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 4rem 2rem;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-secondary, #94a3b8);">
                        <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor" style="opacity: 0.25;">
                            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <div>
                            <p style="margin: 0; font-weight: 600; font-size: 1.1rem; color: var(--text-primary, #e2e8f0);">No Data Yet</p>
                            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.8;">Your attendance records will appear here</p>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    console.log('[Attendance Table] Processing logs...', logsArray.slice(0, 3));

    // Group logs by date and get the record per day
    const logsByDate = {};
    logsArray.forEach(log => {
        // Support both attendance table (date field) and entrance_logs (scan_time field)
        const dateKey = log.date || (log.scan_time ? log.scan_time.split('T')[0] : null);
        if (dateKey) {
            // For attendance table, use the record as-is
            // For entrance_logs, prefer earliest scan of the day
            if (!logsByDate[dateKey] || (log.scan_time && log.scan_time < logsByDate[dateKey].scan_time)) {
                logsByDate[dateKey] = log;
            }
        }
    });
    
    console.log('[Attendance Table] Unique dates found:', Object.keys(logsByDate).length);
    
    // Convert to array and sort by date descending
    const sortedLogs = Object.values(logsByDate)
        .sort((a, b) => {
            const dateA = new Date(a.date || a.scan_time);
            const dateB = new Date(b.date || b.scan_time);
            return dateB - dateA;
        })
        .slice(0, 15); // Take recent 15 records

    console.log('[Attendance Table] Rendering', sortedLogs.length, 'rows');

    tbody.innerHTML = sortedLogs.map(log => {
        // Support both data formats
        const logDate = new Date(log.date || log.scan_time);
        const date = logDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Time In: Use time_in field if available, otherwise extract from scan_time
        let timeIn = '-';
        if (log.time_in) {
            timeIn = formatTime(log.time_in);
        } else if (log.scan_time) {
            timeIn = logDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // Time Out: Use time_out field if available
        const timeOut = log.time_out ? formatTime(log.time_out) : '-';
        
        // Status: Use status field from attendance table, or calculate from time
        let status = log.status || 'present';
        if (!log.status && log.scan_time) {
            // Fallback: determine from scan time (before 8 AM = on time, after = late)
            const hour = logDate.getHours();
            status = hour < 8 ? 'present' : 'late';
        }
        
        let statusBadge = '';
        switch(status.toLowerCase()) {
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
                <td data-label="Date">${date}</td>
                <td data-label="Time In">${timeIn}</td>
                <td data-label="Time Out">${timeOut}</td>
                <td data-label="Status">${statusBadge}</td>
            </tr>
        `;
    }).join('');
    
    console.log('[Attendance Table] ✅ Table rendered successfully');
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
        if (!currentStudent) {
            console.warn('⚠️ No current student, cannot load notifications');
            renderNotifications([]);
            updateNotificationBadge([]);
            return;
        }

        console.log('[Notifications] Loading notifications for student:', {
            id: currentStudent.id,
            grade_level: currentStudent.grade_level,
            section: currentStudent.section
        });

        // Fetch ALL notifications and filter client-side for better reliability
        // This avoids complex SQL OR queries that can fail with null/undefined values
        const { data: allNotifications, error } = await supabase
            .from('student_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('⚠️ Could not load notifications:', error);
            renderNotifications([]);
            updateNotificationBadge([]);
            return;
        }

        console.log('[Notifications] Fetched', allNotifications?.length || 0, 'total notifications');

        // Filter notifications that apply to this student
        const notifications = (allNotifications || []).filter(notif => {
            // IMPORTANT: Each notification record has a student_id field
            // Admin creates individual records for each recipient
            // So we must check if this notification is for THIS specific student
            
            // If notification has a student_id, it must match current student
            if (notif.student_id) {
                return notif.student_id === currentStudent.id;
            }
            
            // Legacy support: notifications without student_id (if any exist)
            // 1. Broadcast to all students
            if (notif.target_type === 'all') {
                return true;
            }
            
            // 2. Grade-specific notifications
            if (notif.target_type === 'grade' && currentStudent.grade_level) {
                return notif.target_value === String(currentStudent.grade_level);
            }
            
            // 3. Section-specific notifications
            if (notif.target_type === 'section' && currentStudent.section) {
                return notif.target_value === currentStudent.section;
            }
            
            return false;
        });

        console.log('[Notifications] Filtered to', notifications.length, 'notifications for this student');
        updateNotificationBadge(notifications);
        renderNotifications(notifications);
    } catch (error) {
        console.error('⚠️ Notification loading failed:', error);
        renderNotifications([]);
        updateNotificationBadge([]);
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
        
        // Fetch all unread notifications for this specific student
        const { data: allUnread, error: fetchError } = await supabase
            .from('student_notifications')
            .select('id, target_type, target_value, student_id')
            .eq('is_read', false)
            .eq('student_id', currentStudent.id); // Only fetch this student's notifications
        
        if (fetchError) {
            console.error('❌ Error fetching unread notifications:', fetchError);
            // If RLS policy blocks reading, just return true (assume success)
            console.log('ℹ️ Continuing despite fetch error (may be RLS policy)');
            return true;
        }
        
        if (!allUnread || allUnread.length === 0) {
            console.log('✅ No unread notifications to mark');
            return true;
        }
        
        console.log('Found', allUnread.length, 'unread notifications to mark');
        
        const notificationIds = allUnread.map(n => n.id);
        
        // Try to mark them as read - if RLS blocks this, catch and handle gracefully
        try {
            const { data, error } = await supabase
                .from('student_notifications')
                .update({ 
                    is_read: true, 
                    read_at: new Date().toISOString() 
                })
                .in('id', notificationIds)
                .select();

            if (error) {
                // Check if it's an RLS policy error
                if (error.code === '42501') {
                    console.warn('⚠️ RLS policy prevents update. Notifications cannot be marked as read.');
                    console.log('ℹ️ Database permissions need to be configured for students to mark notifications as read.');
                    // Return true anyway so the UI still works
                    return true;
                }
                console.error('❌ Error marking notifications as read:', error);
                return false;
            }

            console.log('✅ Successfully marked as read:', data?.length || 0, 'notifications');
            return true;
        } catch (updateError) {
            console.warn('⚠️ Update failed:', updateError);
            // Return true to prevent blocking the UI
            return true;
        }
        
    } catch (error) {
        console.error('💥 Exception in markNotificationsAsRead:', error);
        // Return true to prevent blocking the UI
        return true;
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
    // Setup attendance search filter
    setupAttendanceFilter();
}).catch(error => {
    console.error('Failed to initialize dashboard:', error);
});

// Setup attendance search filter functionality
function setupAttendanceFilter() {
    const searchForm = document.querySelector('.attendance-search-form');
    const searchInput = document.querySelector('.attendance-search-input');
    const yearSelect = document.querySelector('.attendance-year-select');
    
    if (!searchForm || !searchInput || !yearSelect) {
        console.warn('[Attendance Filter] Form elements not found');
        return;
    }
    
    // Store original attendance data
    let allAttendanceLogs = [];
    
    // Intercept loadAttendanceTable to save the data
    const originalLoadTable = window.loadAttendanceTable || loadAttendanceTable;
    window.loadAttendanceTable = function(logs) {
        allAttendanceLogs = Array.isArray(logs) ? logs : [];
        originalLoadTable(logs);
    };
    
    // Handle form submission
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const searchDate = searchInput.value.trim();
        const selectedYear = yearSelect.value;
        
        console.log('[Attendance Filter] Searching:', { searchDate, selectedYear });
        
        if (!allAttendanceLogs || allAttendanceLogs.length === 0) {
            console.warn('[Attendance Filter] No attendance data to filter');
            return;
        }
        
        // Filter the logs
        let filteredLogs = [...allAttendanceLogs];
        
        // Filter by year
        if (selectedYear) {
            filteredLogs = filteredLogs.filter(log => {
                const logDate = new Date(log.date || log.scan_time);
                return logDate.getFullYear().toString() === selectedYear;
            });
        }
        
        // Filter by specific date (YYYY-MM-DD format)
        if (searchDate) {
            filteredLogs = filteredLogs.filter(log => {
                const logDateStr = log.date || (log.scan_time ? log.scan_time.split('T')[0] : '');
                return logDateStr.includes(searchDate);
            });
        }
        
        console.log('[Attendance Filter] Filtered results:', filteredLogs.length);
        
        // Update the table with filtered results
        loadAttendanceTable(filteredLogs);
    });
    
    // Reset filter when input is cleared
    searchInput.addEventListener('input', (e) => {
        if (!e.target.value && !yearSelect.value) {
            loadAttendanceTable(allAttendanceLogs);
        }
    });
    
    yearSelect.addEventListener('change', () => {
        if (!searchInput.value && !yearSelect.value) {
            loadAttendanceTable(allAttendanceLogs);
        }
    });
    
    console.log('[Attendance Filter] Filter setup complete');
}
