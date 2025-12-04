/**
 * Emergency Alert Page - Admin Interface
 * Handles emergency SMS alerts to parents/guardians
 */

import { supabase, ensureAuthenticated } from './ensure-auth.js';

let allStudents = [];
let filteredStudents = [];
let selectedStudents = new Set();

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureAuthenticated('admin');
        await loadStudents();
        await loadSections();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing emergency alert page:', error);
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

// Load all students with parent contact info
async function loadStudents() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('status', 'active')
            .order('last_name');
        
        if (error) throw error;
        
        allStudents = data || [];
        filteredStudents = [...allStudents];
        
        document.getElementById('totalCount').textContent = allStudents.length;
        document.getElementById('displayCount').textContent = filteredStudents.length;
        
        renderStudents();
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Error loading students', 'error');
    }
}

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

// Render students table
function renderStudents() {
    const tbody = document.getElementById('recipientsTableBody');
    
    if (!filteredStudents || filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>';
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
            </tr>
        `;
    }).join('');
    
    updateCounts();
}

// Filter recipients
window.filterRecipients = function() {
    const sectionFilter = document.getElementById('sectionFilter').value;
    const gradeLevelFilter = document.getElementById('gradeLevelFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredStudents = allStudents.filter(student => {
        const matchesSection = !sectionFilter || student.section_id == sectionFilter;
        const matchesGradeLevel = !gradeLevelFilter || student.grade_level == gradeLevelFilter;
        const matchesSearch = !searchTerm || 
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm) ||
            (student.student_number || '').toLowerCase().includes(searchTerm);
        
        return matchesSection && matchesGradeLevel && matchesSearch;
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
        if (student.parent_contact || student.contact_number) {
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
    document.getElementById('selectedCount').textContent = selectedStudents.size;
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
    
    if (!confirm(`Send emergency alert to ${selectedStudents.size} selected student(s)?`)) {
        return;
    }
    
    try {
        const students = allStudents.filter(s => selectedStudents.has(s.id));
        await sendEmergencyAlerts(students, message);
    } catch (error) {
        console.error('Error sending alerts:', error);
        showToast('Error sending alerts', 'error');
    }
};

// Send to all students
window.sendToAll = async function() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    const studentsWithContact = filteredStudents.filter(s => s.parent_contact || s.contact_number);
    
    if (!confirm(`Send emergency alert to all ${studentsWithContact.length} student(s)?`)) {
        return;
    }
    
    try {
        await sendEmergencyAlerts(studentsWithContact, message);
    } catch (error) {
        console.error('Error sending alerts:', error);
        showToast('Error sending alerts', 'error');
    }
};

// Send emergency alerts
async function sendEmergencyAlerts(students, message) {
    showLoading('Sending emergency alerts...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of students) {
        const contact = student.parent_contact || student.contact_number;
        if (!contact) {
            failCount++;
            continue;
        }
        
        try {
            // Here you would integrate with your SMS service
            // For now, we'll just log the message
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
        showToast(`Successfully sent ${successCount} alert(s)`, 'success');
        
        // Clear selection and message
        deselectAll();
        document.getElementById('messageText').value = '';
        document.getElementById('charCount').textContent = '0';
    }
    
    if (failCount > 0) {
        showToast(`Failed to send ${failCount} alert(s)`, 'warning');
    }
}

// Toast notification
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

// Loading indicator
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
