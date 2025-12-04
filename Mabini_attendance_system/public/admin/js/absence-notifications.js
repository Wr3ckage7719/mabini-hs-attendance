/**
 * Absence Notifications Page - Admin Interface
 * Handles SMS notifications for absent students with automated message generation
 */

import { supabase, ensureAuthenticated } from './ensure-auth.js';
import { smsClient } from '../../js/sms-client.js';

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
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="mt-2 mb-0 text-muted">No data available yet</p>
                    <small class="text-muted">No absent students found for the selected date</small>
                </td>
            </tr>
        `;
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
    
    if (!confirm(`Send absence notification to ${selectedStudents.size} selected parent(s)?`)) {
        return;
    }
    
    try {
        const students = absentStudents.filter(s => selectedStudents.has(s.id));
        await sendAbsenceNotifications(students);
    } catch (error) {
        console.error('Error sending notifications:', error);
        showToast('Error sending notifications', 'error');
    }
};

// Send to all absent students
window.sendToAll = async function() {
    const studentsWithContact = filteredStudents.filter(s => s.parent_contact || s.contact_number);
    
    if (!confirm(`Send absence notification to all ${studentsWithContact.length} parent(s)?`)) {
        return;
    }
    
    try {
        await sendAbsenceNotifications(studentsWithContact);
    } catch (error) {
        console.error('Error sending notifications:', error);
        showToast('Error sending notifications', 'error');
    }
};

// Send absence notifications with automated message generation
async function sendAbsenceNotifications(students) {
    showLoading('Sending absence notifications...');
    
    const selectedDate = document.getElementById('absenceDate').value;
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of students) {
        const contact = student.parent_contact || student.contact_number;
        if (!contact) {
            failCount++;
            continue;
        }
        
        // Auto-generate message for this student
        const studentName = `${student.first_name} ${student.last_name}`;
        const message = `Dear Parent/Guardian, your student ${studentName} is absent today (${formattedDate}). If this absence is unexpected, please contact Mabini HS immediately. Thank you.`;
        
        try {
            // Use the SMS client to send
            const result = await smsClient.sendCustom(contact, message);
            
            if (result.success) {
                console.log(`✓ Sent to ${studentName} (${contact})`);
                successCount++;
            } else {
                console.error(`✗ Failed to send to ${studentName}:`, result.error);
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
    
    if (successCount > 0) {
        showToast(`Successfully sent ${successCount} notification(s)`, 'success');
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
