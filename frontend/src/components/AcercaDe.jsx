import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Business as BusinessIcon,
  Visibility as VisionIcon,
  Assignment as MissionIcon,
  Group as GroupIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import PiramideOrganizacional from './PiramideOrganizacional';
import axios from '../api/axios';

export default function AcercaDe() {
  const [empresaInfo, setEmpresaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarInfoEmpresa();
  }, []);

  const cargarInfoEmpresa = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/empresa');
      setEmpresaInfo(response.data);
      setError('');
    } catch (err) {
      console.error('Error al cargar información de la empresa:', err);
      setError('Error al cargar la información de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const descargarPdf = async () => {
    try {
      const response = await axios.get('/empresa/pdf', {
        responseType: 'blob'
      });
      
      // Crear URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!empresaInfo) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">No hay información de la empresa disponible.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            Acerca de Nuestra Empresa
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Conoce más sobre nosotros
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Visión */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VisionIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" color="primary.main">
                Nuestra Visión
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {empresaInfo.vision}
            </Typography>
          </CardContent>
        </Card>

        {/* Misión */}
        <Card sx={{ mb: 3, bgcolor: 'secondary.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MissionIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h5" component="h2" color="secondary.main">
                Nuestra Misión
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {empresaInfo.mision}
            </Typography>
          </CardContent>
        </Card>

        {/* Composición - Descripción textual */}
        <Card sx={{ mb: 3, bgcolor: 'success.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GroupIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h5" component="h2" color="success.main">
                Nuestra Organización
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {empresaInfo.composicion}
            </Typography>
          </CardContent>
        </Card>

        {/* Pirámide Organizacional */}
        <Box sx={{ mb: 3 }}>
          <PiramideOrganizacional />
        </Box>

        {/* Información de archivos */}
        {empresaInfo.archivo_pdf && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Documentación Adicional
            </Typography>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={descargarPdf}
              sx={{ mt: 2 }}
            >
              Descargar Información en PDF
            </Button>
          </Box>
        )}

        {/* Footer de información */}
        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Última actualización: {new Date(empresaInfo.fecha_actualizacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
          {empresaInfo.actualizado_por && (
            <Typography variant="body2" color="text.secondary" align="center">
              Actualizado por: {empresaInfo.actualizado_por}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}