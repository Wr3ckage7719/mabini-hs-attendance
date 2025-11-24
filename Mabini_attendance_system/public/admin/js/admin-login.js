// =====================================================
// ADMIN LOGIN - Supabase Authentication
// =====================================================

import { authClient } from '../../js/auth-client.js';

const form = document.getElementById('admin-login-form');
const emailInput = document.getElementById('admin-email');
const passwordInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');
const alertContainer = document.getElementById('alert-container');

// Show alert message
function showAlert(message, type = 'error') {
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    if (!email || !password) {
        showAlert('Please enter both email and password.');
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
    
    try {
        console.log('Login attempt:', email);
        
        // Create a timeout promise (30 seconds)
        const loginPromise = authClient.login(email, password);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout - took too long')), 30000)
        );
        
        // Race login against timeout
        const result = await Promise.race([loginPromise, timeoutPromise]);
        
        console.log('Login result:', result);
        
        if (result.success) {
            // Get user profile - it's already included in result.user.profile
            const profile = result.user.profile;
            
            if (!profile || profile.role !== 'admin') {
                await authClient.logout();
                showAlert('Access denied. Admin credentials required.');
                loginBtn.disabled = false;
                loginBtn.textContent = originalText;
                return;
            }
            
            // Store user data in session
            sessionStorage.setItem('userData', JSON.stringify({
                id: result.user.id,
                email: result.user.email,
                fullName: profile.full_name,
                role: profile.role,
                ...profile
            }));
            
            showAlert('✓ Login successful! Redirecting...', 'success');
            
            // Redirect to admin dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(result.error || 'Invalid credentials. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Login timeout - took too long') {
            showAlert('Login took too long. Please check your internet connection and try again.');
        } else {
            showAlert('An unexpected error occurred. Please try again.');
        }
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
});

// Check if already authenticated (with timeout)
window.addEventListener('load', async () => {
    try {
        // Set timeout for auth check (5 seconds)
        const checkPromise = (async () => {
            const user = await authClient.getCurrentUser();
            if (user) {
                const profile = await authClient.getUserProfile();
                if (profile?.role === 'admin') {
                    window.location.href = 'dashboard.html';
                }
            }
        })();
        
        // Race the check against a 5-second timeout
        await Promise.race([
            checkPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth check timeout')), 5000))
        ]);
    } catch (error) {
        // Silently ignore timeout or auth errors on page load
        console.log('Auth check skipped:', error.message);
    }
});

// Auto-focus email input
emailInput.focus();
