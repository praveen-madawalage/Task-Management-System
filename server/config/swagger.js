const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'Task Management System API',
        version: '1.0.0',
        description:
            'REST API for the Task Management System.\n\n' +
            '**Authentication:** call `POST /api/auth/login`, copy the `accessToken` from the ' +
            'response, then click **Authorize** and paste it. All endpoints except login and ' +
            'refresh require a Bearer token.',
    },
    servers: [
        {
            url: process.env.API_URL || `http://localhost:${process.env.PORT || 8000}`,
            description: 'Current server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            cookieAuth: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
        },
        parameters: {
            IdPath: {
                in: 'path',
                name: 'id',
                required: true,
                schema: { type: 'string', format: 'uuid' },
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    details: { type: 'array', items: { type: 'object' } },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['admin', 'project_manager', 'collaborator'] },
                    is_active: { type: 'boolean' },
                    must_reset_password: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            Project: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    created_by: { type: 'string', format: 'uuid' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            Task: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    project_id: { type: 'string', format: 'uuid' },
                    created_by: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'completed'] },
                    due_date: { type: 'string', format: 'date-time', nullable: true },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                    assignees: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    labels: { type: 'array', items: { $ref: '#/components/schemas/Label' } },
                },
            },
            Label: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    project_id: { type: 'string', format: 'uuid' },
                    created_by: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    color: { type: 'string', example: '#E11D48' },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
            Notification: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    user_id: { type: 'string', format: 'uuid' },
                    task_id: { type: 'string', format: 'uuid', nullable: true },
                    type: {
                        type: 'string',
                        enum: ['task_assigned', 'status_changed', 'comment_added', 'deadline_approaching', 'admin_update'],
                    },
                    message: { type: 'string' },
                    is_read: { type: 'boolean' },
                    is_delivered: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
            Comment: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    task_id: { type: 'string', format: 'uuid' },
                    user_id: { type: 'string', format: 'uuid' },
                    content: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    author: { $ref: '#/components/schemas/User' },
                },
            },
            Attachment: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    task_id: { type: 'string', format: 'uuid' },
                    user_id: { type: 'string', format: 'uuid' },
                    file_name: { type: 'string' },
                    file_url: { type: 'string' },
                    file_size: { type: 'integer' },
                    created_at: { type: 'string', format: 'date-time' },
                    uploader: { $ref: '#/components/schemas/User' },
                },
            },
        },
        responses: {
            ValidationError: {
                description: 'Validation failed',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            Unauthorized: {
                description: 'Missing or invalid token',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            Forbidden: {
                description: 'Insufficient permissions',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            NotFound: {
                description: 'Resource not found',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
        },
    },
    // Applied to every operation unless overridden (login/refresh override this).
    security: [{ bearerAuth: [] }],
    tags: [
        { name: 'Auth', description: 'Authentication and session management' },
        { name: 'Users', description: 'User management (admin only)' },
        { name: 'Projects', description: 'Project CRUD' },
        { name: 'Tasks', description: 'Task CRUD, assignment, and status' },
        { name: 'Labels', description: 'Per-project labels and task tagging' },
        { name: 'Comments', description: 'Task comments' },
        { name: 'Attachments', description: 'Task file attachments (Supabase Storage)' },
    ],
};

const options = {
    definition,
    // Absolute glob so it resolves regardless of the process working directory.
    apis: [path.resolve(__dirname, '../routes/*.js')],
};

module.exports = swaggerJsdoc(options);
