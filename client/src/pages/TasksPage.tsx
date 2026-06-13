import { useMemo } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { useMyTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { PRIORITY_COLOR, PRIORITY_LABELS, STATUS_LABELS } from '../constants';

export default function TasksPage() {
  const navigate = useNavigate();
  const { data: tasks, isLoading, isError } = useMyTasks();
  const { data: projects } = useProjects();

  const projectName = useMemo(() => {
    const map = new Map<string, string>();
    (projects ?? []).forEach((p) => map.set(p.id, p.title));
    return map;
  }, [projects]);

  // Group the user's assigned tasks by project.
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    (tasks ?? []).forEach((t) => {
      const arr = map.get(t.project_id) ?? [];
      arr.push(t);
      map.set(t.project_id, arr);
    });
    return Array.from(map.entries());
  }, [tasks]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Tasks
      </Typography>

      {isError && <Alert severity="error">Failed to load your tasks.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Typography color="text.secondary">You have no assigned tasks.</Typography>
      ) : (
        groups.map(([projectId, projectTasks]) => (
          <Box key={projectId} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {projectName.get(projectId) ?? 'Project'}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectTasks.map((t) => {
                    const overdue =
                      t.due_date != null && new Date(t.due_date) < new Date() && t.status !== 'completed';
                    return (
                      <TableRow
                        key={t.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/projects/${projectId}`)}
                      >
                        <TableCell>{t.title}</TableCell>
                        <TableCell>
                          <Chip size="small" label={PRIORITY_LABELS[t.priority]} color={PRIORITY_COLOR[t.priority]} />
                        </TableCell>
                        <TableCell>{STATUS_LABELS[t.status]}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color={overdue ? 'error' : 'text.secondary'}>
                            {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}
    </Box>
  );
}
