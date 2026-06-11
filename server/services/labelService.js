const supabase = require('../utils/supabaseClient');

// Note: the labels table has no updated_at column, so updates never set one.
const LABEL_FIELDS = 'id, project_id, created_by, name, color, created_at';

const createLabel = async ({ projectId, createdBy, name, color }) => {
    const { data, error } = await supabase
        .from('labels')
        .insert({ project_id: projectId, created_by: createdBy, name, color })
        .select(LABEL_FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('labels')
        .select(LABEL_FIELDS)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

const listByProject = async (projectId) => {
    const { data, error } = await supabase
        .from('labels')
        .select(LABEL_FIELDS)
        .eq('project_id', projectId)
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
};

// Used for a friendly duplicate message before relying on the DB's
// UNIQUE(project_id, name) constraint.
const nameExistsInProject = async (projectId, name, excludeId) => {
    let query = supabase
        .from('labels')
        .select('id')
        .eq('project_id', projectId)
        .eq('name', name);
    if (excludeId) query = query.neq('id', excludeId);

    const { data } = await query.maybeSingle();
    return !!data;
};

const updateLabel = async (id, fields) => {
    const { data, error } = await supabase
        .from('labels')
        .update(fields)
        .eq('id', id)
        .select(LABEL_FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const deleteLabel = async (id) => {
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (error) throw error;
};

// ---- task_labels (tagging) ----

const getLabelsForTask = async (taskId) => {
    const { data, error } = await supabase
        .from('task_labels')
        .select(`labels ( ${LABEL_FIELDS} )`)
        .eq('task_id', taskId);

    if (error) throw error;
    return (data || []).map((row) => row.labels);
};

const isLabelOnTask = async (taskId, labelId) => {
    const { data, error } = await supabase
        .from('task_labels')
        .select('task_id')
        .eq('task_id', taskId)
        .eq('label_id', labelId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

const addLabelToTask = async (taskId, labelId) => {
    const { error } = await supabase
        .from('task_labels')
        .insert({ task_id: taskId, label_id: labelId });

    if (error) throw error;
};

const removeLabelFromTask = async (taskId, labelId) => {
    const { error } = await supabase
        .from('task_labels')
        .delete()
        .eq('task_id', taskId)
        .eq('label_id', labelId);

    if (error) throw error;
};

module.exports = {
    createLabel,
    findById,
    listByProject,
    nameExistsInProject,
    updateLabel,
    deleteLabel,
    getLabelsForTask,
    isLabelOnTask,
    addLabelToTask,
    removeLabelFromTask,
};
