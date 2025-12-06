/**
 * Teacher Attendance Records
 * View, add, and edit student attendance records
 */

import { dataClient } from '../../js/data-client.js';
import { supabase } from '../../js/supabase-client.js';

// DOM Elements
const filterDate = document.getElementById('filterDate');
const filterSection = document.getElementById('filterSection');
const filterStatus = document.getElementById('filterStatus');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const addAttendanceBtn = document.getElementById('addAttendanceBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const alertContainer = document.getElementById('alertContainer');

// Stats
const statPresent = document.getElementById('statPresent');
const statLate = document.getElementById('statLate');
const statAbsent = document.getElementById('statAbsent');
const statTotal = document.getElementById('statTotal');

// Modal Elements
const attendanceModal = new bootstrap.Modal(document.getElementById('attendanceModal'));
const modalTitle = document.getElementById('modalTitle');
const attendanceForm = document.getElementById('attendanceForm');
const recordId = document.getElementById('recordId');
const studentSelect = document.getElementById('studentSelect');
const attendanceDate = document.getElementById('attendanceDate');
const checkInTime = document.getElementById('checkInTime');
const checkOutTime = document.getElementById('checkOutTime');
const attendanceStatus = document.getElementById('attendanceStatus');
const remarks = document.getElementById('remarks');
const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');

// State
let allRecords = [];
let allStudents = [];
let teacherSections = [];
let currentEditId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Set default date to today
    filterDate.value = new Date().toISOString().split('T')[0];
    attendanceDate.value = new Date().toISOString().split('T')[0];
    
    await loadTeacherSections();
    await loadStudents();
    await loadAttendanceRecords();
    
    // Event listeners
    filterDate.addEventListener('change', loadAttendanceRecords);
    filterSection.addEventListener('change', loadAttendanceRecords);
    filterStatus.addEventListener('change', loadAttendanceRecords);
    resetFiltersBtn.addEventListener('click', resetFilters);
    addAttendanceBtn.addEventListener('click', openAddModal);
    refreshBtn.addEventListener('click', loadAttendanceRecords);
    exportExcelBtn.addEventListener('click', exportToExcel);
    saveAttendanceBtn.addEventListener('click', saveAttendance);
});

// Load teacher's assigned sections
async function loadTeacherSections() {
    try {
        const teacherData = JSON.parse(sessionStorage.getItem('teacherData'));
        if (!teacherData) {
            showAlert('Teacher session not found', 'error');
            return;
        }

        // Get teaching loads for this teacher
        const loadsResult = await dataClient.getAll('teaching_loads', [
            { field: 'teacher_id', operator: '==', value: teacherData.id }
        ]);

        if (loadsResult.error) {
            console.error('Error loading teaching loads:', loadsResult.error);
            return;
        }

        // Get unique section IDs
        const sectionIds = [...new Set(loadsResult.data.map(load => load.section_id))];
        
        // Load section details
        for (const sectionId of sectionIds) {
            const sectionResult = await dataClient.getOne('sections', sectionId);
            if (sectionResult.data) {
                teacherSections.push(sectionResult.data);
            }
        }

        // Populate section filter
        filterSection.innerHTML = '<option value="">All Sections</option>';
        teacherSections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.section_name || section.section_code;
            filterSection.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading teacher sections:', error);
        showAlert('Failed to load sections', 'error');
    }
}

