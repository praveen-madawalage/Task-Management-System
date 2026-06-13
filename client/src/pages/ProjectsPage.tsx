import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
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
import { COLORS } from '../theme';

interface SnackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

// A 1–2 letter monogram from the project title.
const monogram = (title: string) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '–';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Short, readable id tag like "#A1B2C3" from the UUID.
const shortId = (id: string) => '#' + id.replace(/-/g, '').slice(0, 6).toUpperCase();

const progressPct = (p: Project) =>
  p.task_count ? Math.round(((p.completed_count ?? 0) / p.task_count) * 100) : 0;

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
          {(projects ?? []).map((p) => {
            const pct = progressPct(p);
            return (
              <Card
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 182,
                  p: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'transform .2s ease, border-color .2s ease',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: COLORS.border2 },
                  '&:hover .project-actions': { opacity: 1 },
                }}
              >
                {/* Accent bar */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${COLORS.accent}, transparent)`,
                    opacity: 0.8,
                  }}
                />

                {/* Header: monogram + id tag (+ hover actions for managers) */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.75 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '11px',
                      bgcolor: COLORS.surface2,
                      border: `1px solid ${COLORS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: COLORS.mono,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {monogram(p.title)}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {canManage(p) && (
                      <Box className="project-actions" sx={{ opacity: 0, transition: 'opacity .15s' }} onClick={(e) => e.stopPropagation()}>
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
                    <Typography sx={{ fontFamily: COLORS.mono, fontSize: 10, color: COLORS.text4, letterSpacing: '.06em' }}>
                      {shortId(p.id)}
                    </Typography>
                  </Box>
                </Box>

                {/* Title + description */}
                <Typography sx={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.01em', mb: 0.875 }}>
                  {p.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: COLORS.text3,
                    lineHeight: 1.5,
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.description || 'No description'}
                </Typography>
                <Typography sx={{ fontFamily: COLORS.mono, fontSize: 10, color: COLORS.text4, mt: 1.25 }}>
                  by {p.creator?.name ?? 'Unknown'}
                </Typography>

                {/* Footer: task count + progress + percent */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, pt: 1.75, borderTop: `1px solid ${COLORS.border}` }}>
                  <Typography sx={{ fontFamily: COLORS.mono, fontSize: 11, color: COLORS.text2 }}>
                    {p.task_count ?? 0} <Box component="span" sx={{ color: COLORS.text4 }}>tasks</Box>
                  </Typography>
                  <Box sx={{ flex: 1, height: 5, borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: COLORS.accent, borderRadius: '3px', transition: 'width .4s ease' }} />
                  </Box>
                  <Typography sx={{ fontFamily: COLORS.mono, fontSize: 11, color: COLORS.text3 }}>{pct}%</Typography>
                </Box>
              </Card>
            );
          })}
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
