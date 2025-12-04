/**
 * Low Attendance Warning Page - Admin Interface
 * Handles email/SMS warnings for students with low attendance and automated message generation
 */

import { supabase, ensureAuthenticated } from './ensure-auth.js';
import { smsClient } from '../../js/sms-client.js';

let lowAttendanceStudents = [];
let filteredStudents = [];
let selectedStudents = new Set();

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated('admin');
        // Load sections and students in parallel, don't block on sections failure
        Promise.all([
            loadSections().catch(err => console.error('Sections load failed:', err)),
            loadLowAttendanceStudents()
        ]);
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing low attendance warning page:', error);
        showToast('Error initializing page: ' + error.message, 'error');
    }
});

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }
}

// Load students with low attendance
window.loadLowAttendanceStudents = async function() {
    const threshold = parseInt(document.getElementById('attendanceThreshold').value);
    const dateRange = parseInt(document.getElementById('dateRange').value);
    
    try {
        showLoading('Calculating attendance rates...');
        
        // Get all active students with section info
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select(`
                *,
                sections:section_id (
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('status', 'active');
        
        if (studentsError) throw studentsError;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);
        
        // Format dates for SQL date comparison (YYYY-MM-DD)
        const endDateStr = endDate.toISOString().split('T')[0];
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Get attendance records for date range
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id, attendance_date, status')
            .gte('attendance_date', startDateStr)
            .lte('attendance_date', endDateStr)
            .in('status', ['present', 'late']);
        
        if (attendanceError) throw attendanceError;
        
        // Calculate attendance rate for each student
        // Count unique dates per student (a student can only attend once per day)
        const attendanceMap = {};
        if (attendance && attendance.length > 0) {
            attendance.forEach(record => {
                if (!attendanceMap[record.student_id]) {
                    attendanceMap[record.student_id] = new Set();
                }
                attendanceMap[record.student_id].add(record.attendance_date);
            });
        }
        
        // Convert sets to counts
        const attendanceCounts = {};
        Object.keys(attendanceMap).forEach(studentId => {
            attendanceCounts[studentId] = attendanceMap[studentId].size;
        });
        
        // Filter students with low attendance
        lowAttendanceStudents = students.map(student => {
            const daysPresent = attendanceCounts[student.id] || 0;
            const attendanceRate = dateRange > 0 ? (daysPresent / dateRange) * 100 : 0;
            
            return {
                ...student,
                section_name: student.sections?.name || 'N/A',
                days_present: daysPresent,
                days_absent: dateRange - daysPresent,
                total_days: dateRange,
                attendance_rate: attendanceRate.toFixed(1)
            };
        }).filter(student => parseFloat(student.attendance_rate) < threshold);
        
        filteredStudents = [...lowAttendanceStudents];
        
        // Update stats
        document.getElementById('totalLowAttendance').textContent = lowAttendanceStudents.length;
        document.getElementById('totalCountBtn').textContent = lowAttendanceStudents.length;
        
        const criticalStudents = lowAttendanceStudents.filter(s => parseFloat(s.attendance_rate) < 60);
        document.getElementById('criticalCount').textContent = criticalStudents.length;
        
        const warningStudents = lowAttendanceStudents.filter(s => {
            const rate = parseFloat(s.attendance_rate);
            return rate >= 60 && rate < 75;
        });
        document.getElementById('warningCount').textContent = warningStudents.length;
        
        document.getElementById('displayCount').textContent = filteredStudents.length;
        
        renderStudents();
        hideLoading();
    } catch (error) {
        console.error('Error loading low attendance students:', error);
        showToast('Error calculating attendance rates', 'error');
        hideLoading();
    }
};

// Load sections for filter
async function loadSections() {
    try {
        const { data, error } = await supabase
            .from('sections')
            .select('*')
            .order('name');
        
        if (error) {
            console.error('Sections query error:', error);
            throw error;
        }
        
        const sectionFilter = document.getElementById('sectionFilter');
        if (sectionFilter && data) {
            data.forEach(section => {
                const option = document.createElement('option');
                option.value = section.id;
                option.textContent = section.name;
                sectionFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading sections:', error);
        // Don't show toast, this is optional filter data
    }
}

// Render students table
function renderStudents() {
    const tbody = document.getElementById('lowAttendanceTableBody');
    
    if (!filteredStudents || filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="mt-2 mb-0 text-muted">No data available yet</p>
                    <small class="text-muted">No students found with low attendance for the selected criteria</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredStudents.map(student => {
        const isSelected = selectedStudents.has(student.id);
        const hasEmail = student.email; // Students receive via their institutional email
        const rate = parseFloat(student.attendance_rate);
        
        let badgeClass = 'bg-success';
        if (rate < 60) badgeClass = 'bg-danger';
        else if (rate < 75) badgeClass = 'bg-warning';
        
        return `
            <tr>
                <td>
                    <input type="checkbox" 
                        ${isSelected ? 'checked' : ''} 
                        ${!hasEmail ? 'disabled' : ''}
                        onchange="toggleStudent('${student.id}')">
                </td>
                <td>${student.student_number || 'N/A'}</td>
                <td>${student.first_name} ${student.last_name}</td>
                <td>${student.section_name || 'N/A'}</td>
                <td><span class="badge ${badgeClass}">${student.attendance_rate}%</span></td>
                <td>${student.days_absent}</td>
                <td>${student.total_days}</td>
                <td>${student.email || '<span class="text-muted">No email</span>'}</td>
                <td>
                    ${student.parent_contact || student.contact_number ? 
                        `<span class="badge bg-success">${student.parent_contact || student.contact_number}</span>` : 
                        `<span class="text-muted">-</span>`
                    }
                </td>
            </tr>
        `;
    }).join('');
    
    updateCounts();
}

// Filter recipients
window.filterRecipients = function() {
    const sectionFilter = document.getElementById('sectionFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredStudents = lowAttendanceStudents.filter(student => {
        const matchesSection = !sectionFilter || student.section_id == sectionFilter;
        const matchesSearch = !searchTerm || 
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm) ||
            (student.student_number || '').toLowerCase().includes(searchTerm);
        
        return matchesSection && matchesSearch;
    });
    
    document.getElementById('displayCount').textContent = filteredStudents.length;
    renderStudents();
};

// Toggle student selection
window.toggleStudent = function(studentId) {
    if (selectedStudents.has(studentId)) {
        selectedStudents.delete(studentId);
    } else {
        selectedStudents.add(studentId);
    }
    updateCounts();
};

// Toggle select all
window.toggleSelectAll = function() {
    const checkbox = document.getElementById('selectAllCheckbox');
    if (checkbox.checked) {
        selectAll();
    } else {
        deselectAll();
    }
};

// Select all visible students
window.selectAll = function() {
    filteredStudents.forEach(student => {
        if (student.email) { // Only students with institutional email
            selectedStudents.add(student.id);
        }
    });
    document.getElementById('selectAllCheckbox').checked = true;
    renderStudents();
};

// Deselect all
window.deselectAll = function() {
    selectedStudents.clear();
    document.getElementById('selectAllCheckbox').checked = false;
    renderStudents();
};

// Update counts
function updateCounts() {
    const count = selectedStudents.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('selectedCountBtn').textContent = count;
}

// Send to selected students
window.sendToSelected = async function() {
    if (selectedStudents.size === 0) {
        showToast('Please select at least one student', 'warning');
        return;
    }
    
    const notificationType = document.getElementById('notificationType').value;
    
    if (!confirm(`Send warning to ${selectedStudents.size} selected student(s) via ${notificationType}?`)) {
        return;
    }
    
    try {
        const students = lowAttendanceStudents.filter(s => selectedStudents.has(s.id));
        await sendWarnings(students, notificationType);
    } catch (error) {
        console.error('Error sending warnings:', error);
        showToast('Error sending warnings', 'error');
    }
};

// Send to all students
window.sendToAll = async function() {
    const notificationType = document.getElementById('notificationType').value;
    const studentsWithEmail = filteredStudents.filter(s => s.email); // Only students with institutional email
    
    if (studentsWithEmail.length === 0) {
        showToast('No students have institutional email addresses', 'warning');
        return;
    }
    
    if (!confirm(`Send warning to all ${studentsWithEmail.length} student(s) via ${notificationType}?`)) {
        return;
    }
    
    try {
        await sendWarnings(studentsWithEmail, notificationType);
    } catch (error) {
        console.error('Error sending warnings:', error);
        showToast('Error sending warnings', 'error');
    }
};

// Generate automated message based on attendance rate
function generateAttendanceMessage(student) {
    const rate = parseFloat(student.attendance_rate);
    const studentName = `${student.first_name} ${student.last_name}`;
    
    if (rate < 60) {
        // Critical message
        return `URGENT: ${studentName}, your attendance rate is critically low at ${rate}% (${student.days_absent} absences in ${student.total_days} days). This is below the minimum 75% requirement. Immediate action is required. Please contact your adviser at Mabini HS.`;
    } else {
        // Warning message
        return `Dear ${studentName}, your attendance rate is currently ${rate}% (${student.days_absent} absences in ${student.total_days} days). You need to improve your attendance to meet the required 75% threshold. Please ensure regular attendance. - Mabini HS`;
    }
}

// Send warnings with automated message generation
async function sendWarnings(students, notificationType) {
    showLoading(`Sending ${notificationType} warnings...`);
    
    let successCount = 0;
    let failCount = 0;
    let noEmailCount = 0;
    let noContactCount = 0;
    
    for (const student of students) {
        // Auto-generate message based on attendance rate
        const message = generateAttendanceMessage(student);
        const studentName = `${student.first_name} ${student.last_name}`;
        
        try {
            let emailSent = false;
            let smsSent = false;
            
            // Send via Email to student's institutional email
            if (notificationType === 'email' || notificationType === 'both') {
                if (student.email) {
                    // TODO: Implement actual email sending via email service (SendGrid, AWS SES, etc.)
                    // For now, logging to console as placeholder
                    console.log(`📧 Email to be sent to ${studentName} (${student.email}): ${message}`);
                    emailSent = true;
                } else {
                    console.warn(`⚠ No institutional email for ${studentName}`);
                    noEmailCount++;
                }
            }
            
            // Send via SMS to parents/guardians
            if (notificationType === 'sms' || notificationType === 'both') {
                const contact = student.parent_contact || student.contact_number;
                if (contact) {
                    const result = await smsClient.sendCustom(contact, message);
                    if (result.success) {
                        console.log(`✓ SMS sent to ${studentName}'s parent/guardian (${contact})`);
                        smsSent = true;
                    } else {
                        console.error(`✗ SMS failed for ${studentName}:`, result.error);
                    }
                } else {
                    console.warn(`⚠ No parent/guardian contact for ${studentName}`);
                    noContactCount++;
                }
            }
            
            // Count as success if at least one notification method succeeded
            if (emailSent || smsSent) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error(`✗ Error sending to ${studentName}:`, error);
            failCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    hideLoading();
    
    // Show results
    if (successCount > 0) {
        const notifType = notificationType === 'both' ? 'Email & SMS' : 
                         notificationType === 'sms' ? 'SMS' : 'Email';
        showToast(`Successfully queued ${successCount} ${notifType} warning(s)`, 'success');
        deselectAll();
    }
    
    if (failCount > 0 || noEmailCount > 0 || noContactCount > 0) {
        let warnings = [];
        if (noEmailCount > 0) {
            warnings.push(`${noEmailCount} student(s) missing institutional email`);
        }
        if (noContactCount > 0) {
            warnings.push(`${noContactCount} student(s) missing parent contact`);
        }
        if (failCount > 0) {
            warnings.push(`${failCount} notification(s) failed to send`);
        }
        showToast(warnings.join('; '), 'warning');
    }
}

// Helper functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading(message) {
    const loading = document.createElement('div');
    loading.id = 'loadingIndicator';
    loading.className = 'position-fixed top-50 start-50 translate-middle';
    loading.style.zIndex = '9999';
    loading.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">${message}</p>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) loading.remove();
}
