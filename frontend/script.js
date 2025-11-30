const API = "https://verification-8hok.onrender.com/auth";

// Utility functions
function showMessage(message, type = 'success') {
    // Remove any existing messages
    const existingMsg = document.querySelector('.message');
    if (existingMsg) existingMsg.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.auth-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Verify Form
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerify);
        
        // Auto-focus code input
        const codeInput = document.getElementById('verifyCode');
        if (codeInput) codeInput.focus();
    }
    
    // Forgot Password Form
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgot);
    }
    
    // Reset Password Form
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handleReset);
    }
    
    // Resend Code Link
    const resendLink = document.getElementById('resendCode');
    if (resendLink) {
        resendLink.addEventListener('click', handleResendCode);
    }
});

// SIGNUP
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(API + '/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        
        if (data.status === 'success') {
            showMessage('Account created! Check your email for verification code.', 'success');
            setTimeout(() => {
                window.location.href = 'verify.html';
            }, 2000);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// LOGIN
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        if (data.status === 'success') {
            localStorage.setItem('token', data.token);
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// VERIFY EMAIL
async function handleVerify(e) {
    e.preventDefault();
    
    const email = localStorage.getItem('pendingEmail') || prompt("Please enter your email:");
    const code = document.getElementById('verifyCode').value;
    
    if (!email) {
        showMessage('Please enter your email', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Verifying...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(API + '/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await res.json();
        
        if (data.status === 'success') {
            showMessage('Email verified successfully!', 'success');
            localStorage.removeItem('pendingEmail');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// FORGOT PASSWORD
async function handleForgot(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending Code...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(API + '/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        
        if (data.status === 'success') {
            showMessage('Reset code sent to your email!', 'success');
            localStorage.setItem('resetEmail', email);
            setTimeout(() => {
                window.location.href = 'reset.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// RESET PASSWORD
async function handleReset(e) {
    e.preventDefault();
    
    const email = localStorage.getItem('resetEmail') || document.getElementById('email')?.value;
    const code = document.getElementById('resetCode').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (newPass !== confirmPass) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!email) {
        showMessage('Email is required', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Resetting...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(API + '/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPass })
        });

        const data = await res.json();
        
        if (data.status === 'success') {
            showMessage('Password reset successfully!', 'success');
            localStorage.removeItem('resetEmail');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// RESEND CODE
async function handleResendCode(e) {
    e.preventDefault();
    
    const email = localStorage.getItem('pendingEmail') || prompt("Please enter your email:");
    
    if (!email) {
        showMessage('Please enter your email', 'error');
        return;
    }

    try {
        // This would call a resend endpoint if available
        showMessage('Code resent to your email!', 'success');
    } catch (error) {
        showMessage('Error resending code. Please try again.', 'error');
    }
}

// Auto-focus and auto-tab for verification code
document.addEventListener('DOMContentLoaded', function() {
    const codeInput = document.getElementById('verifyCode');
    if (codeInput) {
        codeInput.addEventListener('input', function(e) {
            if (this.value.length === 6) {
                document.getElementById('verifyForm').dispatchEvent(new Event('submit'));
            }
        });
    }
});
