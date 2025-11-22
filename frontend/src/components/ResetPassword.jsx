import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import { AuthService } from '../services/AuthService';

export default function ResetPassword() {
  const svc = new AuthService();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [idUsuario, setIdUsuario] = useState(null);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const uid = searchParams.get('uid');
    const t = searchParams.get('token');
    if (uid) setIdUsuario(uid);
    if (t) setToken(t);
  }, [searchParams]);

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setSnack({ open: true, message: 'Las contraseñas no coinciden', severity: 'error' }); return; }
    setLoading(true);
    try {
      await svc.reset({ idUsuario, token, newPassword });
      setSnack({ open: true, message: 'Contraseña restablecida. Inicia sesión.', severity: 'success' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setSnack({ open: true, message: err?.response?.data?.error || 'Error al restablecer contraseña', severity: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <Card sx={{ width: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Restablecer contraseña</Typography>
            <Box component="form" onSubmit={submit} sx={{ width: '100%' }}>
              <TextField label="Nueva contraseña" type="password" fullWidth required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} sx={{ mb: 2 }} />
              <TextField label="Confirmar contraseña" type="password" fullWidth required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 2 }} />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Procesando...' : 'Restablecer contraseña'}</Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
