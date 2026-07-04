const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'TLSv1.2',
        rejectUnauthorized: false
    },
    connectionTimeout: 20000,
    logger: true,
    debug: process.env.NODE_ENV !== 'production'
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer SMTP verification failed:', error);
    } else {
        console.log('Nodemailer SMTP server is ready to take messages');
    }
});

module.exports = transporter;
