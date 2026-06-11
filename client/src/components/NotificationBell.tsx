import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)}>
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 460 } } }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
          <Typography variant="subtitle1">Notifications</Typography>
          {unread > 0 && (
            <Button size="small" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              Mark all read
            </Button>
          )}
        </Stack>
        <Divider />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No notifications.
          </Typography>
        ) : (
          <List dense disablePadding>
            {notifications.map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead.mutate(n.id);
                }}
                sx={{ bgcolor: n.is_read ? 'transparent' : 'action.hover', alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={n.message}
                  secondary={new Date(n.created_at).toLocaleString()}
                  slotProps={{
                    primary: { variant: 'body2', sx: { fontWeight: n.is_read ? 400 : 600 } },
                    secondary: { variant: 'caption' },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
