const express = require('express');
const { body, param } = require('express-validator');
const {
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject,
} = require('../controllers/projectController');
const { authenticate, requireRole, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

// Every project route requires a valid token and a completed password reset.
router.use(authenticate, requirePasswordReset);

const createValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional({ nullable: true }).isString().withMessage('Description must be text'),
];

const updateValidation = [
    param('id').isUUID().withMessage('Invalid project id'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional({ nullable: true }).isString().withMessage('Description must be text'),
];

const idValidation = [param('id').isUUID().withMessage('Invalid project id')];

// Creators are project managers (or admins). Ownership for update/delete is
// enforced in the controller (creator-or-admin); collaborators are read-only.
router.post('/', requireRole('admin', 'project_manager'), createValidation, createProject);
router.get('/', listProjects);
router.get('/:id', idValidation, getProject);
router.patch('/:id', requireRole('admin', 'project_manager'), updateValidation, updateProject);
router.delete('/:id', requireRole('admin', 'project_manager'), idValidation, deleteProject);

module.exports = router;
