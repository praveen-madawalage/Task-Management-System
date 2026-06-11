import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LabelIcon from '@mui/icons-material/Label';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import TasksSection from '../components/tasks/TasksSection';
import ManageLabelsDialog from '../components/labels/ManageLabelsDialog';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project, isLoading, isError } = useProject(id);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const canManage = project != null && (user?.role === 'admin' || project.created_by === user?.id);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !project) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mb: 2 }}>
          Back to projects
        </Button>
        <Alert severity="error">Project not found or you don't have access to it.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mb: 2 }}>
        Back to projects
      </Button>

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h4" gutterBottom>
            {project.title}
          </Typography>
          {canManage && (
            <Button startIcon={<LabelIcon />} onClick={() => setLabelsOpen(true)}>
              Manage labels
            </Button>
          )}
        </Stack>
        <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {project.description || 'No description'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Created {new Date(project.created_at).toLocaleString()}
        </Typography>
      </Paper>

      <TasksSection project={project} />

      <ManageLabelsDialog open={labelsOpen} projectId={project.id} onClose={() => setLabelsOpen(false)} />
    </Box>
  );
}
