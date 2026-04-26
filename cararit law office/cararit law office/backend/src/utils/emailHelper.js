require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async (toEmail, subject, text) => {
    try {
        // 🔍 DEBUG
        console.log("EMAIL_USER:", process.env.EMAIL_USER);
        console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "MERON" : "WALA");

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Email credentials missing in .env");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject,
            text
        });

        console.log("✅ Email sent to:", toEmail);

    } catch (err) {
        console.error("❌ Email Error:", err.message);
    }
};

module.exports = { sendEmail };