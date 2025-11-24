// Vercel Serverless Function - Handles all /api/* routes
import app from '../server/index.js';

export default async function handler(req, res) {
    // Let Express handle the request
    return app(req, res);
}

