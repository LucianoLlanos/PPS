import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import PiramideOrganizacional from '../PiramideOrganizacional';
import useAuthStore from '../../store/useAuthStore';
import { EmpresaService } from '../../services/EmpresaService';

export default function EmpresaAdmin() {
  const { user } = useAuthStore();
  const empresaService = useMemo(() => new EmpresaService(), []);
  const [empresaInfo, setEmpresaInfo] = useState({
    vision: '',
    mision: '',
    composicion: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Estados para la gestión organizacional
  const [tabValue, setTabValue] = useState(0);
  const [cargoDialog, setCargoDialog] = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [nuevoCargo, setNuevoCargo] = useState({
    nombre_cargo: '',
    descripcion: '',
    nivel_jerarquico: 1,
    orden_en_nivel: 0
  });
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [savingCargo, setSavingCargo] = useState(false);

  useEffect(() => {
    cargarInfoEmpresa();
  }, []);

  const cargarInfoEmpresa = async () => {
    try {
      setLoading(true);
      const data = await empresaService.getInfo();
      setEmpresaInfo(data);
      setError('');
    } catch (err) {
      console.error('Error al cargar información de la empresa:', err);
      if (err.response?.status === 404) {
        // Si no hay información, usar valores por defecto
        setEmpresaInfo({
          vision: '',
          mision: '',
          composicion: ''
        });
      } else {
        setError('Error al cargar la información de la empresa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEmpresaInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('El archivo es demasiado grande. Máximo 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const guardarCambios = async () => {
    if (!empresaInfo.vision.trim() || !empresaInfo.mision.trim() || !empresaInfo.composicion.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const formData = new FormData();
      formData.append('vision', empresaInfo.vision);
      formData.append('mision', empresaInfo.mision);
      formData.append('composicion', empresaInfo.composicion);
      
      if (selectedFile) {
        formData.append('archivoPdf', selectedFile);
      }

      await empresaService.updateInfo(formData);

      setSuccess('Información de la empresa actualizada exitosamente');
      setSelectedFile(null);
      
      // Recargar la información
      await cargarInfoEmpresa();
      
      // Limpiar mensajes después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.error || 'Error al guardar la información');
    } finally {
      setSaving(false);
    }
  };

  const descargarPdf = async () => {
    try {
      const blob = await empresaService.downloadPdf();
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'informacion-empresa.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      setError('Error al descargar el archivo PDF');
    }
  };

  const eliminarPdf = async () => {
    try {
      await empresaService.deletePdf();
      
      setSuccess('Archivo PDF eliminado exitosamente');
      setConfirmDelete(false);
      
      // Recargar información
      await cargarInfoEmpresa();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error al eliminar PDF:', err);
      setError(err.response?.data?.error || 'Error al eliminar el archivo PDF');
      setConfirmDelete(false);
    }
  };

  // ========== FUNCIONES PARA ORGANIZACIÓN ==========

  const abrirDialogoCargo = (cargo = null) => {
    if (cargo) {
      setCargoEditando(cargo);
      setNuevoCargo({
        nombre_cargo: cargo.nombre_cargo,
        descripcion: cargo.descripcion || '',
        nivel_jerarquico: cargo.nivel_jerarquico,
        orden_en_nivel: cargo.orden_en_nivel
      });
    } else {
      setCargoEditando(null);
      setNuevoCargo({
        nombre_cargo: '',
        descripcion: '',
        nivel_jerarquico: 1,
        orden_en_nivel: 0
      });
    }
    setFotoSeleccionada(null);
    setCargoDialog(true);
  };

  const cerrarDialogoCargo = () => {
    setCargoDialog(false);
    setCargoEditando(null);
    setFotoSeleccionada(null);
    setNuevoCargo({
      nombre_cargo: '',
      descripcion: '',
      nivel_jerarquico: 1,
      orden_en_nivel: 0
    });
  };

  const handleCargoInputChange = (field, value) => {
    setNuevoCargo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      setFotoSeleccionada(file);
      setError('');
    }
  };

  const guardarCargo = async () => {
    if (!nuevoCargo.nombre_cargo.trim()) {
      setError('El nombre del cargo es obligatorio');
      return;
    }

    try {
      setSavingCargo(true);
      setError('');
      
      const formData = new FormData();
      formData.append('nombre_cargo', nuevoCargo.nombre_cargo);
      formData.append('descripcion', nuevoCargo.descripcion);
      formData.append('nivel_jerarquico', nuevoCargo.nivel_jerarquico);
      formData.append('orden_en_nivel', nuevoCargo.orden_en_nivel);
      
      if (fotoSeleccionada) {
        formData.append('foto', fotoSeleccionada);
      }

      let response;
      if (cargoEditando) {
        response = await empresaService.actualizarCargo(cargoEditando.id, formData);
      } else {
        response = await empresaService.crearCargo(formData);
      }

      setSuccess(cargoEditando ? 'Cargo actualizado exitosamente' : 'Cargo creado exitosamente');
      cerrarDialogoCargo();
      
      // Limpiar mensajes después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Error al guardar cargo:', err);
      setError(err.response?.data?.error || 'Error al guardar el cargo');
    } finally {
      setSavingCargo(false);
    }
  };

  const eliminarCargo = async (cargoId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este cargo?')) {
      return;
    }

    try {
      await empresaService.eliminarCargo(cargoId);
      
      setSuccess('Cargo eliminado exitosamente');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error al eliminar cargo:', err);
      setError(err.response?.data?.error || 'Error al eliminar el cargo');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', background: 'linear-gradient(180deg,#ffffff,#fbfcfd)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Administrar Información de la Empresa
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Edita la información que verán los clientes
            </Typography>
          </Box>
        </Box>

        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Divider sx={{ mb: 4 }} />

        {/* Pestañas de navegación */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable" allowScrollButtonsMobile>
            <Tab icon={<InfoIcon />} label="Información General" />
            <Tab icon={<GroupIcon />} label="Estructura Organizacional" />
          </Tabs>
        </Box>

        {/* Contenido de las pestañas */}
        {tabValue === 0 && (
          <Grid container spacing={4}>
          {/* Formulario */}
          <Grid item xs={12} md={8}>
            {/* Visión */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Visión de la Empresa
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={empresaInfo.vision}
                onChange={(e) => handleInputChange('vision', e.target.value)}
                placeholder="Describe la visión de la empresa..."
                variant="outlined"
              />
            </Box>

            {/* Misión */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="secondary">
                Misión de la Empresa
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={empresaInfo.mision}
                onChange={(e) => handleInputChange('mision', e.target.value)}
                placeholder="Describe la misión de la empresa..."
                variant="outlined"
              />
            </Box>

            {/* Composición */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Organización de la Empresa
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={empresaInfo.composicion}
                onChange={(e) => handleInputChange('composicion', e.target.value)}
                placeholder="Describe la estructura organizacional, puestos de trabajo, etc..."
                variant="outlined"
                helperText="Puedes usar saltos de línea para organizar la información"
              />
            </Box>

            {/* Botón guardar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={guardarCambios}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Grid>

          {/* Panel lateral - Archivo PDF */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Archivo PDF
                </Typography>
                
                {/* Archivo actual */}
                {empresaInfo.archivo_pdf && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PdfIcon sx={{ mr: 1, color: 'error.main' }} />
                        <Typography variant="body2">
                          Archivo actual
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton onClick={descargarPdf} size="small" title="Descargar">
                          <PreviewIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => setConfirmDelete(true)} 
                          size="small" 
                          color="error"
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Subir nuevo archivo */}
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    id="pdf-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="pdf-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      fullWidth
                    >
                      {selectedFile ? 'Cambiar Archivo' : 'Subir PDF'}
                    </Button>
                  </label>
                </Box>

                {/* Archivo seleccionado */}
                {selectedFile && (
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary">
                      Archivo seleccionado:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                  Solo archivos PDF, máximo 10MB
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        )}

        {/* Pestaña de Estructura Organizacional */}
        {tabValue === 1 && (
          <Box>
            {/* Pirámide Organizacional con funcionalidad de edición */}
            <Box sx={{ mb: 3, position: 'relative' }}>
              <PiramideOrganizacional 
                editable={true} 
                onCargoClick={(cargo) => abrirDialogoCargo(cargo)} 
              />
              
              {/* Botón flotante para agregar nuevo cargo */}
              <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => abrirDialogoCargo()}
              >
                <AddIcon />
              </Fab>
            </Box>

            {/* Instrucciones */}
            <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="body2" color="info.main">
                <strong>Instrucciones:</strong> Haz clic en cualquier cargo para editarlo, o usa el botón + para agregar un nuevo cargo.
                Los niveles jerárquicos van del 1 (más alto) al 5 (más bajo).
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Dialog de confirmación para eliminar PDF */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} disableScrollLock>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar el archivo PDF actual? 
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button onClick={eliminarPdf} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar cargos */}
      <Dialog 
        open={cargoDialog} 
        onClose={cerrarDialogoCargo} 
        maxWidth="sm" 
        fullWidth
        disableScrollLock
      >
        <DialogTitle>
          {cargoEditando ? 'Editar Cargo' : 'Nuevo Cargo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Nombre del cargo */}
            <TextField
              fullWidth
              label="Nombre del Cargo"
              value={nuevoCargo.nombre_cargo}
              onChange={(e) => handleCargoInputChange('nombre_cargo', e.target.value)}
              required
            />

            {/* Descripción */}
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={nuevoCargo.descripcion}
              onChange={(e) => handleCargoInputChange('descripcion', e.target.value)}
            />

            {/* Nivel jerárquico */}
            <FormControl fullWidth>
              <InputLabel>Nivel Jerárquico</InputLabel>
              <Select
                value={nuevoCargo.nivel_jerarquico}
                label="Nivel Jerárquico"
                onChange={(e) => handleCargoInputChange('nivel_jerarquico', e.target.value)}
                MenuProps={{ disableScrollLock: true }}
              >
                <MenuItem value={1}>Nivel 1 - Dirección</MenuItem>
                <MenuItem value={2}>Nivel 2 - Gerencia</MenuItem>
                <MenuItem value={3}>Nivel 3 - Supervisión</MenuItem>
                <MenuItem value={4}>Nivel 4 - Operativo</MenuItem>
                <MenuItem value={5}>Nivel 5 - Soporte</MenuItem>
              </Select>
            </FormControl>

            {/* Orden en el nivel */}
            <TextField
              fullWidth
              label="Orden en el Nivel"
              type="number"
              value={nuevoCargo.orden_en_nivel}
              onChange={(e) => handleCargoInputChange('orden_en_nivel', parseInt(e.target.value) || 0)}
              helperText="Orden de aparición dentro del mismo nivel (0 = primero)"
            />

            {/* Subir foto */}
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="foto-cargo-upload"
                type="file"
                onChange={handleFotoSelect}
              />
              <label htmlFor="foto-cargo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  {fotoSeleccionada ? 'Cambiar Foto' : 'Subir Foto'}
                </Button>
              </label>
              
              {fotoSeleccionada && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2">
                    Archivo seleccionado: {fotoSeleccionada.name}
                  </Typography>
                </Box>
              )}
              
              {cargoEditando && cargoEditando.foto && !fotoSeleccionada && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="info.main">
                    Este cargo ya tiene una foto asignada
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoCargo}>
            Cancelar
          </Button>
          {cargoEditando && (
            <Button 
              onClick={() => eliminarCargo(cargoEditando.id)} 
              color="error"
            >
              Eliminar
            </Button>
          )}
          <Button 
            onClick={guardarCargo} 
            variant="contained"
            disabled={savingCargo}
            startIcon={savingCargo ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {savingCargo ? 'Guardando...' : (cargoEditando ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}