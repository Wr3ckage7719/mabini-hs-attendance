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
        console.log('=== TEACHER LOGIN ATTEMPT ===');
        console.log('Email/Username:', email);
        console.log('Password length:', password.length);
        
        // First, test if we can query teachers table at all
        console.log('Testing teachers table access...');
        const testResult = await dataClient.getAll('teachers', []);
        console.log('All teachers query result:', {
            success: !testResult.error,
            error: testResult.error,
            count: testResult.data?.length || 0,
            hasData: !!testResult.data
        });
        
        if (testResult.data && testResult.data.length > 0) {
            console.log('Sample teacher emails:', testResult.data.map(t => t.email));
        }
        
        // Query teachers table by email first
        console.log('Querying by email...');
        const emailResult = await dataClient.getAll('teachers', [
            { field: 'email', operator: '==', value: email }
        ]);
        
        console.log('Email query result:', {
            success: !emailResult.error,
            error: emailResult.error,
            dataLength: emailResult.data?.length || 0,
            data: emailResult.data
        });
        
        let teacher = emailResult.data && emailResult.data.length > 0 ? emailResult.data[0] : null;
        
        // If not found by email, try by username
        if (!teacher) {
            console.log('Not found by email, querying by username...');
            const usernameResult = await dataClient.getAll('teachers', [
                { field: 'username', operator: '==', value: email }
            ]);
            
            console.log('Username query result:', {
                success: !usernameResult.error,
                error: usernameResult.error,
                dataLength: usernameResult.data?.length || 0,
                data: usernameResult.data
            });
            
            teacher = usernameResult.data && usernameResult.data.length > 0 ? usernameResult.data[0] : null;
        }
        
        if (!teacher) {
            console.error('=== TEACHER NOT FOUND ===');
            console.error('Searched for:', email);
            showAlert('Invalid email or password.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('=== TEACHER FOUND ===');
        console.log('Teacher ID:', teacher.id);
        console.log('Teacher Email:', teacher.email);
        console.log('Teacher Username:', teacher.username);
        console.log('Teacher Name:', `${teacher.first_name} ${teacher.last_name}`);
        console.log('Teacher Status:', teacher.status);
        console.log('Has Password:', !!teacher.password);
        console.log('Password from DB:', teacher.password);
        
        // Check password
        console.log('=== PASSWORD CHECK ===');
        console.log('Input password:', password);
        console.log('DB password:', teacher.password);
        console.log('Passwords match:', teacher.password === password);
        
        if (!teacher.password) {
            console.error('No password set in database!');
            showAlert('Account error: No password set. Please contact administration.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        if (teacher.password !== password) {
            console.error('Password mismatch!');
            showAlert('Invalid email or password.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        // Check status
        console.log('=== STATUS CHECK ===');
        console.log('Status:', teacher.status);
        if (teacher.status && teacher.status !== 'active') {
            console.error('Account not active. Status:', teacher.status);
            showAlert('Your account is not active. Please contact administration.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('=== LOGIN SUCCESSFUL ===');
        
        // Store teacher data in session
        const teacherDataToStore = {
            id: teacher.id,
            employee_number: teacher.employee_number,
            email: teacher.email,
            username: teacher.username,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            middle_name: teacher.middle_name,
            fullName: `${teacher.first_name} ${teacher.middle_name || ''} ${teacher.last_name}`.trim(),
            department: teacher.department,
            position: teacher.position,
            phone: teacher.phone,
            status: teacher.status,
            role: 'teacher'
        };
        
        sessionStorage.setItem('teacherData', JSON.stringify(teacherDataToStore));
        sessionStorage.setItem('userRole', 'teacher');
        sessionStorage.setItem('userData', JSON.stringify(teacherDataToStore));
        sessionStorage.setItem('loginMethod', 'email');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Clear any logout flag
        sessionStorage.removeItem('justLoggedOut');
        
        console.log('Session data stored successfully');
        
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to teacher dashboard
        setTimeout(() => {
            console.log('Redirecting to dashboard...');
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
        console.log('=== QR CODE SCAN START ===');
        console.log('Raw QR Data:', qrData);
        console.log('QR Data Type:', typeof qrData);
        console.log('QR Data Length:', qrData?.length);
        
        // Extract employee number from any QR format
        let identifier = null;
        
        // Try parsing as JSON first (format: {"employeeNumber":"T12345"})
        try {
            const jsonData = JSON.parse(qrData);
            identifier = jsonData.employeeNumber || jsonData.employee_number || jsonData.id || jsonData.number || jsonData.email;
            if (identifier) {
                console.log('Extracted identifier from JSON:', identifier);
            }
        } catch (e) {
            // Not JSON, continue to other formats
        }
        
        // Try extracting from URL format (format: https://example.com?teacher=T12345)
        if (!identifier && qrData.includes('://')) {
            try {
                const url = new URL(qrData);
                identifier = url.searchParams.get('teacher') || 
                           url.searchParams.get('employeeNumber') || 
                           url.searchParams.get('employee_number') ||
                           url.searchParams.get('id') ||
                           url.searchParams.get('number') ||
                           url.searchParams.get('email');
                if (identifier) {
                    console.log('Extracted identifier from URL:', identifier);
                }
            } catch (e) {
                // Not a valid URL
            }
        }
        
        // Check if it looks like an email
        if (!identifier && qrData.includes('@')) {
            identifier = qrData.trim();
            console.log('Using email from QR:', identifier);
        }
        
        // Try extracting alphanumeric ID (for employee numbers like T12345)
        if (!identifier) {
            // Remove special characters but keep alphanumeric
            const alphaNumeric = qrData.replace(/[^a-zA-Z0-9]/g, '');
            if (alphaNumeric.length >= 3 && alphaNumeric.length <= 15) {
                identifier = alphaNumeric;
                console.log('Extracted identifier from text:', identifier);
            } else if (qrData.trim().length > 0) {
                // Use as-is if it's already clean
                identifier = qrData.trim();
                console.log('Using QR data as-is:', identifier);
            }
        }
        
        if (!identifier || identifier.length === 0) {
            console.error('=== IDENTIFIER EXTRACTION FAILED ===');
            console.error('Raw QR Data:', qrData);
            console.error('Could not extract any valid identifier');
            showAlert('Invalid QR code. No identifier found.');
            qrStatus.textContent = 'Invalid QR code - Ready to scan again';
            return;
        }
        
        console.log('=== IDENTIFIER EXTRACTED ===');
        console.log('Final identifier:', identifier);
        console.log('Identifier length:', identifier.length);
        console.log('Identifier type:', typeof identifier);
        
        // Stop the scanner to prevent multiple scans
        if (html5QrCode && html5QrCode.isScanning) {
            await html5QrCode.stop();
        }
        
        qrStatus.textContent = 'Authenticating teacher...';
        
        console.log('=== DATABASE LOOKUP START ===');
        console.log('Searching for identifier:', identifier);
        
        // Find teacher by employee_number first
        console.log('Attempt 1: Searching by employee_number...');
        let teacherResult = await dataClient.getAll('teachers', [
            { field: 'employee_number', operator: '==', value: identifier }
        ]);
        
        console.log('Employee number query result:', teacherResult);
        let teacher = teacherResult.data && teacherResult.data.length > 0 ? teacherResult.data[0] : null;
        console.log('Employee number search result:', teacher ? 'FOUND' : 'NOT FOUND');
        
        // If not found by employee_number, try email
        if (!teacher && identifier.includes('@')) {
            console.log('Attempt 2: Searching by email...');
            teacherResult = await dataClient.getAll('teachers', [
                { field: 'email', operator: '==', value: identifier }
            ]);
            console.log('Email query result:', teacherResult);
            teacher = teacherResult.data && teacherResult.data.length > 0 ? teacherResult.data[0] : null;
            console.log('Email search result:', teacher ? 'FOUND' : 'NOT FOUND');
        }
        
        // If still not found, try username field
        if (!teacher) {
            console.log('Attempt 3: Searching by username...');
            teacherResult = await dataClient.getAll('teachers', [
                { field: 'username', operator: '==', value: identifier }
            ]);
            console.log('Username query result:', teacherResult);
            teacher = teacherResult.data && teacherResult.data.length > 0 ? teacherResult.data[0] : null;
            console.log('Username search result:', teacher ? 'FOUND' : 'NOT FOUND');
        }
        
        console.log('=== DATABASE LOOKUP END ===');
        if (teacher) {
            console.log('Teacher found:', {
                id: teacher.id,
                employee_number: teacher.employee_number,
                email: teacher.email,
                name: `${teacher.first_name} ${teacher.last_name}`,
                status: teacher.status
            });
        }
        
        if (!teacher) {
            console.error('Teacher not found in database. Searched for:', identifier);
            console.error('Tried fields: employee_number, email, username');
            showAlert('Teacher not found. Please ensure your QR code contains a valid employee number, email, or username.');
            qrStatus.textContent = 'Teacher not found - Ready to scan again';
            // Restart scanner
            setTimeout(() => startQRScanner(), 2000);
            return;
        }
        
        console.log('Teacher found via QR:', {
            id: teacher.id,
            employee_number: teacher.employee_number,
            email: teacher.email,
            username: teacher.username,
            name: `${teacher.first_name} ${teacher.last_name}`,
            status: teacher.status
        });
        
        // Check if teacher account is active (handle null/undefined status as active)
        if (teacher.status && teacher.status !== 'active') {
            console.error('Account not active. Status:', teacher.status);
            showAlert('Your account is not active. Please contact administration.');
            qrStatus.textContent = 'Account inactive - Ready to scan again';
            // Restart scanner
            setTimeout(() => startQRScanner(), 2000);
            return;
        }
        
        // Direct QR login - no password required (same as student QR login)
        // Store teacher data in session
        sessionStorage.setItem('teacherData', JSON.stringify(teacher));
        sessionStorage.setItem('userRole', 'teacher');
        sessionStorage.setItem('userData', JSON.stringify(teacher)); // Required by dashboard and other pages
        sessionStorage.setItem('loginMethod', 'qr');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Clear any logout flag
        sessionStorage.removeItem('justLoggedOut');
        
        qrStatus.textContent = 'Login successful! Redirecting...';
        showAlert('QR Login successful! Welcome, ' + teacher.first_name + '!', 'success');
        
        // Redirect to teacher dashboard
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
            sessionStorage.removeItem('justLoggedOut');
            return;
        }
        
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
