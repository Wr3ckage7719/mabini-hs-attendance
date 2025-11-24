// Vercel Serverless Function - Handles all /api/* routes
import app from '../server/index.js';

// Wrap Express app for Vercel serverless
export default (req, res) => {
    return new Promise((resolve, reject) => {
        // Add Vercel-specific handling
        res.on('finish', resolve);
        res.on('error', reject);
        
        // Let Express handle the request
        app(req, res);
    });
};

