import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { migrateGuestCart, migrateOldCart } from '../utils/cart';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Avatar, Snackbar, Alert } from '@mui/material';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleDemoAdmin = async () => {
    setEmail('admin@example.com');
    setPassword('admin123');
    const fakeEvent = { preventDefault: () => {} };
    await submit(fakeEvent);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { email, password };
      const res = await api.post('/auth/login', payload);
      const { token, user } = res.data;
      setAuth(user, token);
      migrateGuestCart(user);
      migrateOldCart();
      setWelcomeUser(user);
      setShowWelcome(true);
      setLoading(false);
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowWelcome(false);
            if (user && Number(user.idRol) === 3) navigate('/productos');
            else navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setSnack({ open: true, message: 'Credenciales inválidas', severity: 'error' });
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <Card sx={{ width: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              {/* icon */}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Iniciar sesión</Typography>

            <Button variant="outlined" onClick={handleDemoAdmin} disabled={loading}>Demo Admin</Button>

            <Box component="form" onSubmit={submit} sx={{ width: '100%' }}>
              <TextField label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
              <TextField label="Contraseña" type="password" fullWidth required value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />

              <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Cargando...' : 'Iniciar sesión'}</Button>
            </Box>

            <Typography variant="body2">¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></Typography>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>

      {showWelcome && welcomeUser && (
        <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success">¡Hola, {welcomeUser.nombre} {welcomeUser.apellido}! Redirigiendo en {countdown}...</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
