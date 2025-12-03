/**
 * SMS Notifications Page - Admin Interface
 * Handles emergency alerts, absence notifications, and SMS logs
 */

import { checkAuth } from './admin-common.js';
import { getDocuments } from './admin-common.js';
import { showAlert } from './admin-common.js';
import { setActiveNavFromLocation } from './admin-common.js';

const SMS_API = '../api/services/sms_service.php';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        await checkAuth('admin');
        
        // Set active navigation
        setActiveNavFromLocation();
        
        // Initialize with error handling
        try {
            await loadSMSStats();
        } catch (error) {
            console.error('Error loading SMS stats:', error);
            document.getElementById('totalSMSToday').textContent = '0';
            document.getElementById('checkInSMS').textContent = '0';
            document.getElementById('checkOutSMS').textContent = '0';
            document.getElementById('absenceSMS').textContent = '0';
        }
        
        try {
            await loadSMSLogs();
        } catch (error) {
            console.error('Error loading SMS logs:', error);
            const container = document.getElementById('smsLogsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        No SMS logs available yet. Logs will appear here after messages are sent.
                    </div>
                `;
            }
        }
        
        try {
            await loadSections();
        } catch (error) {
            console.error('Error loading sections:', error);
        }
        
        // Set today's date for absence picker
        const absenceDateInput = document.getElementById('absenceDate');
        if (absenceDateInput) {
            absenceDateInput.valueAsDate = new Date();
        }
        
        // Setup sidebar toggle
        setupSidebarToggle();
    } catch (error) {
        console.error('Error initializing SMS notifications page:', error);
    }
});

// Setup sidebar toggle
function setupSidebarToggle() {
    const sidebar = document.getElementById('adminSidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('show');
        });
    }
}

// Load SMS statistics
async function loadSMSStats() {
    try {
        const logs = await getSMSLogs(1000);
        const today = new Date().toDateString();
        
        let todayCount = 0;
        let checkInCount = 0;
        let checkOutCount = 0;
        let absenceCount = 0;
        
        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toDateString();
            if (logDate === today) {
                todayCount++;
                
                const msg = log.message.toLowerCase();
                if (msg.includes('checked in')) checkInCount++;
                else if (msg.includes('checked out')) checkOutCount++;
                else if (msg.includes('absent')) absenceCount++;
            }
        });
        
        document.getElementById('totalSMSToday').textContent = todayCount;
        document.getElementById('checkInSMS').textContent = checkInCount;
        document.getElementById('checkOutSMS').textContent = checkOutCount;
        document.getElementById('absenceSMS').textContent = absenceCount;
    } catch (error) {
        console.error('Error loading SMS stats:', error);
    }
}

// Load SMS logs
async function loadSMSLogs() {
    const container = document.getElementById('smsLogsContainer');
    
    if (!container) {
        console.warn('SMS logs container not found');
        return;
    }
    
    try {
        const logs = await getSMSLogs(50);
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    No SMS logs found.
                </div>
            `;
            return;
        }
        
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Recipient</th>
                            <th>Message</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${new Date(log.timestamp).toLocaleString()}</td>
                                <td><code>${log.recipient}</code></td>
                                <td class="text-truncate" style="max-width: 300px;">${log.message}</td>
                                <td><span class="badge bg-success">Sent</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('Error loading SMS logs:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Error loading SMS logs. Please try again.
            </div>
        `;
    }
}

// Get SMS logs from file
async function getSMSLogs(limit = 100) {
    try {
        const response = await fetch('../logs/sms_log.txt');
        if (!response.ok) {
            // No logs file yet
            return [];
        }
        
        const text = await response.text();
        const lines = text.trim().split('\n').filter(line => line.length > 0);
        
        return lines.slice(-limit).reverse().map(line => {
            // Parse: [timestamp] TO: phone | MSG: message | RESPONSE: response
            const match = line.match(/\[(.*?)\] TO: (.*?) \| MSG: (.*?) \| RESPONSE: (.*)/);
            if (match) {
                return {
                    timestamp: match[1],
                    recipient: match[2],
                    message: match[3],
                    response: match[4]
                };
            }
            return null;
        }).filter(log => log !== null);
    } catch (error) {
        console.error('Error loading SMS logs:', error);
        return [];
    }
}

// Load sections for emergency alert
async function loadSections() {
    try {
        // Load all sections (no status filter since sections table doesn't have status column)
        const sections = await getDocuments('sections');
        
        const select = document.getElementById('emergencySection');
        select.innerHTML = '<option value="">Select a section...</option>' +
            sections.map(s => `
                <option value="${s.id}">${s.section_name} - Grade ${s.grade_level}</option>
            `).join('');
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}

// Toggle section select visibility
window.toggleSectionSelect = function() {
    const target = document.getElementById('emergencyTarget').value;
    const sectionDiv = document.getElementById('sectionSelectDiv');
    sectionDiv.style.display = target === 'section' ? 'block' : 'none';
}

// Show emergency alert modal
window.showEmergencyAlert = function() {
    const modal = new bootstrap.Modal(document.getElementById('emergencyAlertModal'));
    modal.show();
}

// Send emergency alert
window.sendEmergencyAlert = async function() {
    const message = document.getElementById('emergencyMessage').value.trim();
    const target = document.getElementById('emergencyTarget').value;
    const sectionId = target === 'section' ? document.getElementById('emergencySection').value : null;
    
    if (!message) {
        showAlert('Please enter an emergency message', 'danger');
        return;
    }
    
    if (target === 'section' && !sectionId) {
        showAlert('Please select a section', 'danger');
        return;
    }
    
    const sendBtn = document.getElementById('sendEmergencyBtn');
    const progressDiv = document.getElementById('emergencyProgress');
    const progressBar = document.getElementById('emergencyProgressBar');
    const progressText = document.getElementById('emergencyProgressText');
    
    sendBtn.disabled = true;
    progressDiv.style.display = 'block';
    
    try {
        // Get students
        const filters = [];
        if (sectionId) {
            filters.push({ field: 'section_id', operator: '==', value: sectionId });
        }
        filters.push({ field: 'status', operator: '==', value: 'active' });
        
        const students = await getDocuments('students', filters);
        
        if (students.length === 0) {
            showAlert('No students found', 'warning');
            sendBtn.disabled = false;
            progressDiv.style.display = 'none';
            return;
        }
        
        progressText.textContent = `Sending to ${students.length} parents...`;
        
        let success = 0;
        let failed = 0;
        
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const progress = ((i + 1) / students.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Sending ${i + 1} of ${students.length}...`;
            
            if (student.guardian_contact) {
                try {
                    const response = await fetch(SMS_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'send_emergency',
                            parent_phone: student.guardian_contact,
                            student_name: `${student.first_name} ${student.last_name}`,
                            alert_message: message
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        success++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    failed++;
                }
            } else {
                failed++;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Close modal and show results
        bootstrap.Modal.getInstance(document.getElementById('emergencyAlertModal')).hide();
        showAlert(`Emergency alerts sent! Success: ${success}, Failed: ${failed}`, 'success');
        
        // Refresh stats and logs
        await loadSMSStats();
        await loadSMSLogs();
        
    } catch (error) {
        console.error('Error sending emergency alerts:', error);
        showAlert('Error sending emergency alerts', 'danger');
    } finally {
        sendBtn.disabled = false;
        progressDiv.style.display = 'none';
        progressBar.style.width = '0%';
    }
}

// Show absence notifications modal
window.showAbsenceNotifications = function() {
    const modal = new bootstrap.Modal(document.getElementById('absenceModal'));
    modal.show();
}

// Load absent students
window.loadAbsentStudents = async function() {
    const date = document.getElementById('absenceDate').value;
    const container = document.getElementById('absentStudentsList');
    const sendBtn = document.getElementById('sendAbsenceBtn');
    
    if (!date) {
        showAlert('Please select a date', 'danger');
        return;
    }
    
    container.innerHTML = '<div class="text-center"><div class="spinner-border"></div><p>Loading...</p></div>';
    
    try {
        // Get all active students
        const students = await getDocuments('students', [
            { field: 'status', operator: '==', value: 'active' }
        ]);
        
        // Get attendance logs for the date
        const logs = await getDocuments('entrance_logs');
        const attendedIds = new Set();
        
        logs.forEach(log => {
            if (log.timestamp && log.timestamp.startsWith(date)) {
                attendedIds.add(log.student_id);
            }
        });
        
        // Filter absent students (match by student_number)
        const absentStudents = students.filter(s => !attendedIds.has(s.student_number));
        
        if (absentStudents.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i>
                    No absent students found for ${new Date(date).toLocaleDateString()}!
                </div>
            `;
            sendBtn.style.display = 'none';
            return;
        }
        
        // Display absent students
        container.innerHTML = `
            <div class="alert alert-info">
                Found ${absentStudents.length} absent student(s)
            </div>
            <div class="list-group">
                ${absentStudents.map(s => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0">${s.first_name} ${s.last_name}</h6>
                                <small class="text-muted">
                                    Grade ${s.grade_level} - Section: ${s.section_id || 'No section'}
                                    ${s.guardian_contact ? `| Guardian: ${s.guardian_contact}` : ' | <span class="text-danger">No guardian contact</span>'}
                                </small>
                            </div>
                            <input type="checkbox" class="form-check-input absent-student-check" 
                                value="${s.id}" ${s.guardian_contact ? 'checked' : 'disabled'}>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        sendBtn.style.display = 'inline-block';
    } catch (error) {
        console.error('Error loading absent students:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Error loading absent students. Please try again.
            </div>
        `;
        sendBtn.style.display = 'none';
    }
}

// Send absence notifications
window.sendAbsenceNotifications = async function() {
    const date = document.getElementById('absenceDate').value;
    const checkboxes = document.querySelectorAll('.absent-student-check:checked');
    const studentIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (studentIds.length === 0) {
        showAlert('Please select at least one student', 'warning');
        return;
    }
    
    const sendBtn = document.getElementById('sendAbsenceBtn');
    const progressDiv = document.getElementById('absenceProgress');
    const progressBar = document.getElementById('absenceProgressBar');
    const progressText = document.getElementById('absenceProgressText');
    
    sendBtn.disabled = true;
    progressDiv.style.display = 'block';
    
    try {
        // Get selected students
        const students = await getDocuments('students', [
            { field: 'id', operator: 'in', value: studentIds }
        ]);
        
        let success = 0;
        let failed = 0;
        
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const progress = ((i + 1) / students.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Sending ${i + 1} of ${students.length}...`;
            
            if (student.guardian_contact) {
                try {
                    const response = await fetch(SMS_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'send_absence',
                            student: student,
                            parent_phone: student.guardian_contact,
                            date: date
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        success++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    failed++;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Close modal and show results
        bootstrap.Modal.getInstance(document.getElementById('absenceModal')).hide();
        showAlert(`Absence notifications sent! Success: ${success}, Failed: ${failed}`, 'success');
        
        // Refresh stats and logs
        await loadSMSStats();
        await loadSMSLogs();
        
    } catch (error) {
        console.error('Error sending absence notifications:', error);
        showAlert('Error sending absence notifications', 'danger');
    } finally {
        sendBtn.disabled = false;
        progressDiv.style.display = 'none';
        progressBar.style.width = '0%';
    }
}

// Refresh logs
window.refreshLogs = async function() {
    await loadSMSStats();
    await loadSMSLogs();
    showAlert('SMS logs refreshed', 'success');
}

// Logout
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// ===== LOW ATTENDANCE EMAIL NOTIFICATIONS =====

// Show low attendance warning modal
window.showLowAttendanceWarning = function() {
    const modal = new bootstrap.Modal(document.getElementById('lowAttendanceModal'));
    modal.show();
}

// Update attendance period when date range changes
window.updateAttendancePeriod = function() {
    const dateRange = document.getElementById('attendanceDateRange').value;
    const customDiv = document.getElementById('customDateRange');
    
    if (dateRange === 'custom') {
        customDiv.style.display = 'block';
        // Set default custom dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        document.getElementById('customStartDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('customEndDate').value = endDate.toISOString().split('T')[0];
    } else {
        customDiv.style.display = 'none';
    }
}

// Find students with low attendance
window.findLowAttendanceStudents = async function() {
    try {
        const dateRange = document.getElementById('attendanceDateRange').value;
        const threshold = parseInt(document.getElementById('attendanceThreshold').value);
        
        // Calculate date range
        let startDate, endDate;
        if (dateRange === 'custom') {
            startDate = document.getElementById('customStartDate').value;
            endDate = document.getElementById('customEndDate').value;
            if (!startDate || !endDate) {
                showAlert('Please select both start and end dates', 'warning');
                return;
            }
        } else {
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(dateRange));
        }
        
        const startDateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
        const endDateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
        
        // Get all students
        const students = await getDocuments('students');
        
        // Calculate attendance for each student
        const lowAttendanceStudents = [];
        const totalDays = Math.ceil((new Date(endDateStr) - new Date(startDateStr)) / (1000 * 60 * 60 * 24));
        
        for (const student of students) {
            // Get attendance logs for this student in date range
            const { data: logs, error } = await window.supabase
                .from('entrance_logs')
                .select('*')
                .eq('student_id', student.id)
                .gte('timestamp', startDateStr)
                .lte('timestamp', endDateStr + 'T23:59:59');
            
            if (error) {
                console.error('Error fetching logs for student:', student.student_number, error);
                continue;
            }
            
            // Count unique days present
            const uniqueDays = new Set();
            if (logs) {
                logs.forEach(log => {
                    const date = log.timestamp.split('T')[0];
                    uniqueDays.add(date);
                });
            }
            
            const daysPresent = uniqueDays.size;
            const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
            
            // Check if below threshold and has email
            if (attendanceRate < threshold && student.email) {
                lowAttendanceStudents.push({
                    ...student,
                    daysPresent,
                    totalDays,
                    attendanceRate: attendanceRate.toFixed(1)
                });
            }
        }
        
        // Display results
        displayLowAttendanceStudents(lowAttendanceStudents, totalDays);
        
    } catch (error) {
        console.error('Error finding low attendance students:', error);
        showAlert('Error analyzing attendance data', 'danger');
    }
}

// Display low attendance students
function displayLowAttendanceStudents(students, totalDays) {
    const container = document.getElementById('lowAttendanceStudentsList');
    const sendBtn = document.getElementById('sendEmailBtn');
    
    if (students.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i>
                <strong>Great news!</strong> No students found below the attendance threshold.
            </div>
        `;
        sendBtn.style.display = 'none';
        return;
    }
    
    let html = `
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle"></i>
            Found <strong>${students.length}</strong> student(s) with low attendance rate.
        </div>
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
            <table class="table table-sm table-hover">
                <thead class="sticky-top bg-white">
                    <tr>
                        <th>Student #</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Days Present</th>
                        <th>Attendance Rate</th>
                        <th>
                            <input type="checkbox" id="selectAllStudents" onchange="toggleAllStudents(this.checked)" checked>
                        </th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    students.forEach((student, index) => {
        const rateClass = student.attendanceRate < 50 ? 'text-danger' : 
                         student.attendanceRate < 70 ? 'text-warning' : 'text-info';
        html += `
            <tr>
                <td>${student.student_number}</td>
                <td>${student.last_name}, ${student.first_name}</td>
                <td><small>${student.email}</small></td>
                <td>${student.daysPresent} / ${totalDays}</td>
                <td class="${rateClass}"><strong>${student.attendanceRate}%</strong></td>
                <td>
                    <input type="checkbox" class="student-checkbox" data-index="${index}" checked>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    sendBtn.style.display = 'block';
    
    // Store students data for sending emails
    window.lowAttendanceStudentsData = students;
}

// Toggle all student checkboxes
window.toggleAllStudents = function(checked) {
    document.querySelectorAll('.student-checkbox').forEach(cb => {
        cb.checked = checked;
    });
}

// Toggle email preview
window.toggleEmailPreview = function() {
    const preview = document.getElementById('emailPreview');
    preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
}

// Refresh attendance data
window.refreshAttendanceData = function() {
    document.getElementById('lowAttendanceStudentsList').innerHTML = '';
    document.getElementById('sendEmailBtn').style.display = 'none';
    showAlert('Data cleared. Click "Find Students" to search again.', 'info');
}

// Send low attendance emails
window.sendLowAttendanceEmails = async function() {
    try {
        const sendBtn = document.getElementById('sendEmailBtn');
        const progressDiv = document.getElementById('emailProgress');
        const progressBar = document.getElementById('emailProgressBar');
        const progressText = document.getElementById('emailProgressText');
        
        // Get selected students
        const selectedIndices = [];
        document.querySelectorAll('.student-checkbox:checked').forEach(cb => {
            selectedIndices.push(parseInt(cb.dataset.index));
        });
        
        if (selectedIndices.length === 0) {
            showAlert('Please select at least one student', 'warning');
            return;
        }
        
        const selectedStudents = selectedIndices.map(i => window.lowAttendanceStudentsData[i]);
        
        if (!confirm(`Send email warnings to ${selectedStudents.length} student(s)?`)) {
            return;
        }
        
        sendBtn.disabled = true;
        progressDiv.style.display = 'block';
        
        let success = 0;
        let failed = 0;
        
        for (let i = 0; i < selectedStudents.length; i++) {
            const student = selectedStudents[i];
            const progress = ((i + 1) / selectedStudents.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Sending ${i + 1} of ${selectedStudents.length}...`;
            
            try {
                // Send email via API
                const response = await fetch('/api/password-reset/send-otp.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: student.email,
                        customSubject: 'Attendance Warning - Low Attendance Rate',
                        customMessage: `Dear ${student.first_name} ${student.last_name},

This is to inform you that your attendance rate has fallen below the acceptable threshold.

Current Attendance Status:
- Days Present: ${student.daysPresent} out of ${student.totalDays} days
- Attendance Rate: ${student.attendanceRate}%
- Student Number: ${student.student_number}

Attendance is crucial for your academic success. Regular attendance helps you:
- Keep up with lessons and coursework
- Participate in class discussions
- Build good study habits
- Maintain good academic standing

Please ensure you attend classes regularly. If you are experiencing difficulties that prevent you from attending, please contact your adviser or the school administration.

Best regards,
Mabini High School Administration`
                    })
                });
                
                const result = await response.json();
                if (result.success || response.ok) {
                    success++;
                } else {
                    failed++;
                    console.error('Email send failed for:', student.email, result);
                }
            } catch (error) {
                failed++;
                console.error('Error sending email to:', student.email, error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Close modal and show results
        bootstrap.Modal.getInstance(document.getElementById('lowAttendanceModal')).hide();
        showAlert(`Email warnings sent! Success: ${success}, Failed: ${failed}`, success > 0 ? 'success' : 'danger');
        
    } catch (error) {
        console.error('Error sending low attendance emails:', error);
        showAlert('Error sending email warnings', 'danger');
    } finally {
        document.getElementById('sendEmailBtn').disabled = false;
        document.getElementById('emailProgress').style.display = 'none';
        document.getElementById('emailProgressBar').style.width = '0%';
    }
}
