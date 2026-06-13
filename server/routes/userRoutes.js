const express = require('express');
const { body, param, query } = require('express-validator');
const {
    createUser,
    listUsers,
    listAssignable,
    getUser,
    updateUser,
    setUserStatus,
} = require('../controllers/userController');
const { authenticate, requireRole, requirePasswordReset } = require('../middleware/authMiddleware');

const router = express.Router();

const ROLES = ['admin', 'project_manager', 'collaborator'];

/**
 * @openapi
 * /api/users/assignable:
 *   get:
 *     tags: [Users]
 *     summary: List active collaborators and project managers eligible as task assignees (excludes the caller)
 *     responses:
 *       200:
 *         description: Minimal active-user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       email: { type: string }
 *                       role: { type: string, enum: [collaborator, project_manager] }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Defined before the admin-only guard below so project managers can reach it.
router.get(
    '/assignable',
    authenticate,
    requirePasswordReset,
    requireRole('admin', 'project_manager'),
    listAssignable,
);

// Every other user-management route is admin-only and requires the admin to
// have completed any mandatory password reset first.
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

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user (sends an onboarding email with a temporary password)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [admin, project_manager, collaborator] }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *                 emailSent: { type: boolean }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: A user with this email already exists }
 *   get:
 *     tags: [Users]
 *     summary: List users (searchable / filterable)
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: role, schema: { type: string, enum: [admin, project_manager, collaborator] } }
 *       - { in: query, name: isActive, schema: { type: string, enum: ['true', 'false'] } }
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users: { type: array, items: { $ref: '#/components/schemas/User' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { user: { $ref: '#/components/schemas/User' } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Users]
 *     summary: Update a user's name and/or role
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string, enum: [admin, project_manager, collaborator] }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { user: { $ref: '#/components/schemas/User' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Activate or deactivate a user
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [isActive], properties: { isActive: { type: boolean } } }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { user: { $ref: '#/components/schemas/User' } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/', createValidation, createUser);
router.get('/', listValidation, listUsers);
router.get('/:id', idValidation, getUser);
router.patch('/:id', updateValidation, updateUser);
router.patch('/:id/status', statusValidation, setUserStatus);

module.exports = router;
