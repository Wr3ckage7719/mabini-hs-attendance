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
        await Promise.all([
            loadTeachers(),
            loadSubjects(),
            loadSections(),
            loadTeachingLoads()
        ]);
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
    const select = document.getElementById('teacherId');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Teacher</option>' + 
        teachers.map(t => `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`).join('');
}

function populateSubjectDropdown() {
    const select = document.getElementById('subjectId');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Subject</option>' + 
        subjects.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');
}

function populateSectionDropdown() {
    const select = document.getElementById('sectionId');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Section</option>' + 
        sections.map(sec => `<option value="${sec.id}">${sec.section_code} - ${sec.section_name}</option>`).join('');
}

// Setup event listeners
function setupEventListeners() {
    const loadForm = document.getElementById('loadForm');
    if (loadForm) {
        loadForm.addEventListener('submit', handleSubmit);
    }
}

// Render teaching loads table
function renderTeachingLoads() {
    const tbody = document.getElementById('loadsTableBody');
    if (!tbody) return;
    
    if (teachingLoads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-3 mb-0" style="font-size: 1.1rem;">No teaching loads found</p>
                    <p class="text-muted small">Assign teachers to subjects and sections to get started</p>
                    <button class="btn btn-primary mt-2" onclick="window.openAddModal()">
                        <i class="bi bi-plus-circle"></i> Add First Teaching Load
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = teachingLoads.map(load => {
        const teacher = teachers.find(t => t.id === load.teacher_id);
        const subject = subjects.find(s => s.id === load.subject_id);
        const section = sections.find(sec => sec.id === load.section_id);
        
        const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown';
        const subjectName = subject ? `${subject.code} - ${subject.name}` : 'Unknown';
        const sectionName = section ? section.section_code : 'Unknown';
        const schedule = load.schedule || '-';
        const room = load.room || '-';
        
        return `
            <tr>
                <td>${escapeHtml(teacherName)}</td>
                <td>${escapeHtml(subjectName)}</td>
                <td><span class="badge bg-info">${escapeHtml(sectionName)}</span></td>
                <td>${escapeHtml(schedule)}</td>
                <td>${escapeHtml(room)}</td>
                <td>${load.school_year || 'Current'}</td>
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
    const scheduleEl = document.getElementById('schedule');
    const roomEl = document.getElementById('room');
    const schoolYearEl = document.getElementById('schoolYear');
    
    if (teacherIdEl) teacherIdEl.value = load.teacher_id || '';
    if (subjectIdEl) subjectIdEl.value = load.subject_id || '';
    if (sectionIdEl) sectionIdEl.value = load.section_id || '';
    if (scheduleEl) scheduleEl.value = load.schedule || '';
    if (roomEl) roomEl.value = load.room || '';
    if (schoolYearEl) schoolYearEl.value = load.school_year || '';
    
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
        
        // Build schedule string
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');
        const startTime = startTimeEl?.value || '';
        const endTime = endTimeEl?.value || '';
        const schedule = selectedDays.length > 0 && startTime && endTime 
            ? `${selectedDays.join(', ')} ${startTime}-${endTime}`
            : '';
        
        const teacherIdEl = document.getElementById('teacherId');
        const subjectIdEl = document.getElementById('subjectId');
        const sectionIdEl = document.getElementById('sectionId');
        const roomEl = document.getElementById('room');
        
        const formData = {
            teacher_id: teacherIdEl?.value || null,
            subject_id: subjectIdEl?.value || null,
            section_id: sectionIdEl?.value || null,
            schedule: schedule,
            room: roomEl?.value?.trim() || null,
            school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1) // Auto-generate: 2025-2026
        };
        
        // Validate required fields
        if (!formData.teacher_id || !formData.subject_id || !formData.section_id) {
            showAlert('Please fill in all required fields', 'warning');
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
            
            if (error) throw error;
            
            showAlert('Teaching load created successfully', 'success');
        }
        
        if (loadModal) loadModal.hide();
        await loadTeachingLoads();
        
    } catch (error) {
        console.error('Error saving teaching load:', error);
        showAlert('Failed to save teaching load: ' + error.message, 'danger');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = editingLoadId ? 'Update Load' : 'Create Load';
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
