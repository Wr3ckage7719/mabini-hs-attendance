// Vercel Serverless Function - Verify OTP for Password Reset
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
        const { email, otp, role } = req.body;
        
        console.log('OTP verification request:', { email, otp: otp?.substring(0, 2) + '****', role });
        
        // Validate input
        if (!email || !otp || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and role are required'
            });
        }

        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format. Must be 6 digits'
            });
        }
        
        // Find the OTP token
        const { data: tokenData, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('email', email)
            .eq('token', otp)
            .eq('user_type', role)
            .eq('used', false)
            .order('created_at', { ascending: false })
            .limit(1)
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
                message: 'Invalid OTP code. Please try again'
            });
        }

        // Check if OTP has expired
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        
        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one',
                expired: true
            });
        }
        
        // Mark OTP as verified (but not used yet - will be used when password is actually reset)
        const { error: updateError } = await supabase
            .from('password_reset_tokens')
            .update({ 
                verified_at: now.toISOString()
            })
            .eq('id', tokenData.id);
        
        if (updateError) {
            console.error('Error updating token:', updateError);
        }
        
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            resetToken: tokenData.id // Return token ID for the next step
        });
        
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again later'
        });
    }
}
