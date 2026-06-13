import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleGate from '../RoleGate';
import NotificationBell from '../NotificationBell';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ mr: 4 }}>
            TMS
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/">
              Dashboard
            </Button>
            <Button color="inherit" component={RouterLink} to="/projects">
              Projects
            </Button>
            <RoleGate roles={['project_manager', 'collaborator']}>
              <Button color="inherit" component={RouterLink} to="/tasks">
                Tasks
              </Button>
            </RoleGate>
            <RoleGate roles={['admin']}>
              <Button color="inherit" component={RouterLink} to="/users">
                Users
              </Button>
            </RoleGate>
          </Box>
          <NotificationBell />
          <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled>
              {user?.name} ({user?.role})
            </MenuItem>
            <MenuItem component={RouterLink} to="/change-password" onClick={() => setAnchor(null)}>
              Change password
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
