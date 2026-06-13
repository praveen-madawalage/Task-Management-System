import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Role, User } from '../types';
import { ROLES, ROLE_LABELS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { useCreateUser, useSetUserStatus, useUpdateUser, useUsers } from '../hooks/useUsers';
import UserFormDialog from '../components/users/UserFormDialog';
import type { UserFormValues } from '../components/users/UserFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { extractError } from '../utils/error';

interface SnackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<'' | 'true' | 'false'>('');
  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(
    () => ({ search: debouncedSearch, role, isActive: status }),
    [debouncedSearch, role, status],
  );
  const { data: users, isLoading, isError } = useUsers(params);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const setStatusMut = useSetUserStatus();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    setFormError(null);
    try {
      if (editing) {
        await updateUser.mutateAsync({ id: editing.id, input: { name: values.name, role: values.role } });
        setSnack({ open: true, message: 'User updated', severity: 'success' });
      } else {
        const res = await createUser.mutateAsync({
          name: values.name,
          email: values.email,
          role: values.role,
        });
        setSnack({
          open: true,
          message: res.emailSent
            ? 'User created and onboarding email sent.'
            : 'User created, but the email could not be sent — check the server logs for the temporary password.',
          severity: res.emailSent ? 'success' : 'info',
        });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(extractError(err));
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    try {
      await setStatusMut.mutateAsync({ id: confirmTarget.id, isActive: !confirmTarget.is_active });
      setSnack({
        open: true,
        message: confirmTarget.is_active ? 'User deactivated' : 'User activated',
        severity: 'success',
      });
    } catch (err) {
      setSnack({ open: true, message: extractError(err), severity: 'error' });
    } finally {
      setConfirmTarget(null);
    }
  };

  // The signed-in admin manages everyone else; they don't appear in their own list.
  const visibleUsers = (users ?? []).filter((u) => u.id !== currentUser?.id);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Signed in as {currentUser?.name} ({currentUser?.role})
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New user
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role | '')}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | 'true' | 'false')}
          size="small"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </Stack>

      {isError && <Alert severity="error">Failed to load users.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.is_active ? 'Active' : 'Inactive'}
                        color={u.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={isSelf ? "You can't change your own status" : u.is_active ? 'Deactivate' : 'Activate'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={isSelf}
                            onClick={() => setConfirmTarget(u)}
                            color={u.is_active ? 'error' : 'success'}
                          >
                            {u.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && visibleUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No other users match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <UserFormDialog
        open={formOpen}
        user={editing}
        submitting={createUser.isPending || updateUser.isPending}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.is_active ? 'Deactivate user' : 'Activate user'}
        message={
          confirmTarget?.is_active
            ? `Deactivate ${confirmTarget?.name}? They will no longer be able to log in.`
            : `Activate ${confirmTarget?.name}? They will be able to log in again.`
        }
        confirmLabel={confirmTarget?.is_active ? 'Deactivate' : 'Activate'}
        confirmColor={confirmTarget?.is_active ? 'error' : 'primary'}
        loading={setStatusMut.isPending}
        onConfirm={handleToggleStatus}
        onClose={() => setConfirmTarget(null)}
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
