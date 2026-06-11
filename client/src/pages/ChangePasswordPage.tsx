import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setAccessToken } from '../api/axiosClient';
import * as authApi from '../api/auth';

const PASSWORD_HINT = 'At least 8 characters, with one uppercase letter, one number, and one special character.';

export default function ChangePasswordPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mustReset = Boolean(user?.must_reset_password);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      // The change returns a fresh access token with the reset flag cleared.
      setAccessToken(data.accessToken);
      const me = await authApi.getMe();
      setUser(me);
      navigate('/', { replace: true });
    } catch (err) {
      const res = (err as { response?: { data?: { error?: string; details?: { msg: string }[] } } })?.response?.data;
      setError(res?.details?.[0]?.msg ?? res?.error ?? 'Could not change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {mustReset ? 'Set a new password' : 'Change password'}
          </Typography>
          {mustReset && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You must set a new password before continuing.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              helperText={PASSWORD_HINT}
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
