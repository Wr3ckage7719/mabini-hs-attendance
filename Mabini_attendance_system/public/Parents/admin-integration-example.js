/**
 * Integration Example: Add Parent Link Sharing to Admin Panel
 * 
 * This file shows how to integrate the parent attendance viewer
 * into your existing admin/students.html page.
 * 
 * INSTRUCTIONS:
 * 1. Add this script to your admin/students.html page
 * 2. Or copy the relevant functions to your existing students.js file
 */

import { 
    generateSignedParentLink, 
    copyLinkToClipboard, 
    shareLinkNative 
} from './parent-link-generator.js';

/**
 * Add "Share with Parent" button to student table
 * Call this after loading students
 */
export async function addParentLinkButtons() {
    // Wait for student table to load
    const table = document.querySelector('#studentsTable tbody');
    if (!table) {
        console.error('Students table not found');
        return;
    }
    
    // Add column header
    const headerRow = document.querySelector('#studentsTable thead tr');
    if (headerRow && !document.getElementById('th-parent-link')) {
        const th = document.createElement('th');
        th.id = 'th-parent-link';
        th.textContent = 'Parent Portal';
        th.style.cssText = 'text-align:center;width:120px';
        headerRow.appendChild(th);
    }
    
    // Add button to each student row
    table.querySelectorAll('tr').forEach(row => {
        const studentId = row.dataset.studentId;
        if (!studentId) return;
        
        // Skip if button already exists
        if (row.querySelector('.btn-parent-link')) return;
        
        const studentData = {
            id: studentId,
            student_number: row.cells[0]?.textContent || '',
            first_name: row.cells[1]?.textContent?.split(' ')[0] || '',
            last_name: row.cells[1]?.textContent?.split(' ').slice(1).join(' ') || '',
            parent_guardian_contact: row.dataset.parentPhone || ''
        };
        
        const cell = document.createElement('td');
        cell.style.cssText = 'text-align:center';
        
        const btn = document.createElement('button');
        btn.className = 'btn-parent-link';
        btn.innerHTML = '📱 Share';
        btn.style.cssText = `
            padding: 6px 12px;
            background: linear-gradient(90deg, #6c5ce7, #4f46e5);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: opacity 0.2s;
        `;
        
        btn.addEventListener('mouseover', () => btn.style.opacity = '0.9');
        btn.addEventListener('mouseout', () => btn.style.opacity = '1');
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleShareClick(studentData, btn);
        });
        
        cell.appendChild(btn);
        row.appendChild(cell);
    });
}

/**
 * Handle share button click
 * Shows options for how to share the link
 */
