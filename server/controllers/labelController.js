const { validationResult } = require('express-validator');
const labelService = require('../services/labelService');
const projectService = require('../services/projectService');
const taskService = require('../services/taskService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

const isManagerOrAdmin = (role) => role === 'admin' || role === 'project_manager';
const canManageProject = (req, project) =>
    req.user.role === 'admin' || project.created_by === req.user.userId;

// ---- Label definitions (scoped to a project) ----

const createLabel = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { projectId } = req.params;
    const { name, color } = req.body;

    try {
        const project = await projectService.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (!canManageProject(req, project)) {
            return res.status(403).json({ error: 'Only the project creator or an admin can manage labels' });
        }

        if (await labelService.nameExistsInProject(projectId, name)) {
            return res.status(409).json({ error: 'A label with this name already exists in the project' });
        }

        const label = await labelService.createLabel({
            projectId,
            createdBy: req.user.userId,
            name,
            color,
        });
        res.status(201).json({ label });
    } catch (err) {
        console.error('Create label failed:', err.message);
        res.status(500).json({ error: 'Failed to create label' });
    }
};

const listLabels = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { projectId } = req.params;

    try {
        const project = await projectService.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Viewing follows project access: managers/admins always, collaborators
        // only if they have a task in the project.
        if (!isManagerOrAdmin(req.user.role)) {
            const allowed = await projectService.collaboratorHasAccess(req.user.userId, projectId);
            if (!allowed) return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const labels = await labelService.listByProject(projectId);
        res.json({ labels });
    } catch (err) {
        console.error('List labels failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch labels' });
    }
};

// Loads a label and confirms the caller may manage its project. Sends the
// response and returns null when not permitted.
const loadManagedLabel = async (req, res) => {
    const label = await labelService.findById(req.params.id);
    if (!label) {
        res.status(404).json({ error: 'Label not found' });
        return null;
    }
    const project = await projectService.findById(label.project_id);
    if (!project || !canManageProject(req, project)) {
        res.status(403).json({ error: 'Only the project creator or an admin can manage this label' });
        return null;
    }
    return label;
};

const updateLabel = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const fields = {};
    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.color !== undefined) fields.color = req.body.color;

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: 'Provide at least one field to update (name or color)' });
    }

    try {
        const label = await loadManagedLabel(req, res);
        if (!label) return;

        if (fields.name && fields.name !== label.name) {
            if (await labelService.nameExistsInProject(label.project_id, fields.name, label.id)) {
                return res.status(409).json({ error: 'A label with this name already exists in the project' });
            }
        }

        const updated = await labelService.updateLabel(label.id, fields);
        res.json({ label: updated });
    } catch (err) {
        console.error('Update label failed:', err.message);
        res.status(500).json({ error: 'Failed to update label' });
    }
};

const deleteLabel = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const label = await loadManagedLabel(req, res);
        if (!label) return;

        await labelService.deleteLabel(label.id);
        res.json({ message: 'Label deleted successfully' });
    } catch (err) {
        console.error('Delete label failed:', err.message);
        res.status(500).json({ error: 'Failed to delete label' });
    }
};

// ---- Tagging tasks ----

// Loads a task and confirms the caller may manage its project (creator/admin).
const loadManagedTask = async (req, res) => {
    const task = await taskService.findById(req.params.taskId);
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return null;
    }
    const project = await projectService.findById(task.project_id);
    if (!project || !canManageProject(req, project)) {
        res.status(403).json({ error: 'Only the project creator or an admin can tag this task' });
        return null;
    }
    return task;
};

const addLabelToTask = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { labelId } = req.body;

    try {
        const task = await loadManagedTask(req, res);
        if (!task) return;

        const label = await labelService.findById(labelId);
        if (!label) return res.status(404).json({ error: 'Label not found' });

        // A task can only carry labels defined in its own project.
        if (label.project_id !== task.project_id) {
            return res.status(400).json({ error: 'Label belongs to a different project' });
        }

        if (await labelService.isLabelOnTask(task.id, labelId)) {
            return res.status(409).json({ error: 'Label is already applied to this task' });
        }

        await labelService.addLabelToTask(task.id, labelId);
        const labels = await labelService.getLabelsForTask(task.id);
        res.status(201).json({ labels });
    } catch (err) {
        console.error('Add label to task failed:', err.message);
        res.status(500).json({ error: 'Failed to apply label' });
    }
};

const removeLabelFromTask = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const task = await loadManagedTask(req, res);
        if (!task) return;

        await labelService.removeLabelFromTask(task.id, req.params.labelId);
        const labels = await labelService.getLabelsForTask(task.id);
        res.json({ labels });
    } catch (err) {
        console.error('Remove label from task failed:', err.message);
        res.status(500).json({ error: 'Failed to remove label' });
    }
};

module.exports = {
    createLabel,
    listLabels,
    updateLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
};
