const express = require('express');
const { body, param } = require('express-validator');
const {
    createLabel,
    listLabels,
    updateLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
} = require('../controllers/labelController');
const { authenticate, requireRole, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

// Per-route guards (no router.use here) so this router can be mounted at /api
// without its middleware firing for non-label requests that pass through it.
const guard = [authenticate, requirePasswordReset];
const manageGuard = [authenticate, requirePasswordReset, requireRole('admin', 'project_manager')];

const createValidation = [
    param('projectId').isUUID().withMessage('Invalid project id'),
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer'),
    body('color').matches(HEX_COLOR).withMessage('Color must be a hex value like #1A2B3C'),
];

const updateValidation = [
    param('id').isUUID().withMessage('Invalid label id'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer'),
    body('color').optional().matches(HEX_COLOR).withMessage('Color must be a hex value like #1A2B3C'),
];

const tagValidation = [
    param('taskId').isUUID().withMessage('Invalid task id'),
    body('labelId').isUUID().withMessage('A valid labelId is required'),
];

const untagValidation = [
    param('taskId').isUUID().withMessage('Invalid task id'),
    param('labelId').isUUID().withMessage('Invalid label id'),
];

/**
 * @openapi
 * /api/projects/{projectId}/labels:
 *   post:
 *     tags: [Labels]
 *     summary: Create a label in a project (creator or admin)
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, color]
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               color: { type: string, example: '#E11D48', description: 'Hex color' }
 *     responses:
 *       201:
 *         description: Label created
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { label: { $ref: '#/components/schemas/Label' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: A label with this name already exists in the project }
 *   get:
 *     tags: [Labels]
 *     summary: List a project's labels (project access required)
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: List of labels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labels: { type: array, items: { $ref: '#/components/schemas/Label' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/labels/{id}:
 *   patch:
 *     tags: [Labels]
 *     summary: Update a label's name and/or color (creator or admin)
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               color: { type: string, example: '#1A2B3C' }
 *     responses:
 *       200:
 *         description: Updated label
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { label: { $ref: '#/components/schemas/Label' } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Name already exists in the project }
 *   delete:
 *     tags: [Labels]
 *     summary: Delete a label (creator or admin); removes it from any tagged tasks
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200: { description: Label deleted }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/tasks/{taskId}/labels:
 *   post:
 *     tags: [Labels]
 *     summary: Apply a label to a task (project creator or admin)
 *     parameters:
 *       - { in: path, name: taskId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [labelId], properties: { labelId: { type: string, format: uuid } } }
 *     responses:
 *       201:
 *         description: Updated label list for the task
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { labels: { type: array, items: { $ref: '#/components/schemas/Label' } } } }
 *       400: { description: Label belongs to a different project, or validation failed }
 *       409: { description: Label is already applied to this task }
 * /api/tasks/{taskId}/labels/{labelId}:
 *   delete:
 *     tags: [Labels]
 *     summary: Remove a label from a task (project creator or admin)
 *     parameters:
 *       - { in: path, name: taskId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: labelId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Updated label list for the task
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { labels: { type: array, items: { $ref: '#/components/schemas/Label' } } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
// Label definitions (scoped to a project)
router.post('/projects/:projectId/labels', manageGuard, createValidation, createLabel);
router.get('/projects/:projectId/labels', guard, param('projectId').isUUID().withMessage('Invalid project id'), listLabels);
router.patch('/labels/:id', manageGuard, updateValidation, updateLabel);
router.delete('/labels/:id', manageGuard, param('id').isUUID().withMessage('Invalid label id'), deleteLabel);

// Tagging tasks
router.post('/tasks/:taskId/labels', manageGuard, tagValidation, addLabelToTask);
router.delete('/tasks/:taskId/labels/:labelId', manageGuard, untagValidation, removeLabelFromTask);

module.exports = router;
