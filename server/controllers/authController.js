const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate random code
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const emailTemplates = {
    verifyEmail: (code, name = 'User') => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                }
                .content { 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }
                .code { 
                    background: #667eea; 
                    color: white; 
                    padding: 15px 30px; 
                    font-size: 28px; 
                    font-weight: bold; 
                    letter-spacing: 5px; 
                    text-align: center; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    display: inline-block;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    color: #666; 
                    font-size: 14px;
                }
                .button {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to Our App! 🎉</h1>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>Thank you for signing up! To complete your registration, please use the verification code below:</p>
                
                <div style="text-align: center;">
                    <div class="code">${code}</div>
                </div>

                <p>This code will expire in 24 hours for security reasons.</p>
                
                <p>If you didn't create an account with us, please ignore this email.</p>
                
                <div class="footer">
                    <p>Best regards,<br>The App Team</p>
                </div>
            </div>
        </body>
        </html>
    `,

    resetPassword: (code, name = 'User') => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                .header { 
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                }
                .content { 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }
                .code { 
                    background: #ff6b6b; 
                    color: white; 
                    padding: 15px 30px; 
                    font-size: 28px; 
                    font-weight: bold; 
                    letter-spacing: 5px; 
                    text-align: center; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    display: inline-block;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    color: #666; 
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Password Reset 🔒</h1>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>We received a request to reset your password. Use the code below to create a new password:</p>
                
                <div style="text-align: center;">
                    <div class="code">${code}</div>
                </div>

                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> This code is valid for 1 hour only. If you didn't request this reset, please ignore this email and ensure your account is secure.
                </div>

                <p>Once verified, you'll be able to set a new password for your account.</p>
                
                <div class="footer">
                    <p>Stay secure,<br>The App Team</p>
                </div>
            </div>
        </body>
        </html>
    `
};

// SIGNUP
exports.signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const code = generateCode();
        const hash = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (email, password, name, email_code) VALUES (?, ?, ?, ?)",
            [email, hash, name, code]
        );

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: "Verify Your Email - Welcome to Our App!",
            html: emailTemplates.verifyEmail(code, name),
            text: `Your verification code is: ${code}\n\nWelcome to Our App! Please use this code to verify your email address.`
        });

        res.json({ status: 'success', message: 'Account created. Check email for verification code.' });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
};

// VERIFY EMAIL
exports.verify = async (req, res) => {
    try {
        const { email, code } = req.body;

        const [user] = await db.query(
            "SELECT * FROM users WHERE email = ? AND email_code = ?",
            [email, code]
        );

        if (!user.length)
            return res.json({ status: 'error', message: 'Invalid verification code' });

        await db.query(
            "UPDATE users SET is_verified = 1, email_code = NULL WHERE email = ?",
            [email]
        );

        res.json({ status: 'success', message: 'Email verified' });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [usr] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!usr.length)
            return res.json({ status: 'error', message: 'User not found' });

        const valid = await bcrypt.compare(password, usr[0].password);
        if (!valid)
            return res.json({ status: 'error', message: 'Incorrect password' });

        const token = jwt.sign({ id: usr[0].id }, process.env.JWT_SECRET);

        res.json({ status: 'success', token });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
};

// FORGOT PASSWORD
exports.forgot = async (req, res) => {
    try {
        const { email } = req.body;
        const code = generateCode();

        // Get user name for personalized email
        const [user] = await db.query("SELECT name FROM users WHERE email = ?", [email]);
        const userName = user.length ? user[0].name : 'User';

        await db.query("UPDATE users SET reset_code = ? WHERE email = ?", [code, email]);

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request - Secure Your Account',
            html: emailTemplates.resetPassword(code, userName),
            text: `Your password reset code is: ${code}\n\nUse this code to reset your password. This code will expire in 1 hour.`
        });

        res.json({ status: 'success', message: 'Reset code sent' });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
};

// RESET PASSWORD
exports.reset = async (req, res) => {
    try {
        const { email, code, newPass } = req.body;

        const [usr] = await db.query(
            "SELECT * FROM users WHERE email = ? AND reset_code = ?",
            [email, code]
        );

        if (!usr.length)
            return res.json({ status: 'error', message: 'Invalid code' });

        const hash = await bcrypt.hash(newPass, 10);

        await db.query(
            "UPDATE users SET password = ?, reset_code = NULL WHERE email = ?",
            [hash, email]
        );

        res.json({ status: 'success', message: 'Password updated' });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
};