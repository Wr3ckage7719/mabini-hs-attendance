// Vercel Serverless Function - Reset Password
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        const { email, resetToken, newPassword, role } = req.body;
        
        console.log('Password reset request:', { email, resetToken, role });
        
        // Validate input
        if (!email || !resetToken || !newPassword || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Verify the reset token is valid and verified
        const { data: tokenData, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('id', resetToken)
            .eq('email', email)
            .eq('user_type', role)
            .eq('used', false)
            .maybeSingle();
        
        if (tokenError) {
            console.error('Database error:', tokenError);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check if token was verified
        if (!tokenData.verified_at) {
            return res.status(400).json({
                success: false,
                message: 'Token not verified. Please verify OTP first'
            });
        }

        // Check if token has expired
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        
        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please start over',
                expired: true
            });
        }
        
        // Update password in the appropriate table
        const userTable = role === 'student' ? 'students' : 'teachers';
        const { data: updateData, error: updateError } = await supabase
            .from(userTable)
            .update({ 
                password: newPassword,
                updated_at: now.toISOString()
            })
            .eq('email', email)
            .select();
        
        if (updateError) {
            console.error('Error updating password:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update password. Please try again'
            });
        }

        if (!updateData || updateData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Mark token as used
        await supabase
            .from('password_reset_tokens')
            .update({ 
                used: true,
                used_at: now.toISOString()
            })
            .eq('id', resetToken);

        console.log('Password reset successful for:', email);
        
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully! You can now login with your new password'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again later'
        });
    }
}
