import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import useSnackbarStore from '../store/useSnackbarStore';

export default function GlobalSnackbar() {
  const { open, message, severity, duration, hide } = useSnackbarStore();
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={hide}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      ContentProps={{ sx: { mt: { xs: '64px', md: '72px' } } }}
      sx={{ '& .MuiSnackbarContent-root': { borderRadius: 0 } }}
    >
      <Alert onClose={hide} severity={severity} variant="filled" sx={{ borderRadius: 0 }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
