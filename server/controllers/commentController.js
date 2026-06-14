const { validationResult } = require('express-validator');
const commentService = require('../services/commentService');
const taskService = require('../services/taskService');
const projectService = require('../services/projectService');
const notificationService = require('../services/notificationService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

// Notify the task's assignees and project creator (except the author) about a
// new comment. Never breaks the request.
const notifyComment = async (task, actorId) => {
    try {
        const recipients = new Set();
        const assignees = await taskService.getAssignees(task.id);
        assignees.forEach((a) => recipients.add(a.id));

        const project = await projectService.findById(task.project_id);
        if (project) recipients.add(project.created_by);
        recipients.delete(actorId);

        for (const userId of recipients) {
            await notificationService.notify(
                userId,
                'comment_added',
                `New comment on task "${task.title}"`,
                task.id
            );
        }
    } catch (err) {
        console.error('Comment notification failed:', err.message);
    }
};

const addComment = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await taskService.findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (!(await taskService.canUserContributeToTask(req.user, task))) {
            return res.status(403).json({ error: 'You can only comment on tasks assigned to you' });
        }

        const comment = await commentService.createComment(task.id, req.user.userId, req.body.content);
        await notifyComment(task, req.user.userId);
        res.status(201).json({ comment });
    } catch (err) {
        console.error('Add comment failed:', err.message);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

const listComments = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await taskService.findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (!(await taskService.canUserViewTask(req.user, task))) {
            return res.status(403).json({ error: 'You do not have access to this task' });
        }

        const comments = await commentService.listByTask(task.id);
        res.json({ comments });
    } catch (err) {
        console.error('List comments failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

const deleteComment = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const comment = await commentService.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const task = await taskService.findById(comment.task_id);
        const project = task ? await projectService.findById(task.project_id) : null;

        const isAuthor = comment.user_id === req.user.userId;
        const isProjectOwner = project && project.created_by === req.user.userId;
        if (req.user.role !== 'admin' && !isAuthor && !isProjectOwner) {
            return res.status(403).json({ error: 'You cannot delete this comment' });
        }

        await commentService.deleteComment(comment.id);
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('Delete comment failed:', err.message);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

module.exports = { addComment, listComments, deleteComment };
