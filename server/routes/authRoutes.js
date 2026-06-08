const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { login, logout, refresh, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Brute-force / credential-stuffing protection: much stricter than the global
// limiter, scoped to the login endpoint only so normal API traffic can't use up
// the budget and attackers can't grind passwords.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later' },
});

const loginValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Valid email is required')
        // Canonical form is trim + lowercase ONLY. We deliberately avoid
        // normalizeEmail()'s Gmail dot/+tag stripping so the value stored at
        // user creation and the value compared at login always match.
        .customSanitizer((value) => value.toLowerCase()),
    body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
];

router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

module.exports = router;
