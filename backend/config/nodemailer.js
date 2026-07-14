const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'TLSv1.2',
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    logger: true,
    debug: process.env.NODE_ENV !== 'production'
});

console.log(`Configuring SMTP on ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || 587} secure=${process.env.EMAIL_SECURE === 'true'}`);

transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer SMTP verification failed:', error);
    } else {
        console.log('Nodemailer SMTP server is ready to take messages');
    }
});

module.exports = transporter;
