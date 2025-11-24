// =====================================================
// SUBJECTS MANAGEMENT - Supabase Integration (Direct)
// =====================================================

import { supabase, ensureAuthenticated } from './ensure-auth.js';

let subjects = [];
let editingSubjectId = null;
let subjectModal = null;
let currentFilters = {
    gradeLevel: '',
    search: ''
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Subjects management page loaded');
    
    // Ensure user is authenticated (but don't redirect on failure to avoid loops)
    try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            console.warn('No active session - user should login');
            // Don't redirect here - let session-guard.js handle it
        } else {
            console.log('✅ User authenticated');
        }
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        // Don't redirect - avoid infinite loops
    }
    
    // Initialize Bootstrap modal
    const modalElement = document.getElementById('subjectModal');
    if (modalElement) {
        subjectModal = new bootstrap.Modal(modalElement);
    }
    
    setupEventListeners();
    await loadSubjects();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            currentFilters.search = this.value.toLowerCase();
            renderSubjects();
        }, 300));
    }
    
    // Grade level filter
    const gradeLevelFilter = document.getElementById('gradeLevelFilter');
    if (gradeLevelFilter) {
        gradeLevelFilter.addEventListener('change', function() {
            currentFilters.gradeLevel = this.value;
            renderSubjects();
        });
    }
    
    // Form submission
    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
        subjectForm.addEventListener('submit', handleSubmit);
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load subjects from Supabase
async function loadSubjects() {
    console.log('Loading subjects from Supabase...');
    
    try {
        // Use direct Supabase query
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error loading subjects:', error);
            throw error;
        }
        
        subjects = data || [];
        console.log('Loaded subjects:', subjects.length);
        renderSubjects();
    } catch (error) {
        console.error('Error loading subjects:', error);
        showAlert('Failed to load subjects: ' + error.message, 'danger');
        renderEmptyState('Failed to load subjects');
    }
}

// Filter subjects
function getFilteredSubjects() {
    return subjects.filter(subject => {
        // Grade level filter
        if (currentFilters.gradeLevel && subject.grade_level !== currentFilters.gradeLevel) {
            return false;
        }
        
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const codeMatch = (subject.code || '').toLowerCase().includes(searchTerm);
            const nameMatch = (subject.name || '').toLowerCase().includes(searchTerm);
            const descMatch = (subject.description || '').toLowerCase().includes(searchTerm);
            
            if (!codeMatch && !nameMatch && !descMatch) {
                return false;
            }
        }
        
        return true;
    });
}

// Render subjects table
function renderSubjects() {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    
    const filteredSubjects = getFilteredSubjects();
    
    if (filteredSubjects.length === 0) {
        const message = currentFilters.search || currentFilters.gradeLevel ? 
            'No subjects match your filters' : 
            'No subjects found';
        renderEmptyState(message);
        return;
    }
    
    const rows = filteredSubjects.map(subject => {
        const createdDate = subject.created_at ? new Date(subject.created_at).toLocaleDateString() : '-';
        
        return `
            <tr>
                <td><strong>${escapeHtml(subject.code || '-')}</strong></td>
                <td>${escapeHtml(subject.name || '-')}</td>
                <td>${escapeHtml(subject.description || '-')}</td>
                <td>
                    <span class="badge bg-primary">Grade ${subject.grade_level || '-'}</span>
                </td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.editSubject('${subject.id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSubject('${subject.id}', '${escapeHtml(subject.code)}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = rows.join('');
}

// Render empty state
function renderEmptyState(message) {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                <p class="text-muted mt-3 mb-0" style="font-size: 1.1rem;">${message}</p>
                ${!currentFilters.search && !currentFilters.gradeLevel ? `
                    <p class="text-muted small">Create your first subject to get started</p>
                    <button class="btn btn-primary mt-2" onclick="window.openAddModal()">
                        <i class="bi bi-plus-circle"></i> Add First Subject
                    </button>
                ` : '<p class="text-muted small mt-2">Try adjusting your filters</p>'}
            </td>
        </tr>
    `;
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
    console.log('Opening add subject modal');
    editingSubjectId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const subjectForm = document.getElementById('subjectForm');
    
    if (modalTitle) modalTitle.textContent = 'Add New Subject';
    if (subjectForm) subjectForm.reset();
    
    if (subjectModal) subjectModal.show();
};

// Edit subject
window.editSubject = function(id) {
    console.log('Editing subject:', id);
    const subject = subjects.find(s => s.id === id);
    
    if (!subject) {
        console.error('Subject not found:', id);
        showAlert('Subject not found', 'danger');
        return;
    }
    
    editingSubjectId = id;
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Subject';
    
    document.getElementById('code').value = subject.code || '';
    document.getElementById('name').value = subject.name || '';
    document.getElementById('description').value = subject.description || '';
    document.getElementById('gradeLevel').value = subject.grade_level || '';
    
    if (subjectModal) subjectModal.show();
};

// Delete subject
window.deleteSubject = async function(id, code) {
    if (!confirm(`Are you sure you want to delete subject: ${code}?`)) {
        return;
    }
    
    try {
        // Ensure authenticated
        await ensureAuthenticated();
        
        // Delete using direct Supabase call
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Subject deleted successfully', 'success');
        await loadSubjects();
    } catch (error) {
        console.error('Error deleting subject:', error);
        showAlert('Failed to delete subject: ' + error.message, 'danger');
    }
};

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('#subjectForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    }
    
    try {
        // Ensure authenticated
        await ensureAuthenticated();
        
        const code = document.getElementById('code').value.trim().toUpperCase();
        const name = document.getElementById('name').value.trim();
        const description = document.getElementById('description').value.trim();
        const gradeLevel = document.getElementById('gradeLevel').value;
        
        if (!code || !name || !gradeLevel) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const formData = {
            code: code,
            name: name,
            description: description || null,
            grade_level: parseInt(gradeLevel)
        };
        
        if (editingSubjectId) {
            // Update existing subject using direct Supabase call
            const { data, error } = await supabase
                .from('subjects')
                .update(formData)
                .eq('id', editingSubjectId)
                .select()
                .single();
            
            if (error) throw error;
            
            showAlert('Subject updated successfully', 'success');
        } else {
            // Create new subject using direct Supabase call
            const { data, error } = await supabase
                .from('subjects')
                .insert([formData])
                .select()
                .single();
            
            if (error) throw error;
            
            showAlert('Subject created successfully', 'success');
        }
        
        if (subjectModal) subjectModal.hide();
        await loadSubjects();
        
    } catch (error) {
        console.error('Error saving subject:', error);
        showAlert('Failed to save subject: ' + error.message, 'danger');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = editingSubjectId ? 'Update Subject' : 'Create Subject';
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
export { loadSubjects, renderSubjects };
