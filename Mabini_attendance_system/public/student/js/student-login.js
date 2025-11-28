// =====================================================
// STUDENT LOGIN - Supabase Authentication
// =====================================================

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';

// DOM Elements
const loginForm = document.getElementById('student-login-form');
const emailInput = document.getElementById('student-email');
const passwordInput = document.getElementById('student-password');
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
        console.log('Student login attempt:', email);
        
        // Query students table by email (username is also email)
        const studentResult = await dataClient.getAll('students', [
            { field: 'email', operator: '==', value: email }
        ]);
        
        const student = studentResult.data && studentResult.data.length > 0 ? studentResult.data[0] : null;
        
        if (!student) {
            showAlert('Invalid email or password.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('Student found:', student);
        console.log('Stored password:', student.password);
        console.log('Entered password:', password);
        console.log('Passwords match:', student.password === password);
        
        // Check password
        if (student.password !== password) {
            showAlert('Invalid email or password.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        // Check status
        if (student.status && student.status !== 'active') {
            showAlert('Your account is not active. Please contact administration.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        // Store student data in session
        sessionStorage.setItem('studentData', JSON.stringify(student));
        sessionStorage.setItem('userRole', 'student');
        
        // Check if this is a first login after password retrieval
        // You can add a flag in the database or check if password was recently reset
        // For now, we'll check if password hasn't been changed yet
        if (!sessionStorage.getItem('passwordChanged')) {
            sessionStorage.setItem('showPasswordPrompt', 'true');
        }
        
        showAlert('Login successful! Redirecting...', 'success');
        // Redirect to student dashboard
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
        console.log('QR Code scanned:', qrData);
        
        // QR code should contain just the student number
        const studentNumber = qrData.trim();
        
        if (!studentNumber) {
            showAlert('Invalid QR code. No student number found.');
            qrStatus.textContent = 'Invalid QR code - Ready to scan again';
            return;
        }
        
        qrStatus.textContent = 'Authenticating student...';
        
        // Find student by student number
        const studentResult = await dataClient.getAll('students', [
            { field: 'student_number', operator: '==', value: studentNumber }
        ]);
        
        const student = studentResult.data && studentResult.data.length > 0 ? studentResult.data[0] : null;
        
        if (!student) {
            showAlert('Student not found. Please check your QR code.');
            qrStatus.textContent = 'Student not found - Ready to scan again';
            return;
        }
        
        if (student.status !== 'active') {
            showAlert('Your account is not active. Please contact administration.');
            qrStatus.textContent = 'Account inactive - Ready to scan again';
            return;
        }
        
        // Check if student has auth account setup
        const result = await authClient.verifyStudentCredentials(studentNumber);
        
        if (result.success && result.hasAuth) {
            // Student has auth account - auto login
            // Note: For true QR login, we'd need a special token system
            // For now, redirect to email login
            showAlert('QR verified! Please log in with your email and password.', 'success');
            qrStatus.textContent = 'Please use email login';
            
            // Switch to email tab
            emailTabBtn.click();
            emailInput.value = student.email || '';
            emailInput.focus();
        } else {
            // Account not setup - show retrieval option
            showAlert('Your account is not set up yet. Please retrieve your account credentials first.', 'error');
            qrStatus.textContent = 'Account not set up - Please retrieve credentials';
            
            // Show account retrieval modal after a short delay
            setTimeout(() => {
                const retrieveModal = document.getElementById('retrieve-account-modal');
                if (retrieveModal) {
                    retrieveModal.style.display = 'flex';
                }
            }, 2000);
        }
        
    } catch (error) {
        console.error('QR Login error:', error);
        showAlert('Network error. Please check your connection and try again.');
        qrStatus.textContent = 'Network error - Ready to scan again';
    }
}

// Check if already logged in
window.addEventListener('load', async () => {
    try {
        // Check if student is logged in via session storage
        const studentData = sessionStorage.getItem('studentData');
        const userRole = sessionStorage.getItem('userRole');
        
        if (studentData && userRole === 'student') {
            const student = JSON.parse(studentData);
            
            // Verify student still exists and is active
            const studentResult = await dataClient.getAll('students', [
                { field: 'id', operator: '==', value: student.id }
            ]);
            
            const currentStudent = studentResult.data && studentResult.data.length > 0 
                ? studentResult.data[0] : null;
            
            if (currentStudent && currentStudent.status === 'active') {
                window.location.href = 'dashboard.html';
                return;
            } else {
                // Student no longer exists or inactive - clear session
                sessionStorage.removeItem('studentData');
                sessionStorage.removeItem('userRole');
            }
        }
    } catch (error) {
        console.error('Auto-login check error:', error);
        // On error, clear session to be safe
        sessionStorage.removeItem('studentData');
        sessionStorage.removeItem('userRole');
    }
});
