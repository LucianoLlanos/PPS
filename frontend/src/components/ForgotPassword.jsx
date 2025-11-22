import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Snackbar, Alert } from '@mui/material';
import { AuthService } from '../services/AuthService';

export default function ForgotPassword() {
  const svc = new AuthService();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await svc.forgot(email);
      setSnack({ open: true, message: 'Si existe una cuenta, recibirás un correo con instrucciones.', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Error enviando solicitud', severity: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <Card sx={{ width: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Recuperar contraseña</Typography>
            <Typography variant="body2">Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.</Typography>
            <Box component="form" onSubmit={submit} sx={{ width: '100%' }}>
              <TextField label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Enviando...' : 'Enviar instrucciones'}</Button>
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
