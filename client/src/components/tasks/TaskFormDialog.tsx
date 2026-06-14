import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { Label, Task, TaskPriority, TaskStatus } from '../../types';
import { PRIORITIES, PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS, STATUSES } from '../../constants';
import { COLORS } from '../../theme';
import { useAssignableUsers } from '../../hooks/useUsers';

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO string or ''
  assigneeIds: string[];
  labelIds: string[];
}

interface TaskFormDialogProps {
  open: boolean;
  task: Task | null; // null = create mode
  projectLabels: Label[];
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

export default function TaskFormDialog({
  open,
  task,
  projectLabels,
  submitting,
  error,
  onClose,
  onSubmit,
}: TaskFormDialogProps) {
  const isEdit = Boolean(task);
  const { data: users } = useAssignableUsers();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [assigneeError, setAssigneeError] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setPriority(task?.priority ?? 'medium');
      setStatus(task?.status ?? 'todo');
      setDueDate(task?.due_date ? dayjs(task.due_date) : null);
      setAssigneeIds(task?.assignees?.map((a) => a.id) ?? []);
      setLabelIds(task?.labels?.map((l) => l.id) ?? []);
      setAssigneeError(false);
    }
  }, [open, task]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Every task must have at least one assignee — prompt right here if missing.
    if (assigneeIds.length === 0) {
      setAssigneeError(true);
      return;
    }
    onSubmit({
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? dueDate.endOf('day').toISOString() : '',
      assigneeIds,
      labelIds,
    });
  };

  const handleAssignees = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    const next = typeof value === 'string' ? value.split(',') : value;
    setAssigneeIds(next);
    if (next.length > 0) setAssigneeError(false);
  };

  const handleLabels = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setLabelIds(typeof value === 'string' ? value.split(',') : value);
  };

  const userName = (id: string) => users?.find((u) => u.id === id)?.name ?? id;
  const labelById = (id: string) => projectLabels.find((l) => l.id === id);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                fullWidth
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                fullWidth
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Assignees — required */}
            <FormControl fullWidth error={assigneeError}>
              <InputLabel id="assignees-label">Assignees *</InputLabel>
              <Select
                labelId="assignees-label"
                multiple
                value={assigneeIds}
                onChange={handleAssignees}
                input={<OutlinedInput label="Assignees *" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => (
                      <Chip key={id} size="small" label={userName(id)} />
                    ))}
                  </Box>
                )}
              >
                {(users ?? []).map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} · {ROLE_LABELS[u.role]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {assigneeError ? 'Please assign at least one person to this task.' : 'At least one assignee is required.'}
              </FormHelperText>
            </FormControl>

            {/* Labels */}
            <FormControl fullWidth disabled={projectLabels.length === 0}>
              <InputLabel id="labels-label">Labels</InputLabel>
              <Select
                labelId="labels-label"
                multiple
                value={labelIds}
                onChange={handleLabels}
                input={<OutlinedInput label="Labels" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const label = labelById(id);
                      return (
                        <Chip key={id} size="small" label={label?.name ?? id} sx={{ bgcolor: label?.color, color: '#fff' }} />
                      );
                    })}
                  </Box>
                )}
              >
                {projectLabels.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    <Chip size="small" label={l.name} sx={{ bgcolor: l.color, color: '#fff' }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Due date — inline calendar */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Due date {dueDate && <Box component="span" sx={{ color: COLORS.text }}>· {dueDate.format('MMM D, YYYY')}</Box>}
                </Typography>
                {dueDate && (
                  <Button size="small" onClick={() => setDueDate(null)}>
                    Clear
                  </Button>
                )}
              </Box>
              <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar
                    value={dueDate}
                    onChange={(v) => setDueDate(v)}
                    disablePast
                    sx={{ width: '100%', maxHeight: 320 }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
