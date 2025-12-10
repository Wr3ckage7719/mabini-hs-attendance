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
    // Set default date for attendance form (not for filter)
    attendanceDate.value = new Date().toISOString().split('T')[0];
    // Leave filterDate empty to show all records by default
    filterDate.value = '';
    
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
        // Check both userData and teacherData for compatibility
        const userDataStr = sessionStorage.getItem('userData') || sessionStorage.getItem('teacherData');
        if (!userDataStr) {
            showAlert('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }
        
        const teacherData = JSON.parse(userDataStr);
        if (!teacherData || !teacherData.id) {
            showAlert('Invalid session data. Please login again.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Get teaching loads for this teacher
        const loadsResult = await dataClient.getAll('teaching_loads', [
            { field: 'teacher_id', operator: '==', value: teacherData.id }
        ]);

        if (loadsResult.error) {
            console.error('Error loading teaching loads:', loadsResult.error);
            showAlert('Failed to load teaching assignments', 'error');
            return;
        }

        if (!loadsResult.data || loadsResult.data.length === 0) {
            console.log('No teaching loads found for teacher');
            filterSection.innerHTML = '<option value="">No sections assigned</option>';
            return;
        }

        // Get unique section IDs
        const sectionIds = [...new Set(loadsResult.data.map(load => load.section_id).filter(id => id))];
        
        if (sectionIds.length === 0) {
            filterSection.innerHTML = '<option value="">No sections assigned</option>';
            return;
        }
        
        // Load section details
        for (const sectionId of sectionIds) {
            try {
                const sectionResult = await dataClient.getOne('sections', sectionId);
                if (sectionResult.data) {
                    teacherSections.push(sectionResult.data);
                }
            } catch (err) {
                console.error('Error loading section:', sectionId, err);
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
            console.log('No sections to load students from');
            studentSelect.innerHTML = '<option value="">No students available</option>';
            return;
        }

        const sectionIds = teacherSections.map(s => s.id);
        
        // Load all students in these sections
        const studentsResult = await dataClient.getAll('students', [
            { field: 'section_id', operator: 'in', value: sectionIds }
        ]);

        if (studentsResult.error) {
            console.error('Error loading students:', studentsResult.error);
            showAlert('Failed to load students: ' + studentsResult.error, 'error');
            studentSelect.innerHTML = '<option value="">Error loading students</option>';
            return;
        }

        allStudents = studentsResult.data || [];
        
        if (allStudents.length === 0) {
            studentSelect.innerHTML = '<option value="">No students in your sections</option>';
            return;
        }
        
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

        console.log('[Attendance Records] Loading with filters:', { selectedDate, selectedSection, selectedStatus });

        // Show loading
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Loading records...</p>
                </td>
            </tr>
        `;

        // Check if teacher has any students assigned
        if (allStudents.length === 0) {
            console.log('[Attendance Records] No students assigned to teacher');
            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 text-muted">
                        <i class="bi bi-people" style="font-size: 3rem;"></i>
                        <p class="mt-2">No students assigned</p>
                        <small>This teacher has no teaching assignments. Contact admin to assign sections.</small>
                    </td>
                </tr>
            `;
            allRecords = [];
            updateStatistics();
            return;
        }

        // Build query - ONLY filter by date if explicitly set
        let filters = [];
        
        // Don't filter by today's date by default - show all records
        if (selectedDate) {
            filters.push({ field: 'date', operator: '==', value: selectedDate });
        }
        
        if (selectedStatus) {
            filters.push({ field: 'status', operator: '==', value: selectedStatus });
        }

        console.log('[Attendance Records] Query filters:', filters);

        // Query attendance table
        const result = await dataClient.getAll('attendance', filters);
        
        console.log('[Attendance Records] Query result:', result);

        if (result.error) {
            console.error('Error loading attendance:', result.error);
            showAlert('Failed to load attendance records: ' + result.error, 'error');
            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-danger">
                        <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
                        <p class="mt-2">Error loading records</p>
                        <small>${result.error}</small>
                    </td>
                </tr>
            `;
            allRecords = [];
            updateStatistics();
            return;
        }

        let logs = result.data || [];
        
        console.log('[Attendance Records] Total logs from database:', logs.length);

        // Filter for teacher's students only (CRITICAL: must have students)
        const studentIds = allStudents.map(s => s.id);
        console.log('[Attendance Records] Teacher student IDs:', studentIds.length, studentIds);
        
        logs = logs.filter(log => studentIds.includes(log.student_id));
        
        console.log('[Attendance Records] After student filter:', logs.length);

        // Apply section filter client-side
        if (selectedSection) {
            const sectionStudentIds = allStudents
                .filter(s => s.section_id === selectedSection)
                .map(s => s.id);
            logs = logs.filter(log => sectionStudentIds.includes(log.student_id));
            console.log('[Attendance Records] After section filter:', logs.length);
        }

        allRecords = logs;
        console.log('[Attendance Records] Final records to display:', allRecords.length);
        
        renderAttendanceTable();
        updateStatistics();

    } catch (error) {
        console.error('Error loading attendance records:', error);
        showAlert('Failed to load attendance records: ' + error.message, 'error');
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
                    <p class="mt-2">Error loading records</p>
                    <small>${error.message}</small>
                </td>
            </tr>
        `;
        allRecords = [];
        updateStatistics();
    }
}

// Derive attendance status from log
function deriveStatus(log) {
    // Use the status field directly from attendance table
    return log.status || 'present';
}

// Render attendance table
function renderAttendanceTable() {
    if (allRecords.length === 0) {
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
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
        const checkIn = log.time_in || '-';
        const checkOut = log.time_out || '-';
        const date = log.date ? formatDate(log.date) : '-';
        
        // Check if photo exists
        const photoUrl = log.photo_url || log.photo;
        const photoCell = photoUrl 
            ? `<img src="${photoUrl}" class="photo-thumbnail" onclick="viewPhoto('${log.id}')" alt="Photo" onerror="this.parentElement.innerHTML='<span class=\\'photo-placeholder\\'><i class=\\'bi bi-image\\'>N/A</i></span>'">`
            : `<span class="photo-placeholder"><i class="bi bi-camera-slash"></i></span>`;

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
                <td>${photoCell}</td>
                <td><span class="badge status-${status}">${capitalizeFirst(status)}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="editAttendance('${log.id}')" title="Edit" ${!status || !['present', 'late', 'absent', 'excused'].includes(status.toLowerCase()) ? 'disabled' : ''}>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteAttendance('${log.id}')" title="Delete" ${!status || !['present', 'late', 'absent', 'excused'].includes(status.toLowerCase()) ? 'disabled' : ''}>
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
    // Safety check - if no students, set all to 0
    if (allStudents.length === 0) {
        statPresent.textContent = 0;
        statLate.textContent = 0;
        statAbsent.textContent = 0;
        statTotal.textContent = 0;
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayRecords = allRecords.filter(log => {
        return log.date === today;
    });

    const presentCount = todayRecords.filter(log => log.status === 'present').length;
    const lateCount = todayRecords.filter(log => log.status === 'late').length;
    const absentCount = allStudents.length - todayRecords.length;

    statPresent.textContent = presentCount;
    statLate.textContent = lateCount;
    statAbsent.textContent = Math.max(0, absentCount); // Ensure non-negative
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
    filterDate.value = ''; // Show all dates
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
        
        // Validate that record has a valid status
        const validStatuses = ['present', 'late', 'absent', 'excused'];
        const status = (log.status || '').toLowerCase();
        if (!validStatuses.includes(status)) {
            showAlert('Cannot edit: This record does not have a valid attendance status.', 'warning');
            return;
        }

        currentEditId = logId;
        modalTitle.textContent = 'Edit Attendance';
        
        studentSelect.value = log.student_id;
        attendanceDate.value = log.date || '';
        checkInTime.value = log.time_in || '';
        checkOutTime.value = log.time_out || '';
        attendanceStatus.value = log.status || 'present';
        remarks.value = log.remarks || '';
        
        attendanceModal.show();
    } catch (error) {
        console.error('Error editing attendance:', error);
        showAlert('Failed to load attendance record', 'error');
    }
};

// Delete attendance
window.deleteAttendance = async function(logId) {
    try {
        const log = allRecords.find(r => r.id === logId);
        if (!log) return;
        
        // Validate that record has a valid status
        const validStatuses = ['present', 'late', 'absent', 'excused'];
        const status = (log.status || '').toLowerCase();
        if (!validStatuses.includes(status)) {
            showAlert('Cannot delete: This record does not have a valid attendance status.', 'warning');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this attendance record?')) return;

        const result = await dataClient.delete('attendance', logId);

        if (result.error) {
            console.error('Error deleting attendance:', result.error);
            showAlert('Failed to delete attendance record: ' + result.error, 'error');
            return;
        }

        showAlert('Attendance record deleted successfully', 'success');
        await loadAttendanceRecords();
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showAlert('Failed to delete attendance record: ' + error.message, 'error');
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
        const remarksText = remarks.value;

        saveAttendanceBtn.disabled = true;
        saveAttendanceBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

        if (currentEditId) {
            // Update existing record
            const result = await dataClient.update('attendance', currentEditId, {
                time_in: checkIn || null,
                time_out: checkOut || null,
                status: status,
                remarks: remarksText || null
            });

            if (result.error) {
                console.error('Error updating attendance:', result.error);
                throw new Error(result.error);
            }

            showAlert('Attendance updated successfully', 'success');
        } else {
            // Get student's section_id
            const student = allStudents.find(s => s.id === studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            // Create new record
            const result = await dataClient.create('attendance', {
                student_id: studentId,
                section_id: student.section_id,
                date: date,
                time_in: checkIn || null,
                time_out: checkOut || null,
                status: status,
                remarks: remarksText || null
            });

            if (result.error) {
                console.error('Error creating attendance:', result.error);
                throw new Error(result.error);
            }

            showAlert('Attendance recorded successfully', 'success');
        }

        attendanceModal.hide();
        await loadAttendanceRecords();

    } catch (error) {
        console.error('Error saving attendance:', error);
        showAlert('Failed to save attendance: ' + error.message, 'error');
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
    const headers = ['Student Name', 'Student Number', 'Section', 'Date', 'Time In', 'Time Out', 'Status', 'Remarks'];
    const rows = allRecords.map(log => {
        const student = allStudents.find(s => s.id === log.student_id);
        if (!student) return null;

        const section = teacherSections.find(s => s.id === student.section_id);
        const status = log.status || 'unknown';
        
        return [
            `${student.first_name} ${student.last_name}`,
            student.student_number,
            section ? section.section_name || section.section_code : 'N/A',
            log.date || '-',
            log.time_in || '-',
            log.time_out || '-',
            capitalizeFirst(status),
            log.remarks || '-'
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

// View photo in modal
window.viewPhoto = async function(recordId) {
    try {
        const log = allRecords.find(r => r.id === recordId);
        if (!log) {
            showAlert('Record not found', 'error');
            return;
        }
        
        const student = allStudents.find(s => s.id === log.student_id);
        const section = teacherSections.find(s => s.id === student?.section_id);
        const photoUrl = log.photo_url || log.photo;
        
        if (!photoUrl) {
            showAlert('No photo available for this record', 'warning');
            return;
        }
        
        // Update modal content
        document.getElementById('photoViewerImage').src = photoUrl;
        document.getElementById('photoStudentName').textContent = student ? `${student.first_name} ${student.last_name}` : 'Unknown';
        document.getElementById('photoDateTime').textContent = log.date && log.time_in 
            ? `${formatDate(log.date)} at ${log.time_in}`
            : formatDate(log.date) || 'Unknown';
        document.getElementById('photoStatus').innerHTML = `<span class="badge status-${log.status}">${capitalizeFirst(log.status || 'present')}</span>`;
        document.getElementById('photoSection').textContent = section ? (section.section_name || section.section_code) : 'N/A';
        
        // Set download link
        const downloadBtn = document.getElementById('photoDownloadBtn');
        downloadBtn.href = photoUrl;
        downloadBtn.download = `attendance_${student?.student_number || 'photo'}_${log.date || 'unknown'}.jpg`;
        
        // Show modal
        const photoModal = new bootstrap.Modal(document.getElementById('photoViewerModal'));
        photoModal.show();
        
    } catch (error) {
        console.error('Error viewing photo:', error);
        showAlert('Failed to load photo', 'error');
    }
};

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
