// Common teacher functionality
import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';

console.log('Teacher common script loaded');

let currentUser = null;

// Check authentication
async function checkAuth() {
    try {
        // Get current user from Supabase
        const user = await authClient.getCurrentUser();
        
        if (!user) {
            console.log('Not authenticated, redirecting to login');
            sessionStorage.removeItem('userData');
            window.location.href = 'login.html';
            return false;
        }

        // Get user profile to verify role
        const profile = await authClient.getUserProfile();
        
        if (!profile || profile.role !== 'teacher') {
            console.log('Auth verification failed or not a teacher');
            sessionStorage.removeItem('userData');
            window.location.href = 'login.html';
            return false;
        }
        
        // Store user data
        currentUser = {
            id: user.id,
            email: user.email,
            fullName: profile.full_name || profile.first_name + ' ' + profile.last_name,
            full_name: profile.full_name,
            role: profile.role,
            ...profile
        };
        
        // Persist to session
        sessionStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Update UI
        updateUserProfile(currentUser);

        return true;
    } catch (e) {
        console.error('Auth check error:', e);
        sessionStorage.removeItem('userData');
        window.location.href = 'login.html';
        return false;
    }
}

// Update user profile in UI
function updateUserProfile(user) {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = user.fullName || user.full_name || 'Teacher';
    if (userRoleEl) {
        const role = user.role || 'Teacher';
        userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    if (userAvatarEl) {
        const name = user.fullName || user.full_name || 'TE';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatarEl.textContent = initials;
    }
}

// Get documents from API
async function getDocuments(collection) {
    try {
        const { data, error } = await dataClient.getAll(collection);
        
        if (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

// Get single document from API
async function getDocument(collection, id) {
    try {
        const { data, error } = await dataClient.getOne(collection, id);
        
        if (error) {
            console.error('Error fetching document:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching document:', error);
        return null;
    }
}

// Export for use in other teacher scripts
window.getDocuments = getDocuments;
window.getDocument = getDocument;
window.dataClient = dataClient;
window.authClient = authClient;

// Sidebar toggle for mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

// Logout function
window.doLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        // Try to import and use centralized logout
        import('../../shared/js/auth.js').then(mod => {
            if (mod && typeof mod.logout === 'function') {
                mod.logout();
            } else {
                sessionStorage.removeItem('userData');
                window.location.href = '/Mabini_HS_Attendance/Mabini_attendance_system/public/index.html';
            }
        }).catch(err => {
            console.warn('Auth module import failed', err);
            sessionStorage.removeItem('userData');
            window.location.href = '/Mabini_HS_Attendance/Mabini_attendance_system/public/index.html';
        });
    }
};

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.warn('Alert container not found');
        return;
    }
    
    const alertClass = type === 'error' ? 'alert-danger' : type === 'success' ? 'alert-success' : 'alert-info';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Set active navigation based on current page
function setActiveNavFromLocation() {
    try {
        const path = window.location.pathname || '';
        const filename = path.split('/').pop() || '';
        
        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            const linkFile = href.split('/').pop();
            
            if (linkFile === filename) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    } catch (e) {
        console.warn('setActiveNavFromLocation failed', e);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavFromLocation();
    
    // Attach logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', doLogout);
    }
    
    // Load user profile if in session
    try {
        const userData = sessionStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            updateUserProfile(user);
        }
    } catch (e) {
        console.warn('Failed to load user profile from session', e);
    }
    
    // Verify authentication
    checkAuth().catch(err => console.error('Auth check failed:', err));
});

console.log('Teacher common script ready');
