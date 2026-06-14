import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import type { Attachment } from '../../types';
import { useDeleteAttachment, useTaskAttachments, useUploadAttachment } from '../../hooks/useAttachments';
import { extractError } from '../../utils/error';
import { formatBytes, isImageFile } from '../../utils/format';

interface TaskAttachmentsProps {
  taskId: string;
  canManage: boolean;
  canContribute: boolean;
  currentUserId?: string;
}

export default function TaskAttachments({ taskId, canManage, canContribute, currentUserId }: TaskAttachmentsProps) {
  const { data: attachments, isLoading } = useTaskAttachments(taskId, true);
  const upload = useUploadAttachment(taskId);
  const remove = useDeleteAttachment(taskId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Attachment | null>(null);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      setError(extractError(err));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const canDelete = (uploaderId: string) => canManage || uploaderId === currentUserId;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">Attachments</Typography>
        {canContribute && (
          <>
            <Button
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </Button>
            <input ref={fileRef} type="file" hidden onChange={onPick} />
          </>
        )}
      </Stack>

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      {isLoading ? (
        <CircularProgress size={20} />
      ) : (
        <Stack spacing={1.5}>
          {(attachments ?? []).map((a) => {
            const image = isImageFile(a.file_name);
            return (
              <Stack key={a.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <InsertDriveFileIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  {image ? (
                    <Typography
                      variant="body2"
                      onClick={() => setPreview(a)}
                      sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        wordBreak: 'break-all',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {a.file_name}
                    </Typography>
                  ) : (
                    <Link href={a.file_url} target="_blank" rel="noopener" variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {a.file_name}
                    </Link>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {formatBytes(a.file_size)} · {a.uploader?.name ?? 'Unknown'}
                  </Typography>
                  {image && (
                    <Box
                      component="img"
                      src={a.file_url}
                      alt={a.file_name}
                      onClick={() => setPreview(a)}
                      sx={{
                        mt: 0.75,
                        width: 96,
                        height: 96,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                    />
                  )}
                </Box>
                {canDelete(a.user_id) && (
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => remove.mutate(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            );
          })}
          {(attachments ?? []).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No attachments yet.
            </Typography>
          )}
        </Stack>
      )}

      {/* In-app image lightbox */}
      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="lg">
        {preview && (
          <Box sx={{ position: 'relative', lineHeight: 0 }}>
            <IconButton
              onClick={() => setPreview(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box
              component="img"
              src={preview.file_url}
              alt={preview.file_name}
              sx={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh' }}
            />
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
