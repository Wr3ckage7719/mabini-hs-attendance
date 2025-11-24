// =====================================================
// MABINI HS ATTENDANCE SYSTEM - EXPRESS SERVER
// Backend API for advanced features
// =====================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

// Load environment variables from current directory
dotenv.config();

// Initialize logger - Console only for Vercel (serverless can't write to filesystem)
const loggerTransports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
];

// Only add file transports in development (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
        loggerTransports.push(
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' })
        );
    } catch (e) {
        console.warn('Could not create log files:', e.message);
    }
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: loggerTransports
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'Mabini HS Attendance API',
        version: '2.0.0',
        description: 'Complete JavaScript backend - No PHP dependencies',
        endpoints: {
            auth: {
                create_user: 'POST /api/auth/create-user',
                update_password: 'POST /api/auth/update-password'
            },
            email: {
                send: 'POST /api/email/send',
                attendance_notification: 'POST /api/email/attendance-notification'
            },
            sms: {
                send: 'POST /api/sms/send',
                check_in: 'POST /api/sms/check_in',
                check_out: 'POST /api/sms/check_out',
                absence: 'POST /api/sms/absence'
            },
            iot: {
                verify_entry: 'POST /api/iot/verify-entry'
            },
            account: {
                retrieve: 'POST /api/account/retrieve'
            },
            reports: {
                attendance: 'POST /api/reports/attendance'
            },
            admin: {
                stats: 'GET /api/admin/stats'
            }
        },
        status: 'All PHP backend migrated to JavaScript'
    });
});

// =====================================================
// AUTH ENDPOINTS
// =====================================================

