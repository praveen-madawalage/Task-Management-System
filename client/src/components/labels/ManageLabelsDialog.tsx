import { useState } from 'react';
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
  IconButton,
  List,
  ListItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Label } from '../../types';
import { useCreateLabel, useDeleteLabel, useProjectLabels, useUpdateLabel } from '../../hooks/useLabels';
import { extractError } from '../../utils/error';
import ConfirmDialog from '../ConfirmDialog';

interface ManageLabelsDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

const DEFAULT_COLOR = '#1976d2';

export default function ManageLabelsDialog({ open, projectId, onClose }: ManageLabelsDialogProps) {
  const { data: labels, isLoading } = useProjectLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Label | null>(null);

  const resetForm = () => {
    setName('');
    setColor(DEFAULT_COLOR);
    setEditingId(null);
  };

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setName(label.name);
    setColor(label.color);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateLabel.mutateAsync({ id: editingId, input: { name, color } });
      } else {
        await createLabel.mutateAsync({ name, color });
      }
      resetForm();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLabel.mutateAsync(deleteTarget.id);
      if (editingId === deleteTarget.id) resetForm();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Project labels</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ flexGrow: 1 }}
          />
          <Tooltip title="Color">
            <TextField
              size="small"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              sx={{ width: 56 }}
            />
          </Tooltip>
          <Button type="submit" variant="contained" disabled={createLabel.isPending || updateLabel.isPending}>
            {editingId ? 'Save' : 'Add'}
          </Button>
          {editingId && <Button onClick={resetForm}>Cancel</Button>}
        </Box>

        {isLoading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (labels ?? []).length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            No labels yet.
          </Typography>
        ) : (
          <List dense>
            {(labels ?? []).map((label) => (
              <ListItem
                key={label.id}
                disableGutters
                secondaryAction={
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => startEdit(label)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(label)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <Chip label={label.name} size="small" sx={{ bgcolor: label.color, color: '#fff' }} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete label"
        message={`Delete label "${deleteTarget?.name}"? It will be removed from any tagged tasks.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteLabel.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Dialog>
  );
}
