const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// Auth endpoints
router.post('/signup', ctrl.signup);
router.post('/verify', ctrl.verify);
router.post('/resend-code', ctrl.resendCode); // NEW
router.post('/login', ctrl.login);
router.post('/forgot', ctrl.forgot);
router.post('/reset', ctrl.reset);
router.get('/profile', auth, ctrl.getProfile); // NEW

module.exports = router;