// Create new user with Supabase Auth
app.post('/api/auth/create-user', async (req, res) => {
    try {
        const { email, password, role, firstName, lastName } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: role || 'user',
                first_name: firstName,
                last_name: lastName
            }
        });
        
        if (authError) {
            logger.error('Auth user creation error:', authError);
            return res.status(400).json({
                success: false,
                error: authError.message
            });
        }
        
        // Create user profile in users table
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                auth_id: authData.user.id,
                email,
                role: role || 'user',
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`,
                status: 'active',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (profileError) {
            logger.error('Profile creation error:', profileError);
            // Rollback: delete auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            return res.status(400).json({
                success: false,
                error: 'Failed to create user profile'
            });
        }
        
        logger.info('User created successfully:', { email, role });
        
        res.json({
            success: true,
            data: {
                authId: authData.user.id,
                profileId: profileData.id,
                email: authData.user.email
            }
        });
        
    } catch (error) {
        logger.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update user password (admin only)
app.post('/api/auth/update-password', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        
        if (!userId || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'User ID and new password are required'
            });
        }
        
        const { error } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );
        
        if (error) {
            logger.error('Password update error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        
        logger.info('Password updated:', { userId });
        
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
        
    } catch (error) {
        logger.error('Update password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// =====================================================
// EMAIL ENDPOINTS
// =====================================================

import sgMail from '@sendgrid/mail';

// Initialize SendGrid client
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Default sender email (must be verified in SendGrid)
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'Mabini HS Attendance <noreply@mabinicolleges.edu.ph>';

// Send email
app.post('/api/email/send', async (req, res) => {
    try {
        const { to, subject, text, html, from } = req.body;
        
        if (!to || !subject || (!text && !html)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, subject, and text or html'
            });
        }
        
        const emailData = {
            from: from || DEFAULT_FROM_EMAIL,
            to: Array.isArray(to) ? to : [to],
            subject,
            html: html || `<p>${text}</p>`,
            ...(text && !html && { text })
        };
        
        try {
            await sgMail.send(emailData);
            logger.info('Email sent via SendGrid:', { to, subject });
            
            res.json({
                success: true,
                message: 'Email sent successfully'
            });
        } catch (emailError) {
            logger.error('SendGrid error:', emailError.response?.body || emailError);
            throw new Error(emailError.response?.body?.errors?.[0]?.message || 'Failed to send email');
        }
        
    } catch (error) {
        logger.error('Email send error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email'
        });
    }
});

// Send attendance notification
app.post('/api/email/attendance-notification', async (req, res) => {
    try {
        const { studentId, type, timestamp } = req.body;
        
        // Get student details
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
        
        if (studentError || !student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        const emailTo = student.contact_email || student.email;
        if (!emailTo) {
            return res.status(400).json({
                success: false,
                error: 'No email address found for student'
            });
        }
        
        const studentName = `${student.first_name} ${student.last_name}`;
        const time = new Date(timestamp).toLocaleString();
        
        const subject = type === 'check-in' ? 
            `Check-in Notification - ${studentName}` :
            `Check-out Notification - ${studentName}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Mabini High School</h1>
                    <p style="color: #f0f0f0; margin: 5px 0 0 0;">Attendance System</p>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                    <p style="font-size: 16px; color: #555;">Dear Parent/Guardian,</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${type === 'check-in' ? '#10b981' : '#f59e0b'};">
                        <p style="margin: 0; font-size: 15px;">
                            <strong>${studentName}</strong> (${student.student_number || 'N/A'})
                        </p>
                        <p style="margin: 10px 0; font-size: 18px; color: ${type === 'check-in' ? '#10b981' : '#f59e0b'};">
                            <strong>${type === 'check-in' ? '✓ Checked In' : '✗ Checked Out'}</strong>
                        </p>
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            📅 ${time}
                        </p>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        If you have any concerns, please contact the school administration.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                        This is an automated message from Mabini High School Attendance System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
        `;
        
        try {
            await sgMail.send({
                from: DEFAULT_FROM_EMAIL,
                to: emailTo,
                subject,
                html
            });
            
            // Log notification
            await supabase.from('sms_logs').insert({
                recipient: emailTo,
                message: `${type} notification for ${studentName}`,
                status: 'sent',
                sent_at: new Date().toISOString()
            });
            
            logger.info('Attendance notification sent via SendGrid:', { studentId, type });
            
            res.json({
                success: true,
                message: 'Notification sent successfully'
            });
        } catch (emailError) {
            logger.error('SendGrid notification error:', emailError.response?.body || emailError);
            throw new Error('Failed to send notification email');
        }
        
    } catch (error) {
        logger.error('Attendance notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
});

// =====================================================
// REPORTS ENDPOINTS
// =====================================================

// Generate attendance report
app.post('/api/reports/attendance', async (req, res) => {
    try {
        const { startDate, endDate, sectionId, format } = req.body;
        
        let query = supabase
            .from('attendance')
            .select(`
                *,
                students (
                    student_number,
                    first_name,
                    last_name,
                    grade_level,
                    section
                )
            `);
        
        if (startDate) {
            query = query.gte('date', startDate);
        }
        
        if (endDate) {
            query = query.lte('date', endDate);
        }
        
        const { data, error } = await query;
        
        if (error) {
            logger.error('Report generation error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        
        // Filter by section if needed
        let filteredData = data;
        if (sectionId) {
            filteredData = data.filter(record => 
                record.students?.section === sectionId
            );
        }
        
        // Generate report based on format
        const report = {
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            totalRecords: filteredData.length,
            data: filteredData
        };
        
        logger.info('Attendance report generated:', { 
            records: filteredData.length,
            period: `${startDate} to ${endDate}`
        });
        
        res.json({
            success: true,
            report
        });
        
    } catch (error) {
        logger.error('Report generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate report'
        });
    }
});

// =====================================================
// ADMIN ENDPOINTS
// =====================================================

// Get system statistics
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [
            { count: usersCount },
            { count: studentsCount },
            { count: teachersCount },
            { count: sectionsCount },
            { count: subjectsCount }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('teachers').select('*', { count: 'exact', head: true }),
            supabase.from('sections').select('*', { count: 'exact', head: true }),
            supabase.from('subjects').select('*', { count: 'exact', head: true })
        ]);
        
        res.json({
            success: true,
            stats: {
                users: usersCount,
                students: studentsCount,
                teachers: teachersCount,
                sections: sectionsCount,
                subjects: subjectsCount
            }
        });
        
    } catch (error) {
        logger.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

// =====================================================
// IOT DEVICE ENDPOINTS (Replaces verify-entry.php)
// =====================================================

// Verify entry - for IoT device (Raspberry Pi Scanner)
app.post('/api/iot/verify-entry', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const validApiKey = process.env.IOT_API_KEY || 'mabini_device_001_key_2025';
        
        if (apiKey !== validApiKey) {
            return res.status(401).json({
                success: false,
                gate_action: 'denied',
                message: 'Invalid API key'
            });
        }
        
        const { student_id, face_image } = req.body;
        
        if (!student_id) {
            return res.status(400).json({
                success: false,
                gate_action: 'denied',
                message: 'Student ID is required'
            });
        }
        
        // Look up student
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('student_number', student_id)
            .eq('status', 'active')
            .single();
        
        if (studentError || !student) {
            return res.status(404).json({
                success: false,
                gate_action: 'denied',
                message: 'Student not found or inactive'
            });
        }
        
        // Check for existing entry today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingLog } = await supabase
            .from('entrance_logs')
            .select('*')
            .eq('student_id', student.id)
            .gte('check_in_time', `${today}T00:00:00`)
            .order('check_in_time', { ascending: false })
            .limit(1)
            .single();
        
        let isCheckOut = false;
        let logId = null;
        let action = '';
        let message = '';
        
        if (existingLog) {
            if (!existingLog.check_out_time) {
                // This is a check-out
                isCheckOut = true;
                const { error: updateError } = await supabase
                    .from('entrance_logs')
                    .update({ check_out_time: new Date().toISOString() })
                    .eq('id', existingLog.id);
                
                if (updateError) throw updateError;
                
                logId = existingLog.id;
                action = 'check_out';
                message = 'Check-out recorded successfully';
            } else {
                // Already checked out today
                return res.json({
                    success: false,
                    gate_action: 'denied',
                    message: 'Already checked out today',
                    student: {
                        id: student.id,
                        name: `${student.first_name} ${student.last_name}`,
                        student_number: student.student_number
                    }
                });
            }
        } else {
            // This is a check-in
            const { data: newLog, error: insertError } = await supabase
                .from('entrance_logs')
                .insert({
                    student_id: student.id,
                    check_in_time: new Date().toISOString()
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            logId = newLog.id;
            action = 'check_in';
            message = 'Check-in recorded successfully';
        }
        
        // Send SMS notification
        if (student.guardian_contact) {
            try {
                await fetch(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/sms/${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student,
                        parent_phone: student.guardian_contact,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (smsError) {
                logger.error('SMS notification error:', smsError);
            }
        }
        
        res.json({
            success: true,
            gate_action: 'granted',
            message,
            action,
            student: {
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                student_number: student.student_number,
                grade_level: student.grade_level,
                section: student.section
            },
            log_id: logId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Verify entry error:', error);
        res.status(500).json({
            success: false,
            gate_action: 'denied',
            message: 'System error occurred'
        });
    }
});

// =====================================================
// SMS ENDPOINTS (Replaces sms_service.php)
// =====================================================

// Send generic SMS
app.post('/api/sms/send', async (req, res) => {
    try {
        const { recipient, message } = req.body;
        
        if (!recipient || !message) {
            return res.status(400).json({
                success: false,
                error: 'Recipient and message are required'
            });
        }
        
        const smsApiUrl = process.env.SMS_API_URL || 'https://api.smsmobileapi.com/sendsms/';
        const smsApiKey = process.env.SMS_API_KEY;
        
        const response = await fetch(smsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                recipients: recipient,
                message: message,
                apikey: smsApiKey
            })
        });
        
        const result = await response.text();
        
        // Log SMS
        await supabase.from('sms_logs').insert({
            recipient,
            message: message.substring(0, 160),
            status: response.ok ? 'sent' : 'failed',
            sent_at: new Date().toISOString()
        });
        
        res.json({
            success: response.ok,
            response: result,
            recipient
        });
        
    } catch (error) {
        logger.error('SMS send error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send SMS'
        });
    }
});

// Send check-in SMS notification
app.post('/api/sms/check_in', async (req, res) => {
    try {
        const { student, parent_phone, timestamp } = req.body;
        
        const studentName = student.full_name || `${student.first_name} ${student.last_name}`;
        const time = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        
        const message = `MABINI HS ATTENDANCE\n\nYour child ${studentName} has checked IN.\nTime: ${time}\nDate: ${date}\n\nHave a great day!`;
        
        const result = await fetch(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: parent_phone,
                message
            })
        }).then(r => r.json());
        
        res.json(result);
        
    } catch (error) {
        logger.error('Check-in SMS error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send check-in SMS'
        });
    }
});

// Send check-out SMS notification
app.post('/api/sms/check_out', async (req, res) => {
    try {
        const { student, parent_phone, timestamp } = req.body;
        
        const studentName = student.full_name || `${student.first_name} ${student.last_name}`;
        const time = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        
        const message = `MABINI HS ATTENDANCE\n\nYour child ${studentName} has checked OUT.\nTime: ${time}\nDate: ${date}\n\nStay safe!`;
        
        const result = await fetch(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: parent_phone,
                message
            })
        }).then(r => r.json());
        
        res.json(result);
        
    } catch (error) {
        logger.error('Check-out SMS error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send check-out SMS'
        });
    }
});

// Send absence notification
app.post('/api/sms/absence', async (req, res) => {
    try {
        const { student, parent_phone, date } = req.body;
        
        const studentName = student.full_name || `${student.first_name} ${student.last_name}`;
        const dateFormatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        
        const message = `MABINI HS ATTENDANCE ALERT\n\nYour child ${studentName} was marked ABSENT.\nDate: ${dateFormatted}\n\nPlease contact the school if this is incorrect.`;
        
        const result = await fetch(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: parent_phone,
                message
            })
        }).then(r => r.json());
        
        res.json(result);
        
    } catch (error) {
        logger.error('Absence SMS error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send absence SMS'
        });
    }
});

// =====================================================
// ACCOUNT RETRIEVAL ENDPOINT (Replaces retrieve_account.php)
// =====================================================

app.post('/api/account/retrieve', async (req, res) => {
    try {
        const { email, userType } = req.body; // Add userType to support both students and teachers
        
        logger.info('Account retrieval request:', { email, userType });
        
        // Validate email
        if (!email || !email.includes('@')) {
            logger.warn('Invalid email format:', email);
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        // Check if institutional email (only for students)
        if (userType === 'student' && !email.toLowerCase().endsWith('@mabinicolleges.edu.ph')) {
            logger.warn('Non-institutional email for student:', email);
            return res.status(400).json({
                success: false,
                message: 'Students must use institutional emails (@mabinicolleges.edu.ph)'
            });
        }
        
        // Check if already retrieved
        const { data: existingRetrieval, error: retrievalCheckError } = await supabase
            .from('account_retrievals')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        
        if (retrievalCheckError) {
            logger.error('Error checking retrieval history:', retrievalCheckError);
        }
        
        if (existingRetrieval) {
            logger.info('Duplicate retrieval attempt:', email);
            return res.status(403).json({
                success: false,
                message: 'Account credentials have already been sent to this email. You can only request your credentials once.'
            });
        }
        
        let user, userTable, userIdField, tempPassword, accountType;
        
        // Try to find user in appropriate table
        if (userType === 'teacher' || !userType) {
            // Check teachers table
            const { data: teacher, error: teacherError } = await supabase
                .from('teachers')
                .select('*')
                .eq('email', email)
                .eq('status', 'active')
                .maybeSingle();
            
            if (teacher) {
                user = teacher;
                userTable = 'teachers';
                userIdField = 'id';
                tempPassword = `Teacher${teacher.id.toString().slice(-4)}@2025`;
                accountType = 'Teacher';
                logger.info('Teacher found:', { id: teacher.id });
            }
        }
        
        // If not found as teacher, try student (only if userType is student or not specified)
        if (!user && (userType === 'student' || !userType)) {
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('email', email)
                .eq('status', 'active')
                .maybeSingle();
            
            if (student) {
                user = student;
                userTable = 'students';
                userIdField = 'student_number';
                tempPassword = `Student${student.student_number.slice(-4)}@2025`;
                accountType = 'Student';
                logger.info('Student found:', { id: student.id, studentNumber: student.student_number });
            }
        }
        
        if (!user) {
            logger.warn('No active account found for email:', email);
            return res.status(404).json({
                success: false,
                message: 'No active account found with this email address.'
            });
        }
        
        // Update user record with username and password
        const { error: updateError } = await supabase
            .from(userTable)
            .update({ 
                username: email,
                password: tempPassword
            })
            .eq('id', user.id);
            
        if (updateError) {
            logger.error('Failed to update credentials:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to set up account. Please contact support.'
            });
        }
        
        logger.info('Credentials updated:', { userTable, id: user.id });
        
        // Record retrieval BEFORE sending email (to prevent duplicate requests even if email fails)
        const { error: insertError } = await supabase.from('account_retrievals').insert({
            email,
            user_id: user.id,
            student_number: user[userIdField],
            user_type: accountType.toLowerCase(),
            ip_address: req.ip || 'unknown',
            user_agent: req.get('user-agent') || 'unknown',
            retrieved_at: new Date().toISOString()
        });
        
        if (insertError) {
            logger.error('Failed to record retrieval:', insertError);
            // Continue anyway - we still want to send the email
        }
        
        // Send email with credentials using SendGrid
        try {
            await sgMail.send({
                from: DEFAULT_FROM_EMAIL,
                to: email,
                subject: `Your Mabini HS Attendance System Credentials - ${accountType}`,
                html: `
                    <h2>Mabini High School Attendance System</h2>
                    <p>Dear ${user.first_name} ${user.last_name},</p>
                    <p>Here are your ${accountType} account credentials:</p>
                    <p><strong>Username:</strong> ${email}<br>
                    <strong>Password:</strong> ${tempPassword}</p>
                    <p>Please change your password after logging in.</p>
                    <p><small>This is a one-time retrieval. You cannot request your credentials again.</small></p>
                `
            });
            
            logger.info('Account credentials sent via SendGrid:', { email });
            
            res.json({
                success: true,
                message: 'Your account credentials have been sent to your email!'
            });
        } catch (emailError) {
            logger.error('SendGrid credentials email error:', emailError.response?.body || emailError);
            
            // Rollback the retrieval record since email failed
            await supabase.from('account_retrievals').delete().eq('email', email);
            
            return res.status(500).json({
                success: false,
                message: 'Failed to send email. Please try again or contact support.',
                error: emailError.response?.body?.errors?.[0]?.message || 'Email service error'
            });
        }
        
    } catch (error) {
        logger.error('Account retrieval error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'An unexpected error occurred. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// =====================================================
// START SERVER
// =====================================================

// For Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 Supabase URL: ${process.env.VITE_SUPABASE_URL}`);
        console.log(`\n✅ Mabini HS Attendance Server is running!`);
        console.log(`📍 http://localhost:${PORT}`);
        console.log(`📍 Health: http://localhost:${PORT}/health`);
        console.log(`📍 API Info: http://localhost:${PORT}/api\n`);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
