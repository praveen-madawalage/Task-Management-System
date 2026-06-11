const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

const listNotifications = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const userId = req.user.userId;
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

    try {
        const notifications = await notificationService.listForUser(userId, { unreadOnly, limit, offset });
        const unreadCount = await notificationService.getUnreadCount(userId);
        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error('List notifications failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

const markRead = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const notification = await notificationService.markRead(req.user.userId, req.params.id);
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        res.json({ notification });
    } catch (err) {
        console.error('Mark notification read failed:', err.message);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

const markAllRead = async (req, res) => {
    try {
        await notificationService.markAllRead(req.user.userId);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark all notifications read failed:', err.message);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};

module.exports = { listNotifications, markRead, markAllRead };
