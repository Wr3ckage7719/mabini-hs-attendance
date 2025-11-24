// Quick email test
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing email with:');
console.log('User:', process.env.EMAIL_USER);
console.log('Password:', process.env.EMAIL_PASSWORD ? '***set***' : 'MISSING');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'niccolobalon@mabinicolleges.edu.ph',
    subject: 'Test Email from Mabini HS Attendance',
    html: '<h1>Email Test Successful!</h1><p>Nodemailer is working correctly.</p>'
};

transporter.sendMail(mailOptions)
    .then(info => {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    })
    .catch(error => {
        console.error('❌ Email failed:', error.message);
        console.error('Full error:', error);
    });
