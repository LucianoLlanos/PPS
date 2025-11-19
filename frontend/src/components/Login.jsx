import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/AuthService';
import useAuthStore from '../store/useAuthStore';
import { migrateGuestCart, migrateOldCart } from '../utils/cart';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Avatar, Snackbar, Alert } from '@mui/material';

export default function Login() {
  const authService = useMemo(() => new AuthService(), []);
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
    const demoCreds = { email: 'admin@example.com', password: 'admin123' };
    // also fill form fields for visibility
    setEmail(demoCreds.email);
    setPassword(demoCreds.password);
    // small visual delay so user sees fields populated before auto-login
    await new Promise((resolve) => setTimeout(resolve, 300));
    await submit(null, demoCreds);
  };

  const submit = async (e, overrideCreds = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const payload = overrideCreds ? overrideCreds : { email, password };
      const { token, user } = await authService.login(payload.email, payload.password);
      setAuth(user, token);
      migrateGuestCart(user);
      migrateOldCart();
      setWelcomeUser(user);
      setShowWelcome(true);
      setLoading(false);
      setCountdown(3);
      
      // Usar setTimeout para navegar después de 3 segundos
      setTimeout(() => {
        setShowWelcome(false);
        if (user && Number(user.idRol) === 3) {
          navigate('/productos');
        } else {
          navigate('/');
        }
      }, 3000);
      
      // Countdown visual
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
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

  const getDisplayName = (u) => {
    if (!u) return '';
    // common possibilities
    const candidates = [u.nombre, u.apellido, u.name, u.firstName, u.lastName, u.fullName, u.nombreCompleto, u.usuario];
    // if there is separate nombre and apellido prefer full combo
    if (u.nombre || u.apellido) {
      const n = [u.nombre, u.apellido].filter(Boolean).join(' ');
      if (n) return n;
    }
    for (const c of candidates) {
      if (c && typeof c === 'string' && c.trim().length > 0) return c.trim();
    }
    // fallback to email prefix
    if (u.email && typeof u.email === 'string') return u.email.split('@')[0];
    return '';
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
          <Alert severity="success">¡Hola, {getDisplayName(welcomeUser)}! Redirigiendo en {countdown}...</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
