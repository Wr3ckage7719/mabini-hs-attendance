// =====================================================
// TEACHING LOADS MANAGEMENT - Supabase Integration (Direct)
// =====================================================

import { supabase, ensureAuthenticated } from './ensure-auth.js';

let teachingLoads = [];
let teachers = [];
let subjects = [];
let sections = [];
let editingLoadId = null;
let loadModal = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Teaching loads management page loaded');
    
    // Check authentication (no redirect to avoid loops)
    try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            console.warn('No active session');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
    
    // Initialize Bootstrap modal
    const modalElement = document.getElementById('loadModal');
    if (modalElement) {
        loadModal = new bootstrap.Modal(modalElement);
    }
    
    await initializePage();
    setupEventListeners();
});

// Initialize page data
async function initializePage() {
    try {
        // Load reference data first (teachers, subjects, sections)
        await Promise.all([
            loadTeachers(),
            loadSubjects(),
            loadSections()
        ]);
        
        // Then load teaching loads (which depends on the reference data for display)
        await loadTeachingLoads();
    } catch (error) {
        console.error('Error initializing page:', error);
        showAlert('Failed to load initial data', 'danger');
    }
}

// Load teachers
async function loadTeachers() {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('first_name', { ascending: true });
        
        if (error) throw error;
        
        teachers = data || [];
        console.log('Loaded teachers:', teachers.length);
        populateTeacherDropdown();
    } catch (error) {
        console.error('Error loading teachers:', error);
        showAlert('Failed to load teachers: ' + error.message, 'danger');
    }
}

// Load subjects
async function loadSubjects() {
    try {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('code', { ascending: true });
        
        if (error) throw error;
        
        subjects = data || [];
        console.log('Loaded subjects:', subjects.length);
        populateSubjectDropdown();
    } catch (error) {
        console.error('Error loading subjects:', error);
        showAlert('Failed to load subjects: ' + error.message, 'danger');
    }
}

// Load sections
async function loadSections() {
    try {
        const { data, error } = await supabase
            .from('sections')
            .select('*')
            .order('grade_level', { ascending: true });
        
        if (error) throw error;
        
        sections = data || [];
        console.log('Loaded sections:', sections.length);
        populateSectionDropdown();
    } catch (error) {
        console.error('Error loading sections:', error);
        showAlert('Failed to load sections: ' + error.message, 'danger');
    }
}

// Load teaching loads
async function loadTeachingLoads() {
    try {
        const { data, error } = await supabase
            .from('teaching_loads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        teachingLoads = data || [];
        console.log('Loaded teaching loads:', teachingLoads.length);
        renderTeachingLoads();
    } catch (error) {
        console.error('Error loading teaching loads:', error);
        showAlert('Failed to load teaching loads: ' + error.message, 'danger');
    }
}

// Populate dropdowns
function populateTeacherDropdown() {
    const modalSelect = document.getElementById('teacherId');
    if (modalSelect) {
        modalSelect.innerHTML = '<option value="">Select Teacher</option>' + 
            teachers.map(t => `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`).join('');
    }
    
    // Also populate filter dropdown
    const filterSelect = document.getElementById('teacherFilter');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Teachers</option>' + 
            teachers.map(t => `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`).join('');
    }
}

function populateSubjectDropdown() {
    const modalSelect = document.getElementById('subjectId');
    if (modalSelect) {
        modalSelect.innerHTML = '<option value="">Select Subject</option>' + 
            subjects.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');
    }
    
    // Also populate filter dropdown
    const filterSelect = document.getElementById('subjectFilter');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Subjects</option>' + 
            subjects.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');
    }
}

function populateSectionDropdown() {
    const modalSelect = document.getElementById('sectionId');
    if (modalSelect) {
        modalSelect.innerHTML = '<option value="">Select Section</option>' + 
            sections.map(sec => `<option value="${sec.id}">${sec.section_code} - ${sec.section_name}</option>`).join('');
    }
}

// Setup event listeners
function setupEventListeners() {
    const loadForm = document.getElementById('loadForm');
    if (loadForm) {
        loadForm.addEventListener('submit', handleSubmit);
    }
}

// Apply filters
window.applyFilters = function() {
    const teacherFilter = document.getElementById('teacherFilter')?.value;
    const subjectFilter = document.getElementById('subjectFilter')?.value;
    const gradeLevelFilter = document.getElementById('gradeLevelFilter')?.value;
    
    let filtered = [...teachingLoads];
    
    // Filter by teacher
    if (teacherFilter) {
        filtered = filtered.filter(load => load.teacher_id === teacherFilter);
    }
    
    // Filter by subject
    if (subjectFilter) {
        filtered = filtered.filter(load => load.subject_id === subjectFilter);
    }
    
    // Filter by grade level
    if (gradeLevelFilter) {
        filtered = filtered.filter(load => {
            const section = sections.find(s => s.id === load.section_id);
            return section && section.grade_level == gradeLevelFilter;
        });
    }
    
    renderTeachingLoads(filtered);
};

