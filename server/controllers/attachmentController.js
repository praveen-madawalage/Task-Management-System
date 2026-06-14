const { validationResult } = require('express-validator');
const attachmentService = require('../services/attachmentService');
const taskService = require('../services/taskService');
const projectService = require('../services/projectService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

const addAttachment = async (req, res) => {
    if (failOnValidation(req, res)) return;

    if (!req.file) {
        return res.status(400).json({ error: 'A file is required (multipart field "file")' });
    }

    try {
        const task = await taskService.findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (!(await taskService.canUserContributeToTask(req.user, task))) {
            return res.status(403).json({ error: 'You can only upload to tasks assigned to you' });
        }

        const attachment = await attachmentService.uploadAttachment(task.id, req.user.userId, req.file);
        res.status(201).json({ attachment });
    } catch (err) {
        console.error('Add attachment failed:', err.message);
        res.status(500).json({ error: 'Failed to upload attachment' });
    }
};

const listAttachments = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await taskService.findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (!(await taskService.canUserViewTask(req.user, task))) {
            return res.status(403).json({ error: 'You do not have access to this task' });
        }

        const attachments = await attachmentService.listByTask(task.id);
        res.json({ attachments });
    } catch (err) {
        console.error('List attachments failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
};

const deleteAttachment = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const attachment = await attachmentService.findById(req.params.id);
        if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

        const task = await taskService.findById(attachment.task_id);
        const project = task ? await projectService.findById(task.project_id) : null;

        const isUploader = attachment.user_id === req.user.userId;
        const isProjectOwner = project && project.created_by === req.user.userId;
        if (req.user.role !== 'admin' && !isUploader && !isProjectOwner) {
            return res.status(403).json({ error: 'You cannot delete this attachment' });
        }

        await attachmentService.deleteAttachment(attachment);
        res.json({ message: 'Attachment deleted successfully' });
    } catch (err) {
        console.error('Delete attachment failed:', err.message);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
};

module.exports = { addAttachment, listAttachments, deleteAttachment };
