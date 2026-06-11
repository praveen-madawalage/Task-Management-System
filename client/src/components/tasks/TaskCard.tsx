import { Avatar, AvatarGroup, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { Task } from '../../types';
import { PRIORITY_COLOR, PRIORITY_LABELS } from '../../constants';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue =
    task.due_date != null && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card variant="outlined" onClick={onClick} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {task.title}
        </Typography>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip size="small" label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLOR[task.priority]} />
          {(task.labels ?? []).map((l) => (
            <Chip key={l.id} size="small" label={l.name} sx={{ bgcolor: l.color, color: '#fff' }} />
          ))}
        </Stack>

        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color={overdue ? 'error' : 'text.secondary'}>
            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
          </Typography>
          <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
            {(task.assignees ?? []).map((a) => (
              <Avatar key={a.id}>{a.name.charAt(0).toUpperCase()}</Avatar>
            ))}
          </AvatarGroup>
        </Stack>
      </CardContent>
    </Card>
  );
}
