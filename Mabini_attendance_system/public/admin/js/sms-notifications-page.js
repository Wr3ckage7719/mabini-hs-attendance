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
