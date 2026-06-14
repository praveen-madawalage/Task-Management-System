import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMyTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useNotifications } from '../hooks/useNotifications';
import * as tasksApi from '../api/tasks';
import * as usersApi from '../api/users';
import { COLORS } from '../theme';
import type { Task, TaskStatus } from '../types';

const MONO = COLORS.mono;

const priColor = (p: Task['priority']) =>
  p === 'high' ? COLORS.rose : p === 'medium' ? COLORS.amber : COLORS.emerald;

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'To Do', color: COLORS.text2, bg: 'rgba(255,255,255,0.06)' },
  in_progress: { label: 'In Progress', color: COLORS.sky, bg: 'rgba(56,189,248,0.13)' },
  completed: { label: 'Completed', color: COLORS.emerald, bg: 'rgba(52,211,153,0.13)' },
};

const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

const dueInfo = (iso: string) => {
  const d = daysUntil(iso);
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, color: COLORS.rose };
  if (d === 0) return { label: 'Today', color: COLORS.amber };
  if (d === 1) return { label: 'Tomorrow', color: COLORS.amber };
  if (d <= 7) return { label: `${d}d left`, color: COLORS.text2 };
  return { label: new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), color: COLORS.text3 };
};

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const NOTIF_COLOR: Record<string, string> = {
  task_assigned: COLORS.accent,
  status_changed: COLORS.sky,
  comment_added: COLORS.amber,
  deadline_approaching: COLORS.rose,
  admin_update: COLORS.emerald,
};

interface Stat {
  label: string;
  value: number;
  sub: string;
  dot: string;
}

