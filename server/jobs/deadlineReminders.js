const cron = require('node-cron');
const supabase = require('../utils/supabaseClient');
const notificationService = require('../services/notificationService');

// How far ahead of the due date to warn assignees.
const REMINDER_WINDOW_HOURS = 24;

const runDeadlineCheck = async () => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

    // Tasks due within the window and not yet completed.
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, due_date, status')
        .neq('status', 'completed')
        .not('due_date', 'is', null)
        .gte('due_date', now.toISOString())
        .lte('due_date', windowEnd.toISOString());

    if (error) {
        console.error('Deadline check query failed:', error.message);
        return;
    }
    if (!tasks || tasks.length === 0) return;

    for (const task of tasks) {
        const { data: assignments } = await supabase
            .from('task_assignments')
            .select('user_id')
            .eq('task_id', task.id);

        for (const { user_id } of assignments || []) {
            // Don't send a second reminder for the same task to the same user.
            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user_id)
                .eq('task_id', task.id)
                .eq('type', 'deadline_approaching')
                .limit(1);

            if (existing && existing.length > 0) continue;

            await notificationService.notify(
                user_id,
                'deadline_approaching',
                `Task "${task.title}" is due soon`,
                task.id
            );
        }
    }
};

const scheduleDeadlineReminders = () => {
    // Every hour, on the hour.
    cron.schedule('0 * * * *', async () => {
        try {
            await runDeadlineCheck();
        } catch (err) {
            console.error('[cron] Deadline reminder run failed:', err.message);
        }
    });
};

module.exports = { scheduleDeadlineReminders, runDeadlineCheck };
