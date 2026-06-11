const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { login, logout, refresh, changePassword, me } = require('../controllers/authController');
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

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Authenticated; returns an access token and sets the refresh-token cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { description: Invalid credentials }
 *       403: { description: Account deactivated }
 *       429: { description: Too many login attempts }
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token and issue a new access token
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access token issued; the refresh-token cookie is rotated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401: { description: Missing, invalid, or expired refresh token }
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear the cookie
 *     responses:
 *       200: { description: Logged out }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (clears the mandatory-reset flag, revokes other sessions)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:
 *                 type: string
 *                 description: Min 8 chars with at least one uppercase letter, one number, and one special character.
 *     responses:
 *       200:
 *         description: Password updated; returns a fresh access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 accessToken: { type: string }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { description: Current password incorrect or not authenticated }
 */
/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user's profile
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { user: { $ref: '#/components/schemas/User' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);
router.get('/me', authenticate, me);

module.exports = router;
