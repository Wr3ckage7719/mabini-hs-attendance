// =====================================================
// TEACHER LOGIN - Supabase Authentication
// =====================================================

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';

// DOM Elements
const loginForm = document.getElementById('teacher-login-form');
const emailInput = document.getElementById('teacher-email');
const passwordInput = document.getElementById('teacher-password');
const loginBtn = document.getElementById('login-btn');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const alertContainer = document.getElementById('alert-container');
const emailTabBtn = document.getElementById('email-tab-btn');
const qrTabBtn = document.getElementById('qr-tab-btn');
const emailTab = document.getElementById('email-tab');
const qrTab = document.getElementById('qr-tab');
const qrStatus = document.getElementById('qr-status');

let html5QrCode = null;

// Show alert message
function showAlert(message, type = 'error') {
    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Tab switching
emailTabBtn.addEventListener('click', () => {
    emailTabBtn.classList.add('active');
    qrTabBtn.classList.remove('active');
    emailTab.classList.add('active');
    qrTab.classList.remove('active');
    
    // Stop QR scanner
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop();
    }
});

qrTabBtn.addEventListener('click', () => {
    qrTabBtn.classList.add('active');
    emailTabBtn.classList.remove('active');
    qrTab.classList.add('active');
    emailTab.classList.remove('active');
    
    // Start QR scanner
    startQRScanner();
});

// Handle email login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields');
        return;
    }
    
    // Disable button and show loading
    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Signing in...';
    
    try {
        console.log('Teacher login attempt:', email);
        
        // Query teachers table by email
        const teacherResult = await dataClient.getAll('teachers', [
            { field: 'email', operator: '==', value: email }
        ]);
        
        const teacher = teacherResult.data && teacherResult.data.length > 0 ? teacherResult.data[0] : null;
        
        if (!teacher) {
            showAlert('Invalid email or password.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('Teacher found:', teacher);
        
        // Check password
        if (teacher.password !== password) {
            showAlert('Invalid email or password.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        // Check status
        if (teacher.status && teacher.status !== 'active') {
            showAlert('Your account is not active. Please contact administration.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        // Store teacher data in session
        sessionStorage.setItem('teacherData', JSON.stringify(teacher));
        sessionStorage.setItem('userRole', 'teacher');
        
        showAlert('Login successful! Redirecting...', 'success');
        // Redirect to teacher dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An unexpected error occurred. Please try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
});

// Handle forgot password (fallback - link now has direct href)
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        console.log('Forgot password clicked - redirecting...');
        // Link now has direct href, but keep this as fallback
        if (e.target.getAttribute('href') === '#') {
            e.preventDefault();
            window.location.href = 'forgot-password.html';
        }
    });
}

// QR Code Scanner
function startQRScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }
    
    if (html5QrCode.isScanning) {
        return;
    }
    
    qrStatus.textContent = 'Starting camera...';
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
            qrStatus.textContent = 'QR Code detected! Authenticating...';
            await handleQRLogin(decodedText);
        },
        (errorMessage) => {
            // Ignore common scanning errors
        }
    ).catch((err) => {
        console.error('QR Scanner error:', err);
        qrStatus.textContent = 'Camera access denied or unavailable';
    });
    
    qrStatus.textContent = 'Ready to scan - Point camera at QR code';
}

// Handle QR code login
async function handleQRLogin(qrData) {
    try {
        // Parse QR code data
        let data;
        try {
            data = JSON.parse(qrData);
        } catch {
            // Might be just an employee number
            data = { employee_number: qrData };
        }
        
        // Find teacher by employee number or QR code
        const teacher = await dataClient.query('teachers', {
            filter: data.employee_number ? 
                { employee_number: data.employee_number } : 
                { qr_code: qrData },
            single: true
        });
        
        if (!teacher) {
            showAlert('Teacher not found. Please contact administration.');
            qrStatus.textContent = 'Not found - Ready to scan again';
            return;
        }
        
        if (teacher.status !== 'active') {
            showAlert('Your account is inactive. Please contact administration.');
            qrStatus.textContent = 'Account inactive - Ready to scan again';
            return;
        }
        
        // For true QR login, redirect to email login with pre-filled email
        showAlert('QR verified! Please log in with your email and password.', 'success');
        qrStatus.textContent = 'Please use email login';
        
        // Switch to email tab and pre-fill email
        emailTabBtn.click();
        emailInput.value = teacher.email || '';
        passwordInput.focus();
        
    } catch (error) {
        console.error('QR Login error:', error);
        showAlert('Invalid QR code format');
        qrStatus.textContent = 'Error - Ready to scan again';
    }
}

// Check if already logged in
window.addEventListener('load', async () => {
    try {
        // Check if teacher is logged in via session storage
        const teacherData = sessionStorage.getItem('teacherData');
        const userRole = sessionStorage.getItem('userRole');
        
        if (teacherData && userRole === 'teacher') {
            const teacher = JSON.parse(teacherData);
            
            // Verify teacher still exists and is active
            const teacherResult = await dataClient.getAll('teachers', [
                { field: 'id', operator: '==', value: teacher.id }
            ]);
            
            const currentTeacher = teacherResult.data && teacherResult.data.length > 0 
                ? teacherResult.data[0] : null;
            
            if (currentTeacher && currentTeacher.status === 'active') {
                window.location.href = 'dashboard.html';
                return;
            } else {
                // Teacher no longer exists or inactive - clear session
                sessionStorage.removeItem('teacherData');
                sessionStorage.removeItem('userRole');
            }
        }
    } catch (error) {
        console.error('Auto-login check error:', error);
        // On error, clear session to be safe
        sessionStorage.removeItem('teacherData');
        sessionStorage.removeItem('userRole');
    }
});
