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
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { Label, Task, TaskPriority, TaskStatus } from '../../types';
import { PRIORITIES, PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS, STATUSES } from '../../constants';
import { useAssignableUsers } from '../../hooks/useUsers';

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // datetime-local value or ''
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

// ISO string -> value for <input type="datetime-local"> in local time.
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setPriority(task?.priority ?? 'medium');
      setStatus(task?.status ?? 'todo');
      setDueDate(toLocalInput(task?.due_date ?? null));
      setAssigneeIds(task?.assignees?.map((a) => a.id) ?? []);
      setLabelIds(task?.labels?.map((l) => l.id) ?? []);
    }
  }, [open, task]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, priority, status, dueDate, assigneeIds, labelIds });
  };

  const handleAssignees = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setAssigneeIds(typeof value === 'string' ? value.split(',') : value);
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
            <TextField
              label="Due date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth>
              <InputLabel id="assignees-label">Assignees</InputLabel>
              <Select
                labelId="assignees-label"
                multiple
                value={assigneeIds}
                onChange={handleAssignees}
                input={<OutlinedInput label="Assignees" />}
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
            </FormControl>
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
                        <Chip
                          key={id}
                          size="small"
                          label={label?.name ?? id}
                          sx={{ bgcolor: label?.color, color: '#fff' }}
                        />
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
