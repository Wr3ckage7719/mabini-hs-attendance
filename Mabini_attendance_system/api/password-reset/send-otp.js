// Vercel Serverless Function - Send OTP for Password Reset
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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { email, role } = req.body;
        
        console.log('Password reset OTP request:', { email, role });
        
        // Validate input
        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email and role are required'
            });
        }

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be student or teacher'
            });
        }
        
        // Check if user exists in the correct table
        const userTable = role === 'student' ? 'students' : 'teachers';
        const { data: user, error: userError } = await supabase
            .from(userTable)
            .select('id, email, first_name, last_name, status')
            .eq('email', email)
            .maybeSingle();
        
        if (userError) {
            console.error('Database error:', userError);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No ${role} account found with this email address`
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active. Please contact administration'
            });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        // Store OTP in password_reset_tokens table
        const { error: insertError } = await supabase
            .from('password_reset_tokens')
            .insert({
                user_type: role,
                email: email,
                token: otp,
                expires_at: expiresAt.toISOString(),
                used: false
            });
        
        if (insertError) {
            console.error('Error storing OTP:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate OTP. Please try again'
            });
        }

        // Send OTP via email
        if (process.env.SENDGRID_API_KEY) {
            try {
                await sgMail.send({
                    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@mabinicolleges.edu.ph',
                    to: email,
                    subject: 'Password Reset OTP - Mabini HS Attendance System',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #0f172a;">Password Reset Request</h2>
                            <p>Hello ${user.first_name} ${user.last_name},</p>
                            <p>You requested to reset your password for the Mabini High School Attendance System.</p>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #64748b;">Your OTP Code:</p>
                                <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 4px; color: #0f172a;">${otp}</h1>
                                <p style="margin: 0; font-size: 12px; color: #64748b;">This code expires in 10 minutes</p>
                            </div>
                            <p>If you didn't request this password reset, please ignore this email or contact your administrator.</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="font-size: 12px; color: #64748b;">
                                This is an automated message from Mabini High School Attendance System.<br>
                                Please do not reply to this email.
                            </p>
                        </div>
                    `
                });
                
                console.log('OTP email sent successfully to:', email);
            } catch (emailError) {
                console.error('SendGrid error:', emailError.response?.body || emailError);
                // Don't fail the request if email fails - OTP is still stored
                return res.status(200).json({
                    success: true,
                    message: 'OTP generated but email delivery may have failed. Please check your inbox or contact support.',
                    emailSent: false
                });
            }
        }
        
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email',
            emailSent: true,
            expiresIn: 600 // 10 minutes in seconds
        });
        
    } catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again later'
        });
    }
}
