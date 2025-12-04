/**
 * Absence Notifications Page - Admin Interface
 * Handles SMS notifications for absent students
 */

import { supabase, ensureAuthenticated } from './ensure-auth.js';

let absentStudents = [];
let filteredStudents = [];
let selectedStudents = new Set();

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated('admin');
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('absenceDate').value = today;
        
        await loadSections();
        await loadAbsentStudents();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing absence notifications page:', error);
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

// Load absent students for selected date
window.loadAbsentStudents = async function() {
    const dateInput = document.getElementById('absenceDate');
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
        showToast('Please select a date', 'warning');
        return;
    }
    
    try {
        showLoading('Loading absent students...');
        
        // Get all students
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('status', 'active');
        
        if (studentsError) throw studentsError;
        
        // Get attendance records for the selected date
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id')
            .gte('check_in_time', `${selectedDate} 00:00:00`)
            .lte('check_in_time', `${selectedDate} 23:59:59`);
        
        if (attendanceError) throw attendanceError;
        
        // Students who checked in
        const presentStudentIds = new Set(attendance.map(a => a.student_id));
        
        // Filter absent students
        absentStudents = students.filter(student => !presentStudentIds.has(student.id));
        filteredStudents = [...absentStudents];
        
        // Update stats
        document.getElementById('totalAbsent').textContent = absentStudents.length;
        document.getElementById('totalCountBtn').textContent = absentStudents.length;
        
        const studentsWithContact = absentStudents.filter(s => s.parent_contact || s.contact_number);
        document.getElementById('hasContact').textContent = studentsWithContact.length;
        
        document.getElementById('displayCount').textContent = filteredStudents.length;
        
        renderAbsentStudents();
        hideLoading();
    } catch (error) {
        console.error('Error loading absent students:', error);
        showToast('Error loading absent students', 'error');
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

// Render absent students table
function renderAbsentStudents() {
    const tbody = document.getElementById('absentTableBody');
    
    if (!filteredStudents || filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No absent students found for this date</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredStudents.map(student => {
        const isSelected = selectedStudents.has(student.id);
        const hasContact = student.parent_contact || student.contact_number;
        
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
                <td>${student.grade_level || 'N/A'}</td>
                <td>
                    ${hasContact ? 
                        `<span class="badge bg-success">${student.parent_contact || student.contact_number}</span>` : 
                        `<span class="badge bg-danger">No Contact</span>`
                    }
                </td>
                <td><span class="badge bg-warning">Absent</span></td>
            </tr>
        `;
    }).join('');
    
    updateCounts();
}

// Filter recipients
window.filterRecipients = function() {
    const sectionFilter = document.getElementById('sectionFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredStudents = absentStudents.filter(student => {
        const matchesSection = !sectionFilter || student.section_id == sectionFilter;
        const matchesSearch = !searchTerm || 
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm) ||
            (student.student_number || '').toLowerCase().includes(searchTerm);
        
        return matchesSection && matchesSearch;
    });
    
    document.getElementById('displayCount').textContent = filteredStudents.length;
    renderAbsentStudents();
};

// Apply message template
window.applyTemplate = function() {
    const template = document.getElementById('messageTemplate').value;
    const messageText = document.getElementById('messageText');
    
    switch(template) {
        case 'default':
            messageText.value = 'Dear Parent/Guardian, your student [STUDENT_NAME] is absent today [DATE]. If this is unexpected, please contact the school. - Mabini HS';
            break;
        case 'concern':
            messageText.value = 'IMPORTANT: [STUDENT_NAME] was marked absent on [DATE]. Please confirm if this absence is authorized. Contact the school office if you have concerns. - Mabini HS';
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
        if (student.parent_contact || student.contact_number) {
            selectedStudents.add(student.id);
        }
    });
    document.getElementById('selectAllCheckbox').checked = true;
    renderAbsentStudents();
};

// Deselect all
window.deselectAll = function() {
    selectedStudents.clear();
    document.getElementById('selectAllCheckbox').checked = false;
    renderAbsentStudents();
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
    
    if (!confirm(`Send absence notification to ${selectedStudents.size} selected parent(s)?`)) {
        return;
    }
    
    try {
        const students = absentStudents.filter(s => selectedStudents.has(s.id));
        await sendAbsenceNotifications(students, message);
    } catch (error) {
        console.error('Error sending notifications:', error);
        showToast('Error sending notifications', 'error');
    }
};

// Send to all absent students
window.sendToAll = async function() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    const studentsWithContact = filteredStudents.filter(s => s.parent_contact || s.contact_number);
    
    if (!confirm(`Send absence notification to all ${studentsWithContact.length} parent(s)?`)) {
        return;
    }
    
    try {
        await sendAbsenceNotifications(studentsWithContact, message);
    } catch (error) {
        console.error('Error sending notifications:', error);
        showToast('Error sending notifications', 'error');
    }
};

// Send absence notifications
async function sendAbsenceNotifications(students, messageTemplate) {
    showLoading('Sending absence notifications...');
    
    const selectedDate = document.getElementById('absenceDate').value;
    const formattedDate = new Date(selectedDate).toLocaleDateString();
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of students) {
        const contact = student.parent_contact || student.contact_number;
        if (!contact) {
            failCount++;
            continue;
        }
        
        // Replace placeholders
        let message = messageTemplate
            .replace('[STUDENT_NAME]', `${student.first_name} ${student.last_name}`)
            .replace('[DATE]', formattedDate)
            .replace('[SECTION]', student.section_name || 'N/A');
        
        try {
            // Here you would integrate with your SMS service
            console.log(`Sending to ${student.first_name} ${student.last_name} (${contact}): ${message}`);
            
            // TODO: Implement actual SMS sending
            // await sendSMS(contact, message);
            
            successCount++;
        } catch (error) {
            console.error(`Failed to send to ${student.first_name} ${student.last_name}:`, error);
            failCount++;
        }
    }
    
    hideLoading();
    
    if (successCount > 0) {
        showToast(`Successfully sent ${successCount} notification(s)`, 'success');
        
        // Clear selection
        deselectAll();
    }
    
    if (failCount > 0) {
        showToast(`Failed to send ${failCount} notification(s)`, 'warning');
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
