import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAddComment, useDeleteComment, useTaskComments } from '../../hooks/useComments';
import { extractError } from '../../utils/error';

interface TaskCommentsProps {
  taskId: string;
  canManage: boolean;
  canContribute: boolean;
  currentUserId?: string;
}

export default function TaskComments({ taskId, canManage, canContribute, currentUserId }: TaskCommentsProps) {
  const { data: comments, isLoading } = useTaskComments(taskId, true);
  const addComment = useAddComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    try {
      await addComment.mutateAsync(content.trim());
      setContent('');
    } catch (err) {
      setError(extractError(err));
    }
  };

  const canDelete = (authorId: string) => canManage || authorId === currentUserId;

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Comments
      </Typography>

      {isLoading ? (
        <CircularProgress size={20} />
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {(comments ?? []).map((c) => (
            <Stack key={c.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>
                {c.author?.name?.charAt(0).toUpperCase() ?? '?'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2">
                  <strong>{c.author?.name ?? 'Unknown'}</strong>{' '}
                  <Typography component="span" variant="caption" color="text.secondary">
                    · {new Date(c.created_at).toLocaleString()}
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {c.content}
                </Typography>
              </Box>
              {canDelete(c.user_id) && (
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => deleteComment.mutate(c.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ))}
          {(comments ?? []).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No comments yet.
            </Typography>
          )}
        </Stack>
      )}

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
      {canContribute && (
        <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small"
            placeholder="Add a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            maxRows={4}
          />
          <Button type="submit" variant="contained" disabled={addComment.isPending || !content.trim()}>
            Post
          </Button>
        </Box>
      )}
    </Box>
  );
}