// Load students from teacher's sections
async function loadStudents() {
    try {
        if (teacherSections.length === 0) {
            return;
        }

        const sectionIds = teacherSections.map(s => s.id);
        
        // Load all students in these sections
        const studentsResult = await dataClient.getAll('students', [
            { field: 'section_id', operator: 'in', value: sectionIds }
        ]);

        if (studentsResult.error) {
            console.error('Error loading students:', studentsResult.error);
            return;
        }

        allStudents = studentsResult.data || [];
        
        // Populate student select
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        allStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.first_name} ${student.last_name} (${student.student_number})`;
            option.dataset.sectionId = student.section_id;
            studentSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Failed to load students', 'error');
    }
}

// Load attendance records
async function loadAttendanceRecords() {
    try {
        const selectedDate = filterDate.value;
        const selectedSection = filterSection.value;
        const selectedStatus = filterStatus.value;

        // Show loading
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Loading records...</p>
                </td>
            </tr>
        `;

        // Query entrance_logs table for the selected date
        const startDate = selectedDate ? `${selectedDate}T00:00:00` : null;
        const endDate = selectedDate ? `${selectedDate}T23:59:59` : null;

        let query = supabase.from('entrance_logs').select('*');
        
        if (startDate && endDate) {
            query = query.gte('check_in_time', startDate).lte('check_in_time', endDate);
        }

        query = query.order('check_in_time', { ascending: false });

        const { data: logs, error: logsError } = await query;

        if (logsError) {
            console.error('Error loading logs:', logsError);
            showAlert('Failed to load attendance records', 'error');
            return;
        }

        // Filter records for teacher's students
        const studentIds = allStudents.map(s => s.id);
        let filteredRecords = logs.filter(log => studentIds.includes(log.student_id));

        // Apply section filter
        if (selectedSection) {
            const sectionStudentIds = allStudents
                .filter(s => s.section_id === selectedSection)
                .map(s => s.id);
            filteredRecords = filteredRecords.filter(log => sectionStudentIds.includes(log.student_id));
        }

        // Apply status filter (derive status from times)
        if (selectedStatus) {
            filteredRecords = filteredRecords.filter(log => {
                const status = deriveStatus(log);
                return status === selectedStatus;
            });
        }

        allRecords = filteredRecords;
        renderAttendanceTable();
        updateStatistics();

    } catch (error) {
        console.error('Error loading attendance records:', error);
        showAlert('Failed to load attendance records', 'error');
    }
}

// Derive attendance status from log times
function deriveStatus(log) {
    if (!log.check_in_time) return 'absent';
    
    const checkInDate = new Date(log.check_in_time);
    const hour = checkInDate.getHours();
    
    // If checked in after 8 AM, mark as late
    if (hour >= 8) return 'late';
    
    return 'present';
}

