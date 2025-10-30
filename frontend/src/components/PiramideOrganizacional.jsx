import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Paper,
  Chip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from '../api/axios';

const PiramideOrganizacional = ({ editable = false, onCargoClick = null }) => {
  const [organizacion, setOrganizacion] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarOrganizacion();
  }, []);

  const cargarOrganizacion = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/empresa/organizacion');
      setOrganizacion(response.data);
      setError('');
    } catch (err) {
      console.error('Error al cargar organización:', err);
      setError('Error al cargar la estructura organizacional');
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorPorNivel = (nivel) => {
    const colores = {
      1: { bg: '#1976d2', text: '#ffffff' }, // Azul - Gerencia General
      2: { bg: '#388e3c', text: '#ffffff' }, // Verde - Gerentes
      3: { bg: '#f57c00', text: '#ffffff' }, // Naranja - Supervisores/Seniors
      4: { bg: '#7b1fa2', text: '#ffffff' }, // Morado - Operativos
      5: { bg: '#c2185b', text: '#ffffff' }  // Rosa - Soporte
    };
    return colores[nivel] || { bg: '#757575', text: '#ffffff' };
  };

  const obtenerAnchoNivel = (nivel) => {
    // Calculamos el ancho basado en el nivel (pirámide inversa)
    const anchos = {
      1: '200px',
      2: '280px', 
      3: '360px',
      4: '440px',
      5: '520px'
    };
    return anchos[nivel] || '200px';
  };

  const CargoCard = ({ cargo, nivel, delay = 0 }) => {
    const colores = obtenerColorPorNivel(nivel);
    
    return (
      <Zoom in={!loading} timeout={500} style={{ transitionDelay: `${delay}ms` }}>
        <Card
          sx={{
            minWidth: 150,
            maxWidth: 200,
            cursor: editable && onCargoClick ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: editable ? 'scale(1.05)' : 'scale(1.02)',
              boxShadow: 6
            },
            background: `linear-gradient(135deg, ${colores.bg}, ${colores.bg}dd)`,
            color: colores.text,
            border: '2px solid rgba(255,255,255,0.2)'
          }}
          onClick={editable && onCargoClick ? () => onCargoClick(cargo) : undefined}
        >
          <CardContent sx={{ textAlign: 'center', p: 2 }}>
            {/* Avatar/Foto */}
            <Avatar
              src={cargo.foto ? `http://localhost:3000/empresa/cargo/${cargo.id}/foto` : undefined}
              sx={{
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.3)'
              }}
            >
              {!cargo.foto && <PersonIcon />}
            </Avatar>

            {/* Nombre del cargo */}
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                mb: 1,
                lineHeight: 1.2
              }}
            >
              {cargo.nombre_cargo}
            </Typography>

            {/* Descripción */}
            {cargo.descripcion && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  opacity: 0.9,
                  lineHeight: 1.3
                }}
              >
                {cargo.descripcion.length > 60 
                  ? `${cargo.descripcion.substring(0, 60)}...` 
                  : cargo.descripcion
                }
              </Typography>
            )}

            {/* Chip de nivel */}
            <Chip
              label={`Nivel ${nivel}`}
              size="small"
              sx={{
                mt: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: colores.text,
                fontSize: '0.7rem'
              }}
            />
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Cargando estructura organizacional...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (Object.keys(organizacion).length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay estructura organizacional configurada
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, bgcolor: '#f8f9fa' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" color="primary.main" gutterBottom>
          Estructura Organizacional
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Organización jerárquica de la empresa
        </Typography>
      </Box>

      {/* Pirámide organizacional */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        {Object.keys(organizacion)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((nivel) => (
            <Fade in={!loading} timeout={800} key={nivel}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 2,
                  maxWidth: obtenerAnchoNivel(parseInt(nivel)),
                  width: '100%'
                }}
              >
                {organizacion[nivel].map((cargo, index) => (
                  <CargoCard
                    key={cargo.id}
                    cargo={cargo}
                    nivel={parseInt(nivel)}
                    delay={index * 100}
                  />
                ))}
              </Box>
            </Fade>
          ))}
      </Box>

      {/* Leyenda de niveles */}
      <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((nivel) => {
          const colores = obtenerColorPorNivel(nivel);
          const nombres = {
            1: 'Dirección',
            2: 'Gerencia',
            3: 'Supervisión',
            4: 'Operativo',
            5: 'Soporte'
          };
          
          return (
            <Chip
              key={nivel}
              label={`${nombres[nivel]} (Nivel ${nivel})`}
              size="small"
              sx={{
                bgcolor: colores.bg,
                color: colores.text,
                fontWeight: 'bold'
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default PiramideOrganizacional;