async function handleShareClick(student, button) {
    // Disable button during operation
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '⏳ Generating...';
    
    try {
        // Generate signed link (7 days expiry)
        const link = await generateSignedParentLink(student.id, 168);
        
        // Show share options
        const action = await showShareOptions(student, link);
        
        switch (action) {
            case 'copy':
                await copyLinkToClipboard(link);
                showNotification('Link copied to clipboard!', 'success');
                break;
                
            case 'sms':
                await sendViaSMS(student, link);
                break;
                
            case 'email':
                await sendViaEmail(student, link);
                break;
                
            case 'qr':
                await showQRCode(student, link);
                break;
                
            default:
                // User cancelled
                break;
        }
        
    } catch (error) {
        console.error('Share error:', error);
        showNotification('Failed to generate link', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

/**
 * Show share options modal
 */
function showShareOptions(student, link) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: linear-gradient(180deg, #081226, #0a1630);
                    padding: 30px;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    color: #eaf1fb;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #eaf1fb;">
                        Share Attendance Link
                    </h3>
                    <p style="color: #9aa9bf; margin: 0 0 25px 0; font-size: 14px;">
                        Student: <strong>${student.first_name} ${student.last_name}</strong><br>
                        Student #: <strong>${student.student_number}</strong>
                    </p>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="share-option" data-action="copy" style="
                            padding: 14px;
                            background: rgba(108, 92, 231, 0.2);
                            border: 1px solid rgba(108, 92, 231, 0.3);
                            color: #eaf1fb;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            text-align: left;
                            transition: all 0.2s;
                        ">
                            📋 <strong>Copy Link</strong> - Copy to clipboard
                        </button>
                        
                        <button class="share-option" data-action="sms" style="
                            padding: 14px;
                            background: rgba(34, 197, 94, 0.2);
                            border: 1px solid rgba(34, 197, 94, 0.3);
                            color: #eaf1fb;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            text-align: left;
                            transition: all 0.2s;
                        ">
                            📱 <strong>Send SMS</strong> - Text to parent (${student.parent_guardian_contact || 'No number'})
                        </button>
                        
                        <button class="share-option" data-action="qr" style="
                            padding: 14px;
                            background: rgba(59, 130, 246, 0.2);
                            border: 1px solid rgba(59, 130, 246, 0.3);
                            color: #eaf1fb;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            text-align: left;
                            transition: all 0.2s;
                        ">
                            📷 <strong>QR Code</strong> - Generate scannable code
                        </button>
                        
                        <button class="share-option" data-action="cancel" style="
                            padding: 14px;
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            color: #9aa9bf;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            text-align: center;
                            transition: all 0.2s;
                        ">
                            Cancel
                        </button>
                    </div>
                    
                    <div style="
                        margin-top: 20px;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.02);
                        border-radius: 8px;
                        font-size: 12px;
                        color: #9aa9bf;
                    ">
                        <strong style="color: #eaf1fb;">Link Preview:</strong><br>
                        <code style="
                            display: block;
                            margin-top: 5px;
                            padding: 8px;
                            background: rgba(0, 0, 0, 0.3);
                            border-radius: 4px;
                            word-break: break-all;
                            font-size: 11px;
                        ">${link}</code>
                        <div style="margin-top: 8px; font-size: 11px;">
                            ⏰ Valid for 7 days
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add hover effects
        modal.querySelectorAll('.share-option').forEach(btn => {
            btn.addEventListener('mouseover', () => {
                btn.style.opacity = '0.8';
                btn.style.transform = 'translateX(5px)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateX(0)';
            });
            
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                modal.remove();
                resolve(action === 'cancel' ? null : action);
            });
        });
    });
}

/**
 * Send link via SMS
 */
async function sendViaSMS(student, link) {
    if (!student.parent_guardian_contact) {
        showNotification('No parent phone number on file', 'error');
        return;
    }
    
    try {
        const message = `Mabini HS: View ${student.first_name}'s attendance records here: ${link}`;
        
        // Call your SMS API
        const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: student.parent_guardian_contact,
                message: message,
                student_id: student.id
            })
        });
        
        if (response.ok) {
            showNotification('SMS sent successfully!', 'success');
        } else {
            throw new Error('SMS API failed');
        }
        
    } catch (error) {
        console.error('SMS error:', error);
        showNotification('Failed to send SMS. Try copying the link instead.', 'error');
    }
}

/**
 * Send link via email
 */
async function sendViaEmail(student, link) {
    // Implement email sending via your backend
    showNotification('Email feature coming soon. Link copied to clipboard.', 'info');
    await copyLinkToClipboard(link);
}

/**
 * Show QR code modal
 */
async function showQRCode(student, link) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        ">
            <div style="
                background: white;
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
            ">
                <h3 style="margin: 0 0 10px 0; color: #071027;">
                    Scan QR Code
                </h3>
                <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
                    ${student.first_name} ${student.last_name} - ${student.student_number}
                </p>
                <canvas id="qr-canvas"></canvas>
                <p style="color: #666; margin: 20px 0 0 0; font-size: 12px;">
                    Parent can scan this with their phone camera
                </p>
                <button onclick="this.closest('div').parentElement.remove()" style="
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #6c5ce7;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate QR code
    try {
        const QRCode = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm');
        await QRCode.toCanvas(document.getElementById('qr-canvas'), link, {
            width: 250,
            margin: 2
        });
    } catch (error) {
        console.error('QR generation error:', error);
        modal.remove();
        showNotification('Failed to generate QR code', 'error');
    }
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        info: '#6c5ce7',
        warning: '#f59e0b'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10002;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-initialize when students are loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(addParentLinkButtons, 1000);
    });
} else {
    setTimeout(addParentLinkButtons, 1000);
}

export default { addParentLinkButtons };
