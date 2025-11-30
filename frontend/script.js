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

// Button loading state
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<div class="button-spinner"></div> Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText;
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM loaded, current page:', window.location.pathname);
    
    // Check authentication on dashboard
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        console.log('🔐 Checking authentication for dashboard...');
        checkAuth();
    }
    
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
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// SIGNUP
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('📝 Signup form submitted:', { name, email });
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(API + '/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        console.log('📡 Signup response:', data);
        
        if (data.status === 'success') {
            showMessage('Account created! Check your email for verification code.', 'success');
            // Store email for verification
            localStorage.setItem('pendingEmail', email);
            console.log('💾 Stored pendingEmail:', email);
            setTimeout(() => {
                window.location.href = 'verify.html';
            }, 2000);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Signup network error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// LOGIN - WITH DEBUGGING
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('🔐 Login form submitted:', { email });
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        console.log('🔄 Sending login request to:', API + '/login');
        const res = await fetch(API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log('📡 Login response:', data);
        
        if (data.status === 'success') {
            console.log('✅ Login successful, storing data...');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Verify data was stored
            console.log('💾 Stored token:', localStorage.getItem('token') ? 'YES' : 'NO');
            console.log('💾 Stored user:', localStorage.getItem('user'));
            
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                console.log('🔄 Redirecting to dashboard...');
                window.location.href = 'index.html';
            }, 1500);
        } else {
            console.log('❌ Login failed:', data.message);
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Login network error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// VERIFY EMAIL
async function handleVerify(e) {
    e.preventDefault();
    
    const email = localStorage.getItem('pendingEmail');
    const code = document.getElementById('verifyCode').value;
    
    console.log('🔐 Verify form submitted:', { email, code });
    
    if (!email) {
        showMessage('Email not found. Please sign up again.', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(API + '/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await res.json();
        console.log('📡 Verify response:', data);
        
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
        console.error('❌ Verify network error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// FORGOT PASSWORD
async function handleForgot(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    console.log('🔑 Forgot password form submitted:', { email });
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(API + '/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        console.log('📡 Forgot password response:', data);
        
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
        console.error('❌ Forgot password network error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// RESET PASSWORD
async function handleReset(e) {
    e.preventDefault();
    
    const email = localStorage.getItem('resetEmail');
    const code = document.getElementById('resetCode').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    console.log('🔑 Reset password form submitted:', { email, code });
    
    if (newPass !== confirmPass) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!email) {
        showMessage('Email session expired. Please request a new reset code.', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(API + '/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPass })
        });

        const data = await res.json();
        console.log('📡 Reset password response:', data);
        
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
        console.error('❌ Reset password network error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// RESEND CODE
async function handleResendCode(e) {
    e.preventDefault();
    
    const email = localStorage.getItem('pendingEmail');
    
    console.log('📧 Resend code requested for:', email);
    
    if (!email) {
        showMessage('Email not found. Please sign up again.', 'error');
        return;
    }

    const resendLink = e.target;
    resendLink.style.opacity = '0.6';
    resendLink.style.pointerEvents = 'none';

    try {
        const res = await fetch(API + '/resend-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        console.log('📡 Resend code response:', data);
        
        if (data.status === 'success') {
            showMessage('New verification code sent!', 'success');
            
            // Re-enable after 30 seconds
            setTimeout(() => {
                resendLink.style.opacity = '1';
                resendLink.style.pointerEvents = 'auto';
            }, 30000);
        } else {
            showMessage(data.message, 'error');
            resendLink.style.opacity = '1';
            resendLink.style.pointerEvents = 'auto';
        }
    } catch (error) {
        console.error('❌ Resend code network error:', error);
        showMessage('Error resending code. Please try again.', 'error');
        resendLink.style.opacity = '1';
        resendLink.style.pointerEvents = 'auto';
    }
}

// CHECK AUTH - WITH DEBUGGING
async function checkAuth() {
    console.log('🔐 checkAuth() called');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('📝 Token exists:', !!token);
    console.log('📝 User data exists:', !!userData);
    console.log('📝 Token value:', token);
    console.log('📝 User data:', userData);
    
    // If no token or user data, redirect to login immediately
    if (!token || !userData) {
        console.log('❌ No token or user data - redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        console.log('🔄 Verifying token with backend...');
        const res = await fetch(API + '/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Backend response status:', res.status);
        
        // If token is invalid/expired, redirect to login
        if (!res.ok) {
            console.log('❌ Backend returned error - redirecting to login');
            throw new Error('Not authenticated');
        }
        
        const data = await res.json();
        console.log('✅ Backend verification successful:', data);
        
        // Update user info in dashboard
        const user = JSON.parse(userData);
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        
    } catch (error) {
        console.log('❌ Error during auth check:', error);
        // Clear invalid data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// LOGOUT
function handleLogout() {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingEmail');
    localStorage.removeItem('resetEmail');
    window.location.href = 'login.html';
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
