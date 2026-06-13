import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import RoleGate from '../components/RoleGate';
import ConfirmDialog from '../components/ConfirmDialog';
import ProjectFormDialog from '../components/projects/ProjectFormDialog';
import type { ProjectFormValues } from '../components/projects/ProjectFormDialog';
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from '../hooks/useProjects';
import { extractError } from '../utils/error';

interface SnackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects, isLoading, isError } = useProjects();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });

  const canManage = (p: Project) => user?.role === 'admin' || p.created_by === user?.id;

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (p: Project) => {
    setEditing(p);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    setFormError(null);
    try {
      if (editing) {
        await updateProject.mutateAsync({ id: editing.id, input: values });
        setSnack({ open: true, message: 'Project updated', severity: 'success' });
      } else {
        await createProject.mutateAsync(values);
        setSnack({ open: true, message: 'Project created', severity: 'success' });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(extractError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject.mutateAsync(deleteTarget.id);
      setSnack({ open: true, message: 'Project deleted', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: extractError(err), severity: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Projects</Typography>
        <RoleGate roles={['admin', 'project_manager']}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New project
          </Button>
        </RoleGate>
      </Stack>

      {isError && <Alert severity="error">Failed to load projects.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (projects ?? []).length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          No projects yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          }}
        >
          {(projects ?? []).map((p) => (
            <Card key={p.id} variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography
                    variant="h6"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {p.title}
                  </Typography>
                  {canManage(p) && (
                    <Box sx={{ flexShrink: 0 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(p)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    minHeight: 40,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.description || 'No description'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Created by {p.creator?.name ?? 'Unknown'} · {new Date(p.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ProjectFormDialog
        open={formOpen}
        project={editing}
        submitting={createProject.isPending || updateProject.isPending}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project"
        message={`Delete "${deleteTarget?.title}"? This permanently removes the project and all its tasks, labels, and comments.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteProject.isPending}
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
