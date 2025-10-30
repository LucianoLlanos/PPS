import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions, Button, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, IconButton, Chip, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Avatar, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import api from '../../api/axios';

export default function CarouselAdmin() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    enlace: '',
    orden: 0,
    activo: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/carousel/admin');
      setBanners(response.data || []);
    } catch (error) {
      console.error('Error cargando banners:', error);
      if (error.response?.status === 401) {
        showSnackbar('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
      } else if (error.response?.status === 403) {
        showSnackbar('No tienes permisos para acceder a esta sección.', 'error');
      } else {
        showSnackbar(`Error cargando banners: ${error.response?.data?.error || error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        titulo: banner.titulo,
        descripcion: banner.descripcion || '',
        enlace: banner.enlace || '',
        orden: banner.orden,
        activo: banner.activo
      });
      setPreviewUrl(`http://localhost:3000/uploads/${banner.imagen}`);
    } else {
      setEditingBanner(null);
      setFormData({
        titulo: '',
        descripcion: '',
        enlace: '',
        orden: banners.length,
        activo: true
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBanner(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!formData.titulo) {
      showSnackbar('El título es requerido', 'error');
      return;
    }

    if (!editingBanner && !selectedFile) {
      showSnackbar('La imagen es requerida', 'error');
      return;
    }

    const submitData = new FormData();
    submitData.append('titulo', formData.titulo);
    submitData.append('descripcion', formData.descripcion);
    submitData.append('enlace', formData.enlace);
    submitData.append('orden', formData.orden);
    submitData.append('activo', formData.activo);
    
    if (selectedFile) {
      submitData.append('imagen', selectedFile);
    }

    try {
      if (editingBanner) {
        await api.put(`/carousel/admin/${editingBanner.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSnackbar('Banner actualizado exitosamente');
      } else {
        await api.post('/carousel/admin', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSnackbar('Banner creado exitosamente');
      }
      
      fetchBanners();
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardando banner:', error);
      if (error.response?.status === 401) {
        showSnackbar('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
      } else if (error.response?.status === 403) {
        showSnackbar('No tienes permisos para realizar esta acción.', 'error');
      } else {
        showSnackbar(`Error guardando banner: ${error.response?.data?.error || error.message}`, 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este banner?')) return;

    try {
      await api.delete(`/carousel/admin/${id}`);
      showSnackbar('Banner eliminado exitosamente');
      fetchBanners();
    } catch (error) {
      console.error('Error eliminando banner:', error);
      showSnackbar('Error eliminando banner', 'error');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/carousel/admin/${id}/estado`, {
        activo: !currentStatus
      });
      showSnackbar(`Banner ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      fetchBanners();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      showSnackbar('Error cambiando estado', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Cargando banners...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Carrusel</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Banner
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Orden</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <Avatar
                    src={`http://localhost:3000/uploads/${banner.imagen}`}
                    variant="rounded"
                    sx={{ width: 80, height: 60 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {banner.titulo}
                  </Typography>
                  {banner.enlace && (
                    <Typography variant="caption" color="primary">
                      Enlace: {banner.enlace}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {banner.descripcion || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={banner.orden} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={banner.activo}
                    onChange={() => handleToggleActive(banner.id, banner.activo)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver">
                      <IconButton 
                        size="small"
                        onClick={() => window.open(`http://localhost:3000/uploads/${banner.imagen}`, '_blank')}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(banner)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {banners.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay banners creados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Crea tu primer banner para el carrusel
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Crear Banner
          </Button>
        </Box>
      )}

      {/* Dialog for creating/editing banners */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Orden"
                type="number"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enlace (opcional)"
                value={formData.enlace}
                onChange={(e) => setFormData({ ...formData, enlace: e.target.value })}
                helperText="URL a la que redirigir cuando se haga clic en el banner"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                }
                label="Banner activo"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {editingBanner ? 'Cambiar imagen' : 'Seleccionar imagen'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              
              {previewUrl && (
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBanner ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}