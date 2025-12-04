// Vercel Serverless Function - Send Email via SendGrid
import sgMail from '@sendgrid/mail';

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
            error: 'Method not allowed' 
        });
    }

    try {
        const { to, subject, message, html } = req.body;

        // Validate required fields
        if (!to || !subject || (!message && !html)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, subject, and (message or html)'
            });
        }

        // Validate email format
        if (!to.includes('@')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Check SendGrid configuration
        if (!process.env.SENDGRID_API_KEY) {
            console.error('SendGrid API key not configured');
            return res.status(500).json({
                success: false,
                error: 'Email service not configured'
            });
        }

        // Prepare email message
        const msg = {
            to,
            from: process.env.SENDGRID_FROM_EMAIL || 'niccolobalon@mabinicolleges.edu.ph',
            subject,
            text: message,
            html: html || `<div style="font-family: Arial, sans-serif; padding: 20px;">${message.replace(/\n/g, '<br>')}</div>`
        };

        // Send email
        await sgMail.send(msg);

        console.log(`✅ Email sent to ${to}: ${subject}`);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Email sending error:', error.response?.body || error.message);
        
        return res.status(500).json({
            success: false,
            error: error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email'
        });
    }
}