// Render attendance table
function renderAttendanceTable() {
    if (allRecords.length === 0) {
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-2 text-muted">No attendance records found</p>
                </td>
            </tr>
        `;
        return;
    }

    attendanceTableBody.innerHTML = allRecords.map(log => {
        const student = allStudents.find(s => s.id === log.student_id);
        if (!student) return '';

        const section = teacherSections.find(s => s.id === student.section_id);
        const status = deriveStatus(log);
        const checkIn = log.check_in_time ? formatTime(log.check_in_time) : '-';
        const checkOut = log.check_out_time ? formatTime(log.check_out_time) : '-';
        const date = log.check_in_time ? formatDate(log.check_in_time) : '-';

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-2">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div>
                            <div class="fw-semibold">${student.first_name} ${student.last_name}</div>
                        </div>
                    </div>
                </td>
                <td>${student.student_number}</td>
                <td>${section ? section.section_name || section.section_code : 'N/A'}</td>
                <td>${date}</td>
                <td><span class="time-badge">${checkIn}</span></td>
                <td><span class="time-badge">${checkOut}</span></td>
                <td><span class="badge status-${status}">${capitalizeFirst(status)}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="editAttendance('${log.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteAttendance('${log.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Refresh mobile table utilities
    if (window.teacherMobileUtils) {
        window.teacherMobileUtils.refresh();
    }
}

// Update statistics
function updateStatistics() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = allRecords.filter(log => {
        const logDate = log.check_in_time ? log.check_in_time.split('T')[0] : null;
        return logDate === today;
    });

    const presentCount = todayRecords.filter(log => deriveStatus(log) === 'present').length;
    const lateCount = todayRecords.filter(log => deriveStatus(log) === 'late').length;
    const absentCount = allStudents.length - todayRecords.length;

    statPresent.textContent = presentCount;
    statLate.textContent = lateCount;
    statAbsent.textContent = absentCount;
    statTotal.textContent = allStudents.length;
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Reset filters
function resetFilters() {
    filterDate.value = new Date().toISOString().split('T')[0];
    filterSection.value = '';
    filterStatus.value = '';
    loadAttendanceRecords();
}

// Open add modal
function openAddModal() {
    currentEditId = null;
    modalTitle.textContent = 'Mark Attendance';
    attendanceForm.reset();
    attendanceDate.value = new Date().toISOString().split('T')[0];
    attendanceStatus.value = 'present';
    attendanceModal.show();
}

// Edit attendance
window.editAttendance = async function(logId) {
    try {
        const log = allRecords.find(r => r.id === logId);
        if (!log) return;

        currentEditId = logId;
        modalTitle.textContent = 'Edit Attendance';
        
        studentSelect.value = log.student_id;
        attendanceDate.value = log.check_in_time ? log.check_in_time.split('T')[0] : '';
        checkInTime.value = log.check_in_time ? log.check_in_time.split('T')[1].substring(0, 5) : '';
        checkOutTime.value = log.check_out_time ? log.check_out_time.split('T')[1].substring(0, 5) : '';
        attendanceStatus.value = deriveStatus(log);
        
        attendanceModal.show();
    } catch (error) {
        console.error('Error editing attendance:', error);
        showAlert('Failed to load attendance record', 'error');
    }
};

// Delete attendance
window.deleteAttendance = async function(logId) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;

    try {
        const { error } = await supabase
            .from('entrance_logs')
            .delete()
            .eq('id', logId);

        if (error) throw error;

        showAlert('Attendance record deleted successfully', 'success');
        await loadAttendanceRecords();
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showAlert('Failed to delete attendance record', 'error');
    }
};

// Save attendance
async function saveAttendance() {
    try {
        if (!attendanceForm.checkValidity()) {
            attendanceForm.reportValidity();
            return;
        }

        const studentId = studentSelect.value;
        const date = attendanceDate.value;
        const checkIn = checkInTime.value;
        const checkOut = checkOutTime.value;
        const status = attendanceStatus.value;

        // Build timestamps
        const checkInTimestamp = checkIn ? `${date}T${checkIn}:00` : `${date}T08:00:00`;
        const checkOutTimestamp = checkOut ? `${date}T${checkOut}:00` : null;

        saveAttendanceBtn.disabled = true;
        saveAttendanceBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

        if (currentEditId) {
            // Update existing record
            const { error } = await supabase
                .from('entrance_logs')
                .update({
                    check_in_time: checkInTimestamp,
                    check_out_time: checkOutTimestamp,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentEditId);

            if (error) throw error;
            showAlert('Attendance updated successfully', 'success');
        } else {
            // Create new record
            const { error } = await supabase
                .from('entrance_logs')
                .insert({
                    student_id: studentId,
                    check_in_time: checkInTimestamp,
                    check_out_time: checkOutTimestamp,
                    device_id: 'manual',
                    scan_type: 'entry'
                });

            if (error) throw error;
            showAlert('Attendance recorded successfully', 'success');
        }

        attendanceModal.hide();
        await loadAttendanceRecords();

    } catch (error) {
        console.error('Error saving attendance:', error);
        showAlert('Failed to save attendance', 'error');
    } finally {
        saveAttendanceBtn.disabled = false;
        saveAttendanceBtn.innerHTML = '<i class="bi bi-save me-1"></i>Save';
    }
}

// Export to Excel
function exportToExcel() {
    if (allRecords.length === 0) {
        showAlert('No records to export', 'warning');
        return;
    }

    // Prepare CSV data
    const headers = ['Student Name', 'Student Number', 'Section', 'Date', 'Check-In', 'Check-Out', 'Status'];
    const rows = allRecords.map(log => {
        const student = allStudents.find(s => s.id === log.student_id);
        if (!student) return null;

        const section = teacherSections.find(s => s.id === student.section_id);
        const status = deriveStatus(log);
        
        return [
            `${student.first_name} ${student.last_name}`,
            student.student_number,
            section ? section.section_name || section.section_code : 'N/A',
            log.check_in_time ? formatDate(log.check_in_time) : '-',
            log.check_in_time ? formatTime(log.check_in_time) : '-',
            log.check_out_time ? formatTime(log.check_out_time) : '-',
            capitalizeFirst(status)
        ];
    }).filter(row => row !== null);

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showAlert('Attendance records exported successfully', 'success');
}

// Show alert
function showAlert(message, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type;
    const alert = document.createElement('div');
    alert.className = `alert alert-${alertClass} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
}
