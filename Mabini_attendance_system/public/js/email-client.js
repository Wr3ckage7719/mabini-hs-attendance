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
            // Check if message is HTML
            const isHtml = message.trim().startsWith('<');
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to,
                    subject,
                    message: isHtml ? 'Please view this email in an HTML-capable email client.' : message,
                    html: isHtml ? message : this.formatMessage(message)
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

        const currentDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        line-height: 1.8; 
                        color: #333; 
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 0;
                    }
                    .container { 
                        max-width: 700px; 
                        margin: 40px auto; 
                        background: white;
                        padding: 60px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .letterhead {
                        text-align: center;
                        border-bottom: 3px solid #1a365d;
                        padding-bottom: 20px;
                        margin-bottom: 40px;
                    }
                    .letterhead h1 {
                        color: #1a365d;
                        font-size: 28px;
                        margin: 10px 0 5px 0;
                        font-weight: bold;
                    }
                    .letterhead p {
                        margin: 5px 0;
                        color: #555;
                        font-size: 14px;
                    }
                    .date {
                        text-align: right;
                        margin-bottom: 30px;
                        font-size: 14px;
                    }
                    .greeting {
                        margin-bottom: 20px;
                        font-size: 16px;
                    }
                    .body-text {
                        text-align: justify;
                        margin-bottom: 20px;
                        font-size: 15px;
                        line-height: 1.8;
                    }
                    .attendance-box {
                        background: ${attendanceRate < 60 ? '#fff5f5' : '#fffbeb'};
                        border-left: 5px solid ${attendanceRate < 60 ? '#dc2626' : '#f59e0b'};
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 4px;
                    }
                    .attendance-box h3 {
                        margin-top: 0;
                        color: ${attendanceRate < 60 ? '#dc2626' : '#f59e0b'};
                        font-size: 18px;
                    }
                    .attendance-rate {
                        font-size: 36px;
                        font-weight: bold;
                        color: ${attendanceRate < 60 ? '#dc2626' : '#f59e0b'};
                        margin: 15px 0;
                    }
                    .required-text {
                        color: #666;
                        font-style: italic;
                        font-size: 14px;
                    }
                    .action-required {
                        background: #fef3c7;
                        border: 2px solid #f59e0b;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 5px;
                    }
                    .action-required strong {
                        color: #b45309;
                        font-size: 16px;
                    }
                    .recommendations {
                        margin: 25px 0;
                    }
                    .recommendations ul {
                        margin: 15px 0;
                        padding-left: 25px;
                    }
                    .recommendations li {
                        margin: 10px 0;
                        line-height: 1.6;
                    }
                    .closing {
                        margin-top: 40px;
                        font-size: 15px;
                    }
                    .signature {
                        margin-top: 50px;
                    }
                    .signature p {
                        margin: 5px 0;
                    }
                    .footer {
                        margin-top: 60px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="letterhead">
                        <h1>🎓 MABINI HIGH SCHOOL</h1>
                        <p>Attendance Monitoring Office</p>
                        <p>Mabini Colleges, Philippines</p>
                        <p>Email: attendance@mabinicolleges.edu.ph</p>
                    </div>

                    <div class="date">
                        ${currentDate}
                    </div>

                    <div class="greeting">
                        Dear ${studentName},
                    </div>

                    <div class="body-text">
                        We are writing to inform you about your current attendance record. The Attendance Monitoring Office 
                        has identified that your attendance rate requires immediate attention and improvement.
                    </div>

                    <div class="attendance-box">
                        <h3>${attendanceRate < 60 ? '🚨 CRITICAL ATTENDANCE ALERT' : '⚠️ LOW ATTENDANCE WARNING'}</h3>
                        <p><strong>Your Current Attendance Rate:</strong></p>
                        <div class="attendance-rate">${attendanceRate}%</div>
                        <p class="required-text">Required Minimum Attendance: 75%</p>
                        ${attendanceRate < 60 ? 
                            '<p style="color: #dc2626; font-weight: bold; margin-top: 15px;">You are currently below the critical threshold. This may affect your academic standing.</p>' 
                            : '<p style="color: #f59e0b; font-weight: bold; margin-top: 15px;">Your attendance is below the required threshold and needs improvement.</p>'}
                    </div>

                    <div class="body-text">
                        Regular attendance is crucial for your academic success and is a requirement for all students at 
                        Mabini High School. The school policy mandates a minimum attendance rate of 75% to remain in good 
                        academic standing and to be eligible for examinations.
                    </div>

                    ${attendanceRate < 60 ? `
                        <div class="action-required">
                            <strong>⚠️ IMMEDIATE ACTION REQUIRED</strong><br><br>
                            Due to the critical nature of your attendance situation, you are required to:
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Contact your class adviser within 48 hours</li>
                                <li>Visit the Guidance Office to discuss your attendance concerns</li>
                                <li>Submit any valid documentation for previous absences</li>
                                <li>Develop an attendance improvement plan with school staff</li>
                            </ul>
                            <strong>Failure to address this matter may result in academic consequences.</strong>
                        </div>
                    ` : ''}

                    <div class="recommendations">
                        <strong>Recommendations for Improvement:</strong>
                        <ul>
                            <li>Ensure you arrive at school on time every day to avoid late marks</li>
                            <li>Use the QR code attendance system to properly register your presence</li>
                            <li>Notify your class adviser in advance if you need to be absent for valid reasons</li>
                            <li>Maintain open communication with your teachers regarding any attendance concerns</li>
                            <li>Seek assistance from the Guidance Office if you are experiencing difficulties</li>
                            <li>Review the school attendance policy in your student handbook</li>
                        </ul>
                    </div>

                    <div class="body-text">
                        We understand that unforeseen circumstances may affect attendance. If you have valid reasons for 
                        your absences, please submit the necessary documentation to your class adviser or the Guidance 
                        Office as soon as possible.
                    </div>

                    <div class="body-text">
                        Your education and future success are important to us. We encourage you to take this matter seriously 
                        and to make every effort to improve your attendance record moving forward.
                    </div>

                    <div class="closing">
                        <p>Should you have any questions or concerns regarding this notice, please do not hesitate to contact 
                        the Attendance Monitoring Office or your class adviser.</p>
                        <p style="margin-top: 20px;">Respectfully yours,</p>
                    </div>

                    <div class="signature">
                        <p><strong>Attendance Monitoring Office</strong></p>
                        <p>Mabini High School</p>
                        <p>Email: attendance@mabinicolleges.edu.ph</p>
                    </div>

                    <div class="footer">
                        <p>This is an official communication from Mabini High School Attendance System</p>
                        <p>© ${new Date().getFullYear()} Mabini Colleges. All rights reserved.</p>
                        <p style="margin-top: 10px; font-style: italic;">Please do not reply to this email. For inquiries, contact your class adviser or the Guidance Office.</p>
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
