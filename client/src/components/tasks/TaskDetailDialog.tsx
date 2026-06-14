import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { Task } from '../../types';
import { PRIORITY_COLOR, PRIORITY_LABELS, STATUS_LABELS } from '../../constants';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';

interface TaskDetailDialogProps {
  open: boolean;
  task: Task | null;
  canManage: boolean;
  currentUserId?: string;
  onEdit: (task: Task) => void;
  onClose: () => void;
}

export default function TaskDetailDialog({
  open,
  task,
  canManage,
  currentUserId,
  onEdit,
  onClose,
}: TaskDetailDialogProps) {
  // Comment/upload is allowed for managers/admins or a collaborator assigned to
  // this task. Everyone with view access can still read them.
  const canContribute = task
    ? canManage || (task.assignees?.some((a) => a.id === currentUserId) ?? false)
    : false;

  return (
    <Dialog open={open && task != null} onClose={onClose} fullWidth maxWidth="sm">
      {task && (
        <>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogContent dividers>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              <Chip size="small" label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLOR[task.priority]} />
              <Chip size="small" variant="outlined" label={STATUS_LABELS[task.status]} />
              {(task.labels ?? []).map((l) => (
                <Chip key={l.id} size="small" label={l.name} sx={{ bgcolor: l.color, color: '#fff' }} />
              ))}
            </Stack>

            {task.description && (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {task.description}
              </Typography>
            )}

            <Stack direction="row" spacing={4} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Due
                </Typography>
                <Typography variant="body2">
                  {task.due_date ? new Date(task.due_date).toLocaleString() : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Assignees
                </Typography>
                {(task.assignees ?? []).length > 0 ? (
                  <AvatarGroup
                    max={5}
                    sx={{ justifyContent: 'flex-start', '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 13 } }}
                  >
                    {(task.assignees ?? []).map((a) => (
                      <Avatar key={a.id}>{a.name.charAt(0).toUpperCase()}</Avatar>
                    ))}
                  </AvatarGroup>
                ) : (
                  <Typography variant="body2">—</Typography>
                )}
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />
            <TaskAttachments taskId={task.id} canManage={canManage} canContribute={canContribute} currentUserId={currentUserId} />

            <Divider sx={{ my: 2 }} />
            <TaskComments taskId={task.id} canManage={canManage} canContribute={canContribute} currentUserId={currentUserId} />
          </DialogContent>
          <DialogActions>
            {canManage && (
              <Button startIcon={<EditIcon />} onClick={() => onEdit(task)}>
                Edit task
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
