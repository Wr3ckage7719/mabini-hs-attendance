/**
 * Parent Link Generator Utility
 * Generates secure, shareable links for parent attendance viewing
 * 
 * Usage in Admin Panel or SMS System:
 * import { generateParentLink, generateSignedParentLink } from './parent-link-generator.js';
 */

/**
 * Generate basic parent attendance link (legacy, less secure)
 * @param {string} studentId - UUID of the student
 * @param {string} baseUrl - Base URL of your application
 * @returns {string} Complete URL for parent viewing
 */
export function generateParentLink(studentId, baseUrl = window.location.origin) {
    if (!studentId) {
        throw new Error('Student ID is required');
    }
    
    return `${baseUrl}/Parents/View.html?student_id=${studentId}`;
}

/**
 * Generate signed parent link with expiration (recommended)
 * @param {string} studentId - UUID of the student
 * @param {number} expiryHours - Hours until link expires (default: 168 = 7 days)
 * @param {string} baseUrl - Base URL of your application
 * @param {string} secret - Secret key for signing (optional, uses env)
 * @returns {Promise<string>} Signed URL with expiration
 */
export async function generateSignedParentLink(
    studentId, 
    expiryHours = 168,
    baseUrl = window.location.origin,
    secret = null
) {
    if (!studentId) {
        throw new Error('Student ID is required');
    }
    
    const expires = Date.now() + (expiryHours * 60 * 60 * 1000);
    const data = `${studentId}:${expires}`;
    
    // In browser environment, we'll create a simple hash
    // In Node.js/server environment, use crypto.createHmac
    let signature;
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Browser environment
        const encoder = new TextEncoder();
        const secretKey = secret || 'default-secret-key-change-in-production';
        const keyData = encoder.encode(secretKey);
        const messageData = encoder.encode(data);
        
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            messageData
        );
        
        signature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } else {
        // Fallback: simple hash (not cryptographically secure)
        console.warn('Using fallback hash - not secure for production');
        signature = btoa(data).substring(0, 32);
    }
    
    return `${baseUrl}/Parents/View.html?student_id=${studentId}&expires=${expires}&sig=${signature}`;
}

/**
 * Copy link to clipboard
 * @param {string} link - The link to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyLinkToClipboard(link) {
    try {
        await navigator.clipboard.writeText(link);
        return true;
    } catch (err) {
        console.error('Failed to copy link:', err);
        return false;
    }
}

/**
 * Share link via Web Share API (mobile-friendly)
 * @param {string} link - The link to share
 * @param {string} studentName - Name of the student
 * @returns {Promise<boolean>} Success status
 */
export async function shareLinkNative(link, studentName = 'your child') {
    if (!navigator.share) {
        console.warn('Web Share API not supported');
        return false;
    }
    
    try {
        await navigator.share({
            title: 'Student Attendance Report',
            text: `View ${studentName}'s attendance records`,
            url: link
        });
        return true;
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
        }
        return false;
    }
}

/**
 * Generate QR code for parent link (requires qrcode library)
 * @param {string} link - The parent link
 * @param {HTMLElement} container - DOM element to render QR code
 * @returns {Promise<void>}
 */
export async function generateQRCode(link, container) {
    try {
        // Dynamically import QR code library
        const QRCode = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm');
        
        await QRCode.toCanvas(container, link, {
            width: 200,
            margin: 2,
            color: {
                dark: '#071027',
                light: '#FFFFFF'
            }
        });
    } catch (err) {
        console.error('Failed to generate QR code:', err);
        throw err;
    }
}

/**
 * Validate parent link expiration
 * @param {string} expires - Expiry timestamp from URL
 * @returns {Object} Validation result
 */
export function validateLinkExpiry(expires) {
    if (!expires) {
        return { valid: true, message: 'No expiration set' };
    }
    
    const expiryTime = parseInt(expires);
    const now = Date.now();
    
    if (now > expiryTime) {
        return { 
            valid: false, 
            message: 'Link has expired',
            expiredAt: new Date(expiryTime)
        };
    }
    
    const hoursRemaining = Math.floor((expiryTime - now) / (1000 * 60 * 60));
    
    return {
        valid: true,
        message: 'Link is valid',
        expiresAt: new Date(expiryTime),
        hoursRemaining
    };
}

/**
 * Complete workflow: Generate and send link
 * Example usage in admin panel
 */
export async function sendAttendanceLinkToParent(student, method = 'copy') {
    const link = await generateSignedParentLink(student.id, 168); // 7 days
    
    switch (method) {
        case 'copy':
            const copied = await copyLinkToClipboard(link);
            if (copied) {
                alert(`Link copied to clipboard!\n\nShare this with the parent:\n${link}`);
            } else {
                prompt('Copy this link:', link);
            }
            break;
            
        case 'share':
            const shared = await shareLinkNative(
                link, 
                `${student.first_name} ${student.last_name}`
            );
            if (!shared) {
                await copyLinkToClipboard(link);
                alert('Link copied to clipboard (share not available)');
            }
            break;
            
        case 'qr':
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999">
                    <div style="background:white;padding:30px;border-radius:12px;text-align:center">
                        <h3>Scan QR Code</h3>
                        <canvas id="qr-canvas"></canvas>
                        <p style="color:#666;margin-top:15px">Parent can scan this with their phone</p>
                        <button onclick="this.closest('div').parentElement.remove()" style="margin-top:15px;padding:10px 20px;background:#6c5ce7;color:white;border:none;border-radius:6px;cursor:pointer">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            await generateQRCode(link, document.getElementById('qr-canvas'));
            break;
            
        case 'sms':
            // This requires server-side SMS integration
            console.log('SMS integration required');
            alert('SMS feature requires backend integration. Use copy/share for now.');
            break;
            
        default:
            console.error('Unknown method:', method);
    }
    
    return link;
}

/**
 * Add "Share with Parent" button to student rows
 * Call this function on page load in admin/students.html
 */
export function initializeParentLinkButtons() {
    // Find all student rows and add share button
    document.querySelectorAll('.student-row').forEach(row => {
        const studentId = row.dataset.studentId;
        const studentData = JSON.parse(row.dataset.student || '{}');
        
        // Create share button
        const btn = document.createElement('button');
        btn.className = 'btn-share-parent';
        btn.innerHTML = '📱 Share with Parent';
        btn.style.cssText = 'padding:6px 12px;background:#6c5ce7;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px';
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Show method selection
            const method = confirm('Copy link to clipboard?') ? 'copy' : 'share';
            await sendAttendanceLinkToParent(studentData, method);
        });
        
        // Add to row
        const actionsCell = row.querySelector('.actions-cell');
        if (actionsCell) {
            actionsCell.appendChild(btn);
        }
    });
}

// Export all functions as default object
export default {
    generateParentLink,
    generateSignedParentLink,
    copyLinkToClipboard,
    shareLinkNative,
    generateQRCode,
    validateLinkExpiry,
    sendAttendanceLinkToParent,
    initializeParentLinkButtons
};
