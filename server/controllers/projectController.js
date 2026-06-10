const { validationResult } = require('express-validator');
const projectService = require('../services/projectService');

const failOnValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return true;
    }
    return false;
};

const isManagerOrAdmin = (role) => role === 'admin' || role === 'project_manager';

const createProject = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const { title, description } = req.body;

    try {
        const project = await projectService.createProject({
            title,
            description,
            createdBy: req.user.userId,
        });
        res.status(201).json({ project });
    } catch (err) {
        console.error('Create project failed:', err.message);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

const listProjects = async (req, res) => {
    try {
        const projects = isManagerOrAdmin(req.user.role)
            ? await projectService.listAll()
            : await projectService.listForCollaborator(req.user.userId);
        res.json({ projects });
    } catch (err) {
        console.error('List projects failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

const getProject = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const project = await projectService.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!isManagerOrAdmin(req.user.role)) {
            const allowed = await projectService.collaboratorHasAccess(req.user.userId, project.id);
            if (!allowed) {
                return res.status(403).json({ error: 'You do not have access to this project' });
            }
        }

        res.json({ project });
    } catch (err) {
        console.error('Get project failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

// Shared owner-or-admin guard for update/delete. Returns the project if the
// caller is allowed to mutate it, otherwise sends the appropriate response and
// returns null.
const loadMutableProject = async (req, res) => {
    const project = await projectService.findById(req.params.id);
    if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return null;
    }
    const isOwner = project.created_by === req.user.userId;
    if (req.user.role !== 'admin' && !isOwner) {
        res.status(403).json({ error: 'Only the project creator or an admin can modify this project' });
        return null;
    }
    return project;
};

const updateProject = async (req, res) => {
    if (failOnValidation(req, res)) return;

    const fields = {};
    if (req.body.title !== undefined) fields.title = req.body.title;
    if (req.body.description !== undefined) fields.description = req.body.description;

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: 'Provide at least one field to update (title or description)' });
    }

    try {
        const project = await loadMutableProject(req, res);
        if (!project) return;

        const updated = await projectService.updateProject(req.params.id, fields);
        res.json({ project: updated });
    } catch (err) {
        console.error('Update project failed:', err.message);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

const deleteProject = async (req, res) => {
    if (failOnValidation(req, res)) return;

    try {
        const project = await loadMutableProject(req, res);
        if (!project) return;

        await projectService.deleteProject(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Delete project failed:', err.message);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };
