import {
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Task, TaskStatus } from '../../types';
import { PRIORITY_COLOR, PRIORITY_LABELS, STATUS_LABELS, STATUSES } from '../../constants';

interface TaskTableProps {
  tasks: Task[];
  canManage: boolean;
  canChangeStatus: (task: Task) => boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
}

export default function TaskTable({
  tasks,
  canManage,
  canChangeStatus,
  onStatusChange,
  onEdit,
  onDelete,
  onOpen,
}: TaskTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assignees</TableCell>
            <TableCell>Due</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => {
            const overdue =
              task.due_date != null && new Date(task.due_date) < new Date() && task.status !== 'completed';
            return (
              <TableRow key={task.id} hover>
                <TableCell>
                  <Typography
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => onOpen(task)}
                  >
                    {task.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLOR[task.priority]} />
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={task.status}
                    disabled={!canChangeStatus(task)}
                    onChange={(e: SelectChangeEvent) => onStatusChange(task.id, e.target.value as TaskStatus)}
                    sx={{ minWidth: 140 }}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <AvatarGroup max={4} sx={{ justifyContent: 'flex-start', '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 13 } }}>
                    {(task.assignees ?? []).map((a) => (
                      <Tooltip key={a.id} title={a.name}>
                        <Avatar>{a.name.charAt(0).toUpperCase()}</Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={overdue ? 'error' : 'text.secondary'}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {canManage && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(task)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(task)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No tasks yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
