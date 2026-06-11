const supabase = require('../utils/supabaseClient');

const TASK_FIELDS =
    'id, project_id, created_by, title, description, priority, status, due_date, created_at, updated_at';

const SORTABLE_COLUMNS = ['due_date', 'priority', 'created_at', 'status'];

const createTask = async ({ projectId, createdBy, title, description, priority, status, dueDate }) => {
    const insert = { project_id: projectId, created_by: createdBy, title };
    if (description !== undefined) insert.description = description;
    if (priority !== undefined) insert.priority = priority;
    if (status !== undefined) insert.status = status;
    if (dueDate !== undefined) insert.due_date = dueDate;

    const { data, error } = await supabase
        .from('tasks')
        .insert(insert)
        .select(TASK_FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_FIELDS)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

// Filtered + sorted task list. When `assigneeId` is set, results are limited to
// tasks assigned to that user (this is how collaborators are scoped to their
// own work).
const listTasks = async ({ projectId, status, priority, assigneeId, search, sortColumn, ascending }) => {
    if (assigneeId) {
        const { data: assignments, error: aErr } = await supabase
            .from('task_assignments')
            .select('task_id')
            .eq('user_id', assigneeId);
        if (aErr) throw aErr;

        const taskIds = (assignments || []).map((a) => a.task_id);
        if (taskIds.length === 0) return [];

        return runTaskQuery({ taskIds, projectId, status, priority, search, sortColumn, ascending });
    }

    return runTaskQuery({ projectId, status, priority, search, sortColumn, ascending });
};

const runTaskQuery = async ({ taskIds, projectId, status, priority, search, sortColumn, ascending }) => {
    let query = supabase.from('tasks').select(TASK_FIELDS);

    if (taskIds) query = query.in('id', taskIds);
    if (projectId) query = query.eq('project_id', projectId);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    if (search) {
        const safe = search.replace(/[,()%*\\]/g, '').trim();
        if (safe) query = query.ilike('title', `%${safe}%`);
    }

    const column = SORTABLE_COLUMNS.includes(sortColumn) ? sortColumn : 'created_at';
    query = query.order(column, { ascending: ascending !== false, nullsFirst: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

const updateTask = async (id, fields) => {
    const { data, error } = await supabase
        .from('tasks')
        .update({ ...fields, updated_at: new Date() })
        .eq('id', id)
        .select(TASK_FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
};

// ---- Assignees ----

const getAssignees = async (taskId) => {
    const { data, error } = await supabase
        .from('task_assignments')
        .select('assigned_at, users ( id, name, email, role, is_active )')
        .eq('task_id', taskId);

    if (error) throw error;
    return (data || []).map((row) => ({ ...row.users, assigned_at: row.assigned_at }));
};

const isAssignee = async (taskId, userId) => {
    const { data, error } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

const addAssignee = async (taskId, userId) => {
    const { error } = await supabase
        .from('task_assignments')
        .insert({ task_id: taskId, user_id: userId });

    if (error) throw error;
};

const removeAssignee = async (taskId, userId) => {
    const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

    if (error) throw error;
};

// View access mirrors getTask: managers/admins see any task; collaborators only
// tasks assigned to them. `user` is the decoded JWT payload (userId, role).
const canUserViewTask = async (user, task) => {
    if (user.role === 'admin' || user.role === 'project_manager') return true;
    return isAssignee(task.id, user.userId);
};

module.exports = {
    createTask,
    findById,
    listTasks,
    updateTask,
    deleteTask,
    getAssignees,
    isAssignee,
    addAssignee,
    removeAssignee,
    canUserViewTask,
};
