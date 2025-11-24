// =====================================================
// USERS MANAGEMENT - Supabase Integration (Direct)
// =====================================================

import { supabase, ensureAuthenticated } from './ensure-auth.js';

let users = [];
let editingUserId = null;
let userModal = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Users management page loaded');
    
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
    const modalElement = document.getElementById('userModal');
    if (modalElement) {
        userModal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
    }
    
    await loadUsers();
});

// Load users from Supabase
async function loadUsers() {
    console.log('Loading users from Supabase...');
    const tbody = document.getElementById('usersTableBody');
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Filter out teachers - they should be managed in Teachers page
        users = (data || []).filter(user => user.role !== 'teacher');
        console.log('Loaded users:', users.length);
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                        <p class="mt-2">Failed to load users. Please refresh the page.</p>
                        <small>${error.message}</small>
                    </td>
                </tr>
            `;
        }
    }
}

// Render users table
function renderUsers() {
    console.log('Rendering', users.length, 'users');
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) {
        console.error('usersTableBody element not found!');
        return;
    }
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="text-muted mt-3 mb-0" style="font-size: 1.1rem;">No users found</p>
                    <p class="text-muted small">Create your first user to get started</p>
                    <button class="btn btn-primary mt-2" onclick="window.openAddModal()">
                        <i class="bi bi-plus-circle"></i> Add First User
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = users.map(user => {
        const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-';
        const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
        const status = user.status || 'active';
        
        return `
            <tr>
                <td>${escapeHtml(user.email || '-')}</td>
                <td>${escapeHtml(fullName)}</td>
                <td>
                    <span class="badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}">
                        ${(user.role || 'user').toUpperCase()}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${status === 'active' ? 'success' : 'secondary'}">
                        ${status.toUpperCase()}
                    </span>
                </td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.editUser('${user.id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.deleteUser('${user.id}', '${escapeHtml(user.email)}')">
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
    console.log('Opening add user modal');
    editingUserId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const userForm = document.getElementById('userForm');
    const passwordField = document.getElementById('password');
    const passwordGroup = passwordField?.closest('.mb-3');
    const roleField = document.getElementById('role');
    
    if (modalTitle) modalTitle.textContent = 'Add New User';
    if (userForm) userForm.reset();
    if (passwordField) {
        passwordField.required = true;
        if (passwordGroup) passwordGroup.style.display = 'block';
    }
    if (roleField) roleField.disabled = false;
    
    if (userModal) userModal.show();
};

// Edit user
window.editUser = function(id) {
    console.log('Editing user:', id);
    const user = users.find(u => u.id === id);
    
    if (!user) {
        console.error('User not found:', id);
        showAlert('User not found', 'danger');
        return;
    }
    
    editingUserId = id;
    
    const modalTitle = document.getElementById('modalTitle');
    const emailField = document.getElementById('email');
    const firstNameField = document.getElementById('firstName');
    const lastNameField = document.getElementById('lastName');
    const roleField = document.getElementById('role');
    const statusField = document.getElementById('status');
    const passwordField = document.getElementById('password');
    const passwordGroup = passwordField?.closest('.mb-3');
    
    if (modalTitle) modalTitle.textContent = 'Edit User';
    if (emailField) emailField.value = user.email || '';
    if (firstNameField) firstNameField.value = user.first_name || '';
    if (lastNameField) lastNameField.value = user.last_name || '';
    if (roleField) {
        roleField.value = user.role || 'user';
        // Disable role field if editing admin (only one admin allowed)
        roleField.disabled = user.role === 'admin';
    }
    if (statusField) statusField.value = user.status || 'active';
    
    // Hide password field for admin users - they cannot change password here
    if (passwordField && passwordGroup) {
        if (user.role === 'admin') {
            passwordGroup.style.display = 'none';
            passwordField.value = '';
            passwordField.required = false;
        } else {
            passwordGroup.style.display = 'block';
            passwordField.value = '';
            passwordField.required = false;
        }
    }
    
    if (userModal) userModal.show();
};

// Delete user
window.deleteUser = async function(id, email) {
    // Check if trying to delete admin
    const user = users.find(u => u.id === id);
    if (user && user.role === 'admin') {
        showAlert('Cannot delete the admin account', 'danger');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user: ${email}?`)) {
        return;
    }
    
    try {
        // Ensure authenticated
        await ensureAuthenticated();
        
        // Delete using direct Supabase call
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('User deleted successfully', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user: ' + error.message, 'danger');
    }
};

// Handle form submission
const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.querySelector('#userForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        }
        
        try {
            const roleValue = document.getElementById('role').value;
            
            // Prevent creating multiple admin accounts
            if (!editingUserId && roleValue === 'admin') {
                const adminExists = users.some(u => u.role === 'admin');
                if (adminExists) {
                    showAlert('Only one admin account is allowed', 'danger');
                    return;
                }
            }
            
            const formData = {
                email: document.getElementById('email').value.trim(),
                first_name: document.getElementById('firstName').value.trim(),
                last_name: document.getElementById('lastName').value.trim(),
                full_name: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
                role: roleValue,
                status: document.getElementById('status')?.value || 'active'
            };
            
            const password = document.getElementById('password').value;
            
            if (editingUserId) {
                // Ensure authenticated
                await ensureAuthenticated();
                
                // Update existing user
                const { data, error } = await supabase
                    .from('users')
                    .update(formData)
                    .eq('id', editingUserId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                // Update password if provided
                if (password) {
                    // Note: Password update would need special handling via Supabase Admin API
                    console.log('Password update not yet implemented for editing');
                }
                
                showAlert('User updated successfully', 'success');
            } else {
                // Ensure authenticated
                await ensureAuthenticated();
                
                // Create new user
                // For now, just create the users table record
                const { data, error } = await supabase
                    .from('users')
                    .insert([formData])
                    .select()
                    .single();
                
                if (error) throw error;
                
                showAlert('User created successfully', 'success');
            }
            
            if (userModal) userModal.hide();
            await loadUsers();
            
        } catch (error) {
            console.error('Error saving user:', error);
            showAlert('Failed to save user: ' + error.message, 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = editingUserId ? 'Update User' : 'Create User';
            }
        }
    });
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
export { loadUsers, renderUsers };
