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



// SIGNUP 
exports.signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.json({ status: 'error', message: 'Email already registered' });
        }

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

        res.json({ 
            status: 'success', 
            message: 'Account created. Check email for verification code.',
            email: email 
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.json({ status: 'error', message: 'Server error during signup' });
    }
};

// RESEND VERIFICATION CODE - NEW ENDPOINT
exports.resendCode = async (req, res) => {
    try {
        const { email } = req.body;
        
        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!user.length) {
            return res.json({ status: 'error', message: 'Email not found' });
        }

        const code = generateCode();
        
        await db.query("UPDATE users SET email_code = ? WHERE email = ?", [code, email]);

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: "New Verification Code",
            html: emailTemplates.verifyEmail(code, user[0].name),
            text: `Your new verification code is: ${code}`
        });

        res.json({ status: 'success', message: 'New verification code sent' });

    } catch (err) {
        console.error('Resend code error:', err);
        res.json({ status: 'error', message: 'Failed to resend code' });
    }
};

// VERIFY EMAIL - FIXED
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

        res.json({ status: 'success', message: 'Email verified successfully!' });

    } catch (err) {
        console.error('Verify error:', err);
        res.json({ status: 'error', message: 'Verification failed' });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [usr] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!usr.length)
            return res.json({ status: 'error', message: 'User not found' });

        if (!usr[0].is_verified)
            return res.json({ status: 'error', message: 'Please verify your email first' });

        const valid = await bcrypt.compare(password, usr[0].password);
        if (!valid)
            return res.json({ status: 'error', message: 'Incorrect password' });

        const token = jwt.sign({ id: usr[0].id, email: usr[0].email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            status: 'success', 
            token,
            user: {
                id: usr[0].id,
                name: usr[0].name,
                email: usr[0].email
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.json({ status: 'error', message: 'Login failed' });
    }
};

// FORGOT PASSWORD
exports.forgot = async (req, res) => {
    try {
        const { email } = req.body;
        
        const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!user.length) {
            return res.json({ status: 'error', message: 'Email not found' });
        }

        const code = generateCode();

        await db.query("UPDATE users SET reset_code = ? WHERE email = ?", [code, email]);

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request - Secure Your Account',
            html: emailTemplates.resetPassword(code, user[0].name),
            text: `Your password reset code is: ${code}\n\nUse this code to reset your password. This code will expire in 1 hour.`
        });

        res.json({ status: 'success', message: 'Reset code sent to your email' });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.json({ status: 'error', message: 'Failed to send reset code' });
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
            return res.json({ status: 'error', message: 'Invalid or expired reset code' });

        const hash = await bcrypt.hash(newPass, 10);

        await db.query(
            "UPDATE users SET password = ?, reset_code = NULL WHERE email = ?",
            [hash, email]
        );

        res.json({ status: 'success', message: 'Password updated successfully' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.json({ status: 'error', message: 'Password reset failed' });
    }
};

// GET USER PROFILE - NEW
exports.getProfile = async (req, res) => {
    try {
        const [user] = await db.query(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (!user.length) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({ status: 'success', user: user[0] });

    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to get profile' });
    }
};
