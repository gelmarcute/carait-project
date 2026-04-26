// src/config/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gelmargazzingan69@gmail.com', // Your Super Admin email
        pass: 'xxxx xxxx xxxx xxxx'          // You will replace this with the real 16-letter App Password later
    }
});

const sendEmailNotification = async (toEmail, subject, textContent) => {
    try {
        const mailOptions = {
            from: '"Carait Management System" <gelmargazzingan69@gmail.com>',
            to: toEmail,
            subject: subject,
            text: textContent,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', toEmail);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendEmailNotification };