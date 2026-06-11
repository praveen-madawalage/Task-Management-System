import { Box, Card, CardContent, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}
      </Typography>
      <Card sx={{ maxWidth: 360, mt: 2 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            Signed in as
          </Typography>
          <Typography>{user?.email}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Role: {user?.role}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
