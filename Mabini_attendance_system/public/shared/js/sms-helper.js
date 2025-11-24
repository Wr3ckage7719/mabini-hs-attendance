/**
 * SMS Helper - Client-side SMS functionality
 * Provides easy-to-use functions for sending SMS notifications
 */

const SMS_API = '../api/services/sms_service.php';

/**
 * Send a generic SMS
 * @param {string} recipient - Phone number (e.g., "09394920476")
 * @param {string} message - Message content
 * @returns {Promise} Result of SMS operation
 */
export async function sendSMS(recipient, message) {
    try {
        const response = await fetch(SMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send_sms',
                recipient: recipient,
                message: message
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('SMS Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send check-in notification to parent
 * @param {Object} student - Student object with name
 * @param {string} parentPhone - Parent's phone number
 * @param {string} checkInTime - Check-in timestamp
 */
export async function sendCheckInNotification(student, parentPhone, checkInTime = null) {
    try {
        const response = await fetch(SMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send_checkin',
                student: student,
                parent_phone: parentPhone,
                check_in_time: checkInTime || new Date().toISOString()
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Check-in SMS Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send check-out notification to parent
 * @param {Object} student - Student object with name
 * @param {string} parentPhone - Parent's phone number
 * @param {string} checkOutTime - Check-out timestamp
 */
export async function sendCheckOutNotification(student, parentPhone, checkOutTime = null) {
    try {
        const response = await fetch(SMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send_checkout',
                student: student,
                parent_phone: parentPhone,
                check_out_time: checkOutTime || new Date().toISOString()
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Check-out SMS Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send absence notification to parent
 * @param {Object} student - Student object with name
 * @param {string} parentPhone - Parent's phone number
 * @param {string} date - Date of absence
 */
export async function sendAbsenceNotification(student, parentPhone, date = null) {
    try {
        const response = await fetch(SMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send_absence',
                student: student,
                parent_phone: parentPhone,
                date: date || new Date().toISOString().split('T')[0]
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Absence SMS Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send daily attendance summary
 * @param {string} parentPhone - Parent's phone number
 * @param {string} studentName - Student's name
 * @param {string} status - Attendance status (Present/Absent)
 * @param {string} checkInTime - Check-in time (optional)
 * @param {string} checkOutTime - Check-out time (optional)
 */
export async function sendDailySummary(parentPhone, studentName, status, checkInTime = null, checkOutTime = null) {
    try {
        const response = await fetch(SMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send_daily_summary',
                parent_phone: parentPhone,
                student_name: studentName,
                status: status,
                check_in_time: checkInTime,
                check_out_time: checkOutTime
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Daily Summary SMS Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send emergency alert
 * @param {string} parentPhone - Parent's phone number
 * @param {string} studentName - Student's name
 * @param {string} alertMessage - Emergency message
 */
export async function sendEmergencyAlert(parentPhone, studentName, alertMessage) {
    try {
        const response = await fetch(SMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send_emergency',
                parent_phone: parentPhone,
                student_name: studentName,
                alert_message: alertMessage
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Emergency SMS Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Format phone number to standard format
 * @param {string} phone - Phone number in any format
 * @returns {string} Formatted phone number (09XXXXXXXXX)
 */
export function formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 63, remove it and add 0
    if (cleaned.startsWith('63')) {
        cleaned = '0' + cleaned.substring(2);
    }
    
    // If starts with +63, remove it and add 0
    if (phone.startsWith('+63')) {
        cleaned = '0' + cleaned.substring(2);
    }
    
    // Ensure it starts with 09
    if (!cleaned.startsWith('09')) {
        if (cleaned.startsWith('9')) {
            cleaned = '0' + cleaned;
        }
    }
    
    return cleaned;
}

/**
 * Validate Philippine mobile number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhoneNumber(phone) {
    const cleaned = formatPhoneNumber(phone);
    // Philippine mobile numbers: 09XX-XXX-XXXX (11 digits starting with 09)
    return /^09\d{9}$/.test(cleaned);
}
