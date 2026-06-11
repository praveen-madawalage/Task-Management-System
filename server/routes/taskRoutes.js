const express = require('express');
const { body, param, query } = require('express-validator');
const {
    createTask,
    listTasks,
    getTask,
    updateTask,
    updateStatus,
    deleteTask,
    addAssignee,
    removeAssignee,
} = require('../controllers/taskController');
const { authenticate, requireRole, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'completed'];
const SORT_FIELDS = ['dueDate', 'priority', 'createdAt', 'status'];

router.use(authenticate, requirePasswordReset);

// Rejects a due date in the past (empty/no due date is fine).
const notPastDate = (value) => {
    if (new Date(value).getTime() < Date.now()) {
        throw new Error('Due date cannot be in the past');
    }
    return true;
};

const createValidation = [
    body('projectId').isUUID().withMessage('A valid projectId is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional({ nullable: true }).isString().withMessage('Description must be text'),
    body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
    body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date').bail().custom(notPastDate),
    body('assigneeIds').optional().isArray().withMessage('assigneeIds must be an array'),
    body('assigneeIds.*').optional().isUUID().withMessage('Each assignee id must be a valid UUID'),
];

const updateValidation = [
    param('id').isUUID().withMessage('Invalid task id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional({ nullable: true }).isString().withMessage('Description must be text'),
    body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
    body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date').bail().custom(notPastDate),
];

const statusValidation = [
    param('id').isUUID().withMessage('Invalid task id'),
    body('status').isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const addAssigneeValidation = [
    param('id').isUUID().withMessage('Invalid task id'),
    body('userId').isUUID().withMessage('A valid userId is required'),
];

const removeAssigneeValidation = [
    param('id').isUUID().withMessage('Invalid task id'),
    param('userId').isUUID().withMessage('Invalid user id'),
];

const listValidation = [
    query('projectId').optional().isUUID().withMessage('Invalid projectId filter'),
    query('status').optional().isIn(STATUSES).withMessage('Invalid status filter'),
    query('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority filter'),
    query('assignedTo').optional().custom((v) => v === 'me' || /^[0-9a-fA-F-]{36}$/.test(v)).withMessage('assignedTo must be "me" or a user id'),
    query('sortBy').optional().isIn(SORT_FIELDS).withMessage(`sortBy must be one of: ${SORT_FIELDS.join(', ')}`),
    query('order').optional().isIn(['asc', 'desc']).withMessage('order must be "asc" or "desc"'),
];

const idValidation = [param('id').isUUID().withMessage('Invalid task id')];

// Manage = project creator or admin (enforced in controller); requireRole keeps
// collaborators out of these routes entirely.
router.post('/', requireRole('admin', 'project_manager'), createValidation, createTask);
router.get('/', listValidation, listTasks);
router.get('/:id', idValidation, getTask);
router.patch('/:id', requireRole('admin', 'project_manager'), updateValidation, updateTask);
router.patch('/:id/status', statusValidation, updateStatus); // assignees allowed too
router.delete('/:id', requireRole('admin', 'project_manager'), idValidation, deleteTask);
router.post('/:id/assignees', requireRole('admin', 'project_manager'), addAssigneeValidation, addAssignee);
router.delete('/:id/assignees/:userId', requireRole('admin', 'project_manager'), removeAssigneeValidation, removeAssignee);

module.exports = router;
