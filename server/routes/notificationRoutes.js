const express = require('express');
const { param, query } = require('express-validator');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { authenticate, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, requirePasswordReset);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications (newest first)
 *     parameters:
 *       - { in: query, name: unreadOnly, schema: { type: string, enum: ['true', 'false'] } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100 } }
 *       - { in: query, name: offset, schema: { type: integer, minimum: 0 } }
 *     responses:
 *       200:
 *         description: Notifications and the current unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications: { type: array, items: { $ref: '#/components/schemas/Notification' } }
 *                 unreadCount: { type: integer }
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all of the current user's notifications as read
 *     responses:
 *       200: { description: All notifications marked as read }
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200:
 *         description: Updated notification
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { notification: { $ref: '#/components/schemas/Notification' } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
    '/',
    [
        query('unreadOnly').optional().isIn(['true', 'false']).withMessage('unreadOnly must be "true" or "false"'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('offset must be >= 0'),
    ],
    listNotifications
);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', [param('id').isUUID().withMessage('Invalid notification id')], markRead);

module.exports = router;
