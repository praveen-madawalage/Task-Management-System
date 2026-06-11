const express = require('express');
const { body, param } = require('express-validator');
const { addComment, listComments, deleteComment } = require('../controllers/commentController');
const { authenticate, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

// Per-route guards (no router.use) so this router mounts cleanly at /api.
const guard = [authenticate, requirePasswordReset];

/**
 * @openapi
 * /api/tasks/{taskId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a task (task viewers — managers/admins or assignees)
 *     parameters:
 *       - { in: path, name: taskId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [content], properties: { content: { type: string } } }
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { comment: { $ref: '#/components/schemas/Comment' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   get:
 *     tags: [Comments]
 *     summary: List a task's comments (oldest first)
 *     parameters:
 *       - { in: path, name: taskId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments: { type: array, items: { $ref: '#/components/schemas/Comment' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment (author, project creator, or admin)
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200: { description: Comment deleted }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
    '/tasks/:taskId/comments',
    guard,
    [
        param('taskId').isUUID().withMessage('Invalid task id'),
        body('content').trim().notEmpty().withMessage('Comment content is required'),
    ],
    addComment
);
router.get(
    '/tasks/:taskId/comments',
    guard,
    [param('taskId').isUUID().withMessage('Invalid task id')],
    listComments
);
router.delete(
    '/comments/:id',
    guard,
    [param('id').isUUID().withMessage('Invalid comment id')],
    deleteComment
);

module.exports = router;
