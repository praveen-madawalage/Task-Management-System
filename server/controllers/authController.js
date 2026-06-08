const { validationResult } = require('express-validator');
const authService = require('../services/authService');

const REFRESH_COOKIE = 'refresh_token';

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) * 24 * 60 * 60 * 1000,
});

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;

    const user = await authService.findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await authService.validatePassword(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken();
    await authService.saveRefreshToken(user.id, refreshToken);

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());

    res.json({
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustResetPassword: user.must_reset_password,
        },
    });
};

const logout = async (req, res) => {
    const token = req.cookies[REFRESH_COOKIE];

    if (token) {
        await authService.deleteRefreshToken(token);
    }

    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.json({ message: 'Logged out successfully' });
};

const refresh = async (req, res) => {
    const token = req.cookies[REFRESH_COOKIE];

    if (!token) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    const stored = await authService.findRefreshToken(token);
    if (!stored) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Rotation: consume the presented token immediately. It can only be used once,
    // whether it turns out to be expired, valid, or replayed.
    await authService.deleteRefreshToken(token);

    if (new Date() > new Date(stored.expires_at)) {
        return res.status(401).json({ error: 'Refresh token expired, please log in again' });
    }

    const user = await authService.findUserById(stored.user_id);
    if (!user || !user.is_active) {
        return res.status(403).json({ error: 'User not found or deactivated' });
    }

    const accessToken = authService.generateAccessToken(user);
    const newRefreshToken = authService.generateRefreshToken();
    await authService.saveRefreshToken(user.id, newRefreshToken);

    res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions());
    res.json({ accessToken });
};

const changePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const passwordHash = await authService.getUserPasswordHash(userId);
    if (!passwordHash) {
        return res.status(404).json({ error: 'User not found' });
    }

    const valid = await authService.validatePassword(currentPassword, passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password must differ from current password' });
    }

    await authService.updatePassword(userId, newPassword);

    // updatePassword revoked every refresh token for this user. Re-establish the
    // current session with a fresh pair: a new access token that no longer carries
    // the reset flag, and a new refresh token. Other sessions stay logged out.
    const tokenUser = { id: userId, role: req.user.role, must_reset_password: false };
    const accessToken = authService.generateAccessToken(tokenUser);
    const refreshToken = authService.generateRefreshToken();
    await authService.saveRefreshToken(userId, refreshToken);

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
    res.json({ message: 'Password updated successfully', accessToken });
};

module.exports = { login, logout, refresh, changePassword };
