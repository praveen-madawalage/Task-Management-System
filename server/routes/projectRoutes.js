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
/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project (project manager or admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { project: { $ref: '#/components/schemas/Project' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   get:
 *     tags: [Projects]
 *     summary: List projects (admins/PMs see all; collaborators see projects with a task assigned to them)
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects: { type: array, items: { $ref: '#/components/schemas/Project' } }
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by id
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200:
 *         description: Project
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { project: { $ref: '#/components/schemas/Project' } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project (creator or admin)
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { project: { $ref: '#/components/schemas/Project' } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (creator or admin); cascades to tasks, labels, comments
 *     parameters: [ { $ref: '#/components/parameters/IdPath' } ]
 *     responses:
 *       200: { description: Project deleted }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/', requireRole('admin', 'project_manager'), createValidation, createProject);
router.get('/', listProjects);
router.get('/:id', idValidation, getProject);
router.patch('/:id', requireRole('admin', 'project_manager'), updateValidation, updateProject);
router.delete('/:id', requireRole('admin', 'project_manager'), idValidation, deleteProject);

module.exports = router;
