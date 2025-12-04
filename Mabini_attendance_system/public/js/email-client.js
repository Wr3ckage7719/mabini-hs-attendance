/**
 * Email Client - SendGrid Integration
 * Handles email sending for notifications and alerts
 */

class EmailClient {
    constructor() {
        this.apiUrl = '/api/send-email';
    }

    /**
     * Send a custom email
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} message - Email message (plain text or HTML)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendCustom(to, subject, message) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to,
                    subject,
                    message,
                    html: this.formatMessage(message)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            return {
                success: true,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send low attendance warning email to student
     * @param {string} email - Student's institutional email
     * @param {string} studentName - Student's full name
     * @param {number} attendanceRate - Attendance percentage
     * @param {string} message - Warning message
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendLowAttendanceWarning(email, studentName, attendanceRate, message) {
        const subject = attendanceRate < 60 
            ? '🚨 URGENT: Critical Low Attendance Alert - Mabini HS'
            : '⚠️ Low Attendance Warning - Mabini HS';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .warning-badge { display: inline-block; padding: 10px 20px; border-radius: 5px; font-weight: bold; margin: 15px 0; }
                    .critical { background: #dc3545; color: white; }
                    .warning { background: #ffc107; color: #000; }
                    .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Mabini High School</h1>
                        <p style="margin: 0;">Attendance System</p>
                    </div>
                    <div class="content">
                        <h2>Dear ${studentName},</h2>
                        <div class="warning-badge ${attendanceRate < 60 ? 'critical' : 'warning'}">
                            ${attendanceRate < 60 ? '🚨 CRITICAL' : '⚠️ WARNING'}
                        </div>
                        <div class="stats">
                            <h3>📊 Your Current Attendance</h3>
                            <p style="font-size: 32px; font-weight: bold; color: ${attendanceRate < 60 ? '#dc3545' : '#ffc107'}; margin: 10px 0;">
                                ${attendanceRate}%
                            </p>
                            <p style="margin: 0; color: #666;">Required: 75% minimum</p>
                        </div>
                        <p style="font-size: 16px; line-height: 1.8;">${message}</p>
                        
                        ${attendanceRate < 60 ? `
                            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <strong>⚠️ Immediate Action Required:</strong><br>
                                Please contact your class adviser or visit the Guidance Office immediately to address this matter.
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                            <p><strong>What you can do:</strong></p>
                            <ul>
                                <li>Ensure you arrive on time every day</li>
                                <li>Notify your adviser if you need to be absent</li>
                                <li>Check in regularly using the QR code system</li>
                                <li>Contact the Guidance Office if you need assistance</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Mabini High School Attendance System</p>
                        <p>© ${new Date().getFullYear()} Mabini Colleges. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendCustom(email, subject, html);
    }

    /**
     * Send absence notification email
     * @param {string} email - Student's email
     * @param {string} studentName - Student's full name
     * @param {string} date - Absence date
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendAbsenceNotification(email, studentName, date) {
        const subject = 'Absence Notification - Mabini HS';
        const message = `Dear ${studentName},\n\nOur records show that you were marked absent on ${date}.\n\nIf this is an error, please contact your class adviser immediately.\n\nThank you,\nMabini High School`;
        
        return await this.sendCustom(email, subject, message);
    }

    /**
     * Format message with HTML styling
     * @param {string} message - Plain text message
     * @returns {string} HTML formatted message
     */
    formatMessage(message) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }
}

// Create singleton instance
export const emailClient = new EmailClient();
