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

// Label definitions (scoped to a project)
router.post('/projects/:projectId/labels', manageGuard, createValidation, createLabel);
router.get('/projects/:projectId/labels', guard, param('projectId').isUUID().withMessage('Invalid project id'), listLabels);
router.patch('/labels/:id', manageGuard, updateValidation, updateLabel);
router.delete('/labels/:id', manageGuard, param('id').isUUID().withMessage('Invalid label id'), deleteLabel);

// Tagging tasks
router.post('/tasks/:taskId/labels', manageGuard, tagValidation, addLabelToTask);
router.delete('/tasks/:taskId/labels/:labelId', manageGuard, untagValidation, removeLabelFromTask);

module.exports = router;
