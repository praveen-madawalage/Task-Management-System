import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQueryClient } from '@tanstack/react-query';
import type { Project, Task, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  useCreateTask,
  useDeleteTask,
  useProjectTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from '../../hooks/useTasks';
import * as tasksApi from '../../api/tasks';
import * as labelsApi from '../../api/labels';
import { useProjectLabels } from '../../hooks/useLabels';
import { extractError } from '../../utils/error';
import ConfirmDialog from '../ConfirmDialog';
import TaskFormDialog from './TaskFormDialog';
import type { TaskFormValues } from './TaskFormDialog';
import TaskBoard from './TaskBoard';
import TaskTable from './TaskTable';
import TaskDetailDialog from './TaskDetailDialog';

type ViewMode = 'board' | 'table';

interface SnackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export default function TasksSection({ project }: { project: Project }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: tasks, isLoading, isError } = useProjectTasks(project.id);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus(project.id);
  const { data: projectLabels } = useProjectLabels(project.id);

  const [view, setView] = useState<ViewMode>('board');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });

  // Derive the open detail task from the live list so it reflects edits/drags.
  const detailTask = (tasks ?? []).find((t) => t.id === detailTaskId) ?? null;

  const canManage = user?.role === 'admin' || project.created_by === user?.id;
  const canChangeStatus = (task: Task) =>
    canManage || (task.assignees?.some((a) => a.id === user?.id) ?? false);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditing(task);
    setFormError(null);
    setFormOpen(true);
  };
  // Clicking a task opens its detail view (comments, attachments) for everyone.
  const handleOpen = (task: Task) => {
    setDetailTaskId(task.id);
  };

  const reconcileAssignees = async (taskId: string, current: string[], next: string[]) => {
    for (const id of next.filter((x) => !current.includes(x))) await tasksApi.addAssignee(taskId, id);
    for (const id of current.filter((x) => !next.includes(x))) await tasksApi.removeAssignee(taskId, id);
  };

  const reconcileLabels = async (taskId: string, current: string[], next: string[]) => {
    for (const id of next.filter((x) => !current.includes(x))) await labelsApi.addLabelToTask(taskId, id);
    for (const id of current.filter((x) => !next.includes(x))) await labelsApi.removeLabelFromTask(taskId, id);
  };

  // Quick inline add from a card: reuse an existing same-named project label or
  // create a new one, then tag the task with it.
  const handleAddLabel = async (taskId: string, name: string, color: string) => {
    try {
      const existing = (projectLabels ?? []).find((l) => l.name.toLowerCase() === name.toLowerCase());
      const labelId = existing ? existing.id : (await labelsApi.createLabel(project.id, { name, color })).id;
      await labelsApi.addLabelToTask(taskId, labelId);
      qc.invalidateQueries({ queryKey: ['labels', project.id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      setSnack({ open: true, message: extractError(err), severity: 'error' });
    }
  };

  // One-click delete from a card removes the label from the project entirely
  // (the DB cascade also untags it from every task it was on).
  const handleRemoveLabel = async (_taskId: string, labelId: string) => {
    try {
      await labelsApi.deleteLabel(labelId);
      qc.invalidateQueries({ queryKey: ['labels', project.id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      setSnack({ open: true, message: extractError(err), severity: 'error' });
    }
  };

  const handleSubmit = async (values: TaskFormValues) => {
    setFormError(null);
    const dueDate = values.dueDate ? new Date(values.dueDate).toISOString() : null;
    try {
      if (editing) {
        await updateTask.mutateAsync({
          id: editing.id,
          input: {
            title: values.title,
            description: values.description,
            priority: values.priority,
            status: values.status,
            dueDate,
          },
        });
        await reconcileAssignees(editing.id, editing.assignees?.map((a) => a.id) ?? [], values.assigneeIds);
        await reconcileLabels(editing.id, editing.labels?.map((l) => l.id) ?? [], values.labelIds);
        qc.invalidateQueries({ queryKey: ['tasks'] });
        setSnack({ open: true, message: 'Task updated', severity: 'success' });
      } else {
        const created = await createTask.mutateAsync({
          projectId: project.id,
          title: values.title,
          description: values.description,
          priority: values.priority,
          status: values.status,
          dueDate,
          assigneeIds: values.assigneeIds,
        });
        await reconcileLabels(created.id, [], values.labelIds);
        qc.invalidateQueries({ queryKey: ['tasks'] });
        setSnack({ open: true, message: 'Task created', severity: 'success' });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(extractError(err));
    }
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatus.mutate(
      { id: taskId, status },
      {
        onError: (err) =>
          setSnack({ open: true, message: extractError(err, 'Could not change status'), severity: 'error' }),
      },
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask.mutateAsync(deleteTarget.id);
      setSnack({ open: true, message: 'Task deleted', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: extractError(err), severity: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Tasks</Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="view-label">View</InputLabel>
            <Select
              labelId="view-label"
              label="View"
              value={view}
              onChange={(e: SelectChangeEvent) => setView(e.target.value as ViewMode)}
            >
              <MenuItem value="board">Board</MenuItem>
              <MenuItem value="table">Table</MenuItem>
            </Select>
          </FormControl>
          {canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New task
            </Button>
          )}
        </Stack>
      </Stack>

      {isError && <Alert severity="error">Failed to load tasks.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : view === 'board' ? (
        <TaskBoard
          tasks={tasks ?? []}
          canChangeStatus={canChangeStatus}
          canManageLabels={canManage}
          onStatusChange={handleStatusChange}
          onAddLabel={handleAddLabel}
          onRemoveLabel={handleRemoveLabel}
          onOpen={handleOpen}
        />
      ) : (
        <TaskTable
          tasks={tasks ?? []}
          canManage={canManage}
          canChangeStatus={canChangeStatus}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
          onDelete={(t) => setDeleteTarget(t)}
          onOpen={handleOpen}
        />
      )}

      <TaskDetailDialog
        open={detailTask != null}
        task={detailTask}
        canManage={canManage}
        currentUserId={user?.id}
        onEdit={(t) => {
          setDetailTaskId(null);
          openEdit(t);
        }}
        onClose={() => setDetailTaskId(null)}
      />

      <TaskFormDialog
        open={formOpen}
        task={editing}
        projectLabels={projectLabels ?? []}
        submitting={createTask.isPending || updateTask.isPending}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete task"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteTask.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
