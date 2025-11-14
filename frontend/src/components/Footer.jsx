import React from 'react';
import { Box, Typography, Link, Grid, IconButton, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Phone, Email, Language, Instagram, Facebook, LinkedIn } from '@mui/icons-material';

export default function Footer(){
  return (
    <Box component="footer" sx={{
      width: '100vw', m: 0, p: 0,
      background: 'linear-gradient(180deg,#0f4fa3 0%,#0d437f 100%)',
      color: 'white', pt: 3, pb: 2,
      position: 'relative',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      maxWidth: 'none', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 2.4,
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)'
      }
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: { xs: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="flex-start">
          {/* Columna navegación */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' }, py: 0.5 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.4, fontWeight: 700, color: '#e3f2fd', letterSpacing: '.5px' }}>NAVEGACIÓN</Typography>
              <Grid container spacing={0.6}>
                <Grid item xs={6} md={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                    <Link component={RouterLink} to="/" sx={{ color: 'rgba(255,255,255,0.92)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Inicio / Productos</Link>
                    <Link component={RouterLink} to="/servicios" sx={{ color: 'rgba(255,255,255,0.92)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Servicios Post-Venta</Link>
                    <Link component={RouterLink} to="/acerca-de" sx={{ color: 'rgba(255,255,255,0.92)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Acerca de la Empresa</Link>
                    <Link component={RouterLink} to="/politicas-terminos" sx={{ color: 'rgba(255,255,255,0.92)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Políticas y Términos</Link>
                  </Box>
                </Grid>
                <Grid item xs={6} md={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7, mt: { xs: 0, md: 0.4 } }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '.5px' }}>ATENCIÓN</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>Lun a Vie 8:00 - 18:00</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>Sábados 9:00 - 13:00</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          {/* Columna central logo + contacto */}
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box component="img" src="/logo.jpeg" alt="Atilio Marola Logo" sx={{ height: 72, width: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.55)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#e3f2fd', letterSpacing: '.6px' }}>ATILIO MAROLA</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone sx={{ mr: 1, color: '#81c784', fontSize: '1.15rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', fontSize: '0.78rem' }}>381-5762418 / 381-4321553</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Email sx={{ mr: 1, color: '#64b5f6', fontSize: '1.15rem' }} />
                  <Link href="mailto:ventas@atiliomarola.com.ar" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, '&:hover': { textDecoration: 'underline', color: '#e3f2fd' } }}>ventas@atiliomarola.com.ar</Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Language sx={{ mr: 1, color: '#ffb74d', fontSize: '1.15rem' }} />
                  <Link href="https://www.atiliomarola.com.ar" target="_blank" rel="noopener noreferrer" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, '&:hover': { textDecoration: 'underline', color: '#e3f2fd' } }}>www.atiliomarola.com.ar</Link>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.6, mt: 0.6 }}>
                <IconButton component="a" href="https://instagram.com/atiliomarola" target="_blank" rel="noopener noreferrer" size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}><Instagram fontSize="small" /></IconButton>
                <IconButton component="a" href="https://facebook.com/atiliomarola" target="_blank" rel="noopener noreferrer" size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}><Facebook fontSize="small" /></IconButton>
                <IconButton component="a" href="https://linkedin.com/company/atiliomarola" target="_blank" rel="noopener noreferrer" size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}><LinkedIn fontSize="small" /></IconButton>
              </Box>
            </Box>
          </Grid>
          {/* Columna sucursales */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'center', md: 'right' }, py: 1, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-end' }, gap: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.4, fontWeight: 700, color: '#e3f2fd', letterSpacing: '.5px' }}>NUESTRAS UBICACIONES</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, alignItems: { xs: 'center', md: 'flex-end' } }}>
                <Box sx={{ p: 1.1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', width: { md: '230px' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e3f2fd', mb: 0.5, fontSize: '0.9rem' }}>🏢 CASA CENTRAL</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', lineHeight: 1.25 }}>📍 Libertad 462<br/>San Miguel de Tucumán, Tucumán<br/>📞 381-5762418</Typography>
                </Box>
                <Box sx={{ p: 1.1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', width: { md: '230px' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e3f2fd', mb: 0.5, fontSize: '0.9rem' }}>🌿 SUCURSAL YERBA BUENA</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', lineHeight: 1.25 }}>📍 Av. Aconquija 2399<br/>Yerba Buena, Tucumán<br/>📞 381-4321553</Typography>
                </Box>
                <Box sx={{ p: 1.1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', width: { md: '230px' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e3f2fd', mb: 0.5, fontSize: '0.9rem' }}>🏔️ SUCURSAL CATAMARCA</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', lineHeight: 1.25 }}>📍 San Martín 360<br/>Santa María, Catamarca<br/>📞 03838-421789</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.18)', mb: 0.8 }} />
      <Box sx={{ textAlign: 'center', pt: 0.6, px: 2 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem' }}>&copy; {new Date().getFullYear()} Atilio Marola - Todos los derechos reservados</Typography>
      </Box>
    </Box>
  );
}
