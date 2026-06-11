const { validationResult } = require('express-validator');
const taskService = require('../services/taskService');
const projectService = require('../services/projectService');
const userService = require('../services/userService');
const labelService = require('../services/labelService');
const notificationService = require('../services/notificationService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

const isManagerOrAdmin = (role) => role === 'admin' || role === 'project_manager';

// True if the caller may manage (mutate) tasks in the given project: admins
// always, or the project manager who created it.
const canManageProject = (req, project) =>
    req.user.role === 'admin' || project.created_by === req.user.userId;

// Validates that every id refers to an existing, active user. Returns an array
// of the ids that are invalid (empty array = all good).
const findInvalidAssignees = async (userIds) => {
    const invalid = [];
    for (const id of userIds) {
        const user = await userService.findById(id);
        if (!user || !user.is_active) invalid.push(id);
    }
    return invalid;
};

// Notify newly assigned users (never the person performing the action).
// Notification failures must never break the underlying request.
const notifyAssigned = async (task, userIds, actorId) => {
    try {
        for (const userId of userIds) {
            if (userId === actorId) continue;
            await notificationService.notify(
                userId,
                'task_assigned',
                `You were assigned to task "${task.title}"`,
                task.id
            );
        }
    } catch (err) {
        console.error('Assignment notification failed:', err.message);
    }
};

// Notify a task's assignees and the owning project's creator (except the actor)
// when its status changes.
const notifyStatusChange = async (task, actorId) => {
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
                'status_changed',
                `Task "${task.title}" is now ${task.status}`,
                task.id
            );
        }
    } catch (err) {
        console.error('Status-change notification failed:', err.message);
    }
};

const createTask = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { projectId, title, description, priority, status, dueDate, assigneeIds } = req.body;

    try {
        const project = await projectService.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (!canManageProject(req, project)) {
            return res.status(403).json({ error: 'Only the project creator or an admin can add tasks to this project' });
        }

        if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
            const invalid = await findInvalidAssignees(assigneeIds);
            if (invalid.length > 0) {
                return res.status(400).json({ error: 'Some assignees do not exist or are inactive', invalid });
            }
        }

        const task = await taskService.createTask({
            projectId,
            createdBy: req.user.userId,
            title,
            description,
            priority,
            status,
            dueDate,
        });

        if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
            for (const userId of assigneeIds) {
                await taskService.addAssignee(task.id, userId);
            }
            await notifyAssigned(task, assigneeIds, req.user.userId);
        }

        const assignees = await taskService.getAssignees(task.id);
        res.status(201).json({ task: { ...task, assignees } });
    } catch (err) {
        console.error('Create task failed:', err.message);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

const listTasks = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const sortByMap = { dueDate: 'due_date', priority: 'priority', createdAt: 'created_at', status: 'status' };
    const sortColumn = sortByMap[req.query.sortBy] || 'created_at';
    const ascending = req.query.order !== 'desc';

    // Collaborators are forced to their own assigned tasks. Managers/admins may
    // optionally filter by assignee ('me' or a specific user id).
    let assigneeId;
    if (!isManagerOrAdmin(req.user.role)) {
        assigneeId = req.user.userId;
    } else if (req.query.assignedTo === 'me') {
        assigneeId = req.user.userId;
    } else if (req.query.assignedTo) {
        assigneeId = req.query.assignedTo;
    }

    try {
        const tasks = await taskService.listTasks({
            projectId: req.query.projectId,
            status: req.query.status,
            priority: req.query.priority,
            assigneeId,
            search: req.query.search,
            sortColumn,
            ascending,
        });
        res.json({ tasks });
    } catch (err) {
        console.error('List tasks failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

const getTask = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await taskService.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Collaborators may only view tasks assigned to them.
        if (!isManagerOrAdmin(req.user.role)) {
            const assigned = await taskService.isAssignee(task.id, req.user.userId);
            if (!assigned) return res.status(403).json({ error: 'You do not have access to this task' });
        }

        const assignees = await taskService.getAssignees(task.id);
        const labels = await labelService.getLabelsForTask(task.id);
        res.json({ task: { ...task, assignees, labels } });
    } catch (err) {
        console.error('Get task failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
};

// Loads a task and confirms the caller may manage it (project creator or admin).
// Sends the response and returns null when not permitted.
const loadManagedTask = async (req, res) => {
    const task = await taskService.findById(req.params.id);
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return null;
    }
    const project = await projectService.findById(task.project_id);
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return null;
    }
    if (!canManageProject(req, project)) {
        res.status(403).json({ error: 'Only the project creator or an admin can modify this task' });
        return null;
    }
    return task;
};

const updateTask = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const fields = {};
    for (const key of ['title', 'description', 'priority', 'status']) {
        if (req.body[key] !== undefined) fields[key] = req.body[key];
    }
    if (req.body.dueDate !== undefined) fields.due_date = req.body.dueDate;

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: 'Provide at least one field to update' });
    }

    try {
        const task = await loadManagedTask(req, res);
        if (!task) return;

        const updated = await taskService.updateTask(req.params.id, fields);
        if (fields.status !== undefined) {
            await notifyStatusChange(updated, req.user.userId);
        }
        const assignees = await taskService.getAssignees(req.params.id);
        res.json({ task: { ...updated, assignees } });
    } catch (err) {
        console.error('Update task failed:', err.message);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Status-only update: allowed to managers/admins AND to assigned collaborators.
const updateStatus = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await taskService.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        let allowed = false;
        if (req.user.role === 'admin') {
            allowed = true;
        } else {
            const project = await projectService.findById(task.project_id);
            if (project && project.created_by === req.user.userId) {
                allowed = true;
            } else {
                allowed = await taskService.isAssignee(task.id, req.user.userId);
            }
        }

        if (!allowed) {
            return res.status(403).json({ error: 'You cannot update the status of this task' });
        }

        const updated = await taskService.updateTask(req.params.id, { status: req.body.status });
        await notifyStatusChange(updated, req.user.userId);
        res.json({ task: updated });
    } catch (err) {
        console.error('Update task status failed:', err.message);
        res.status(500).json({ error: 'Failed to update task status' });
    }
};

const deleteTask = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await loadManagedTask(req, res);
        if (!task) return;

        await taskService.deleteTask(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Delete task failed:', err.message);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

const addAssignee = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { userId } = req.body;

    try {
        const task = await loadManagedTask(req, res);
        if (!task) return;

        const user = await userService.findById(userId);
        if (!user || !user.is_active) {
            return res.status(400).json({ error: 'User does not exist or is inactive' });
        }

        if (await taskService.isAssignee(task.id, userId)) {
            return res.status(409).json({ error: 'User is already assigned to this task' });
        }

        await taskService.addAssignee(task.id, userId);
        await notifyAssigned(task, [userId], req.user.userId);
        const assignees = await taskService.getAssignees(task.id);
        res.status(201).json({ assignees });
    } catch (err) {
        console.error('Add assignee failed:', err.message);
        res.status(500).json({ error: 'Failed to assign user' });
    }
};

const removeAssignee = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await loadManagedTask(req, res);
        if (!task) return;

        await taskService.removeAssignee(task.id, req.params.userId);
        const assignees = await taskService.getAssignees(task.id);
        res.json({ assignees });
    } catch (err) {
        console.error('Remove assignee failed:', err.message);
        res.status(500).json({ error: 'Failed to unassign user' });
    }
};

module.exports = {
    createTask,
    listTasks,
    getTask,
    updateTask,
    updateStatus,
    deleteTask,
    addAssignee,
    removeAssignee,
};
