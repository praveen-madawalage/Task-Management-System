import { Avatar, AvatarGroup, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { Task } from '../../types';
import { PRIORITY_COLOR, PRIORITY_LABELS } from '../../constants';
import AddLabelPopover from './AddLabelPopover';

interface TaskCardProps {
  task: Task;
  canManageLabels: boolean;
  onAddLabel: (taskId: string, name: string, color: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
  onClick: () => void;
}

export default function TaskCard({ task, canManageLabels, onAddLabel, onRemoveLabel, onClick }: TaskCardProps) {
  const overdue =
    task.due_date != null && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card variant="outlined" onClick={onClick} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Top row: quick add-label control (left) + label "bookmarks" (right). */}
        <Stack
          direction="row"
          onClick={(e) => e.stopPropagation()}
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 28, mb: 0.5 }}
        >
          {canManageLabels ? (
            <AddLabelPopover onAdd={(name, color) => onAddLabel(task.id, name, color)} />
          ) : (
            <Box />
          )}
          <Stack
            direction="row"
            sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end', maxWidth: '75%' }}
          >
            {(task.labels ?? []).map((l) => (
              <Chip
                key={l.id}
                size="small"
                label={l.name}
                onDelete={canManageLabels ? () => onRemoveLabel(task.id, l.id) : undefined}
                sx={{
                  height: 20,
                  bgcolor: l.color,
                  color: '#fff',
                  '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#fff' } },
                }}
              />
            ))}
          </Stack>
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {task.title}
        </Typography>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip size="small" label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLOR[task.priority]} />
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
