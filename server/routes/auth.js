const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth'); 


router.post('/signup', ctrl.signup);
router.post('/verify', ctrl.verify);
router.post('/login', ctrl.login);
router.post('/forgot', ctrl.forgot);
router.post('/reset', ctrl.reset);




module.exports = router;
