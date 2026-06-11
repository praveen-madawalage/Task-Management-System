import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import type { Project } from '../../types';

export interface ProjectFormValues {
  title: string;
  description: string;
}

interface ProjectFormDialogProps {
  open: boolean;
  project: Project | null; // null = create mode
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
}

export default function ProjectFormDialog({
  open,
  project,
  submitting,
  error,
  onClose,
  onSubmit,
}: ProjectFormDialogProps) {
  const isEdit = Boolean(project);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(project?.title ?? '');
      setDescription(project?.description ?? '');
    }
  }, [open, project]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
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