// Clear filters
window.clearFilters = function() {
    const teacherFilter = document.getElementById('teacherFilter');
    const subjectFilter = document.getElementById('subjectFilter');
    const gradeLevelFilter = document.getElementById('gradeLevelFilter');
    
    if (teacherFilter) teacherFilter.value = '';
    if (subjectFilter) subjectFilter.value = '';
    if (gradeLevelFilter) gradeLevelFilter.value = '';
    
    renderTeachingLoads();
};

// Render teaching loads table
function renderTeachingLoads(loadsToRender = null) {
    const tbody = document.getElementById('loadsTableBody');
    if (!tbody) return;
    
    const loads = loadsToRender || teachingLoads;
    
    if (loads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-3 mb-0" style="font-size: 1.1rem;">No teaching loads found</p>
                    <p class="text-muted small">${loadsToRender ? 'Try adjusting your filters' : 'Assign teachers to subjects and sections to get started'}</p>
                    ${!loadsToRender ? `
                    <button class="btn btn-primary mt-2" onclick="window.openAddModal()">
                        <i class="bi bi-plus-circle"></i> Add First Teaching Load
                    </button>` : ''}
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = loads.map(load => {
        const teacher = teachers.find(t => t.id === load.teacher_id);
        const subject = subjects.find(s => s.id === load.subject_id);
        const section = sections.find(sec => sec.id === load.section_id);
        
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown';
        const subjectName = subject ? `${subject.code} - ${subject.name}` : 'Unknown';
        const sectionName = section ? section.section_code : 'Unknown';
        const gradeLevel = section ? `Grade ${section.grade_level}` : '-';
        
        // Use new separate fields: day_of_week, start_time, end_time
        let days = 'N/A';
        if (load.day_of_week) {
            // If it contains commas, format as abbreviations
            if (load.day_of_week.includes(',')) {
                const dayList = load.day_of_week.split(',').map(d => d.trim());
                days = dayList.map(d => d.substring(0, 3)).join(', ');
            } else {
                days = load.day_of_week;
            }
        } else if (load.schedule) {
            // Fallback to old schedule field
            days = extractDaysFromSchedule(load.schedule);
        }
        
        let timeRange = 'N/A';
        if (load.start_time && load.end_time) {
            timeRange = `${formatTime(load.start_time)}-${formatTime(load.end_time)}`;
        } else if (load.schedule) {
            // Fallback to old schedule field
            timeRange = extractTimeFromSchedule(load.schedule);
        }
        
        return `
            <tr>
                <td>${escapeHtml(teacherName)}</td>
                <td>${escapeHtml(subjectName)}</td>
                <td><span class="badge bg-info">${escapeHtml(sectionName)}</span></td>
                <td>${escapeHtml(gradeLevel)}</td>
                <td>${escapeHtml(days)}</td>
                <td>${escapeHtml(timeRange)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.editLoad('${load.id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.deleteLoad('${load.id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = rows.join('');
}

// Format time to 12-hour format (HH:MM to h:MM AM/PM)
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}`;
}

// Helper to extract days from schedule
function extractDaysFromSchedule(schedule) {
    if (!schedule) return '-';
    const parts = schedule.split(/\d{1,2}:\d{2}/);
    return parts[0].trim() || schedule;
}

// Helper to extract time from schedule
function extractTimeFromSchedule(schedule) {
    if (!schedule) return '-';
    const timeMatch = schedule.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    return timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : '-';
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open add modal
window.openAddModal = function() {
    console.log('Opening add teaching load modal');
    editingLoadId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const loadForm = document.getElementById('loadForm');
    
    if (modalTitle) modalTitle.textContent = 'Add New Teaching Load';
    if (loadForm) loadForm.reset();
    
    // Clear all day checkboxes
    document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
    
    // Auto-populate academic year with current year
    const academicYearEl = document.getElementById('academicYear');
    if (academicYearEl) {
        const currentYear = new Date().getFullYear();
        academicYearEl.value = currentYear + '-' + (currentYear + 1);
    }
    
    if (loadModal) loadModal.show();
};

// Edit load
window.editLoad = function(id) {
    console.log('Editing teaching load:', id);
    const load = teachingLoads.find(l => l.id === id);
    
    if (!load) {
        console.error('Teaching load not found:', id);
        showAlert('Teaching load not found', 'danger');
        return;
    }
    
    editingLoadId = id;
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Teaching Load';
    
    const teacherIdEl = document.getElementById('teacherId');
    const subjectIdEl = document.getElementById('subjectId');
    const sectionIdEl = document.getElementById('sectionId');
    const roomEl = document.getElementById('room');
    const academicYearEl = document.getElementById('academicYear');
    
    if (teacherIdEl) teacherIdEl.value = load.teacher_id || '';
    if (subjectIdEl) subjectIdEl.value = load.subject_id || '';
    if (sectionIdEl) sectionIdEl.value = load.section_id || '';
    if (roomEl) roomEl.value = load.room || '';
    if (academicYearEl) academicYearEl.value = load.school_year || '';
    
    // Clear all checkboxes first
    document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
    
    // Populate days and times from new separate fields
    if (load.day_of_week) {
        // day_of_week is comma-separated: "Monday, Tuesday, Wednesday"
        const days = load.day_of_week.split(',').map(d => d.trim());
        days.forEach(day => {
            const checkbox = document.querySelector(`.day-checkbox[value="${day}"]`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (load.schedule) {
        // Fallback: Parse old schedule format "Monday, Tuesday 08:00-09:00"
        const scheduleMatch = load.schedule.match(/^(.+)\\s+(\\d{1,2}:\\d{2})-(\\d{1,2}:\\d{2})$/);
        if (scheduleMatch) {
            const daysString = scheduleMatch[1];
            const days = daysString.split(',').map(d => d.trim());
            days.forEach(day => {
                const checkbox = document.querySelector(`.day-checkbox[value="${day}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
    
    // Set time fields from new separate fields
    const startTimeEl = document.getElementById('startTime');
    const endTimeEl = document.getElementById('endTime');
    
    if (load.start_time && load.end_time) {
        if (startTimeEl) startTimeEl.value = load.start_time;
        if (endTimeEl) endTimeEl.value = load.end_time;
    } else if (load.schedule) {
        // Fallback: Parse old schedule format
        const scheduleMatch = load.schedule.match(/^(.+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
        if (scheduleMatch) {
            if (startTimeEl) startTimeEl.value = scheduleMatch[2];
            if (endTimeEl) endTimeEl.value = scheduleMatch[3];
        }
    }
    
    if (loadModal) loadModal.show();
};

// Delete load
window.deleteLoad = async function(id) {
    if (!confirm('Are you sure you want to delete this teaching load?')) {
        return;
    }
    
    try {
        // Ensure authenticated
        await ensureAuthenticated();
        
        const { error } = await supabase
            .from('teaching_loads')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Teaching load deleted successfully', 'success');
        await loadTeachingLoads();
    } catch (error) {
        console.error('Error deleting teaching load:', error);
        showAlert('Failed to delete teaching load: ' + error.message, 'danger');
    }
};

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('#loadForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    }
    
    try {
        // Get selected days
        const selectedDays = [];
        const dayCheckboxes = document.querySelectorAll('.day-checkbox:checked');
        if (dayCheckboxes) {
            dayCheckboxes.forEach(cb => {
                selectedDays.push(cb.value);
            });
        }
        
        console.log('Selected days:', selectedDays);
        
        // Get time values
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');
        const startTime = startTimeEl?.value || '';
        const endTime = endTimeEl?.value || '';
        
        // Build day_of_week as comma-separated string
        const dayOfWeek = selectedDays.length > 0 ? selectedDays.join(', ') : null;
        
        console.log('Day of week:', dayOfWeek, 'Start:', startTime, 'End:', endTime);
        
        const teacherIdEl = document.getElementById('teacherId');
        const subjectIdEl = document.getElementById('subjectId');
        const sectionIdEl = document.getElementById('sectionId');
        const roomEl = document.getElementById('room');
        const academicYearEl = document.getElementById('academicYear');
        
        const formData = {
            teacher_id: teacherIdEl?.value || null,
            subject_id: subjectIdEl?.value || null,
            section_id: sectionIdEl?.value || null,
            day_of_week: dayOfWeek,
            start_time: startTime || null,
            end_time: endTime || null,
            room: roomEl?.value?.trim() || null,
            school_year: academicYearEl?.value?.trim() || null
        };
        
        console.log('Form data to save:', formData);
        
        // Validate required fields
        if (!formData.teacher_id || !formData.subject_id || !formData.section_id) {
            showAlert('Please fill in all required fields', 'warning');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Teaching Load';
            }
            return;
        }
        
        // Validate schedule
        if (!formData.day_of_week || !formData.start_time || !formData.end_time) {
            showAlert('Please select at least one day and set the time schedule', 'warning');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Teaching Load';
            }
            return;
        }
        
        // Ensure authenticated
        await ensureAuthenticated();
        
        if (editingLoadId) {
            // Update existing load
            const { data, error } = await supabase
                .from('teaching_loads')
                .update(formData)
                .eq('id', editingLoadId)
                .select()
                .single();
            
            if (error) throw error;
            
            showAlert('Teaching load updated successfully', 'success');
        } else {
            // Create new load
            const { data, error } = await supabase
                .from('teaching_loads')
                .insert([formData])
                .select()
                .single();
            
            if (error) {
                console.error('Supabase insert error:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                throw error;
            }
            
            console.log('Teaching load created:', data);
            showAlert('Teaching load created successfully', 'success');
        }
        
        if (loadModal) loadModal.hide();
        await loadTeachingLoads();
        
    } catch (error) {
        console.error('Error saving teaching load:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error));
        showAlert('Failed to save teaching load: ' + (error.message || error.error_description || JSON.stringify(error)), 'danger');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Teaching Load';
        }
    }
}

// Show alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Export for testing
export { loadTeachingLoads, renderTeachingLoads };
