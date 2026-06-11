import { Alert, Box, Button, CircularProgress, Divider, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useProject(id);

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
        <Typography variant="h4" gutterBottom>
          {project.title}
        </Typography>
        <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {project.description || 'No description'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Created {new Date(project.created_at).toLocaleString()}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" color="text.secondary">
          Tasks — coming soon
        </Typography>
      </Paper>
    </Box>
  );
}
