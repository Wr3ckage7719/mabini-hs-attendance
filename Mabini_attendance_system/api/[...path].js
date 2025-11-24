// Vercel Serverless Function - Account Retrieval
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Route handling
    const path = req.url;
    
    // Health check
    if (path === '/api/health' || path === '/health') {
        return res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: {
                hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
                hasSendGridKey: !!process.env.SENDGRID_API_KEY,
                hasSendGridFrom: !!process.env.SENDGRID_FROM_EMAIL
            }
        });
    }

    // Account retrieval endpoint
    if (path.includes('/api/account/retrieve') && req.method === 'POST') {
        try {
            const { email, userType } = req.body;
            
            console.log('Account retrieval request:', { email, userType });
            
            // Validate email
            if (!email || !email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address'
                });
            }
            
            // Check if institutional email (only for students)
            if (userType === 'student' && !email.toLowerCase().endsWith('@mabinicolleges.edu.ph')) {
                return res.status(400).json({
                    success: false,
                    message: 'Students must use institutional emails (@mabinicolleges.edu.ph)'
                });
            }
            
            // Check if already retrieved
            const { data: existingRetrieval } = await supabase
                .from('account_retrievals')
                .select('*')
                .eq('email', email)
                .maybeSingle();
            
            if (existingRetrieval) {
                return res.status(403).json({
                    success: false,
                    message: 'Account credentials have already been sent to this email. You can only request your credentials once.'
                });
            }
            
            let user, userTable, userIdField, tempPassword, accountType;
            
            // Try to find user
            if (userType === 'teacher' || !userType) {
                const { data: teacher } = await supabase
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
                }
            }
            
            if (!user && (userType === 'student' || !userType)) {
                const { data: student } = await supabase
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
                }
            }
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'No active account found with this email address.'
                });
            }
            
            // Update credentials
            await supabase
                .from(userTable)
                .update({ 
                    username: email,
                    password: tempPassword
                })
                .eq('id', user.id);
            
            // Record retrieval
            await supabase.from('account_retrievals').insert({
                email,
                user_id: user.id,
                student_number: user[userIdField],
                user_type: accountType.toLowerCase(),
                ip_address: req.headers['x-forwarded-for'] || 'unknown',
                user_agent: req.headers['user-agent'] || 'unknown',
                retrieved_at: new Date().toISOString()
            });
            
            // Send email with SendGrid
            try {
                await sgMail.send({
                    from: process.env.SENDGRID_FROM_EMAIL || 'niccolobalon@mabinicolleges.edu.ph',
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
                
                return res.status(200).json({
                    success: true,
                    message: 'Your account credentials have been sent to your email!'
                });
            } catch (emailError) {
                console.error('SendGrid error:', emailError.response?.body || emailError);
                
                // Rollback retrieval record
                await supabase.from('account_retrievals').delete().eq('email', email);
                
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send email. Please try again or contact support.',
                    error: emailError.response?.body?.errors?.[0]?.message || 'Email service error'
                });
            }
            
        } catch (error) {
            console.error('Account retrieval error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An unexpected error occurred. Please try again later.'
            });
        }
    }

    // Default 404
    return res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
}

