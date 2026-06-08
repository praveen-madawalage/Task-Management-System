const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

// Blocks users who still owe a mandatory first-login password reset. Apply this
// after `authenticate` on every protected feature route — but NOT on the
// change-password route, which is how they clear the flag.
const requirePasswordReset = (req, res, next) => {
    if (req.user && req.user.mustResetPassword) {
        return res.status(403).json({
            error: 'Password reset required before accessing the system',
            code: 'PASSWORD_RESET_REQUIRED',
        });
    }
    next();
};

module.exports = { authenticate, requireRole, requirePasswordReset };
