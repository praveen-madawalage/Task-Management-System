const express = require('express');
const multer = require('multer');
const { param } = require('express-validator');
const { addAttachment, listAttachments, deleteAttachment } = require('../controllers/attachmentController');
const { authenticate, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

const guard = [authenticate, requirePasswordReset];

// Files are buffered in memory then streamed to Supabase Storage. 10 MB cap.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// Wraps multer so its errors return a clean 400 instead of bubbling to the
// generic 500 handler.
const uploadSingle = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File exceeds the 10MB limit' });
            }
            return res.status(400).json({ error: 'File upload failed', detail: err.message });
        }
        next();
    });
};

/**
 * @openapi
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload an attachment to a task (task viewers — managers/admins or assignees)
 *     parameters:
 *       - { in: path, name: taskId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Attachment uploaded
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { attachment: { $ref: '#/components/schemas/Attachment' } } }
 *       400: { description: Missing file or file too large }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   get:
 *     tags: [Attachments]
 *     summary: List a task's attachments (newest first)
 *     parameters:
 *       - { in: path, name: taskId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: List of attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attachments: { type: array, items: { $ref: '#/components/schemas/Attachment' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/attachments/{id}:
 *   delete:
 *     tags: [Attachments]
 *     summary: Delete an attachment (uploader, project creator, or admin)
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200: { description: Attachment deleted }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
    '/tasks/:taskId/attachments',
    guard,
    [param('taskId').isUUID().withMessage('Invalid task id')],
    uploadSingle,
    addAttachment
);
router.get(
    '/tasks/:taskId/attachments',
    guard,
    [param('taskId').isUUID().withMessage('Invalid task id')],
    listAttachments
);
router.delete(
    '/attachments/:id',
    guard,
    [param('id').isUUID().withMessage('Invalid attachment id')],
    deleteAttachment
);

module.exports = router;
