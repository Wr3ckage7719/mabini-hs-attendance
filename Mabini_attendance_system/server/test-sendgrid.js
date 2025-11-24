// SendGrid Email Test
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing SendGrid...');
console.log('API Key:', process.env.SENDGRID_API_KEY ? '***set***' : 'MISSING');
console.log('From:', process.env.SENDGRID_FROM_EMAIL);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: 'niccolobalon@mabinicolleges.edu.ph',
    from: process.env.SENDGRID_FROM_EMAIL || 'niccolobalon@mabinicolleges.edu.ph',
    subject: 'SendGrid Test - Mabini HS Attendance',
    html: '<h1>✅ SendGrid Works!</h1><p>Email sending is configured correctly.</p>',
};

sgMail.send(msg)
    .then(() => {
        console.log('✅ Email sent successfully!');
        console.log('Check your inbox at niccolobalon@mabinicolleges.edu.ph');
    })
    .catch((error) => {
        console.error('❌ SendGrid error:', error.response?.body || error.message);
    });
