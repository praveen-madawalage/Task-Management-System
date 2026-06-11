const supabase = require('../utils/supabaseClient');
const { getIO } = require('../sockets/io');

const NOTIFICATION_FIELDS = 'id, user_id, task_id, type, message, is_read, is_delivered, created_at';

const markDelivered = async (ids) => {
    if (!ids || ids.length === 0) return;
    await supabase.from('notifications').update({ is_delivered: true }).in('id', ids);
};

// Persist a notification, then push it live if the user is connected. If they
// are offline it stays with is_delivered=false for delivery on reconnect.
const notify = async (userId, type, message, taskId = null) => {
    const { data, error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, task_id: taskId, type, message })
        .select(NOTIFICATION_FIELDS)
        .single();

    if (error) {
        console.error('Failed to persist notification:', error.message);
        return null;
    }

    try {
        const io = getIO();
        const room = `user:${userId}`;
        const sockets = await io.in(room).fetchSockets();
        if (sockets.length > 0) {
            io.to(room).emit('notification', data);
            await markDelivered([data.id]);
        }
    } catch (err) {
        // Socket layer unavailable or user offline — leave it pending.
    }

    return data;
};

// On (re)connection, push every not-yet-delivered notification, then mark them
// delivered.
const deliverPending = async (userId) => {
    const { data, error } = await supabase
        .from('notifications')
        .select(NOTIFICATION_FIELDS)
        .eq('user_id', userId)
        .eq('is_delivered', false)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return;

    getIO().to(`user:${userId}`).emit('notifications:pending', data);
    await markDelivered(data.map((n) => n.id));
};

module.exports = { notify, deliverPending, markDelivered };
