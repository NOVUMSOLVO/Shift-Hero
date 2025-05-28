import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert, Stack } from '@mui/material';
import { removeNotification } from '../redux/slices/uiSlice';

const Notification = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.ui);
  
  const handleClose = (id) => {
    dispatch(removeNotification(id));
  };
  
  return (
    <Stack spacing={2} sx={{ position: 'fixed', top: 24, right: 24, zIndex: 2000 }}>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={notification.duration || 6000}
          onClose={() => handleClose(notification.id)}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type || 'info'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};

export default Notification;
