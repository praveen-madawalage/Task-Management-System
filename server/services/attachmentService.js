const crypto = require('crypto');
const supabase = require('../utils/supabaseClient');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'attachments';

const ATTACHMENT_FIELDS = 'id, task_id, user_id, file_name, file_url, file_size, created_at';
const ATTACHMENT_WITH_UPLOADER = `${ATTACHMENT_FIELDS}, uploader:users ( id, name, email )`;

// Uploads the file to Supabase Storage, then records its metadata. `file` is a
// multer in-memory file ({ buffer, originalname, mimetype, size }).
const uploadAttachment = async (taskId, userId, file) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `${taskId}/${crypto.randomUUID()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    const { data, error } = await supabase
        .from('attachments')
        .insert({
            task_id: taskId,
            user_id: userId,
            file_name: file.originalname,
            file_url: pub.publicUrl,
            file_size: file.size,
        })
        .select(ATTACHMENT_WITH_UPLOADER)
        .single();

    if (error) {
        // Roll back the uploaded object if the metadata insert fails.
        await supabase.storage.from(BUCKET).remove([objectPath]).catch(() => {});
        throw error;
    }
    return data;
};

const listByTask = async (taskId) => {
    const { data, error } = await supabase
        .from('attachments')
        .select(ATTACHMENT_WITH_UPLOADER)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

const findById = async (id) => {
    const { data, error } = await supabase
        .from('attachments')
        .select(ATTACHMENT_FIELDS)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
};

// Recovers the storage object path from a public URL so the file can be removed.
const storagePathFromUrl = (fileUrl) => {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = fileUrl.indexOf(marker);
    return idx === -1 ? null : fileUrl.slice(idx + marker.length);
};

const deleteAttachment = async (attachment) => {
    const path = storagePathFromUrl(attachment.file_url);
    if (path) {
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    }
    const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
    if (error) throw error;
};

module.exports = { uploadAttachment, listByTask, findById, deleteAttachment };
