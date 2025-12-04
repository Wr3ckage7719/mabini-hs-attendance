/**
 * Low Attendance Warning Page - Admin Interface
 * Handles email/SMS warnings for students with low attendance
 */

import { supabase, ensureAuthenticated } from './ensure-auth.js';

let lowAttendanceStudents = [];
let filteredStudents = [];
let selectedStudents = new Set();

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated('admin');
        await loadSections();
        await loadLowAttendanceStudents();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing low attendance warning page:', error);
    }
});

// Setup event listeners
function setupEventListeners() {
    const messageText = document.getElementById('messageText');
    if (messageText) {
        messageText.addEventListener('input', () => {
            const charCount = messageText.value.length;
            document.getElementById('charCount').textContent = charCount;
        });
    }

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
        
        // Get all active students
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('status', 'active');
        
        if (studentsError) throw studentsError;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);
        
        // Get attendance records for date range
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id, check_in_time')
            .gte('check_in_time', startDate.toISOString())
            .lte('check_in_time', endDate.toISOString());
        
        if (attendanceError) throw attendanceError;
        
        // Calculate attendance rate for each student
        const attendanceMap = {};
        attendance.forEach(record => {
            if (!attendanceMap[record.student_id]) {
                attendanceMap[record.student_id] = 0;
            }
            attendanceMap[record.student_id]++;
        });
        
        // Filter students with low attendance
        lowAttendanceStudents = students.map(student => {
            const daysPresent = attendanceMap[student.id] || 0;
            const attendanceRate = dateRange > 0 ? (daysPresent / dateRange) * 100 : 0;
            
            return {
                ...student,
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
            .eq('status', 'active')
            .order('name');
        
        if (error) throw error;
        
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
    }
}

// Render students table
function renderStudents() {
    const tbody = document.getElementById('lowAttendanceTableBody');
    
    if (!filteredStudents || filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No students found with low attendance</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredStudents.map(student => {
        const isSelected = selectedStudents.has(student.id);
        const hasContact = student.email || student.parent_contact || student.contact_number;
        const rate = parseFloat(student.attendance_rate);
        
        let badgeClass = 'bg-success';
        if (rate < 60) badgeClass = 'bg-danger';
        else if (rate < 75) badgeClass = 'bg-warning';
        
        return `
            <tr>
                <td>
                    <input type="checkbox" 
                        ${isSelected ? 'checked' : ''} 
                        ${!hasContact ? 'disabled' : ''}
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
                    ${hasContact ? 
                        `<span class="badge bg-success">${student.parent_contact || student.contact_number || 'Email only'}</span>` : 
                        `<span class="badge bg-danger">No Contact</span>`
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

// Apply message template
window.applyTemplate = function() {
    const template = document.getElementById('messageTemplate').value;
    const messageText = document.getElementById('messageText');
    
    switch(template) {
        case 'warning':
            messageText.value = 'Dear [STUDENT_NAME], your attendance rate is currently [ATTENDANCE_RATE]%. You have been absent for [DAYS_ABSENT] days out of [TOTAL_DAYS] days. Please improve your attendance to meet school requirements. - Mabini HS';
            break;
        case 'critical':
            messageText.value = 'URGENT: [STUDENT_NAME], your attendance rate has dropped to [ATTENDANCE_RATE]% ([DAYS_ABSENT] absences in [TOTAL_DAYS] days). This is below the minimum requirement. Immediate improvement is required. Please contact your adviser. - Mabini HS';
            break;
        default:
            break;
    }
    
    document.getElementById('charCount').textContent = messageText.value.length;
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
        if (student.email || student.parent_contact || student.contact_number) {
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
    
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    const notificationType = document.getElementById('notificationType').value;
    
    if (!confirm(`Send warning to ${selectedStudents.size} selected student(s) via ${notificationType}?`)) {
        return;
    }
    
    try {
        const students = lowAttendanceStudents.filter(s => selectedStudents.has(s.id));
        await sendWarnings(students, message, notificationType);
    } catch (error) {
        console.error('Error sending warnings:', error);
        showToast('Error sending warnings', 'error');
    }
};

// Send to all students
window.sendToAll = async function() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    const notificationType = document.getElementById('notificationType').value;
    const studentsWithContact = filteredStudents.filter(s => 
        s.email || s.parent_contact || s.contact_number
    );
    
    if (!confirm(`Send warning to all ${studentsWithContact.length} student(s) via ${notificationType}?`)) {
        return;
    }
    
    try {
        await sendWarnings(studentsWithContact, message, notificationType);
    } catch (error) {
        console.error('Error sending warnings:', error);
        showToast('Error sending warnings', 'error');
    }
};

// Send warnings
async function sendWarnings(students, messageTemplate, notificationType) {
    showLoading(`Sending ${notificationType} warnings...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of students) {
        // Replace placeholders
        let message = messageTemplate
            .replace('[STUDENT_NAME]', `${student.first_name} ${student.last_name}`)
            .replace('[ATTENDANCE_RATE]', student.attendance_rate)
            .replace('[DAYS_ABSENT]', student.days_absent)
            .replace('[TOTAL_DAYS]', student.total_days);
        
        try {
            if (notificationType === 'email' || notificationType === 'both') {
                if (student.email) {
                    console.log(`Sending email to ${student.first_name} ${student.last_name} (${student.email}): ${message}`);
                    // TODO: Implement email sending
                    // await sendEmail(student.email, 'Low Attendance Warning', message);
                }
            }
            
            if (notificationType === 'sms' || notificationType === 'both') {
                const contact = student.parent_contact || student.contact_number;
                if (contact) {
                    console.log(`Sending SMS to ${student.first_name} ${student.last_name} (${contact}): ${message}`);
                    // TODO: Implement SMS sending
                    // await sendSMS(contact, message);
                }
            }
            
            successCount++;
        } catch (error) {
            console.error(`Failed to send to ${student.first_name} ${student.last_name}:`, error);
            failCount++;
        }
    }
    
    hideLoading();
    
    if (successCount > 0) {
        showToast(`Successfully sent ${successCount} warning(s)`, 'success');
        
        // Clear selection
        deselectAll();
    }
    
    if (failCount > 0) {
        showToast(`Failed to send ${failCount} warning(s)`, 'warning');
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
