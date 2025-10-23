import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { migrateGuestCart, migrateOldCart } from '../utils/cart';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Avatar, Snackbar, Alert } from '@mui/material';

export default function Register() {
  const [formData, setFormData] = useState({ nombre: '', apellido: '', email: '', password: '', telefono: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' });
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Ingresa un email válido';
    if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (formData.telefono && !/^\+?[\d\s-()]+$/.test(formData.telefono)) newErrors.telefono = 'Ingresa un teléfono válido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telefono: formData.telefono.trim() || null,
        idRol: 1
      };
      await api.post('/auth/register', payload);
      const loginRes = await api.post('/auth/login', { email: payload.email, password: payload.password });
      const { token, user } = loginRes.data;
      setAuth(user, token);
      migrateGuestCart(user);
      migrateOldCart();
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Error al crear cuenta';
      if (message.includes('Email ya registrado')) setErrors({ email: 'Este email ya está registrado' });
      else setSnack({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <Card sx={{ width: 480, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Crear cuenta</Typography>

            <Box component="form" onSubmit={submit} sx={{ width: '100%' }}>
              <TextField label="Nombre" name="nombre" fullWidth required value={formData.nombre} onChange={handleChange} error={!!errors.nombre} helperText={errors.nombre} sx={{ mb: 2 }} />
              <TextField label="Apellido" name="apellido" fullWidth required value={formData.apellido} onChange={handleChange} error={!!errors.apellido} helperText={errors.apellido} sx={{ mb: 2 }} />
              <TextField label="Email" name="email" type="email" fullWidth required value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} sx={{ mb: 2 }} />
              <TextField label="Contraseña" name="password" type="password" fullWidth required value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} sx={{ mb: 2 }} />
              <TextField label="Teléfono (opcional)" name="telefono" fullWidth value={formData.telefono} onChange={handleChange} error={!!errors.telefono} helperText={errors.telefono} sx={{ mb: 3 }} />

              <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Button>
            </Box>

            <Typography variant="body2">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></Typography>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}