// Import Firebase functions
import { login, resetPassword, checkAuth } from '../shared/js/auth.js';

// Detect role from URL parameter
const urlParams = new URLSearchParams(window.location.search);
let userRole = urlParams.get('role') || 'teacher'; // default to teacher

// QR Scanner instance
let html5QrCode = null;

// Update page based on role
document.addEventListener('DOMContentLoaded', () => {
    const subtitle = document.getElementById('role-subtitle');
    const qrMessage = document.getElementById('qr-message');
    const qrTabBtn = document.querySelector('.tab-btn[onclick*="qr"]');
    const tabsContainer = document.querySelector('.tabs-container');
    const logoIcon = document.querySelector('.logo-icon');
    
    if (userRole === 'admin') {
        subtitle.textContent = 'Administrator Portal';
        logoIcon.innerHTML = '<i class="bi bi-person-badge-fill" aria-hidden="true"></i>';
        logoIcon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        // Completely hide QR tab and content for admin
        if (qrTabBtn) {
            qrTabBtn.style.display = 'none';
        }
        // Hide the entire tabs container if admin (since only one option)
        if (tabsContainer) {
            tabsContainer.style.display = 'none';
        }
        // Make email tab always visible
        document.getElementById('email-tab').classList.add('active');
        
    } else if (userRole === 'teacher') {
        subtitle.textContent = 'Teacher Portal';
        logoIcon.innerHTML = '<i class="bi bi-person-lines-fill" aria-hidden="true"></i>';
        logoIcon.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        qrMessage.textContent = 'Scan your teacher QR code to sign in';
        
    } else if (userRole === 'student') {
        subtitle.textContent = 'Student Portal';
        logoIcon.innerHTML = '<i class="bi bi-mortarboard" aria-hidden="true"></i>';
        logoIcon.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        qrMessage.textContent = 'Scan your student QR code to sign in';
    }
});

// Tab switching
window.switchTab = function(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'email') {
        document.getElementById('email-tab').classList.add('active');
        // Stop QR scanner if running
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                html5QrCode = null;
            }).catch(err => console.error('Error stopping scanner:', err));
        }
    } else {
        document.getElementById('qr-tab').classList.add('active');
        // Auto-start scanner for teacher/student
        if (userRole !== 'admin') {
            setTimeout(() => startQRScanner(), 300);
        }
    }
}

// Email login handler
window.handleEmailLogin = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const btn = document.getElementById('login-btn');
    
    // Clear previous alerts
    document.getElementById('alert-container').innerHTML = '';
    
    // Show loading state
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    
    try {
        // Login with role verification
        const result = await login(email, password, userRole);
        
        if (result.success) {
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (userRole === 'admin') {
                    window.location.href = '../admin/dashboard.html';
                } else if (userRole === 'teacher') {
                    window.location.href = '../teacher/dashboard.html';
                } else {
                    window.location.href = '../student/dashboard.html';
                }
            }, 1000);
        } else {
            showAlert(result.error || 'Invalid credentials. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'An error occurred. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

// Forgot password handler
window.handleForgotPassword = async function(e) {
    e.preventDefault();
    
    const email = prompt('Please enter your email address:');
    if (!email) return;
    
    try {
        const result = await resetPassword(email);
        if (result.success) {
            showAlert('Password reset email sent! Please check your inbox.', 'success');
        } else {
            showAlert(result.error || 'Failed to send reset email. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        showAlert(error.message || 'Failed to send reset email. Please try again.', 'error');
    }
}

// QR Scanner
window.startQRScanner = async function() {
    // Don't start scanner for admin
    if (userRole === 'admin') return;
    
    const qrReader = document.getElementById('qr-reader');
    const qrStatus = document.getElementById('qr-status');
    
    if (html5QrCode) {
        // Scanner already running
        return;
    }
    
    try {
        html5QrCode = new Html5Qrcode("qr-reader");
        qrStatus.textContent = 'Starting camera...';
        
        await html5QrCode.start(
            { facingMode: "environment" }, // Use back camera
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            async (decodedText, decodedResult) => {
                // QR code successfully scanned
                qrStatus.textContent = 'QR Code detected! Verifying...';
                
                try {
                    // Parse QR code data (expected format: JSON with userId)
                    const qrData = JSON.parse(decodedText);
                    
                    if (!qrData.userId || !qrData.role) {
                        throw new Error('Invalid QR code format');
                    }
                    
                    // Verify role matches
                    if (qrData.role !== userRole) {
                        showAlert(`This is a ${qrData.role} QR code. Please use a ${userRole} QR code.`, 'error');
                        return;
                    }
                    
                    // Stop scanner
                    await html5QrCode.stop();
                    html5QrCode = null;
                    
                    // Authenticate with QR code data
                    await authenticateWithQR(qrData);
                    
                } catch (error) {
                    console.error('QR verification error:', error);
                    showAlert('Invalid QR code. Please scan a valid ' + userRole + ' QR code.', 'error');
                }
            },
            (errorMessage) => {
                // Scanning error (can be ignored for most cases)
            }
        );
        
        qrStatus.textContent = 'Point your camera at the QR code';
        
    } catch (error) {
        console.error('QR scanner error:', error);
        qrStatus.textContent = 'Camera access denied or not available';
        showAlert('Unable to access camera. Please check permissions.', 'error');
    }
}

// Authenticate with QR code
async function authenticateWithQR(qrData) {
    try {
        // Import Firebase functions
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
        const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');
        const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js');
        
        // Get Firebase instance from config
        const { db, auth } = await import('../shared/js/firebase-config.js');
        
        // Verify user exists in Firestore
        let userDoc = null;
        let userData = null;
        
        // Check in multiple collections based on role
        const collections = userRole === 'teacher' ? ['teachers', 'users'] : ['students', 'users'];
        
        for (const collectionName of collections) {
            const docRef = doc(db, collectionName, qrData.userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                userData = docSnap.data();
                userDoc = docSnap;
                break;
            }
        }
        
        if (!userData) {
            showAlert('User not found. Please contact administrator.', 'error');
            return;
        }
        
        // Verify role matches
        if (userData.role !== userRole) {
            showAlert('Access denied. Invalid role.', 'error');
            return;
        }
        
        // Store user data in session (simulating authenticated session)
        // Note: For production, you should use Firebase Custom Tokens for proper authentication
        sessionStorage.setItem('userData', JSON.stringify({
            uid: qrData.userId,
            email: userData.email || '',
            role: userData.role,
            fullName: userData.fullName || userData.name || 'User',
            qrAuthenticated: true,
            ...userData
        }));
        
        showAlert('QR login successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(() => {
            if (userRole === 'teacher') {
                window.location.href = '../teacher/dashboard.html';
            } else if (userRole === 'student') {
                window.location.href = '../student/dashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('QR authentication error:', error);
        showAlert('Authentication failed. Please try again.', 'error');
    }
}

// Alert helper
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    alertContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Check if already authenticated
window.addEventListener('load', async () => {
    const authStatus = await checkAuth();
    if (authStatus.authenticated) {
        const role = authStatus.role;
        if (role === 'admin') {
            window.location.href = '../admin/dashboard.html';
        } else if (role === 'teacher') {
            window.location.href = '../teacher/dashboard.html';
        } else if (role === 'student') {
            window.location.href = '../student/dashboard.html';
        }
    }
});
