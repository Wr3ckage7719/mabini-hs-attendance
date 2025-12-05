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
    
    // Stop QR scanner when switching away
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log('QR Scanner stopped');
            qrStatus.textContent = 'Scanner stopped';
        }).catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
});

qrTabBtn.addEventListener('click', () => {
    qrTabBtn.classList.add('active');
    emailTabBtn.classList.remove('active');
    qrTab.classList.add('active');
    emailTab.classList.remove('active');
    
    // Start QR scanner when switching to QR tab
    setTimeout(() => {
        startQRScanner();
    }, 300); // Small delay to ensure DOM is ready
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
        sessionStorage.setItem('loginMethod', 'email');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Clear any logout flag
        sessionStorage.removeItem('justLoggedOut');
        
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
        console.log('Scanner already running');
        return;
    }
    
    qrStatus.textContent = 'Starting camera...';
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    html5QrCode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        config,
        async (decodedText) => {
            console.log('QR Code detected:', decodedText);
            qrStatus.textContent = 'QR Code detected! Authenticating...';
            
            // Process the QR code login
            await handleQRLogin(decodedText);
        },
        (errorMessage) => {
            // Ignore scanning errors - they're normal during continuous scanning
            // Only log if it's a real error
            if (!errorMessage.includes('NotFoundException')) {
                console.debug('Scan frame error:', errorMessage);
            }
        }
    ).then(() => {
        qrStatus.textContent = 'Ready to scan - Point camera at QR code';
        console.log('QR Scanner started successfully');
    }).catch((err) => {
        console.error('QR Scanner start error:', err);
        
        if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
            qrStatus.textContent = 'Camera permission denied. Please allow camera access.';
            showAlert('Please allow camera access to use QR login', 'error');
        } else if (err.toString().includes('NotFoundError')) {
            qrStatus.textContent = 'No camera found on this device';
            showAlert('No camera detected. Please use email login.', 'error');
        } else {
            qrStatus.textContent = 'Camera unavailable. Please use email login.';
            showAlert('Camera error: ' + err.message, 'error');
        }
    });
}

// Handle QR code login
async function handleQRLogin(qrData) {
    try {
        console.log('QR Code scanned:', qrData);
        
        // Extract student number from any QR format
        let studentNumber = null;
        
        // Try parsing as JSON first (format: {"studentNumber":"123456"})
        try {
            const jsonData = JSON.parse(qrData);
            studentNumber = jsonData.studentNumber || jsonData.student_number || jsonData.id || jsonData.number;
            if (studentNumber) {
                console.log('Extracted student number from JSON:', studentNumber);
            }
        } catch (e) {
            // Not JSON, continue to other formats
        }
        
        // Try extracting from URL format (format: https://example.com?student=123456)
        if (!studentNumber && qrData.includes('://')) {
            try {
                const url = new URL(qrData);
                studentNumber = url.searchParams.get('student') || 
                              url.searchParams.get('studentNumber') || 
                              url.searchParams.get('student_number') ||
                              url.searchParams.get('id') ||
                              url.searchParams.get('number');
                if (studentNumber) {
                    console.log('Extracted student number from URL:', studentNumber);
                }
            } catch (e) {
                // Not a valid URL
            }
        }
        
        // Try extracting numbers from text (fallback for plain text or embedded numbers)
        if (!studentNumber) {
            // Remove all non-numeric characters and check if we have a valid number
            const numericOnly = qrData.replace(/\D/g, '');
            if (numericOnly.length >= 3 && numericOnly.length <= 10) {
                studentNumber = numericOnly;
                console.log('Extracted student number from text:', studentNumber);
            } else if (qrData.trim().length > 0) {
                // If it's already just the number, use it directly
                studentNumber = qrData.trim();
                console.log('Using QR data as-is:', studentNumber);
            }
        }
        
        if (!studentNumber || studentNumber.length === 0) {
            showAlert('Invalid QR code. No student number found.');
            qrStatus.textContent = 'Invalid QR code - Ready to scan again';
            console.error('Could not extract student number from:', qrData);
            return;
        }
        
        console.log('Final student number to lookup:', studentNumber);
        
        // Stop the scanner to prevent multiple scans
        if (html5QrCode && html5QrCode.isScanning) {
            await html5QrCode.stop();
        }
        
        qrStatus.textContent = 'Authenticating student...';
        
        // Find student by student number
        const studentResult = await dataClient.getAll('students', [
            { field: 'student_number', operator: '==', value: studentNumber }
        ]);
        
        const student = studentResult.data && studentResult.data.length > 0 ? studentResult.data[0] : null;
        
        if (!student) {
            showAlert('Student not found. Invalid QR code.');
            qrStatus.textContent = 'Student not found - Ready to scan again';
            // Restart scanner
            setTimeout(() => startQRScanner(), 2000);
            return;
        }
        
        console.log('Student found via QR:', student);
        
        // Check if student account is active
        if (student.status !== 'active') {
            showAlert('Your account is not active. Please contact administration.');
            qrStatus.textContent = 'Account inactive - Ready to scan again';
            // Restart scanner
            setTimeout(() => startQRScanner(), 2000);
            return;
        }
        
        // Check enrollment status
        if (student.enrollment_status && student.enrollment_status !== 'enrolled') {
            showAlert('Your enrollment status is ' + student.enrollment_status + '. Please contact administration.');
            qrStatus.textContent = 'Enrollment issue - Ready to scan again';
            // Restart scanner
            setTimeout(() => startQRScanner(), 2000);
            return;
        }
        
        // Direct QR login - no password required
        // Store student data in session
        sessionStorage.setItem('studentData', JSON.stringify(student));
        sessionStorage.setItem('userRole', 'student');
        sessionStorage.setItem('loginMethod', 'qr');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Clear any logout flag
        sessionStorage.removeItem('justLoggedOut');
        
        qrStatus.textContent = 'Login successful! Redirecting...';
        showAlert('QR Login successful! Welcome, ' + student.first_name + '!', 'success');
        
        // Redirect to student dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('QR Login error:', error);
        showAlert('Network error. Please check your connection and try again.');
        qrStatus.textContent = 'Network error - Ready to scan again';
        // Restart scanner
        setTimeout(() => startQRScanner(), 2000);
    }
}

// Check if already logged in
window.addEventListener('load', async () => {
    try {
        // Check if user just logged out - prevent auto-login
        const justLoggedOut = sessionStorage.getItem('justLoggedOut');
        if (justLoggedOut === 'true') {
            // Clear the flag and don't auto-login
            sessionStorage.removeItem('justLoggedOut');
            return;
        }
        
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
                sessionStorage.clear();
            }
        }
    } catch (error) {
        console.error('Auto-login check error:', error);
        // On error, clear session to be safe
        sessionStorage.clear();
    }
});

// Cleanup: Stop scanner when leaving page
window.addEventListener('beforeunload', () => {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => {
            console.error('Error stopping scanner on unload:', err);
        });
    }
});

// Cleanup: Stop scanner when page is hidden (mobile)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => {
            console.error('Error stopping scanner on visibility change:', err);
        });
    } else if (!document.hidden && qrTab.classList.contains('active') && html5QrCode && !html5QrCode.isScanning) {
        // Restart scanner if QR tab is active and page becomes visible again
        startQRScanner();
    }
});