const Card = ({ children, sx }: { children: React.ReactNode; sx?: object }) => (
  <Paper sx={{ borderRadius: '16px', ...sx }}>{children}</Paper>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isPM = user?.role === 'project_manager';

  const { data: myTasks } = useMyTasks();
  const { data: projects } = useProjects();
  const { data: notifData } = useNotifications();

  // Admin-only system-wide counts.
  const allTasksQ = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => tasksApi.listTasks({}),
    enabled: isAdmin,
  });
  const usersQ = useQuery({
    queryKey: ['users', 'dashboard-count'],
    queryFn: () => usersApi.listUsers({}),
    enabled: isAdmin,
  });

  const tasks = myTasks ?? [];
  const projectName = useMemo(() => {
    const m = new Map<string, string>();
    (projects ?? []).forEach((p) => m.set(p.id, p.title));
    return m;
  }, [projects]);

  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const dueSoon = tasks.filter(
    (t) => t.due_date != null && t.status !== 'completed' && daysUntil(t.due_date) <= 7,
  ).length;

  const stats: Stat[] = useMemo(() => {
    if (isAdmin) {
      const all = allTasksQ.data ?? [];
      return [
        { label: 'Users', value: (usersQ.data ?? []).length, sub: 'Total accounts', dot: COLORS.sky },
        { label: 'Projects', value: (projects ?? []).length, sub: 'Across the system', dot: COLORS.accent },
        { label: 'Tasks', value: all.length, sub: 'All tasks', dot: COLORS.amber },
        { label: 'In Progress', value: all.filter((t) => t.status === 'in_progress').length, sub: 'Currently active', dot: COLORS.emerald },
      ];
    }
    if (isPM) {
      const mine = (projects ?? []).filter((p) => p.created_by === user?.id).length;
      return [
        { label: 'My Projects', value: mine, sub: 'Created by you', dot: COLORS.accent },
        { label: 'In Progress', value: inProgress, sub: 'Assigned to you', dot: COLORS.sky },
        { label: 'Completed', value: completed, sub: 'Assigned to you', dot: COLORS.emerald },
        { label: 'Due Soon', value: dueSoon, sub: 'Next 7 days', dot: COLORS.amber },
      ];
    }
    return [
      { label: 'Assigned', value: tasks.length, sub: 'Total tasks', dot: COLORS.accent },
      { label: 'In Progress', value: inProgress, sub: 'Currently active', dot: COLORS.sky },
      { label: 'Completed', value: completed, sub: 'Done', dot: COLORS.emerald },
      { label: 'Due Soon', value: dueSoon, sub: 'Next 7 days', dot: COLORS.amber },
    ];
  }, [isAdmin, isPM, allTasksQ.data, usersQ.data, projects, user?.id, tasks.length, inProgress, completed, dueSoon]);

  const dashTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
        .slice(0, 5),
    [tasks],
  );
  const deadlines = useMemo(
    () =>
      tasks
        .filter((t) => t.due_date != null && t.status !== 'completed')
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
        .slice(0, 4),
    [tasks],
  );
  const activity = (notifData?.notifications ?? []).slice(0, 6);

  // Gradient spotlight banner content (role-specific).
  const myProjectCount = (projects ?? []).filter((p) => p.created_by === user?.id).length;
  let ctaLabel = 'View my tasks';
  let ctaTo = '/tasks';
  let bannerSummary = `${tasks.length} tasks assigned · ${dueSoon} due this week.`;
  if (isAdmin) {
    ctaLabel = 'Manage users';
    ctaTo = '/users';
    bannerSummary = 'An overview of your whole workspace at a glance.';
  } else if (isPM) {
    ctaLabel = 'Go to projects';
    ctaTo = '/projects';
    bannerSummary = `${myProjectCount} projects you manage · ${inProgress} tasks in progress.`;
  }

  return (
    <Box>
      {/* Gradient spotlight banner — the signature Framer atmosphere card */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          p: { xs: 3, md: 4 },
          mb: 3,
          color: '#fff',
          background: `linear-gradient(135deg, ${COLORS.gradientViolet}, ${COLORS.gradientMagenta})`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.35), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative' }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Welcome back, {user?.name}
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 540, opacity: 0.92 }}>{bannerSummary}</Typography>
          <Button variant="contained" onClick={() => navigate(ctaTo)} sx={{ mt: 2.5 }}>
            {ctaLabel}
          </Button>
        </Box>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {stats.map((s) => (
          <Card
            key={s.label}
            sx={{
              p: 2.5,
              transition: 'transform .2s ease, border-color .2s ease',
              '&:hover': { transform: 'translateY(-3px)', borderColor: COLORS.border2 },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: COLORS.text3 }}>
                {s.label}
              </Typography>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.dot, boxShadow: `0 0 12px ${s.dot}` }} />
            </Box>
            <Typography sx={{ fontSize: 32, fontWeight: 600, letterSpacing: '-.03em', mt: 1.75, lineHeight: 1 }}>
              {s.value}
            </Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.text3, mt: 1 }}>{s.sub}</Typography>
          </Card>
        ))}
      </Box>

      {/* Main grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
        {/* My tasks */}
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '18px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>My tasks</Typography>
            <Button onClick={() => navigate('/tasks')} sx={{ fontFamily: MONO, fontSize: 11, color: COLORS.accentText, minWidth: 0, p: 0, letterSpacing: '.03em' }}>
              VIEW ALL →
            </Button>
          </Box>
          {dashTasks.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: COLORS.text3, fontSize: 13 }}>You're all caught up.</Box>
          ) : (
            dashTasks.map((t) => {
              const st = STATUS_META[t.status];
              const due = t.due_date ? dueInfo(t.due_date) : null;
              return (
                <Box
                  key={t.id}
                  onClick={() => navigate(`/projects/${t.project_id}`)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.75, p: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer', transition: 'background .15s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: priColor(t.priority), flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: COLORS.text3, mt: 0.4 }}>
                      {projectName.get(t.project_id) ?? 'Project'}
                    </Typography>
                  </Box>
                  <Box sx={{ fontSize: 11, fontWeight: 500, color: st.color, bgcolor: st.bg, borderRadius: '6px', px: 1, py: 0.4, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </Box>
                  {due && (
                    <Typography sx={{ fontSize: 11.5, color: due.color, minWidth: 64, textAlign: 'right' }}>{due.label}</Typography>
                  )}
                </Box>
              );
            })
          )}
        </Card>

        {/* Right column */}
        <Stack spacing={2.5}>
          {/* Upcoming deadlines */}
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: '18px 20px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 14.5, fontWeight: 600 }}>
              Upcoming deadlines
            </Box>
            {deadlines.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: COLORS.text3, fontSize: 13 }}>Nothing due soon.</Box>
            ) : (
              deadlines.map((t) => {
                const d = new Date(t.due_date as string);
                const info = dueInfo(t.due_date as string);
                return (
                  <Box
                    key={t.id}
                    onClick={() => navigate(`/projects/${t.project_id}`)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '13px 20px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer', transition: 'background .15s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                  >
                    <Box sx={{ width: 44, flexShrink: 0, textAlign: 'center', borderRadius: '10px', bgcolor: COLORS.surface2, border: `1px solid ${COLORS.border}`, py: 0.75 }}>
                      <Box sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}>{d.getDate()}</Box>
                      <Box sx={{ fontFamily: MONO, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.08em', mt: 0.3, opacity: 0.7 }}>
                        {d.toLocaleDateString(undefined, { month: 'short' })}
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: info.color, mt: 0.3 }}>{info.label}</Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Card>

          {/* Recent activity */}
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: '18px 20px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 14.5, fontWeight: 600 }}>
              Recent activity
            </Box>
            <Box sx={{ p: '6px 20px 14px' }}>
              {activity.length === 0 ? (
                <Typography sx={{ py: 2, color: COLORS.text3, fontSize: 13 }}>No recent activity.</Typography>
              ) : (
                activity.map((n) => (
                  <Box key={n.id} sx={{ display: 'flex', gap: 1.5, py: 1.375 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: COLORS.surface3, border: `1px solid ${COLORS.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: NOTIF_COLOR[n.type] ?? COLORS.text3 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, fontSize: 12.5, color: COLORS.text2, lineHeight: 1.45 }}>
                      {n.message}
                      <Box sx={{ fontFamily: MONO, fontSize: 10, color: COLORS.text4, mt: 0.4 }}>{timeAgo(n.created_at)}</Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
