// Simple health check endpoint for Vercel
export default function handler(req, res) {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
            hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
            hasSendGridKey: !!process.env.SENDGRID_API_KEY,
            hasSendGridFrom: !!process.env.SENDGRID_FROM_EMAIL,
            nodeVersion: process.version
        }
    });
}
