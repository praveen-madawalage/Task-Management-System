const supabase = require('../utils/supabaseClient');

const PROJECT_FIELDS = 'id, title, description, created_by, created_at, updated_at';

// Includes the creator (projects.created_by -> users) so every client can show
// who made the project. There's a single FK to users, so the embed is unambiguous.
const PROJECT_SELECT = `${PROJECT_FIELDS}, creator:users ( id, name, email )`;

const createProject = async ({ title, description, createdBy }) => {
    const { data, error } = await supabase
        .from('projects')
        .insert({ title, description, created_by: createdBy })
        .select(PROJECT_SELECT)
        .single();

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

// Admins and project managers see every project.
const listAll = async () => {
    const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Collaborators only see projects that contain a task assigned to them.
const listForCollaborator = async (userId) => {
    const { data: assignments, error: aErr } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('user_id', userId);
    if (aErr) throw aErr;

    const taskIds = (assignments || []).map((a) => a.task_id);
    if (taskIds.length === 0) return [];

    const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('project_id')
        .in('id', taskIds);
    if (tErr) throw tErr;

    const projectIds = [...new Set((tasks || []).map((t) => t.project_id))];
    if (projectIds.length === 0) return [];

    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .in('id', projectIds)
        .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    return projects;
};

// Whether a collaborator has any assigned task within the given project.
const collaboratorHasAccess = async (userId, projectId) => {
    const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);
    if (tErr) throw tErr;

    const taskIds = (tasks || []).map((t) => t.id);
    if (taskIds.length === 0) return false;

    const { data, error } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('user_id', userId)
        .in('task_id', taskIds)
        .limit(1);
    if (error) throw error;

    return (data || []).length > 0;
};

const updateProject = async (id, fields) => {
    const { data, error } = await supabase
        .from('projects')
        .update({ ...fields, updated_at: new Date() })
        .eq('id', id)
        .select(PROJECT_SELECT)
        .single();

    if (error) throw error;
    return data;
};

const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
};

module.exports = {
    createProject,
    findById,
    listAll,
    listForCollaborator,
    collaboratorHasAccess,
    updateProject,
    deleteProject,
};
