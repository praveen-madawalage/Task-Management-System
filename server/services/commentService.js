const supabase = require('../utils/supabaseClient');

const COMMENT_FIELDS = 'id, task_id, user_id, content, created_at';
// Embed the author (comments.user_id -> users) under the alias `author`.
const COMMENT_WITH_AUTHOR = `${COMMENT_FIELDS}, author:users ( id, name, email, role )`;

const createComment = async (taskId, userId, content) => {
    const { data, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, user_id: userId, content })
        .select(COMMENT_WITH_AUTHOR)
        .single();

    if (error) throw error;
    return data;
};

const listByTask = async (taskId) => {
    const { data, error } = await supabase
        .from('comments')
        .select(COMMENT_WITH_AUTHOR)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('comments')
        .select(COMMENT_FIELDS)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

const deleteComment = async (id) => {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
};

module.exports = { createComment, listByTask, findById, deleteComment };
