/**
 * SMS Notifications Module for Admin
 * Handles sending SMS alerts and viewing logs
 */

import { getDocuments, getDocument } from './admin-common.js';

const SMS_API = '../api/services/sms_service.php';

/**
 * Send absence notifications for selected students
 */
export async function sendAbsenceNotifications(studentIds, date = null) {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    try {
        // Get student details
        const students = await getDocuments('students', [
            { field: 'id', operator: 'in', value: studentIds }
        ]);
        
        // Send SMS to each student's guardian
        for (const student of students) {
            if (student.guardian_contact) {
                try {
                    const response = await fetch(SMS_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'send_absence',
                            student: student,
                            parent_phone: student.guardian_contact,
                            date: date || new Date().toISOString().split('T')[0]
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`${student.first_name} ${student.last_name}: ${result.error}`);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`${student.first_name} ${student.last_name}: ${error.message}`);
                }
            } else {
                results.failed++;
                results.errors.push(`${student.first_name} ${student.last_name}: No guardian contact`);
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error sending absence notifications:', error);
        throw error;
    }
}

/**
 * Send emergency alert to all parents or specific section
 */
export async function sendEmergencyAlert(alertMessage, sectionId = null) {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    try {
        // Get students (all or by section)
        const filters = sectionId ? [{ field: 'section', operator: '==', value: sectionId }] : [];
        const students = await getDocuments('students', filters);
        
        // Send SMS to each guardian
        for (const student of students) {
            if (student.guardian_contact) {
                try {
                    const studentName = `${student.first_name} ${student.last_name}`;
                    const response = await fetch(SMS_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'send_emergency',
                            parent_phone: student.guardian_contact,
                            student_name: studentName,
                            alert_message: alertMessage
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`${studentName}: ${result.error}`);
                    }
                    
                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    results.failed++;
                    results.errors.push(`${student.first_name} ${student.last_name}: ${error.message}`);
                }
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error sending emergency alert:', error);
        throw error;
    }
}

/**
 * Get SMS logs
 */
export async function getSMSLogs(limit = 100) {
    try {
        const response = await fetch('../logs/sms_log.txt');
        const text = await response.text();
        
        const lines = text.trim().split('\n').slice(-limit).reverse();
        return lines.map(line => {
            // Parse log format: [timestamp] TO: phone | MSG: message | RESPONSE: response
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

/**
 * Show SMS notification modal
 */
export function showSMSModal(type = 'absence') {
    const modalHtml = `
        <div class="modal fade" id="smsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-chat-dots"></i>
                            ${type === 'emergency' ? 'Send Emergency Alert' : 'Send SMS Notifications'}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${type === 'emergency' ? `
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle"></i>
                                <strong>Warning:</strong> This will send an SMS to all parents/guardians.
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Emergency Message</label>
                                <textarea id="emergencyMessage" class="form-control" rows="4" 
                                    placeholder="Enter emergency message..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Send To</label>
                                <select id="emergencyTarget" class="form-select">
                                    <option value="all">All Parents/Guardians</option>
                                    <option value="section">Specific Section</option>
                                </select>
                            </div>
                            <div id="sectionSelect" class="mb-3" style="display: none;">
                                <label class="form-label">Section</label>
                                <select id="emergencySection" class="form-select">
                                    <!-- Will be populated dynamically -->
                                </select>
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                SMS notifications will be sent to guardians of absent students.
                            </div>
                            <div id="studentsList"></div>
                        `}
                        <div id="smsProgress" class="mt-3" style="display: none;">
                            <div class="progress">
                                <div id="smsProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" 
                                    role="progressbar" style="width: 0%"></div>
                            </div>
                            <p class="text-center mt-2" id="smsProgressText">Sending...</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="sendSMSBtn">
                            <i class="bi bi-send"></i> Send SMS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('smsModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('smsModal'));
    modal.show();
    
    return modal;
}

/**
 * Display SMS logs in a table
 */
export async function displaySMSLogs(containerId) {
    const logs = await getSMSLogs();
    const container = document.getElementById(containerId);
    
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
                            <td>${log.recipient}</td>
                            <td>${log.message}</td>
                            <td>
                                <span class="badge bg-success">Sent</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHtml;
}
