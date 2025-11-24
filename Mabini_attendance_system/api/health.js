// Health check endpoint for Vercel
import app from '../server/index.js';

export default (req, res) => {
    return new Promise((resolve, reject) => {
        res.on('finish', resolve);
        res.on('error', reject);
        app(req, res);
    });
};
