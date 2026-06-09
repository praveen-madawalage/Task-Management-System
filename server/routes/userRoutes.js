const express = require('express');
const { body, param, query } = require('express-validator');
const {
    createUser,
    listUsers,
    getUser,
    updateUser,
    setUserStatus,
} = require('../controllers/userController');
const { authenticate, requireRole, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

const ROLES = ['admin', 'project_manager', 'collaborator'];

// Every user-management route is admin-only and requires the admin to have
// completed any mandatory password reset first.
router.use(authenticate, requirePasswordReset, requireRole('admin'));

const createValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
        .trim()
        .isEmail().withMessage('Valid email is required')
        // Same canonical form as login (trim + lowercase) so stored and
        // login-time emails always match.
        .customSanitizer((value) => value.toLowerCase()),
    body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
];

const updateValidation = [
    param('id').isUUID().withMessage('Invalid user id'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
];

const statusValidation = [
    param('id').isUUID().withMessage('Invalid user id'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

const listValidation = [
    query('role').optional().isIn(ROLES).withMessage('Invalid role filter'),
    query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be "true" or "false"'),
];

const idValidation = [param('id').isUUID().withMessage('Invalid user id')];

router.post('/', createValidation, createUser);
router.get('/', listValidation, listUsers);
router.get('/:id', idValidation, getUser);
router.patch('/:id', updateValidation, updateUser);
router.patch('/:id/status', statusValidation, setUserStatus);

module.exports = router;
